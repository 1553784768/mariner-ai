"""Run explicitly requested smoke checks against an already-running local service."""
import argparse
import time
from urllib.parse import urlsplit

import httpx


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8000')
    parser.add_argument('--timeout', type=float, default=300, help='Pipeline deadline in seconds')
    args = parser.parse_args()
    if urlsplit(args.base_url).hostname not in ('127.0.0.1', 'localhost'):
        parser.error('--base-url must point to the local service')
    outcomes = []
    run = None
    with httpx.Client(base_url=args.base_url.rstrip('/')+'/api/', timeout=15) as client:
        def request(method, path, **kwargs):
            response = client.request(method, path, **kwargs)
            response.raise_for_status()
            return response.json()

        def check(number, label, fn):
            try:
                ok, reason = fn()
            except (httpx.HTTPError, ValueError, KeyError, TypeError, StopIteration) as exc:
                ok, reason = False, str(exc)
            outcomes.append(ok)
            print(f'{number}. {"PASS" if ok else "FAIL"} {label}: {reason}', flush=True)

        check(1, 'Health', lambda: (request('GET', 'health').get('status') == 'ok', 'Local health response'))

        def connection():
            if not request('GET', 'settings/llm')['configured']:
                return False, 'No model configured (未配置模型)'
            result = request('POST', 'settings/llm/test')
            return result['ok'], result['message']
        check(2, 'Model connection', connection)

        def pipeline():
            nonlocal run
            run = request('POST', 'pipeline/runs')
            deadline = time.monotonic()+args.timeout
            while run['status'] == 'running' and time.monotonic() < deadline:
                time.sleep(1)
                run = request('GET', 'pipeline/runs/'+run['id'])
            triage = next(s for s in run['steps'] if s['agent'] == 'triage')
            ok = run['status'] not in ('failed', 'running') and triage['counts']['errors'] == 0
            return ok, f"status={run['status']}, triage errors={triage['counts']['errors']}"
        check(3, 'Policy pipeline', pipeline)

        def collectors():
            if not run:
                return False, 'No pipeline result'
            steps = [s for s in run['steps'] if s['agent'] in ('collector_fr', 'collector_pi')]
            return any(s['counts']['input'] > 0 for s in steps), ', '.join(f"{s['agent']} input={s['counts']['input']}" for s in steps)
        check(4, 'Collector response', collectors)

        def chat():
            cid = request('POST', 'chat/conversations')['id']
            value = request('POST', 'chat/conversations/'+cid+'/messages', json={'text': '今天有哪些需要关注的政策？', 'lang': 'zh', 'use_order_data': False})['assistant']
            return bool(value['text'].strip()) and value['guard']['ok'], f"answer length={len(value['text'])}, guard.ok={value['guard']['ok']}"
        check(5, 'Knowledge-grounded chat', chat)
    return 0 if all(outcomes) else 1


if __name__ == '__main__':
    raise SystemExit(main())
