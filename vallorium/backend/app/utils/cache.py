from fastapi import Request, Response
from fastapi.responses import JSONResponse
import hashlib
import json
from pydantic import BaseModel


def generate_etag(data: dict | BaseModel) -> str:
    payload = data.model_dump() if isinstance(data, BaseModel) else data
    json_str = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(json_str).hexdigest()


def cached_response(
    data: dict | BaseModel,
    max_age: int = 3600,
    request: Request | None = None,
) -> Response:
    payload = data.model_dump() if isinstance(data, BaseModel) else data
    etag = generate_etag(payload)

    if request:
        client_etag = request.headers.get("if-none-match")
        if client_etag == etag:
            return Response(status_code=304)

    return JSONResponse(
        content=payload,
        headers={
            "Cache-Control": f"public, max-age={max_age}",
            "ETag": etag,
        },
    )
