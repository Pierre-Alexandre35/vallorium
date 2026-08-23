import os

PROJECT_NAME = "Vallorium API"

SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"]

API_V1_STR = "/api/v1"

SESSION_COOKIE_SECURE = (
    os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
)
