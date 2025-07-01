#!/bin/bash

# ================================
# GODOFREDA API ENTRYPOINT
# ================================
# Script de inicialização da API com validações e logging
# ================================

set -euo pipefail  # Fail fast on errors

# ================================
# CONFIGURAÇÕES
# ================================
readonly APP_NAME="Godofreda API"
readonly LOG_FILE="/app/logs/entrypoint.log"
readonly PID_FILE="/tmp/godofreda.pid"

# ================================
# FUNÇÕES DE LOGGING
# ================================
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_debug() { log "DEBUG" "$@"; }

# ================================
# FUNÇÕES DE VALIDAÇÃO
# ================================
validate_environment() {
    log_info "Validando ambiente..."
    
    # Verificar variáveis obrigatórias
    local required_vars=("TTS_HOME" "PYTHONPATH")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Variável obrigatória não definida: ${var}"
            exit 1
        fi
    done
    
    # Verificar diretórios necessários
    local required_dirs=("/app" "/app/logs" "/app/tts_temp" "/app/tts_models")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "Diretório obrigatório não encontrado: ${dir}"
            exit 1
        fi
    done
    
    log_info "Ambiente validado com sucesso"
}

validate_dependencies() {
    log_info "Validando dependências..."
    
    # Verificar se Python está disponível
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 não encontrado"
        exit 1
    fi
    
    # Verificar se uvicorn está disponível
    if ! python3 -c "import uvicorn" &> /dev/null; then
        log_error "Uvicorn não encontrado"
        exit 1
    fi
    
    # Verificar se FastAPI está disponível
    if ! python3 -c "import fastapi" &> /dev/null; then
        log_error "FastAPI não encontrado"
        exit 1
    fi
    
    log_info "Dependências validadas com sucesso"
}

# ================================
# FUNÇÕES DE CONTROLE
# ================================
cleanup() {
    log_info "Executando cleanup..."
    
    # Remover arquivo PID se existir
    if [[ -f "$PID_FILE" ]]; then
        rm -f "$PID_FILE"
    fi
    
    # Limpar arquivos temporários
    find /tmp -name "*.tmp" -delete 2>/dev/null || true
    
    log_info "Cleanup concluído"
}

graceful_shutdown() {
    log_info "Recebido sinal de shutdown, finalizando graciosamente..."
    
    # Parar o servidor se estiver rodando
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Parando servidor (PID: $pid)..."
            kill -TERM "$pid"
            
            # Aguardar até 30 segundos
            local count=0
            while kill -0 "$pid" 2>/dev/null && [[ $count -lt 30 ]]; do
                sleep 1
                ((count++))
            done
            
            # Forçar kill se necessário
            if kill -0 "$pid" 2>/dev/null; then
                log_warn "Forçando finalização do processo (PID: $pid)"
                kill -KILL "$pid"
            fi
        fi
    fi
    
    cleanup
    log_info "Shutdown concluído"
    exit 0
}

# ================================
# CONFIGURAÇÃO DE SINAIS
# ================================
trap graceful_shutdown SIGTERM SIGINT

# ================================
# FUNÇÃO PRINCIPAL
# ================================
main() {
    log_info "Iniciando ${APP_NAME}..."
    
    # Criar diretório de logs se não existir
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Validar ambiente e dependências
    validate_environment
    validate_dependencies
    
    # Configurar variáveis de ambiente padrão
    export HOST="${HOST:-0.0.0.0}"
    export PORT="${PORT:-8000}"
    export WORKERS="${WORKERS:-1}"
    # Converter LOG_LEVEL para minúsculo (uvicorn requer minúsculo)
    export LOG_LEVEL="${LOG_LEVEL:-info}"
    LOG_LEVEL=$(echo "$LOG_LEVEL" | tr '[:upper:]' '[:lower:]')
    
    log_info "Configuração: HOST=${HOST}, PORT=${PORT}, WORKERS=${WORKERS}, LOG_LEVEL=${LOG_LEVEL}"
    
    # Iniciar servidor
    log_info "Iniciando servidor FastAPI..."
    
    # Executar uvicorn em background e capturar PID
    uvicorn main:app \
        --host "$HOST" \
        --port "$PORT" \
        --workers "$WORKERS" \
        --log-level "$LOG_LEVEL" \
        --access-log \
        --use-colors &
    
    local server_pid=$!
    echo "$server_pid" > "$PID_FILE"
    
    log_info "Servidor iniciado com PID: $server_pid"
    
    # Aguardar processo
    wait "$server_pid"
}

# ================================
# EXECUÇÃO
# ================================
main "$@"