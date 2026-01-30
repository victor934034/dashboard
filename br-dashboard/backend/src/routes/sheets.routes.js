const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheets.service');

// Conectar planilha
router.post('/connect', async (req, res) => {
  try {
    const { userId, spreadsheetUrl } = req.body;

    if (!userId || !spreadsheetUrl) {
      return res.status(400).json({
        success: false,
        error: 'userId e spreadsheetUrl são obrigatórios'
      });
    }

    const result = await googleSheetsService.connectSpreadsheet(userId, spreadsheetUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ler planilha
router.get('/read', async (req, res) => {
  try {
    const { userId, range, sheetName } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }

    const result = await googleSheetsService.readSheet(userId, range, sheetName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Atualizar planilha
router.put('/update', async (req, res) => {
  try {
    const { userId, range, values, sheetName } = req.body;

    if (!userId || !range || !values) {
      return res.status(400).json({
        success: false,
        error: 'userId, range e values são obrigatórios'
      });
    }

    const result = await googleSheetsService.writeSheet(userId, range, values, sheetName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Adicionar linha
router.post('/add-row', async (req, res) => {
  try {
    const { userId, values, sheetName } = req.body;

    if (!userId || !values) {
      return res.status(400).json({
        success: false,
        error: 'userId e values são obrigatórios'
      });
    }

    const result = await googleSheetsService.addRow(userId, values, sheetName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar linha
router.delete('/delete-row/:rowIndex', async (req, res) => {
  try {
    const { userId, sheetId } = req.body;
    const { rowIndex } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }

    const result = await googleSheetsService.deleteRow(userId, parseInt(rowIndex), sheetId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Atualizar célula
router.put('/update-cell', async (req, res) => {
  try {
    const { userId, cell, value, sheetName } = req.body;

    if (!userId || !cell || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'userId, cell e value são obrigatórios'
      });
    }

    const result = await googleSheetsService.updateCell(userId, cell, value, sheetName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Produtos com estoque baixo
router.get('/low-stock', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }

    const result = await googleSheetsService.getProductsLowStock(userId);
    res.json({
      success: true,
      products: result
    });
  } catch (error) {
    if (error.message.includes('Nenhuma planilha conectada')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status da conexão
router.get('/status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }

    const spreadsheet = googleSheetsService.getConnectedSpreadsheet(userId);
    res.json({
      success: true,
      connected: !!spreadsheet,
      spreadsheet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
