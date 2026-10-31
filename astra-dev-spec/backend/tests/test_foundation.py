from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings


def test_health_and_errors(tmp_path):
    app = create_app(Settings(scheduler_enabled=False, database_url=f"sqlite:///{tmp_path}/test.db", as_of_date="2026-10-31"))
    @app.get("/test-validation")
    def validated(value: int):
        return value
    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        assert client.get("/api/health").json() == {"status": "ok"}
        response = client.get("/test-validation?value=no")
        assert response.status_code == 400
        assert response.json() == {"error": {"code": "BAD_REQUEST", "message": "请求参数不合法"}}
        assert client.get("/api/health", headers={"Origin": "https://evil.example"}).status_code == 403
        assert client.get("/api/health", headers={"Host": "evil.example:8000"}).status_code == 403
