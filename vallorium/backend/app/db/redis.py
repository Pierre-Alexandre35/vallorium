import os

from redis import Redis

redis_client = Redis.from_url(
    os.environ["REDIS_URL"],
    decode_responses=True,
)
