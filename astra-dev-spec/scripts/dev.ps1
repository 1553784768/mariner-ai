param([switch]$Fixture, [switch]$SmokeTest)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$backendRoot = Join-Path $projectRoot 'backend'
$frontendRoot = Join-Path $projectRoot 'frontend'
$pythonPath = Join-Path $backendRoot '.venv/Scripts/python.exe'
$nodePath = (Get-Command node -ErrorAction Stop).Source
$nextPath = Join-Path $frontendRoot 'node_modules/next/dist/bin/next'
if (-not (Test-Path -LiteralPath $pythonPath) -or -not (Test-Path -LiteralPath $nextPath)) {
    throw 'Install dependencies as described in README.md first.'
}
$artifactRoot = Join-Path $projectRoot 'artifacts'
New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null
$managedVariables = 'NEXT_TELEMETRY_DISABLED','NEXT_PUBLIC_API_BASE','COLLECTOR_MODE','AS_OF_DATE','SCHEDULER_ENABLED','NEXT_FONT_GOOGLE_MOCKED_RESPONSES'
$previousValues = @{}
foreach ($name in $managedVariables) { $previousValues[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:NEXT_PUBLIC_API_BASE = 'http://127.0.0.1:8000'
if ($Fixture) {
    & $nodePath (Join-Path $projectRoot 'scripts/prepare-test-fonts.cjs') | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Failed to prepare offline font fixtures.' }
    # Preserve Unicode paths without decoding native stdout in a background shell.
    $env:NEXT_FONT_GOOGLE_MOCKED_RESPONSES = Join-Path $artifactRoot 'font-responses.cjs'
    $env:COLLECTOR_MODE = 'fixture'
    $env:AS_OF_DATE = '2026-10-31'
    $env:SCHEDULER_ENABLED = 'false'
}
$backendProcess = $null
$frontendProcess = $null
function Stop-ManagedProcessTree([int]$processId) {
    Get-CimInstance Win32_Process -Filter "ParentProcessId=$processId" -ErrorAction SilentlyContinue | ForEach-Object { Stop-ManagedProcessTree $_.ProcessId }
    Stop-Process -Id $processId -ErrorAction SilentlyContinue
}
try {
    $occupied = Get-NetTCPConnection -State Listen -LocalPort 3000,8000 -ErrorAction SilentlyContinue
    if ($occupied) { throw 'Port 3000 or 8000 is already in use.' }
    $backendProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000') -WorkingDirectory $backendRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $artifactRoot 'backend.log') -RedirectStandardError (Join-Path $artifactRoot 'backend-error.log')
    $frontendProcess = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $nextPath + '"'),'dev','-H','127.0.0.1','-p','3000') -WorkingDirectory $frontendRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $artifactRoot 'frontend.log') -RedirectStandardError (Join-Path $artifactRoot 'frontend-error.log')
    $ready = $false
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        if ($backendProcess.HasExited -or $frontendProcess.HasExited) { throw 'A server exited; inspect artifacts/*.log.' }
        try {
            $health = Invoke-RestMethod 'http://127.0.0.1:8000/api/health' -TimeoutSec 2
            $page = Invoke-WebRequest 'http://127.0.0.1:3000/inbox' -TimeoutSec 5
            if ($health.status -eq 'ok' -and $page.StatusCode -eq 200 -and $page.Content.Contains('Mariner AI')) { $ready = $true; break }
        } catch { Start-Sleep -Seconds 1 }
    }
    if (-not $ready) { throw 'Servers did not become ready; inspect artifacts/*.log.' }
    Write-Output 'Mariner AI: http://127.0.0.1:3000/inbox'
    if (-not $SmokeTest) {
        while (-not $backendProcess.HasExited -and -not $frontendProcess.HasExited) { Start-Sleep -Seconds 1 }
    }
} finally {
    if ($frontendProcess) { Stop-ManagedProcessTree $frontendProcess.Id }
    if ($backendProcess) { Stop-ManagedProcessTree $backendProcess.Id }
    foreach ($name in $managedVariables) { [Environment]::SetEnvironmentVariable($name, $previousValues[$name], 'Process') }
}
