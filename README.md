# 🤖 Godofreda - IA VTuber Multimodal

[![CI/CD](https://github.com/godofreda/godofreda/actions/workflows/ci.yml/badge.svg)](https://github.com/godofreda/godofreda/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-green.svg)](https://fastapi.tiangolo.com/)

> **Godofreda** [em Desenvolvimento] é uma IA VTuber sarcástica e irreverente com capacidades de síntese de voz, chat conversacional e análise multimodal.

## 🚀 Características

- **🎤 Síntese de Voz Avançada**: TTS em português com Coqui TTS
- **💬 Chat Inteligente**: Conversação sarcástica com LLM local (Ollama)
- **🖼️ Análise Multimodal**: Suporte a texto, imagem e voz
- **⚡ API REST**: FastAPI com documentação automática
- **📊 Monitoramento**: Métricas Prometheus e health checks
- **🛡️ Segurança**: Rate limiting, CORS configurado, validação robusta
- **🧹 Limpeza Automática**: Gerenciamento automático de arquivos temporários
- **💾 Cache Inteligente**: Cache Redis para otimização de performance
- **🐳 Docker**: Containerização completa com docker-compose
- **📱 Dashboard React**: Interface web moderna

## 🏗️ Arquitetura

```
Godofreda/
├── app/                    # Backend FastAPI
│   ├── main.py            # API principal
│   ├── config.py          # Configuração centralizada
│   ├── llm_service.py     # Serviço LLM (Ollama)
│   ├── cache_service.py   # Cache Redis
│   ├── rate_limiter.py    # Rate limiting
│   └── cleanup_service.py # Limpeza automática
├── frontend/              # Dashboard React
├── monitoring/            # Stack de monitoramento
│   ├── prometheus/        # Métricas
│   ├── grafana/          # Dashboards
│   └── alertmanager/     # Alertas
├── docker/               # Dockerfiles
├── tests/                # Testes automatizados
└── docs/                 # Documentação
```

## 🛠️ Tecnologias

### Backend
- **FastAPI** - Framework web moderno
- **Coqui TTS** - Síntese de voz
- **Ollama** - LLM local
- **Redis** - Cache e rate limiting
- **Prometheus** - Métricas e monitoramento

### Frontend
- **React** - Interface web
- **TypeScript** - Tipagem estática
- **Nginx** - Servidor web

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Grafana** - Dashboards
- **AlertManager** - Alertas

## 📦 Instalação

### Pré-requisitos

- Docker e Docker Compose
- Python 3.11+ (para desenvolvimento)
- Node.js 18+ (para desenvolvimento frontend)

### Instalação Rápida

1. **Clone o repositório**
```bash
git clone https://github.com/godofreda/godofreda.git
cd godofreda
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env com suas configurações
```

3. **Inicie com Docker Compose**
```bash
make up
```

4. **Acesse a aplicação**
- API: http://localhost:8000
- Dashboard: http://localhost:3000
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

### Desenvolvimento

1. **Instale dependências Python**
```bash
pip install -r requirements.txt
```

2. **Instale dependências Node.js**
```bash
cd frontend
npm install
```

3. **Execute testes**
```bash
make test
```

4. **Execute linting**
```bash
make lint
```

## 🎯 Uso

### API REST

#### Síntese de Voz
```bash
curl -X POST "http://localhost:8000/falar" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "texto=Olá, eu sou a Godofreda!"
```

#### Chat Conversacional
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "user_input=Como você está hoje?"
```

#### Chat Multimodal
```bash
curl -X POST "http://localhost:8000/api/godofreda/chat" \
  -F "text=Analise esta imagem" \
  -F "image=@imagem.jpg"
```

### Dashboard Web

Acesse http://localhost:3000 para usar a interface web interativa.

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# API
API_HOST=0.0.0.0
API_PORT=8000
API_MAX_TEXT_LENGTH=1000

# TTS
TTS_MODEL=tts_models/multilingual/multi-dataset/your_tts
TTS_TEMP_DIR=app/tts_temp
DEFAULT_SPEAKER=default

# LLM
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b

# Redis
REDIS_URL=redis://redis:6379

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:8080"]
```

### Modelos TTS

O sistema suporta modelos Coqui TTS. Baixe modelos em `app/tts_models/`.

### Modelos LLM

Configure modelos Ollama em `scripts/init_ollama.sh`.

## 📊 Monitoramento

### Métricas Disponíveis

- **godofreda_requests_total**: Total de requisições por endpoint
- **godofreda_request_duration_seconds**: Duração das requisições
- **godofreda_tts_requests_total**: Requisições de TTS
- **godofreda_errors_total**: Total de erros
- **godofreda_active_connections**: Conexões ativas

### Dashboards Grafana

Acesse http://localhost:3001 para visualizar dashboards de monitoramento.

## 🧪 Testes

```bash
# Executar todos os testes
make test

# Executar testes com coverage
pytest tests/ -v --cov=app --cov-report=html

# Executar testes específicos
pytest tests/test_api.py::test_chat_endpoint
```

## 🚀 Deploy

### Produção

```bash
# Build das imagens
make build

# Deploy com docker-compose
make up-prod

# Verificar logs
make logs
```

### Kubernetes

```bash
# Aplicar manifests
kubectl apply -f k8s/

# Verificar status
kubectl get pods -n godofreda
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use **Black** para formatação
- Use **Flake8** para linting
- Siga **PEP 8** para estilo Python
- Escreva testes para novas funcionalidades

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [Coqui TTS](https://github.com/coqui-ai/TTS) - Síntese de voz
- [Ollama](https://ollama.ai/) - LLM local
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web
- [React](https://reactjs.org/) - Interface web

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/godofreda/godofreda/issues)
- **Discord**: [Servidor da Comunidade](https://discord.gg/godofreda)
- **Email**: team@godofreda.ai

---

**Desenvolvido com ❤️ pela equipe Godofreda** 