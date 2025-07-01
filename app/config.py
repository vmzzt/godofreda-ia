# ================================
# GODOFREDA CONFIGURAÇÃO CENTRALIZADA
# ================================
# Arquivo de configuração centralizado para resolver
# problemas de URLs hardcoded e configurações espalhadas
# ================================

import os
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class APIConfig:
    """Configurações da API"""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    cors_origins: Optional[List[str]] = None
    max_text_length: int = 1000
    
    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8501").split(",")
        self.max_text_length = int(os.getenv("MAX_TEXT_LENGTH", self.max_text_length))

@dataclass
class TTSConfig:
    """Configurações do TTS"""
    model: str = "tts_models/multilingual/multi-dataset/xtts_v2"
    default_speaker: str = "p230"
    temp_dir: str = "app/tts_temp"
    coqui_tos_agreed: bool = True
    
    def __post_init__(self):
        self.model = os.getenv("TTS_MODEL", self.model)
        self.default_speaker = os.getenv("TTS_SPEAKER", self.default_speaker)
        self.temp_dir = os.getenv("TTS_TEMP_DIR", self.temp_dir)
        self.coqui_tos_agreed = bool(int(os.getenv("COQUI_TOS_AGREED", "1")))

@dataclass
class LLMConfig:
    """Configurações do LLM"""
    host: str = "http://ollama:11434"
    model: str = "llama2:7b"
    timeout: int = 30
    max_retries: int = 3
    retry_delay: int = 2
    
    def __post_init__(self):
        self.host = os.getenv("OLLAMA_HOST", self.host)
        self.model = os.getenv("OLLAMA_MODEL", self.model)
        self.timeout = int(os.getenv("OLLAMA_TIMEOUT", self.timeout))
        self.max_retries = int(os.getenv("OLLAMA_MAX_RETRIES", self.max_retries))
        self.retry_delay = int(os.getenv("OLLAMA_RETRY_DELAY", self.retry_delay))

@dataclass
class FileConfig:
    """Configurações de arquivos"""
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    allowed_image_types: Optional[List[str]] = None
    allowed_audio_types: Optional[List[str]] = None
    cleanup_interval_hours: int = 1
    file_max_age_hours: int = 1
    
    def __post_init__(self):
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE_MB", "100")) * 1024 * 1024
        self.allowed_image_types = [
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
        ]
        self.allowed_audio_types = [
            "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/flac"
        ]
        self.cleanup_interval_hours = int(os.getenv("CLEANUP_INTERVAL_HOURS", self.cleanup_interval_hours))
        self.file_max_age_hours = int(os.getenv("FILE_MAX_AGE_HOURS", self.file_max_age_hours))

@dataclass
class LoggingConfig:
    """Configurações de logging"""
    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    file_path: str = "app/logs/godofreda.log"
    
    def __post_init__(self):
        self.level = os.getenv("LOG_LEVEL", self.level)
        self.file_path = os.getenv("LOG_FILE_PATH", self.file_path)

@dataclass
class MonitoringConfig:
    """Configurações de monitoramento"""
    prometheus_enabled: bool = True
    metrics_port: int = 8000
    health_check_interval: int = 30
    
    def __post_init__(self):
        self.prometheus_enabled = bool(int(os.getenv("PROMETHEUS_ENABLED", "1")))
        self.metrics_port = int(os.getenv("METRICS_PORT", self.metrics_port))
        self.health_check_interval = int(os.getenv("HEALTH_CHECK_INTERVAL", self.health_check_interval))

class Config:
    """Configuração centralizada da aplicação"""
    
    def __init__(self):
        self.api = APIConfig()
        self.tts = TTSConfig()
        self.llm = LLMConfig()
        self.file = FileConfig()
        self.logging = LoggingConfig()
        self.monitoring = MonitoringConfig()
    
    @property
    def api_url(self) -> str:
        """URL da API para uso interno"""
        return f"http://{self.api.host}:{self.api.port}"
    
    @property
    def frontend_url(self) -> str:
        """URL do frontend"""
        return os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    @property
    def ollama_url(self) -> str:
        """URL do Ollama"""
        return self.llm.host
    
    def validate(self) -> None:
        """Valida as configurações"""
        # Criar diretórios necessários (usar caminhos absolutos)
        try:
            os.makedirs(self.tts.temp_dir, exist_ok=True)
            os.makedirs(os.path.dirname(self.logging.file_path), exist_ok=True)
        except OSError as e:
            # Se não conseguir criar diretórios, usar alternativas
            print(f"Aviso: Não foi possível criar diretórios: {e}")
            # Usar /tmp como fallback
            self.tts.temp_dir = "/tmp/tts_temp"
            self.logging.file_path = "/tmp/godofreda.log"
        
        # Validar configurações críticas
        if not self.tts.model:
            raise ValueError("TTS_MODEL não pode estar vazio")
        
        if not self.llm.host:
            raise ValueError("OLLAMA_HOST não pode estar vazio")
        
        if self.file.max_file_size <= 0:
            raise ValueError("MAX_FILE_SIZE deve ser maior que 0")

# Instância global da configuração
config = Config()

# Validação inicial
try:
    config.validate()
except Exception as e:
    print(f"Erro na validação da configuração: {e}")
    raise 