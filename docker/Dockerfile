# ================================
# GODOFREDA API DOCKERFILE
# ================================
# Multi-stage build para otimizar tamanho e segurança
# ================================

# ================================
# STAGE 1: BUILD DEPENDENCIES
# ================================
FROM python:3.11-slim-bullseye as builder

# Instalar dependências de build
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário para build
RUN groupadd -r godofreda && useradd -r -g godofreda godofreda

# Configurar ambiente de build
WORKDIR /build
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Copiar e instalar dependências Python
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ================================
# STAGE 2: RUNTIME
# ================================
FROM python:3.11-slim-bullseye as runtime

# Metadados da imagem
LABEL maintainer="Godofreda Team <team@godofreda.ai>" \
      version="1.0.0" \
      description="Godofreda API - IA VTuber" \
      org.opencontainers.image.source="https://github.com/godofreda/api"

# Criar usuário não-root para segurança
RUN groupadd -r godofreda && useradd -r -g godofreda godofreda

# Instalar dependências do sistema (apenas runtime)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1-dev \
    espeak-ng \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Configurar ambiente de runtime
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TTS_HOME=/app/tts_models \
    NUMBA_CACHE_DIR=/tmp/numba_cache \
    PYTHONPATH=/app

# Copiar dependências Python do stage de build
COPY --from=builder /root/.local /home/godofreda/.local

# Criar diretórios necessários com permissões corretas
RUN mkdir -p /app/logs /app/tts_temp /app/tts_models /tmp/numba_cache && \
    chown -R godofreda:godofreda /app /tmp/numba_cache && \
    chmod -R 755 /app && \
    chmod -R 1777 /tmp/numba_cache

# Copiar aplicação (apenas arquivos necessários)
COPY --chown=godofreda:godofreda ./app /app

# Copiar script de entrada
COPY --chown=godofreda:godofreda ./docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Configurar PATH para incluir dependências locais
ENV PATH="/home/godofreda/.local/bin:$PATH"

# Mudar para usuário não-root
USER godofreda

# Configurar health check robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8000/health || exit 1

# Expor porta da aplicação
EXPOSE 8000

# Configurar entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Comando padrão
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]