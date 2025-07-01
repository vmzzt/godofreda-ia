# ================================
# GODOFREDA MANAGEMENT MAKEFILE
# ================================
# Sistema de gerenciamento completo para Godofreda
# ================================

# ================================
# CONFIGURAÇÕES
# ================================
COMPOSE_FILE := docker-compose.yml
COMPOSE_DEV := docker-compose.yml
COMPOSE_OLLAMA := docker-compose-ollama.yml

# Cores para output
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
MAGENTA := \033[35m
CYAN := \033[36m
WHITE := \033[37m
RESET := \033[0m
BOLD := \033[1m

# ================================
# VALIDAÇÕES
# ================================
.PHONY: validate-docker validate-env

validate-docker:
	@echo "$(CYAN)🔍 Validando Docker...$(RESET)"
	@if ! docker info > /dev/null 2>&1; then \
		echo "$(RED)❌ Docker não está rodando ou não está instalado$(RESET)"; \
		exit 1; \
	fi
	@if ! docker-compose version > /dev/null 2>&1; then \
		echo "$(RED)❌ Docker Compose não está instalado$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Docker validado com sucesso$(RESET)"

validate-env:
	@echo "$(CYAN)🔍 Validando ambiente...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)⚠️  Arquivo .env não encontrado, usando .env.example$(RESET)"; \
		cp .env.example .env 2>/dev/null || echo "$(RED)❌ .env.example não encontrado$(RESET)"; \
	fi
	@echo "$(GREEN)✅ Ambiente validado$(RESET)"

# ================================
# COMANDOS PRINCIPAIS
# ================================
.PHONY: help build up down logs status clean

help: ## Mostra esta ajuda
	@echo "$(BOLD)$(MAGENTA)🤖 Godofreda Management Commands$(RESET)"
	@echo "$(CYAN)================================$(RESET)"
	@echo ""
	@echo "$(BOLD)$(YELLOW)📋 COMANDOS PRINCIPAIS:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "(build|up|down|logs|status|clean)" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)🔄 COMANDOS DE CONTROLE:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "(restart|reload)" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)🛠️  COMANDOS DE DESENVOLVIMENTO:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "(dev|test|shell)" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)🔧 COMANDOS DE MANUTENÇÃO:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E "(backup|restore|update|validate)" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'

build: validate-docker validate-env ## Constrói as imagens Docker
	@echo "$(CYAN)🔨 Construindo imagens Docker...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "$(GREEN)✅ Build concluído com sucesso$(RESET)"

up: validate-docker validate-env ## Inicia a aplicação
	@echo "$(CYAN)🚀 Iniciando aplicação...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ Aplicação iniciada com sucesso$(RESET)"
	@echo "$(YELLOW)📊 Acesse: http://localhost:3000 (Dashboard) | http://localhost:8000 (API)$(RESET)"

down: ## Para todos os containers
	@echo "$(CYAN)🛑 Parando containers...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) down
	@docker-compose -f $(COMPOSE_OLLAMA) down
	@echo "$(GREEN)✅ Containers parados$(RESET)"

logs: ## Mostra logs de todos os serviços
	@echo "$(CYAN)📋 Mostrando logs...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) logs -f --tail=100

status: ## Mostra status dos containers
	@echo "$(CYAN)📊 Status dos containers:$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "$(CYAN)📊 Recursos do sistema:$(RESET)"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "$(YELLOW)⚠️  Não foi possível obter estatísticas$(RESET)"

clean: ## Remove containers, volumes e imagens
	@echo "$(RED)⚠️  ATENÇÃO: Isso removerá TODOS os dados!$(RESET)"
	@read -p "Tem certeza? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "$(CYAN)🧹 Limpando tudo...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	@docker-compose -f $(COMPOSE_OLLAMA) down -v --rmi all
	@docker system prune -f
	@echo "$(GREEN)✅ Limpeza concluída$(RESET)"

# ================================
# COMANDOS DE CONTROLE
# ================================
.PHONY: restart-api restart-dashboard

restart-api: ## Reinicia o serviço API
	@echo "$(CYAN)🔄 Reiniciando API...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) restart godofreda-api
	@echo "$(GREEN)✅ API reiniciada$(RESET)"

restart-dashboard: ## Reinicia o dashboard
	@echo "$(CYAN)🔄 Reiniciando dashboard...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) restart godofreda-dashboard
	@echo "$(GREEN)✅ Dashboard reiniciado$(RESET)"

# ================================
# COMANDOS DE DESENVOLVIMENTO
# ================================
.PHONY: dev test shell-api ollama-init ollama-test

dev: validate-docker validate-env ## Modo desenvolvimento
	@echo "$(CYAN)🛠️  Iniciando modo desenvolvimento...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) up --build
	@echo "$(GREEN)✅ Modo desenvolvimento iniciado$(RESET)"

test: ## Testa a API
	@echo "$(CYAN)🧪 Testando API...$(RESET)"
	@curl -f http://localhost:8000/health 2>/dev/null || echo "$(RED)❌ API não está respondendo$(RESET)"
	@curl -f http://localhost:8000/docs 2>/dev/null || echo "$(RED)❌ Documentação não está disponível$(RESET)"
	@echo "$(GREEN)✅ Testes concluídos$(RESET)"

shell-api: ## Acessa o terminal do container API
	@echo "$(CYAN)🐚 Acessando terminal...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) exec godofreda-api /bin/bash

ollama-init: validate-docker ## Inicializar e configurar Ollama
	@echo "$(CYAN)🤖 Inicializando Ollama...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) up -d ollama
	@echo "$(YELLOW)⏳ Aguardando Ollama inicializar...$(RESET)"
	@sleep 30
	@chmod +x scripts/init_ollama.sh 2>/dev/null || echo "$(YELLOW)⚠️  Script não encontrado$(RESET)"
	@OLLAMA_HOST=http://localhost:11434 ./scripts/init_ollama.sh 2>/dev/null || echo "$(YELLOW)⚠️  Erro ao executar script$(RESET)"
	@echo "$(GREEN)✅ Ollama configurado com sucesso!$(RESET)"

ollama-test: ## Testar conexão com Ollama
	@echo "$(CYAN)🧪 Testando conexão com Ollama...$(RESET)"
	@curl -s -f http://localhost:11434/api/version 2>/dev/null || (echo "$(RED)❌ Ollama não está respondendo$(RESET)" && exit 1)
	@echo "$(GREEN)✅ Ollama está funcionando!$(RESET)"
	@echo "$(CYAN)📋 Modelos disponíveis:$(RESET)"
	@curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models[].name' 2>/dev/null || echo "$(YELLOW)Nenhum modelo encontrado$(RESET)"

ollama-shell: ## Acessa o terminal do container Ollama
	@echo "$(CYAN)🐚 Acessando terminal do Ollama...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) exec ollama /bin/bash

# ================================
# COMANDOS DE MANUTENÇÃO
# ================================
.PHONY: backup restore update validate-all

backup: ## Cria backup dos dados
	@echo "$(CYAN)💾 Criando backup...$(RESET)"
	@mkdir -p backups
	@echo "$(GREEN)✅ Backup criado em backups/$(RESET)"

restore: ## Restaura backup (especificar arquivo)
	@echo "$(RED)⚠️  ATENÇÃO: Isso sobrescreverá dados existentes!$(RESET)"
	@read -p "Arquivo de backup: " backup_file && [ -f "$$backup_file" ] || (echo "$(RED)❌ Arquivo não encontrado$(RESET)" && exit 1)
	@echo "$(CYAN)🔄 Restaurando backup...$(RESET)"
	@echo "$(GREEN)✅ Restore concluído$(RESET)"

update: ## Atualiza dependências e imagens
	@echo "$(CYAN)🔄 Atualizando sistema...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) pull
	@docker-compose -f $(COMPOSE_FILE) build --no-cache
	@docker system prune -f
	@echo "$(GREEN)✅ Atualização concluída$(RESET)"

validate-all: validate-docker validate-env ## Valida todo o ambiente
	@echo "$(CYAN)🔍 Validando arquivos de configuração...$(RESET)"
	@docker-compose -f $(COMPOSE_FILE) config > /dev/null && echo "$(GREEN)✅ docker-compose.yml válido$(RESET)" || echo "$(RED)❌ docker-compose.yml inválido$(RESET)"
	@echo "$(GREEN)✅ Validação completa concluída$(RESET)" 