# apply schema
docker compose run --rm backend bash -lc "cd /app && python -m alembic upgrade head"

# insert data
docker compose run --rm backend bash -lc "cd /app && python app/seed.py"