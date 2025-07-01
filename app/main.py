"""
Godofreda API - IA VTuber Multimodal
API principal para conversação com IA sarcástica e síntese de voz
"""

from fastapi import FastAPI, HTTPException, Request, Form, File, UploadFile, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse, Response, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from TTS.api import TTS
import os
import uuid
import time
import logging
from datetime import datetime
import json
import io
from typing import Optional, Dict, Any
import asyncio

# Importar serviço GodofredaLLM
from llm_service import GodofredaLLM

# Importar configuração centralizada
from config import config

# Importar serviços
from cache_service import response_cache, cached_response
from rate_limiter import rate_limiter, check_rate_limit, rate_limit_decorator
from cleanup_service import cleanup_service, start_background_cleanup

# ================================
# CONFIGURAÇÃO DE LOGGING
# ================================
# Criar diretório de logs se não existir
try:
    os.makedirs('app/logs', exist_ok=True)
    log_file = 'app/logs/godofreda.log'
except OSError:
    # Fallback para /tmp se não conseguir criar em app/logs
    log_file = '/tmp/godofreda.log'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ================================
# CONFIGURAÇÕES DA APLICAÇÃO
# ================================
# Configuração centralizada importada de config.py

# ================================
# INSTÂNCIA FASTAPI
# ================================
app = FastAPI(
    title="Godofreda API",
    description="API de conversa com IA VTuber Godofreda",
    version="1.0.0"
)

# ================================
# MIDDLEWARE CORS
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.api.cors_origins,  # ✅ SEGURO - Apenas origens configuradas
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# ================================
# MÉTRICAS PROMETHEUS
# ================================
REQUEST_COUNT = Counter('godofreda_requests_total', 'Total de requisições', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('godofreda_request_duration_seconds', 'Duração das requisições')
TTS_REQUEST_COUNT = Counter('godofreda_tts_requests_total', 'Total de requisições TTS')
TTS_DURATION = Histogram('godofreda_tts_duration_seconds', 'Duração da síntese TTS')
ERROR_COUNT = Counter('godofreda_errors_total', 'Total de erros', ['type'])
ACTIVE_CONNECTIONS = Gauge('godofreda_active_connections', 'Conexões ativas')
SYSTEM_STATUS = Gauge('godofreda_system_status', 'Status do sistema (1=online, 0=offline)')

# ================================
# INICIALIZAÇÃO DO TTS
# ================================
def initialize_tts() -> TTS:
    """Inicializa o modelo TTS com tratamento de erro"""
    try:
        # Criar diretório temporário se não existir
        os.makedirs(config.tts.temp_dir, exist_ok=True)
        
        tts = TTS(model_name=config.tts.model)
        SYSTEM_STATUS.set(1)
        logger.info("TTS model loaded successfully")
        return tts
    except Exception as e:
        logger.error(f"Failed to load TTS model: {e}")
        SYSTEM_STATUS.set(0)
        raise

# Inicializar TTS globalmente
try:
    tts = initialize_tts()
except Exception as e:
    logger.error(f"Critical: TTS initialization failed: {e}")
    tts = None

# Inicializar LLM globalmente (singleton)
try:
    llm_instance = GodofredaLLM()
    logger.info("LLM service initialized successfully")
except Exception as e:
    logger.error(f"Critical: LLM initialization failed: {e}")
    llm_instance = None

# ================================
# MIDDLEWARE PARA MÉTRICAS E RATE LIMITING
# ================================
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Middleware para coleta de métricas Prometheus e rate limiting"""
    start_time = time.time()
    
    # Incrementar contador de requisições
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    
    # Incrementar conexões ativas
    ACTIVE_CONNECTIONS.inc()
    
    try:
        # Verificar rate limit para endpoints específicos
        if request.url.path.startswith("/falar"):
            await check_rate_limit(request, "tts")
        elif request.url.path.startswith("/chat"):
            await check_rate_limit(request, "chat")
        elif request.url.path.startswith("/api/godofreda/chat"):
            await check_rate_limit(request, "chat")
        
        response = await call_next(request)
        
        # Registrar duração
        duration = time.time() - start_time
        REQUEST_DURATION.observe(duration)
        
        return response
    except Exception as e:
        # Registrar erro
        ERROR_COUNT.labels(type=type(e).__name__).inc()
        logger.error(f"Request error: {e}")
        raise
    finally:
        # Decrementar conexões ativas
        ACTIVE_CONNECTIONS.dec()

# ================================
# VALIDADORES
# ================================
def validate_text_input(text: str) -> None:
    """Valida entrada de texto"""
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Texto não pode estar vazio")
    
    if len(text) > config.api.max_text_length:
        raise HTTPException(
            status_code=400, 
            detail=f"Texto muito longo (máximo {config.api.max_text_length} caracteres)"
        )

def validate_file_type(file: UploadFile, allowed_types: list) -> None:
    """Valida tipo e tamanho de arquivo"""
    if not file:
        return
        
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de arquivo não suportado. Tipos permitidos: {allowed_types}"
        )
    
    # Verificar tamanho do arquivo
    if hasattr(file, 'size') and file.size and file.size > config.file.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande. Tamanho máximo: {config.file.max_file_size // (1024*1024)}MB"
        )

# ================================
# ENDPOINTS DE SAÚDE
# ================================
@app.get("/")
async def root() -> Dict[str, Any]:
    """Endpoint raiz com informações da API"""
    return {
        "message": "🤖 Godofreda API - IA VTuber",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "metrics": "/metrics",
            "status": "/status",
            "falar": "/falar",
            "chat": "/chat"
        }
    }

@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check básico"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/health/ready")
async def readiness_check() -> Response:
    """Verificação de prontidão"""
    try:
        if SYSTEM_STATUS._value.get() == 1 and tts is not None:
            return JSONResponse(
                content={"status": "ready", "timestamp": datetime.now().isoformat()}
            )
        else:
            return JSONResponse(
                status_code=503,
                content={"status": "not ready", "reason": "TTS model not loaded"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "reason": str(e)}
        )

@app.get("/health/live")
async def liveness_check() -> Dict[str, str]:
    """Verificação de vitalidade"""
    return {"status": "alive", "timestamp": datetime.now().isoformat()}

@app.get("/metrics")
async def metrics() -> Response:
    """Endpoint para métricas Prometheus"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/status")
async def status() -> Dict[str, Any]:
    """Status detalhado do sistema"""
    return {
        "system": {
            "status": "online" if SYSTEM_STATUS._value.get() == 1 else "offline",
            "tts_model": config.tts.model,
            "uptime": "running"
        },
        "metrics": {
            "total_requests": "Available at /metrics",
            "total_tts_requests": "Available at /metrics", 
            "total_errors": "Available at /metrics",
            "active_connections": "Available at /metrics"
        },
        "timestamp": datetime.now().isoformat()
    }

# ================================
# ENDPOINTS DE PERSONALIDADE
# ================================
@app.get("/personality")
async def get_personality() -> Dict[str, Any]:
    """Retorna configurações de personalidade da Godofreda"""
    return {
        "name": "Godofreda",
        "personality": {
            "sarcasm_level": 75,
            "response_speed": "normal",
            "voice_style": "temporary",
            "description": "IA VTuber sarcástica e irreverente"
        },
        "capabilities": [
            "síntese de voz em português",
            "respostas sarcásticas",
            "personalidade configurável"
        ]
    }

# ================================
# ENDPOINTS DE TTS
# ================================
@app.post("/falar")
@rate_limit_decorator("tts")
async def sintetizar_voz(background_tasks: BackgroundTasks, texto: str = Form(...)) -> FileResponse:
    """Sintetiza texto em áudio usando TTS"""
    try:
        # Verificar se o TTS está disponível
        if SYSTEM_STATUS._value.get() != 1 or tts is None:
            raise HTTPException(status_code=503, detail="TTS service unavailable")
        
        # Validar entrada
        validate_text_input(texto)
        
        # Incrementar contador de requisições TTS
        TTS_REQUEST_COUNT.inc()
        
        # Gerar nome único para o arquivo
        output_path = f"{config.tts.temp_dir}/{uuid.uuid4()}.wav"
        
        # Medir duração da síntese
        start_time = time.time()
        
        # Gerar áudio com speaker padrão
        tts.tts_to_file(
            text=texto,
            language="pt",
            file_path=output_path,
            speaker=config.tts.default_speaker
        )
        
        # Registrar duração
        duration = time.time() - start_time
        TTS_DURATION.observe(duration)
        
        # Log de sucesso
        logger.info(f"TTS request completed successfully. Text: '{texto[:50]}...', Duration: {duration:.2f}s")
        
        # Adicionar tarefa de limpeza
        background_tasks.add_task(lambda: os.remove(output_path) if os.path.exists(output_path) else None)
        
        return FileResponse(output_path, media_type="audio/wav")

    except HTTPException:
        raise
    except Exception as e:
        # Registrar erro
        ERROR_COUNT.labels(type="tts_error").inc()
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na síntese de voz: {str(e)}")

# ================================
# ENDPOINTS DE CHAT
# ================================
@app.post("/chat")
@rate_limit_decorator("chat")
@cached_response(ttl=300)  # Cache por 5 minutos
async def chat_endpoint(user_input: str = Form(...), context: str = Form("")) -> Dict[str, str]:
    """Endpoint de chat conversacional com LLM sarcástica"""
    try:
        # Verificar se o LLM está disponível
        if llm_instance is None:
            raise HTTPException(status_code=503, detail="LLM service unavailable")
        
        # Validar entrada
        validate_text_input(user_input)
        
        # Gerar resposta usando LLM singleton
        resposta = await llm_instance.generate_response(user_input, context)
        
        logger.info(f"Chat response generated for input: '{user_input[:50]}...'")
        return {"response": resposta}
        
    except HTTPException:
        raise
    except Exception as e:
        ERROR_COUNT.labels(type="chat_error").inc()
        logger.error(f"Erro no chat LLM: {e}")
        raise HTTPException(status_code=500, detail="Erro ao gerar resposta da Godofreda LLM")

@app.post("/api/godofreda/chat")
@rate_limit_decorator("chat")
async def multimodal_chat(
    text: str = Form(...),
    image: Optional[UploadFile] = File(None),
    voice: Optional[UploadFile] = File(None)
) -> StreamingResponse:
    """Chat multimodal com suporte a texto, imagem e voz"""
    try:
        # Verificar se o TTS está disponível
        if SYSTEM_STATUS._value.get() != 1 or tts is None:
            raise HTTPException(status_code=503, detail="TTS service unavailable")
        
        # Validar entrada de texto
        validate_text_input(text)
        
        # Validar tipos de arquivo
        if image and config.file.allowed_image_types:
            validate_file_type(image, config.file.allowed_image_types)
        if voice and config.file.allowed_audio_types:
            validate_file_type(voice, config.file.allowed_audio_types)
        
        # Processar entrada multimodal
        context = ""
        final_text = text
        
        if image:
            # Simular análise de imagem (aqui você integraria com LLM Vision)
            image_analysis = await analyze_image_with_llm(image)
            context += f"Imagem: {image_analysis}\n"
            logger.info(f"Image analysis completed for: {image.filename}")
        
        if voice:
            # Simular speech-to-text (aqui você integraria com STT)
            transcription = await speech_to_text(voice)
            final_text += f" {transcription}"
            logger.info(f"Voice transcription completed for: {voice.filename}")
        
        # Gerar resposta com personalidade da Godofreda
        godofreda_response = await generate_response_with_personality(
            user_input=final_text,
            context=context
        )
        
        # Converter resposta para áudio
        audio_response = await text_to_speech_response(godofreda_response)
        
        logger.info(f"Multimodal chat completed successfully. Input: '{text[:50]}...'")
        
        return StreamingResponse(
            io.BytesIO(audio_response),
            media_type="audio/wav",
            headers={"X-Response-Text": godofreda_response}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        ERROR_COUNT.labels(type="chat_error").inc()
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

# ================================
# ENDPOINTS DE WEBHOOK
# ================================
@app.post("/webhook/alerts")
async def webhook_alerts(alert_data: dict) -> Dict[str, str]:
    """Webhook para receber alertas do AlertManager"""
    logger.warning(f"Alert received: {json.dumps(alert_data, indent=2)}")
    return {"status": "alert_received"}

# ================================
# FUNÇÕES AUXILIARES
# ================================
async def analyze_image_with_llm(image: UploadFile) -> str:
    """Analisa imagem usando LLM multimodal (simulado)"""
    # TODO: Integrar com GPT-4V, Claude, etc.
    logger.info(f"Image analysis requested for: {image.filename}")
    return "Imagem analisada: contém elementos visuais interessantes"

async def speech_to_text(audio: UploadFile) -> str:
    """Converte áudio para texto (simulado)"""
    # TODO: Integrar com Whisper, etc.
    logger.info(f"Speech-to-text requested for: {audio.filename}")
    return "Áudio transcrito com sucesso"

async def generate_response_with_personality(user_input: str, context: str = "") -> str:
    """Gera resposta com personalidade sarcástica da Godofreda"""
    if llm_instance is None:
        raise HTTPException(status_code=503, detail="LLM service unavailable")
    
    return await llm_instance.generate_response(user_input, context)

async def text_to_speech_response(text: str) -> bytes:
    """Converte texto para áudio usando TTS"""
    try:
        # Gerar nome único para o arquivo temporário
        output_path = f"{config.tts.temp_dir}/{uuid.uuid4()}.wav"
        
        # Gerar áudio
        if tts is not None:
            tts.tts_to_file(
                text=text,
                language="pt",
                file_path=output_path,
                speaker=config.tts.default_speaker
            )
        else:
            raise HTTPException(status_code=503, detail="TTS service unavailable")
        
        # Ler arquivo e retornar bytes
        with open(output_path, 'rb') as f:
            audio_bytes = f.read()
        
        # Limpar arquivo temporário
        os.remove(output_path)
        
        return audio_bytes
        
    except Exception as e:
        logger.error(f"TTS error in chat: {e}")
        raise HTTPException(status_code=500, detail="Erro na síntese de voz")

# ================================
# EVENTOS DE INICIALIZAÇÃO
# ================================
@app.on_event("startup")
async def startup_event():
    """Evento de inicialização da aplicação"""
    logger.info("Starting Godofreda API...")
    
    # Iniciar serviço de limpeza em background
    try:
        asyncio.create_task(start_background_cleanup())
        logger.info("Cleanup service started")
    except Exception as e:
        logger.error(f"Failed to start cleanup service: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento de encerramento da aplicação"""
    logger.info("Shutting down Godofreda API...")
    
    # Parar serviço de limpeza
    try:
        cleanup_service.stop_cleanup_service()
        logger.info("Cleanup service stopped")
    except Exception as e:
        logger.error(f"Error stopping cleanup service: {e}")

# ================================
# INICIALIZAÇÃO DA APLICAÇÃO
# ================================
if __name__ == "__main__":
    import uvicorn
    
    logger.info("Iniciando Godofreda API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
