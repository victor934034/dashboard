FROM public.ecr.aws/docker/library/node:20-alpine
# Optimized backend - V1.2.0 - WhatsApp removed, lightweight build

# Git para dependências do GitHub (se necessário)
RUN apk add --no-cache git

# Diretório de trabalho
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Porta do backend
EXPOSE 3000

# Comando de inicialização
CMD ["node", "src/server.js"]
