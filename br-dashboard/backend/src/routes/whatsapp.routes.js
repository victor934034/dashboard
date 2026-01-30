const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp.service');

// Listar conversas
router.get('/chats', async (req, res) => {
  try {
    console.log('📥 Recebida requisição GET /api/whatsapp/chats');
    const chats = await whatsappService.getChats();
    console.log(`📤 Enviando ${chats.length} chats para o frontend`);
    res.json({
      success: true,
      chats,
      total: chats.length
    });
  } catch (error) {
    console.error('❌ Erro na rota /api/whatsapp/chats:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Buscar mensagens de um chat
router.get('/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await whatsappService.getChatMessages(chatId, limit);
    res.json({
      success: true,
      chatId,
      messages,
      total: messages.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar mensagem
router.post('/send', async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({
        success: false,
        error: 'chatId e message são obrigatórios'
      });
    }

    const result = await whatsappService.sendMessage(chatId, message, false);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CONTROLE DE IA - BLOQUEAR
router.post('/block-ai/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = whatsappService.blockAI(chatId);

    res.json({
      success: true,
      message: 'IA bloqueada para este chat',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CONTROLE DE IA - DESBLOQUEAR
router.post('/unblock-ai/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = whatsappService.unblockAI(chatId);

    res.json({
      success: true,
      message: 'IA desbloqueada para este chat',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// STATUS DA IA
router.get('/ai-status/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const status = whatsappService.getAIStatus(chatId);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status geral do serviço
router.get('/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
