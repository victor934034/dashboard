const express = require('express');
const router = express.Router();
const pedidosService = require('../services/pedidos.service');

// Listar todos os pedidos
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const result = await pedidosService.getPedidos({ status, limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Estatísticas de pedidos (antes do :id para não conflitar)
router.get('/stats/overview', async (req, res) => {
  try {
    const result = await pedidosService.getStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Buscar pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pedidosService.getPedidoById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Atualizar status do pedido
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pedidosService.updatePedido(id, { status });

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Atualizar pedido completo
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pedidosService.updatePedido(id, req.body);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar pedido
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pedidosService.deletePedido(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

