FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Garante que não estamos usando nada do host que possa ter vindo sem querer
# O .dockerignore deveria cuidar disso, mas vamos garantir
COPY . .

# Forçar permissões em toda a pasta de binários
RUN chmod -R +x node_modules/.bin

# AGORA O COMANDO DE BUILD USANDO NODE DIRETAMENTE (Ignora erro de permissão do arquivo)
RUN node node_modules/typescript/bin/tsc -b && node node_modules/vite/bin/vite.js build

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
