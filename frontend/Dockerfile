# ================================
# GODOFREDA FRONTEND DOCKERFILE
# ================================
# Multi-stage build para otimizar tamanho e segurança
# ================================

# ================================
# STAGE 1: DEPENDENCIES
# ================================
FROM node:18-alpine as deps

# Instalar dependências de build
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm install --silent && npm cache clean --force

# ================================
# STAGE 2: BUILD
# ================================
FROM node:18-alpine as builder

# Instalar dependências de build
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar arquivos de configuração
COPY package*.json ./
COPY public ./public
COPY src ./src

# Configurar variáveis de ambiente para build
ENV NODE_ENV=production \
    GENERATE_SOURCEMAP=false \
    CI=false

# Executar build com validação
RUN npm run build && \
    if [ ! -d "build" ]; then \
        echo "Build failed - build directory not found" && exit 1; \
    fi && \
    echo "Build completed successfully"

# ================================
# STAGE 3: RUNTIME
# ================================
FROM nginx:alpine as runtime

# Metadados da imagem
LABEL maintainer="Godofreda Team <team@godofreda.ai>" \
      version="1.0.0" \
      description="Godofreda Frontend - Dashboard VTuber" \
      org.opencontainers.image.source="https://github.com/godofreda/frontend"

# Instalar dependências necessárias
RUN apk add --no-cache curl

# Configurar nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar aplicação buildada
COPY --from=builder --chown=nginx:nginx /app/build /usr/share/nginx/html

# Criar diretórios necessários em locais graváveis
RUN mkdir -p /tmp/nginx_cache /tmp/nginx_logs /tmp/nginx && \
    mkdir -p /tmp/nginx_cache/client_temp /tmp/nginx_cache/proxy_temp /tmp/nginx_cache/fastcgi_temp /tmp/nginx_cache/uwsgi_temp /tmp/nginx_cache/scgi_temp && \
    chown -R nginx:nginx /tmp/nginx_cache /tmp/nginx_logs /tmp/nginx

# Configurar health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:3000/ || exit 1

# Mudar para usuário não-root
USER nginx

# Expor porta da aplicação
EXPOSE 3000

# Configurar entrypoint
ENTRYPOINT ["nginx", "-g", "daemon off;"] 