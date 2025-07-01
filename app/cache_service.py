# ================================
# GODOFREDA CACHE SERVICE
# ================================
# Serviço de cache com Redis para otimização de performance
# ================================

import json
import hashlib
import logging
import os
from typing import Any, Optional, Dict
import redis.asyncio as redis
from config import config

logger = logging.getLogger(__name__)

class CacheService:
    """Serviço de cache com Redis"""
    
    def __init__(self):
        self.redis_client: redis.Redis = None
        self._connect_redis()
    
    def _connect_redis(self) -> None:
        """Conecta ao Redis"""
        try:
            redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            logger.info("Redis cache connected successfully")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Using memory fallback.")
            self.redis_client = None
    
    def _generate_key(self, prefix: str, data: Any) -> str:
        """Gera chave única para cache"""
        data_str = json.dumps(data, sort_keys=True) if isinstance(data, (dict, list)) else str(data)
        hash_obj = hashlib.md5(data_str.encode())
        return f"godofreda:{prefix}:{hash_obj.hexdigest()}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Obtém valor do cache"""
        if not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting from cache: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Define valor no cache com TTL"""
        if not self.redis_client:
            return False
        
        try:
            value_str = json.dumps(value)
            await self.redis_client.setex(key, ttl, value_str)
            return True
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Remove valor do cache"""
        if not self.redis_client:
            return False
        
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error deleting from cache: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Verifica se chave existe no cache"""
        if not self.redis_client:
            return False
        
        try:
            return await self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking cache existence: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache"""
        if not self.redis_client:
            return {"status": "disconnected"}
        
        try:
            info = await self.redis_client.info()
            return {
                "status": "connected",
                "used_memory": info.get("used_memory_human", "Unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0)
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"status": "error", "error": str(e)}

# Instância global do serviço de cache
cache_service = CacheService()

def cached_response(ttl: int = 3600):
    """Decorator para cachear respostas de endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Gerar chave única baseada na função e argumentos
            cache_key = cache_service._generate_key(
                f"{func.__name__}",
                {"args": args, "kwargs": kwargs}
            )
            
            # Tentar obter do cache
            cached_result = await cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Executar função e cachear resultado
            result = await func(*args, **kwargs)
            await cache_service.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for {func.__name__}, cached result")
            
            return result
        return wrapper
    return decorator

# Alias para compatibilidade
response_cache = cache_service 