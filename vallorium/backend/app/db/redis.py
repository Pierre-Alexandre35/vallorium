from redis.asyncio import Redis

redis_client = Redis.from_url(
    "redis://redis:6379/0",
    decode_responses=True,
)
