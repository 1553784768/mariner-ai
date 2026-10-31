from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException


class ApiException(Exception):
    def __init__(self, status, code, message, details=None):
        self.status, self.code, self.message, self.details = status, code, message, details


def error_response(status, code, message, details=None):
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse({"error": error}, status_code=status)


def register_errors(app):
    @app.exception_handler(ApiException)
    async def api_error(request: Request, exc: ApiException):
        return error_response(exc.status, exc.code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        return error_response(400, "BAD_REQUEST", "请求参数不合法")

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException):
        return error_response(exc.status_code, "NOT_FOUND" if exc.status_code == 404 else "BAD_REQUEST",
                              str(exc.detail))

    @app.exception_handler(Exception)
    async def unexpected(request: Request, exc: Exception):
        return error_response(500, "INTERNAL", "服务器内部错误")
