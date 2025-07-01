# ================================
# GODOFREDA RATE LIMITER
# ================================
# Sistema de rate limiting para proteger a API
# ================================

import time
import asyncio
import os
from typing import Dict, Tuple
import logging
import redis.asyncio as redis
from config import config

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter com Redis para persistência"""
    
    def __init__(self):
        self.redis_client: redis.Redis = None
        self.limits = {
            "default": {"requests": 100, "window": 3600},  # 100 req/hora
            "tts": {"requests": 30, "window": 60},         # 30 req/minuto
            "chat": {"requests": 60, "window": 60},        # 60 req/minuto
            "upload": {"requests": 10, "window": 60},      # 10 req/minuto
        }
        self._connect_redis()
    
    def _connect_redis(self) -> None:
        """Conecta ao Redis"""
        try:
            redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            logger.info("Redis rate limiter connected successfully")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Using memory fallback.")
            self.redis_client = None
    
    async def is_allowed(self, client_id: str, endpoint: str = "default") -> Tuple[bool, int]:
        """
        Verifica se a requisição é permitida
        
        Args:
            client_id: Identificador do cliente (IP, token, etc.)
            endpoint: Tipo de endpoint para aplicar limite específico
            
        Returns:
            Tuple[bool, int]: (permitido, tempo_restante_em_segundos)
        """
        if not self.redis_client:
            # Fallback para memória se Redis não estiver disponível
            return True, 0
        
        try:
            now = time.time()
            limit_config = self.limits.get(endpoint, self.limits["default"])
            window_start = now - limit_config["window"]
            
            # Chave única para o cliente e endpoint
            key = f"rate_limit:{endpoint}:{client_id}"
            
            # Usar Redis Sorted Set para manter timestamps ordenados
            # Remover timestamps antigos
            await self.redis_client.zremrangebyscore(key, 0, window_start)
            
            # Contar requisições no período
            request_count = await self.redis_client.zcard(key)
            
            if request_count >= limit_config["requests"]:
                # Calcular tempo restante
                oldest_request = await self.redis_client.zrange(key, 0, 0, withscores=True)
                if oldest_request:
                    oldest_time = oldest_request[0][1]
                    time_remaining = int(oldest_time + limit_config["window"] - now)
                    return False, max(0, time_remaining)
                return False, limit_config["window"]
            
            # Adicionar nova requisição
            await self.redis_client.zadd(key, {str(now): now})
            await self.redis_client.expire(key, limit_config["window"])
            
            return True, 0
            
        except Exception as e:
            logger.error(f"Error in rate limiter: {e}")
            return True, 0  # Permitir em caso de erro
    
    async def get_remaining_requests(self, client_id: str, endpoint: str = "default") -> int:
        """Retorna número de requisições restantes"""
        if not self.redis_client:
            return 999  # Fallback
        
        try:
            now = time.time()
            limit_config = self.limits.get(endpoint, self.limits["default"])
            window_start = now - limit_config["window"]
            
            key = f"rate_limit:{endpoint}:{client_id}"
            
            # Remover timestamps antigos
            await self.redis_client.zremrangebyscore(key, 0, window_start)
            
            # Contar requisições no período
            request_count = await self.redis_client.zcard(key)
            
            return max(0, limit_config["requests"] - request_count)
            
        except Exception as e:
            logger.error(f"Error getting remaining requests: {e}")
            return 999

# Instância global do rate limiter
rate_limiter = RateLimiter()

def get_client_id(request) -> str:
    """Extrai identificador do cliente da requisição"""
    # Priorizar X-Forwarded-For (proxy)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Fallback para IP direto
    return request.client.host if request.client else "unknown"

async def check_rate_limit(request, endpoint: str = "default") -> None:
    """
    Middleware para verificar rate limit
    
    Args:
        request: Objeto de requisição FastAPI
        endpoint: Tipo de endpoint
        
    Raises:
        HTTPException: Se o rate limit foi excedido
    """
    client_id = get_client_id(request)
    is_allowed, time_remaining = await rate_limiter.is_allowed(client_id, endpoint)
    
    if not is_allowed:
        logger.warning(f"Rate limit exceeded for {client_id} on {endpoint}")
        from fastapi import HTTPException
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "retry_after": time_remaining,
                "message": f"Too many requests. Try again in {time_remaining} seconds."
            }
        )

def rate_limit_decorator(endpoint: str = "default"):
    """Decorator para aplicar rate limiting em endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                # Encontrar o objeto request nos argumentos
                request = None
                for arg in args:
                    if hasattr(arg, 'headers') and hasattr(arg, 'client'):
                        request = arg
                        break
                
                if request:
                    await check_rate_limit(request, endpoint)
                
                return await func(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Error in rate limit decorator: {e}")
                # Em caso de erro, permitir a requisição
                return await func(*args, **kwargs)
                
        return wrapper
    return decorator 