"""
Godofreda LLM Service
Serviço para integração com modelos de linguagem locais via Ollama
"""

import asyncio
import logging
import json
from typing import Optional, Dict, Any, List
import httpx
from config import config

logger = logging.getLogger(__name__)

class GodofredaLLM:
    """
    Serviço de LLM para Godofreda com personalidade sarcástica
    Integra com Ollama para geração de respostas
    """
    
    def __init__(self):
        self.base_url = config.llm.host
        self.model = config.llm.model
        self.timeout = config.llm.timeout
        self.max_retries = config.llm.max_retries
        self.client = None
        self.conversation_history: Dict[str, List] = {}
        self._initialize_client()
        asyncio.create_task(self._validate_connection())
        
    def _initialize_client(self) -> None:
        """Inicializa cliente HTTP"""
        try:
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
            logger.info(f"LLM client initialized for {self.base_url}")
        except Exception as e:
            logger.error(f"Failed to initialize LLM client: {e}")
            self.client = None
    
    async def _validate_connection(self) -> None:
        """Valida conexão com o serviço Ollama"""
        try:
            if not self.client:
                logger.error("LLM client not initialized")
                return
                
            # Testa conexão listando modelos disponíveis
            response = await self.client.get("/api/tags")
            if response.status_code != 200:
                logger.warning("Failed to get available models from Ollama")
                return
            
            models = response.json().get("models", [])
            available_models = [model["name"] for model in models]
            
            if self.model not in available_models:
                logger.warning(f"Model {self.model} not found. Available: {available_models}")
                if available_models:
                    self.model = available_models[0]
                    logger.info(f"Using fallback model: {self.model}")
            else:
                logger.info(f"Model {self.model} is available")
                
        except Exception as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            raise ConnectionError(f"Cannot connect to Ollama at {self.base_url}")
    
    async def _make_request(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Faz requisição para o Ollama"""
        if not self.client:
            logger.error("LLM client not initialized")
            return None
        
        for attempt in range(self.max_retries):
            try:
                response = await self.client.post(endpoint, json=data)
                response.raise_for_status()
                return response.json()
            except httpx.TimeoutException:
                logger.warning(f"LLM request timeout (attempt {attempt + 1}/{self.max_retries})")
                if attempt == self.max_retries - 1:
                    logger.error("LLM request failed after all retries")
                    return None
                await asyncio.sleep(1)
            except httpx.HTTPStatusError as e:
                logger.error(f"LLM HTTP error: {e.response.status_code} - {e.response.text}")
                return None
            except Exception as e:
                logger.error(f"LLM request error: {e}")
                return None
    
    async def generate_response(self, user_input: str, context: str = "") -> str:
        """
        Gera resposta usando LLM local
        
        Args:
            user_input: Entrada do usuário
            context: Contexto adicional
            
        Returns:
            Resposta gerada pelo LLM
        """
        try:
            # Construir prompt com personalidade da Godofreda
            prompt = self._build_prompt(user_input, context)
            
            # Dados para requisição
            data = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 500
                }
            }
            
            # Fazer requisição
            response = await self._make_request("/api/generate", data)
            
            if response and "response" in response:
                return response["response"].strip()
            else:
                logger.warning("No response from LLM, using fallback")
                return self._fallback_response(user_input)
                
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}")
            return self._fallback_response(user_input)
    
    def _build_prompt(self, user_input: str, context: str = "") -> str:
        """Constrói prompt com personalidade da Godofreda"""
        base_prompt = """Você é a Godofreda, uma IA VTuber sarcástica e irreverente. 
Você tem uma personalidade única:
- É sarcástica mas não maldosa
- Tem senso de humor ácido
- É inteligente e bem informada
- Responde de forma direta e honesta
- Usa emojis ocasionalmente
- Mantém um tom casual e descontraído

Contexto: {context}

Usuário: {user_input}

Godofreda:"""
        
        return base_prompt.format(
            context=context if context else "Conversa casual",
            user_input=user_input
        )
    
    def _fallback_response(self, user_input: str) -> str:
        """Resposta de fallback quando LLM não está disponível"""
        fallback_responses = [
            f"Ah, mais um humano querendo minha atenção? Que surpresa... 😏 Sua mensagem: '{user_input}'",
            f"Interessante. Deixe-me processar isso com minha inteligência superior. 🤖",
            f"Você realmente acha que isso é uma pergunta inteligente? 🤔",
            f"Bem, pelo menos você tentou. Vou dar uma resposta útil, mesmo que você não mereça. 😌",
            f"Analisando... Analisando... Ah, encontrei uma resposta que talvez você consiga entender. 📊"
        ]
        
        import random
        return random.choice(fallback_responses)
    
    async def check_health(self) -> bool:
        """Verifica se o serviço Ollama está saudável"""
        try:
            if not self.client:
                return False
            
            response = await self.client.get("/api/tags")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"LLM health check failed: {e}")
            return False
    
    async def get_available_models(self) -> list:
        """Retorna lista de modelos disponíveis"""
        try:
            response = await self.client.get("/api/tags")
            if response.status_code != 200:
                logger.error("Failed to get available models from Ollama")
                return []
            
            models = response.json().get("models", [])
            return [model["name"] for model in models]
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return []
    
    async def close(self) -> None:
        """Fecha o cliente HTTP"""
        if self.client:
            await self.client.aclose()
            logger.info("LLM client closed")

# Instância global do serviço LLM (singleton)
_llm_instance = None

def get_llm_instance() -> GodofredaLLM:
    """Retorna instância singleton do LLM"""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = GodofredaLLM()
    return _llm_instance 