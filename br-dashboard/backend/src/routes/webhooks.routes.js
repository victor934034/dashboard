const express = require('express');
const router = express.Router();

// WEBHOOK: RECEBER PEDIDOS DO N8N
router.post('/pedido', async (req, res) => {
  try {
    console.log('📦 Novo pedido recebido do N8N:', req.body);

    const {
      cliente,
      itens,
      total,
      endereco,
      whatsapp,
      data_hora
    } = req.body;

    if (!cliente || !itens || !total) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos. Campos obrigatórios: cliente, itens, total'
      });
    }

    const pedido = {
      id: `PED-${Date.now()}`,
      cliente,
      itens: typeof itens === 'string' ? itens : JSON.stringify(itens),
      total: parseFloat(total),
      endereco: endereco || 'Não informado',
      whatsapp: whatsapp || 'Não informado',
      data_hora: data_hora || new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      }),
      status: 'pendente',
      origem: 'whatsapp',
      createdAt: new Date()
    };

    console.log('✅ Pedido processado:', pedido.id);

    if (global.io) {
      global.io.emit('novo-pedido', pedido);
      global.io.emit('notification', {
        type: 'novo-pedido',
        title: 'Novo Pedido Recebido!',
        message: `Pedido de ${cliente} - R$ ${total}`,
        pedido
      });
    }

    res.json({
      success: true,
      message: `✅ Sucesso! O pedido de ${cliente} foi recebido e salvo.`,
      pedidoId: pedido.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao processar pedido:', error);
    res.status(500).json({
      success: false,
      error: `❌ Erro no processamento: ${error.message}`
    });
  }
});

// WEBHOOK: CHAMAR ATENDENTE HUMANO
router.post('/chamar-atendente', async (req, res) => {
  try {
    console.log('🆘 Solicitação de atendente humano:', req.body);

    const {
      chatId,
      cliente,
      mensagem,
      contexto
    } = req.body;

    if (global.io) {
      global.io.emit('whatsapp:human-needed', {
        chatId,
        cliente,
        mensagem,
        contexto,
        timestamp: new Date().toISOString()
      });

      global.io.emit('notification', {
        type: 'atendimento-solicitado',
        title: '🆘 Atendente Necessário',
        message: `${cliente} precisa de atendimento humano`,
        chatId,
        priority: 'high'
      });
    }

    res.json({
      success: true,
      message: 'Atendente notificado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao processar solicitação de atendente:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
