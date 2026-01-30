FROM node:20.11-slim AS builder
# Forçando limpeza completa de cache - 30/01/2026 12:45

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# COPIE O RESTO DOS ARQUIVOS
COPY . .

# ADICIONE ESTA LINHA: Ela força o Linux a permitir a execução do TSC
RUN chmod +x ./node_modules/.bin/tsc

# AGORA O COMANDO DE BUILD VAI FUNCIONAR
RUN npm run build

# Imagem de produção com Nginx
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
