from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.errors import error_response, register_errors
from app.api.routes import router
from app.api import schemas
from app.api.knowledge import router as knowledge_router
from app.api.chat import router as chat_router
from app.api.import_jobs import router as import_jobs_router
from app.db.models import ImportJob
from app.db.store import rows
from datetime import datetime, timedelta
from app.api.model_settings import router as settings_router
from app.api.pipeline_routes import router as pipeline_router
from app.db.store import database, seed
from app.engine.service import create_run
from app.pipeline.orchestrator import Pipeline
from app.scheduler import make_scheduler
from app.settings import Settings, now


def create_app(settings=None):
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app):
        engine, factory = database(settings.database_url)
        app.state.factory = factory
        with factory.begin() as session:
            seed(session, str(settings.today))
            create_run(session, settings)
            cutoff = datetime.fromisoformat(now()) - timedelta(days=7)
            for job in rows(session, ImportJob):
                if job.payload.get("created_at") and datetime.fromisoformat(job.payload["created_at"]) < cutoff:
                    session.delete(job)
        pipeline = Pipeline(factory, settings)
        app.state.pipeline = pipeline
        scheduler = make_scheduler(settings, pipeline)
        app.state.scheduler = scheduler
        if settings.scheduler_enabled:
            scheduler.start()
        try:
            yield
        finally:
            if scheduler.running:
                scheduler.shutdown()
            pipeline.close()
            engine.dispose()

    app = FastAPI(title="Mariner AI", version="0.2.0", lifespan=lifespan)
    app.state.settings = settings
    register_errors(app)
    app.include_router(router)
    app.include_router(settings_router)
    app.include_router(pipeline_router)
    app.include_router(knowledge_router)
    app.include_router(chat_router)
    app.include_router(import_jobs_router)

    def openapi():
        if app.openapi_schema is None:
            schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
            definitions = schema.setdefault("components", {}).setdefault("schemas", {})
            for name, model in vars(schemas).items():
                if isinstance(model, type) and issubclass(model, BaseModel) and model is not BaseModel:
                    data = model.model_json_schema(ref_template="#/components/schemas/{model}")
                    definitions.update(data.pop("$defs", {}))
                    definitions.setdefault(name, data)
            app.openapi_schema = schema
        return app.openapi_schema
    app.openapi = openapi
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost"])
    app.add_middleware(CORSMiddleware, allow_origins=settings.origins,
                       allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type"])

    @app.middleware("http")
    async def local_only(request, call_next):
        if request.headers.get("host") not in (f"127.0.0.1:{settings.local_port}", f"localhost:{settings.local_port}"):
            return error_response(403, "FORBIDDEN", "请求来源不被允许")
        if request.headers.get("origin") and request.headers["origin"] not in settings.origins:
            return error_response(403, "FORBIDDEN", "请求来源不被允许")
        return await call_next(request)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
