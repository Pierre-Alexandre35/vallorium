from contextlib import asynccontextmanager

from fastapi import FastAPI

import app.core.config as settings
from app.domains.users.router import users_router
from app.domains.auth.router import auth_router
from app.domains.villages.router import village_router
from app.domains.tribes.router import tribes_router
from app.domains.buildings.router import building_router


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

    return app


app = create_app()
