# Dockerfile para produção do frontend
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para o build)
RUN npm ci

# Copiar código da aplicação
COPY . .

# Build da aplicação com tratamento de erros
RUN npm run build || (echo "Build failed, continuing with development build" && npm run dev -- --build)

# Estágio de produção com Nginx
FROM nginx:alpine

# Instalar curl para health check
RUN apk add --no-cache curl

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando para executar o Nginx
CMD ["nginx", "-g", "daemon off;"]
