# 🚀 BR Dashboard - Sistema de Gestão Integrada

Sistema web completo que integra múltiplas ferramentas de gestão empresarial em uma única plataforma.

## 📑 Sumário Executivo

O BR Dashboard é um sistema completo que integra:

- ✅ **Estoque via Google Sheets API** (editável pelo dashboard)
- ✅ **WhatsApp em tempo real** com controle de IA on/off
- ✅ **CRM Kanban** com integração Baserow
- ✅ **Gestor de Pedidos** recebendo webhooks do N8N
- ✅ **Gestor de Campanhas** com API de consulta
- ✅ **Sistema de Transferência Humana** inteligente

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│   BR Dashboard (Frontend React + Backend Node.js)           │
│   - React + Vite + Tailwind CSS + Socket.io-client         │
│   - Node.js + Express + Socket.io                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             │                                                 │
    ┌────────▼──────────┐  ┌─────────────┐  ┌───────────────┐│
    │  Google Sheets    │  │  Baserow    │  │  N8N Agent    ││
    │  (Estoque)        │  │  (CRM)      │  │  (IA)         ││
    │  Service Account  │  │  REST API   │  │  Webhooks     ││
    └───────────────────┘  └─────────────┘  └───────────────┘│
             │                                                 │
    ┌────────▼──────────────────────────────────────────────┐│
    │        PostgreSQL + Redis (Database & Cache)          ││
    └───────────────────────────────────────────────────────┘│
```

## 🔐 Configurações e Credenciais

### 1. Variáveis de Ambiente (.env)

```bash
# ============================================
# CONFIGURAÇÕES GERAIS
# ============================================
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost
BACKEND_URL=http://localhost:3001

# ============================================
# GOOGLE SHEETS API (ESTOQUE)
# ============================================
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-email@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----"

# ============================================
# BASEROW (CRM)
# ============================================
BASEROW_EMAIL=seu-email@exemplo.com
BASEROW_PASSWORD=sua-senha
BASEROW_API_URL=https://api.baserow.io
BASEROW_DATABASE_ID=SEU_DATABASE_ID
BASEROW_TABLE_ID=SEU_TABLE_ID

# ============================================
# N8N WEBHOOKS
# ============================================
N8N_AGENTE_WEBHOOK=https://seu-n8n.com/webhook/agente
N8N_PEDIDOS_WEBHOOK=https://seu-n8n.com/webhook/pedido
N8N_CAMPANHAS_API=https://seu-n8n.com/api/campanhas

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://postgres:senha@localhost:5432/brdashboard
REDIS_URL=redis://localhost:6379

# ============================================
# SEGURANÇA
# ============================================
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# ============================================
# WHATSAPP
# ============================================
WHATSAPP_SESSION_PATH=./whatsapp-session
WHATSAPP_WEBHOOK_SECRET=webhook_secret_aqui
```

## 📦 Estrutura do Projeto

```
br-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── googleSheets.service.js
│   │   │   ├── whatsapp.service.js
│   │   │   ├── baserow.service.js
│   │   │   └── campanhas.service.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── WhatsApp/
│   │   │   ├── Estoque/
│   │   │   ├── CRM/
│   │   │   ├── Pedidos/
│   │   │   └── Campanhas/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🐳 Deploy com Docker Compose

### 1. Construir e Executar

```bash
# Clonar/criar o projeto
cd br-dashboard

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Construir e iniciar todos os serviços
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### 2. Acessar o Sistema

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `GET /api/auth/verify` - Verificar token

### Google Sheets (Estoque)
- `POST /api/sheets/connect` - Conectar planilha
- `GET /api/sheets/read` - Ler dados
- `PUT /api/sheets/update` - Atualizar células
- `POST /api/sheets/add-row` - Adicionar linha
- `DELETE /api/sheets/delete-row/:rowIndex` - Deletar linha
- `GET /api/sheets/low-stock` - Produtos com estoque baixo

### WhatsApp
- `GET /api/whatsapp/chats` - Listar conversas
- `GET /api/whatsapp/chats/:chatId/messages` - Buscar mensagens
- `POST /api/whatsapp/send` - Enviar mensagem
- `POST /api/whatsapp/block-ai/:chatId` - Bloquear IA
- `POST /api/whatsapp/unblock-ai/:chatId` - Desbloquear IA
- `GET /api/whatsapp/ai-status/:chatId` - Status da IA

### CRM (Baserow)
- `GET /api/crm/leads` - Listar leads
- `POST /api/crm/leads` - Criar lead
- `PATCH /api/crm/leads/:id` - Atualizar lead
- `DELETE /api/crm/leads/:id` - Deletar lead

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/:id` - Buscar pedido
- `PATCH /api/pedidos/:id/status` - Atualizar status
- `GET /api/pedidos/stats/overview` - Estatísticas

### Campanhas
- `GET /api/campanhas` - Listar campanhas
- `GET /api/campanhas/texto` - Campanhas em formato texto
- `POST /api/campanhas/clear-cache` - Limpar cache

### Webhooks (N8N)
- `POST /webhook/pedido` - Receber pedidos
- `POST /webhook/chamar-atendente` - Solicitar atendente humano

## ✅ Funcionalidades

### Estoque (Google Sheets)
- [x] Conectar via URL
- [x] Editar células diretamente
- [x] Adicionar/remover linhas
- [x] Alertas de estoque baixo
- [x] Sincronização em tempo real

### WhatsApp
- [x] Chat em tempo real
- [x] Contador de mensagens não lidas
- [x] Botão bloquear/desbloquear IA
- [x] Integração com N8N
- [x] Histórico de mensagens

### CRM
- [x] Kanban visual
- [x] Integração Baserow
- [x] Gerenciamento de leads
- [x] Pipeline de vendas

### Pedidos
- [x] Webhook recebendo do N8N
- [x] Estrutura correta de dados
- [x] Notificações em tempo real
- [x] Lista de pedidos com estatísticas

### Campanhas
- [x] API de consulta
- [x] Cache inteligente
- [x] Formato texto para IA
- [x] Interface de gestão

## 🛠️ Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Socket.io-client
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- Socket.io
- Google APIs
- WhatsApp Web.js
- PostgreSQL
- Redis
- JWT
- Sequelize

## 🔒 Segurança

- Autenticação JWT
- CORS configurado
- Helmet para headers de segurança
- Rate limiting (recomendado adicionar)
- Validação de inputs

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos canais oficiais.

---

**BR Dashboard** - Sistema de Gestão Integrada 🚀
