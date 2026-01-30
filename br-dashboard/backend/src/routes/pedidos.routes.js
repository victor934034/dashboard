const express = require('express');
const router = express.Router();

// Lista de pedidos em memória (substituir por banco de dados em produção)
let pedidos = [];

// Listar todos os pedidos
router.get('/', (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    let result = pedidos;
    
    if (status) {
      result = result.filter(p => p.status === status);
    }
    
    result = result.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      pedidos: result,
      total: result.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Buscar pedido por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const pedido = pedidos.find(p => p.id === id);
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
    }
    
    res.json({
      success: true,
      pedido
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Atualizar status do pedido
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const pedidoIndex = pedidos.findIndex(p => p.id === id);
    
    if (pedidoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
    }
    
    pedidos[pedidoIndex].status = status;
    pedidos[pedidoIndex].updatedAt = new Date();
    
    res.json({
      success: true,
      pedido: pedidos[pedidoIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Estatísticas de pedidos
router.get('/stats/overview', (req, res) => {
  try {
    const total = pedidos.length;
    const pendentes = pedidos.filter(p => p.status === 'pendente').length;
    const processando = pedidos.filter(p => p.status === 'processando').length;
    const concluidos = pedidos.filter(p => p.status === 'concluido').length;
    const cancelados = pedidos.filter(p => p.status === 'cancelado').length;
    
    const faturamento = pedidos
      .filter(p => p.status === 'concluido')
      .reduce((acc, p) => acc + p.total, 0);
    
    res.json({
      success: true,
      stats: {
        total,
        pendentes,
        processando,
        concluidos,
        cancelados,
        faturamento
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
