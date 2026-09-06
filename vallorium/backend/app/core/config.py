import os

PROJECT_NAME = "Vallorium API"

SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"]

API_V1_STR = "/api/v1"

SESSION_COOKIE_SECURE = (
    os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
)

# Keep the pool warm and reuse DB connections across requests. `pre_ping`
# costs an extra DB round-trip on every checkout, so it is opt-in. Enable it
# with DB_POOL_PRE_PING=true if your database/proxy aggressively kills idle
# connections.
DB_POOL_PRE_PING = os.getenv("DB_POOL_PRE_PING", "false").lower() == "true"
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "5"))
DB_POOL_TIMEOUT_SECONDS = int(os.getenv("DB_POOL_TIMEOUT_SECONDS", "10"))
DB_POOL_RECYCLE_SECONDS = int(os.getenv("DB_POOL_RECYCLE_SECONDS", "300"))

LOG_REQUEST_TIMINGS = os.getenv("LOG_REQUEST_TIMINGS", "false").lower() == "true"
