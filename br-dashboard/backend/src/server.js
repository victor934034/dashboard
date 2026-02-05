require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const sheetsRoutes = require('./routes/sheets.routes');
const crmRoutes = require('./routes/crm.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const campanhasRoutes = require('./routes/campanhas.routes');
const webhooksRoutes = require('./routes/webhooks.routes');
const stockRoutes = require('./routes/stock.routes');

// Importar serviços
const googleSheetsService = require('./services/googleSheets.service');

const app = express();
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Tornar io disponível globalmente
app.set('io', io);
global.io = io;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/campanhas', campanhasRoutes);
app.use('/api/stock', stockRoutes);
app.use('/webhook', webhooksRoutes);

// Redirecionar raiz para o frontend
app.get('/', (req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'https://dashboard-dashboard1.zdc13k.easypanel.host/');
});

// Rota de health check
app.get('/health', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`
    },
    services: {
      // Nenhum serviço adicional no momento
    }
  });
});

// Handler de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

// Socket.io - Gerenciar conexões
io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });

  // Entrar em sala de chat específico
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`📱 Cliente ${socket.id} entrou no chat ${chatId}`);
  });

  // Sair de sala de chat
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`📱 Cliente ${socket.id} saiu do chat ${chatId}`);
  });
});

// Inicializar serviços
async function initializeServices() {
  try {
    console.log('🚀 Inicializando serviços...');

    // Inicializar Google Sheets
    await googleSheetsService.initialize();
    console.log('✅ Google Sheets inicializado');

  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error);
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║           🚀 BR DASHBOARD BACKEND                   ║
║                                                      ║
║  Status: Servidor Ativo na porta ${PORT}             ║
║  Ambiente: ${process.env.NODE_ENV || 'development'}                     ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);

  initializeServices();
});

// Tratamento de sinais para shutdown gracioso
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

module.exports = { app, server, io };
