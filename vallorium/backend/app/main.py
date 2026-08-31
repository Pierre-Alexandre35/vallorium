from contextlib import asynccontextmanager
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

import app.core.config as settings
from app.domains.users.router import users_router
from app.domains.auth.router import auth_router
from app.domains.villages.router import village_router
from app.domains.tribes.router import tribes_router
from app.domains.buildings.router import building_router
from app.domains.dashboards.router import dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if settings.LOG_REQUEST_TIMINGS:
        request_logger = logging.getLogger("vallorium.requests")

        @app.middleware("http")
        async def request_timing(request: Request, call_next):
            started_at = time.perf_counter()
            response = await call_next(request)
            duration_ms = (time.perf_counter() - started_at) * 1000
            response.headers["Server-Timing"] = f"app;dur={duration_ms:.2f}"
            request_logger.info(
                "%s %s %.2fms",
                request.method,
                request.url.path,
                duration_ms,
            )
            return response

    @app.get("/", tags=["health"])
    async def root_health():
        return {"status": "ok"}

    @app.get("/api/health", tags=["health"])
    async def api_health():
        return {"status": "ok"}

    app.include_router(users_router, prefix="/api/v1", tags=["users"])
    app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
    app.include_router(village_router, prefix="/api/v1", tags=["village"])
    app.include_router(tribes_router, prefix="/api/v1", tags=["tribes"])
    app.include_router(building_router, prefix="/api/v1", tags=["buildings"])
    app.include_router(dashboard_router, prefix="/api/v1", tags=["dashboard"])

    return app


app = create_app()
