FROM node:20-alpine
# Forçando limpeza de cache do backend - 30/01/2026 14:31 - FINAL WHATSAPP PATCH

# Instalar dependências do sistema para Puppeteer (WhatsApp) e Git para dependências do GitHub
RUN apk add --no-cache \
    chromium \
    git \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Variáveis de ambiente para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Diretório de trabalho
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório para sessão do WhatsApp
RUN mkdir -p /app/whatsapp-session

# Porta do backend
EXPOSE 3000

# Comando de inicialização
CMD ["node", "src/server.js"]
