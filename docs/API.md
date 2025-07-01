# Godofreda API Documentation

## Visão Geral

A Godofreda API é uma API REST para conversação com IA VTuber sarcástica e síntese de voz.

## Endpoints

### Health Check

#### GET /
Endpoint raiz com informações da API.

**Resposta:**
```json
{
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
```

#### GET /health
Health check básico.

#### GET /health/ready
Verificação de prontidão do sistema.

#### GET /health/live
Verificação de vitalidade.

#### GET /metrics
Métricas Prometheus.

#### GET /status
Status detalhado do sistema.

### Personalidade

#### GET /personality
Retorna configurações de personalidade da Godofreda.

### Text-to-Speech

#### POST /falar
Sintetiza texto em áudio.

**Parâmetros:**
- `texto` (string, obrigatório): Texto para sintetizar

**Rate Limit:** 30 requisições por minuto

### Chat

#### POST /chat
Chat conversacional com LLM sarcástica.

**Parâmetros:**
- `user_input` (string, obrigatório): Mensagem do usuário
- `context` (string, opcional): Contexto adicional

**Rate Limit:** 60 requisições por minuto

#### POST /api/godofreda/chat
Chat multimodal com suporte a texto, imagem e voz.

**Parâmetros:**
- `text` (string, obrigatório): Texto da mensagem
- `image` (file, opcional): Imagem para análise
- `voice` (file, opcional): Áudio para transcrição

**Rate Limit:** 60 requisições por minuto

## Rate Limiting

A API implementa rate limiting por endpoint:

- **TTS (/falar):** 30 req/min
- **Chat (/chat, /api/godofreda/chat):** 60 req/min
- **Upload:** 10 req/min
- **Default:** 100 req/hora

## Códigos de Erro

- `400`: Bad Request - Entrada inválida
- `429`: Too Many Requests - Rate limit excedido
- `500`: Internal Server Error - Erro interno
- `503`: Service Unavailable - Serviço indisponível

## Monitoramento

A API expõe métricas Prometheus em `/metrics` para monitoramento. 