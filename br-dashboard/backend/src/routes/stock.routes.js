const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase.service');

// Listar todos os produtos (estoque)
router.get('/products', async (req, res) => {
    try {
        const result = await supabaseService.getProducts();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Adicionar novo produto
router.post('/products', async (req, res) => {
    try {
        const result = await supabaseService.addProduct(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Atualizar quantidade de um produto
router.patch('/products/:id/quantity', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const result = await supabaseService.updateQuantity(id, quantity);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Atualizar produto completo
router.put('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await supabaseService.updateProduct(id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Deletar produto
router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await supabaseService.deleteProduct(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Buscar produtos com estoque baixo (para o dashboard)
router.get('/low-stock', async (req, res) => {
    try {
        const result = await supabaseService.getLowStock();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Diagnóstico de conexão (para depuração)
router.get('/status', async (req, res) => {
    try {
        const result = await supabaseService.checkConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
