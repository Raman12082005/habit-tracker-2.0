from redis.asyncio import Redis
from app.core.config import settings

redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

async def hit(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    try:
        pipe = redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        count, _ = await pipe.execute()
        return count <= limit, int(count)
    except Exception:
        # If Redis is temporarily unavailable, application-level account
        # protections still apply. Do not hard-fail every request.
        return True, 0
