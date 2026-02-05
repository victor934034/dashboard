const express = require('express');
const router = express.Router();
const pedidosService = require('../services/pedidos.service');

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

    const pedidoData = {
      cliente,
      itens,
      total,
      endereco,
      whatsapp,
      data_hora,
      origem: 'whatsapp'
    };

    // Salvar usando o serviço persistente
    const result = await pedidosService.addPedido(pedidoData);

    if (global.io) {
      global.io.emit('novo-pedido', result.pedido);
      global.io.emit('notification', {
        type: 'novo-pedido',
        title: 'Novo Pedido Recebido!',
        message: `Pedido de ${cliente} - R$ ${total}`,
        pedido: result.pedido
      });
    }

    res.json({
      success: true,
      message: `✅ Sucesso! O pedido de ${cliente} foi recebido e salvo.`,
      pedidoId: result.pedido.id,
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


// WEBHOOK: RECEBER NOVO LEAD DO AGENTE
router.post('/crm/lead', async (req, res) => {
  try {
    console.log('👤 Novo lead recebido para o CRM:', req.body);
    const baserowService = require('../services/baserow.service');

    const { nome, telefone, email, notas, origem } = req.body;

    const result = await baserowService.createLead({
      nome,
      telefone,
      email,
      status: 'novo',
      origem: origem || 'Agente AI',
      notas: notas || 'Lead capturado automaticamente pelo agente'
    });

    if (result.success) {
      if (global.io) {
        global.io.emit('notification', {
          type: 'novo-lead',
          title: '👤 Novo Lead no CRM',
          message: `${nome || 'Alguém'} acabou de ser adicionado!`
        });
      }
      res.json({ success: true, lead: result.lead });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro ao processar lead do agente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
