const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.connectedSpreadsheets = new Map();
    this.cache = new Map();
    this.CACHE_TTL = 30000; // 30 segundos
  }

  invalidateCache(userId) {
    if (!userId) return;
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}_`)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      console.log(`🧹 Cache do Google Sheets invalidado para o usuário ${userId}`);
    }
  }

  async initialize() {
    try {
      const privateKey = process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : '';

      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: privateKey
        },
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ Google Sheets Service inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Sheets:', error);
      throw error;
    }
  }

  extractSpreadsheetId(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) throw new Error('URL inválida do Google Sheets');
    return match[1];
  }

  async connectSpreadsheet(userId, spreadsheetUrl) {
    try {
      const spreadsheetId = this.extractSpreadsheetId(spreadsheetUrl);

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId
      });

      const spreadsheetData = {
        id: spreadsheetId,
        title: response.data.properties.title,
        sheets: response.data.sheets.map(s => ({
          id: s.properties.sheetId,
          title: s.properties.title,
          index: s.properties.index
        })),
        url: spreadsheetUrl,
        connectedAt: new Date().toISOString()
      };

      this.connectedSpreadsheets.set(userId, spreadsheetData);

      return {
        success: true,
        data: spreadsheetData
      };
    } catch (error) {
      console.error('Erro ao conectar planilha:', error);
      throw new Error(`Erro ao conectar: ${error.message}`);
    }
  }

  async readSheet(userId, range = 'A1:Z1000', sheetName = null) {
    try {
      const spreadsheet = this.connectedSpreadsheets.get(userId);
      if (!spreadsheet) {
        throw new Error('Nenhuma planilha conectada para este usuário');
      }

      const fullRange = sheetName ? `${sheetName}!${range}` : range;
      const cacheKey = `${userId}_${spreadsheet.id}_${fullRange}`;

      // Verificar Cache
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
        console.log(`⚡ Cache hit no Google Sheets: ${fullRange}`);
        return cached.data;
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheet.id,
        range: fullRange
      });

      const result = {
        success: true,
        data: response.data.values || [],
        range: response.data.range
      };

      // Salvar no Cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      if (error.message.includes('Nenhuma planilha conectada')) {
        // Não logar erro full para este caso esperado
      } else {
        console.error('Erro ao ler planilha:', error.message);
      }
      throw error;
    }
  }

  async writeSheet(userId, range, values, sheetName = null) {
    try {
      const spreadsheet = this.connectedSpreadsheets.get(userId);
      if (!spreadsheet) {
        throw new Error('Nenhuma planilha conectada');
      }

      const fullRange = sheetName ? `${sheetName}!${range}` : range;

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheet.id,
        range: fullRange,
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });

      if (global.io) {
        global.io.emit('sheets:updated', {
          userId,
          range: fullRange,
          updatedCells: response.data.updatedCells
        });
      }

      this.invalidateCache(userId);

      return {
        success: true,
        updatedCells: response.data.updatedCells,
        updatedRows: response.data.updatedRows,
        updatedColumns: response.data.updatedColumns
      };
    } catch (error) {
      if (!error.message.includes('Nenhuma planilha conectada')) {
        console.error('Erro ao escrever na planilha:', error);
      }
      throw error;
    }
  }

  async addRow(userId, values, sheetName = null) {
    try {
      const spreadsheet = this.connectedSpreadsheets.get(userId);
      if (!spreadsheet) {
        throw new Error('Nenhuma planilha conectada');
      }

      const range = sheetName ? `${sheetName}!A:Z` : 'A:Z';

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheet.id,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: [values] }
      });

      if (global.io) {
        global.io.emit('sheets:row-added', {
          userId,
          range: response.data.updates.updatedRange
        });
      }

      this.invalidateCache(userId);

      return {
        success: true,
        updatedRange: response.data.updates.updatedRange
      };
    } catch (error) {
      if (!error.message.includes('Nenhuma planilha conectada')) {
        console.error('Erro ao adicionar linha:', error);
      }
      throw error;
    }
  }

  async deleteRow(userId, rowIndex, sheetId = 0) {
    try {
      const spreadsheet = this.connectedSpreadsheets.get(userId);
      if (!spreadsheet) {
        throw new Error('Nenhuma planilha conectada');
      }

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheet.id,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }]
        }
      });

      if (global.io) {
        global.io.emit('sheets:row-deleted', {
          userId,
          rowIndex
        });
      }

      this.invalidateCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar linha:', error);
      throw error;
    }
  }

  async updateCell(userId, cell, value, sheetName = null) {
    try {
      const fullRange = sheetName ? `${sheetName}!${cell}` : cell;
      return await this.writeSheet(userId, fullRange, [[value]]);
    } catch (error) {
      console.error('Erro ao atualizar célula:', error);
      throw error;
    }
  }

  async getProductsLowStock(userId) {
    try {
      const data = await this.readSheet(userId);
      if (!data.data.length) return [];

      const headers = data.data[0];
      const rows = data.data.slice(1);

      const qtyIndex = headers.findIndex(h =>
        h.toLowerCase().includes('qtd') || h.toLowerCase().includes('quantidade')
      );
      const minIndex = headers.findIndex(h =>
        h.toLowerCase().includes('mín') || h.toLowerCase().includes('minimo')
      );
      const nameIndex = headers.findIndex(h =>
        h.toLowerCase().includes('produto') || h.toLowerCase().includes('nome')
      );

      if (qtyIndex === -1 || minIndex === -1) {
        return [];
      }

      const lowStock = rows
        .map((row, index) => ({
          rowIndex: index + 2,
          name: row[nameIndex] || 'Sem nome',
          quantity: parseInt(row[qtyIndex]) || 0,
          minimum: parseInt(row[minIndex]) || 0,
          row
        }))
        .filter(item => item.quantity < item.minimum && item.quantity >= 0);

      return lowStock;
    } catch (error) {
      if (!error.message.includes('Nenhuma planilha conectada')) {
        console.error('Erro ao buscar estoque baixo:', error);
      }
      return [];
    }
  }

  disconnectSpreadsheet(userId) {
    this.invalidateCache(userId);
    this.connectedSpreadsheets.delete(userId);
    return { success: true };
  }

  getConnectedSpreadsheet(userId) {
    return this.connectedSpreadsheets.get(userId) || null;
  }
}

module.exports = new GoogleSheetsService();
