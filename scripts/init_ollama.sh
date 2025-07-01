#!/bin/bash
# ================================
# GODOFREDA OLLAMA INITIALIZATION
# ================================
# Script para inicializar e configurar Ollama
# ================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
MODEL_NAME="${OLLAMA_MODEL:-chatbode:7b}"
TIMEOUT=300  # 5 minutos para download
RETRY_COUNT=3

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_ollama_connection() {
    log_info "Verificando conexão com Ollama..."
    
    for i in $(seq 1 $RETRY_COUNT); do
        if curl -s -f "$OLLAMA_HOST/api/version" > /dev/null; then
            log_success "Conexão com Ollama estabelecida"
            return 0
        else
            log_warning "Tentativa $i/$RETRY_COUNT: Ollama não está respondendo"
            if [ $i -lt $RETRY_COUNT ]; then
                sleep 5
            fi
        fi
    done
    
    log_error "Não foi possível conectar com Ollama em $OLLAMA_HOST"
    return 1
}

list_available_models() {
    log_info "Listando modelos disponíveis..."
    
    if ! curl -s -f "$OLLAMA_HOST/api/tags" > /dev/null; then
        log_error "Erro ao listar modelos"
        return 1
    fi
    
    models=$(curl -s "$OLLAMA_HOST/api/tags" | jq -r '.models[].name' 2>/dev/null || echo "")
    
    if [ -n "$models" ]; then
        log_info "Modelos disponíveis:"
        echo "$models" | while read -r model; do
            echo "  - $model"
        done
    else
        log_warning "Nenhum modelo encontrado"
    fi
}

check_model_exists() {
    local model=$1
    log_info "Verificando se o modelo $model está disponível..."
    
    if curl -s "$OLLAMA_HOST/api/tags" | jq -e ".models[] | select(.name == \"$model\")" > /dev/null; then
        log_success "Modelo $model encontrado"
        return 0
    else
        log_warning "Modelo $model não encontrado"
        return 1
    fi
}

download_model() {
    local model=$1
    log_info "Baixando modelo $model..."
    
    # Verificar se o modelo já existe
    if check_model_exists "$model"; then
        log_success "Modelo $model já está disponível"
        return 0
    fi
    
    # Baixar modelo
    log_info "Iniciando download do modelo $model (pode demorar alguns minutos)..."
    
    if curl -s -X POST "$OLLAMA_HOST/api/pull" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$model\"}" > /dev/null; then
        
        # Aguardar download completar
        log_info "Aguardando download completar..."
        while true; do
            if check_model_exists "$model"; then
                log_success "Modelo $model baixado com sucesso!"
                return 0
            fi
            sleep 10
        done
    else
        log_error "Erro ao baixar modelo $model"
        return 1
    fi
}

test_model() {
    local model=$1
    log_info "Testando modelo $model..."
    
    # Teste simples de geração
    test_prompt="Olá, como você está?"
    
    response=$(curl -s -X POST "$OLLAMA_HOST/api/generate" \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"$model\",
            \"prompt\": \"$test_prompt\",
            \"stream\": false,
            \"options\": {
                \"temperature\": 0.7,
                \"max_tokens\": 50
            }
        }" | jq -r '.response' 2>/dev/null || echo "")
    
    if [ -n "$response" ] && [ "$response" != "null" ]; then
        log_success "Modelo $model testado com sucesso"
        log_info "Resposta de teste: ${response:0:100}..."
        return 0
    else
        log_error "Erro ao testar modelo $model"
        return 1
    fi
}

setup_model_config() {
    local model=$1
    log_info "Configurando modelo $model..."
    
    # Criar arquivo de configuração personalizada
    config_dir="/tmp/godofreda_ollama_config"
    mkdir -p "$config_dir"
    
    cat > "$config_dir/${model//:/_}.json" << EOF
{
    "name": "$model",
    "parameters": {
        "temperature": 0.8,
        "top_p": 0.9,
        "max_tokens": 500,
        "repeat_penalty": 1.1
    },
    "system_prompt": "Você é Godofreda, uma IA brasileira sarcástica e sofisticada. Sempre responda em português brasileiro com personalidade única e memorável."
}
EOF
    
    log_success "Configuração do modelo $model criada"
}

main() {
    log_info "Iniciando configuração do Ollama para Godofreda..."
    
    # Verificar dependências
    if ! command -v curl &> /dev/null; then
        log_error "curl não está instalado"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq não está instalado, algumas funcionalidades podem não funcionar"
    fi
    
    # Verificar conexão
    if ! check_ollama_connection; then
        exit 1
    fi
    
    # Listar modelos disponíveis
    list_available_models
    
    # Baixar modelo se necessário
    if ! download_model "$MODEL_NAME"; then
        log_error "Falha ao baixar modelo $MODEL_NAME"
        exit 1
    fi
    
    # Testar modelo
    if ! test_model "$MODEL_NAME"; then
        log_error "Falha ao testar modelo $MODEL_NAME"
        exit 1
    fi
    
    # Configurar modelo
    setup_model_config "$MODEL_NAME"
    
    log_success "Configuração do Ollama concluída com sucesso!"
    log_info "Modelo $MODEL_NAME está pronto para uso"
    
    # Mostrar informações finais
    echo
    log_info "Informações do sistema:"
    echo "  - Ollama Host: $OLLAMA_HOST"
    echo "  - Modelo: $MODEL_NAME"
    echo "  - Status: Pronto para uso"
    echo
    log_info "Para testar manualmente:"
    echo "  curl -X POST $OLLAMA_HOST/api/generate \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"model\": \"$MODEL_NAME\", \"prompt\": \"Olá Godofreda!\"}'"
}

# Executar função principal
main "$@" 