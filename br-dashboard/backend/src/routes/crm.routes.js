const express = require('express');
const router = express.Router();
const baserowService = require('../services/baserow.service');

// Diagnóstico Baserow
router.get('/status', async (req, res) => {
  try {
    const result = await baserowService.checkConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar leads
router.get('/leads', async (req, res) => {
  try {
    const result = await baserowService.getLeads();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Criar lead
router.post('/leads', async (req, res) => {
  try {
    const result = await baserowService.createLead(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Atualizar lead
router.patch('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await baserowService.updateLead(id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar lead
router.delete('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await baserowService.deleteLead(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
