const express = require('express');
const router = express.Router();
const campanhasService = require('../services/campanhas.service');

// Listar campanhas
router.get('/', async (req, res) => {
  try {
    const useCache = req.query.cache !== 'false';
    const result = await campanhasService.getCampanhas(useCache);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Campanhas em formato texto (para IA)
router.get('/texto', async (req, res) => {
  try {
    const texto = await campanhasService.getCampanhasTexto();
    res.send(texto);
  } catch (error) {
    res.status(500).send('Erro ao buscar campanhas');
  }
});

// Limpar cache
router.post('/clear-cache', async (req, res) => {
  try {
    campanhasService.clearCache();
    res.json({
      success: true,
      message: 'Cache limpo com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Adicionar campanha
router.post('/', async (req, res) => {
  try {
    const result = await campanhasService.addCampanha(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Atualizar campanha (PUT)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await campanhasService.updateCampanha(id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar campanha
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await campanhasService.deleteCampanha(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
