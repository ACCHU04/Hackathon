"""
Caching utilities — optional Redis-backed cache for article fetches
and LLM responses.

Gracefully degrades to a no-op in-memory cache if Redis is unavailable.
"""
import hashlib
import json
import os
from typing import Any, Optional


class Cache:
    """Simple async cache with Redis backend and in-memory fallback."""

    def __init__(self):
        self._memory: dict[str, str] = {}
        self._redis = None
        self._ttl = 3600  # 1 hour

    async def _get_redis(self):
        if self._redis is not None:
            return self._redis
        redis_url = os.getenv("REDIS_URL", "").strip()
        if not redis_url:
            return None
        try:
            import redis.asyncio as aioredis
            self._redis = aioredis.from_url(redis_url, decode_responses=True)
            return self._redis
        except Exception as exc:  # noqa: BLE001
            print(f"[cache] Redis unavailable ({exc}), using in-memory fallback.")
            return None

    @staticmethod
    def _make_key(namespace: str, value: str) -> str:
        digest = hashlib.sha256(value.encode()).hexdigest()[:16]
        return f"fcv:{namespace}:{digest}"

    async def get(self, namespace: str, key: str) -> Optional[Any]:
        cache_key = self._make_key(namespace, key)
        redis = await self._get_redis()
        if redis:
            try:
                raw = await redis.get(cache_key)
                return json.loads(raw) if raw else None
            except Exception:  # noqa: BLE001
                pass
        raw = self._memory.get(cache_key)
        return json.loads(raw) if raw else None

    async def set(self, namespace: str, key: str, value: Any) -> None:
        cache_key = self._make_key(namespace, key)
        serialized = json.dumps(value)
        redis = await self._get_redis()
        if redis:
            try:
                await redis.setex(cache_key, self._ttl, serialized)
                return
            except Exception:  # noqa: BLE001
                pass
        self._memory[cache_key] = serialized


# Module-level singleton
cache = Cache()
