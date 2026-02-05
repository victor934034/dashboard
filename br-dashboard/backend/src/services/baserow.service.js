const axios = require('axios');

class BaserowService {
  constructor() {
    this.apiUrl = process.env.BASEROW_API_URL || 'https://api.baserow.io';
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }

      const response = await axios.post(`${this.apiUrl}/api/user/token-auth/`, {
        email: process.env.BASEROW_EMAIL,
        password: process.env.BASEROW_PASSWORD
      });

      this.token = response.data.token;
      this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);

      return this.token;
    } catch (error) {
      console.error('Erro ao autenticar no Baserow:', error.message);
      throw error;
    }
  }

  async getHeaders() {
    const token = await this.authenticate();
    return {
      'Authorization': `JWT ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getLeads() {
    try {
      const tableId = process.env.BASEROW_TABLE_ID;
      if (!tableId) {
        return { success: false, error: 'BASEROW_TABLE_ID não configurado' };
      }

      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true`,
        { headers }
      );

      const results = response.data.results || [];

      // Mapear campos do Baserow para o formato esperado pelo Frontend
      const leads = results.map(row => ({
        id: row.id,
        nome: row.Nome || row.nome || row.Pushname || "Lead s/ Nome",
        telefone: row.Telefone || row.telefone || row.ID || "",
        email: row.Email || row.email || "",
        status: (row.Status?.value || row.status?.value || row.Status || row.status || "novo").toLowerCase(),
        origem: row.Origem || row.origem || "WhatsApp",
        notas: row.Notas || row.notas || row['nova info para guardar'] || "",
        data: row['Data Cadastrado'] || row['data_cadastrado'] || row['Created on'] || new Date().toISOString()
      }));

      return {
        success: true,
        leads: leads
      };
    } catch (error) {
      console.error('Erro ao buscar leads:', error.message);
      return { success: false, error: error.message };
    }
  }

  async createLead(leadData) {
    try {
      const tableId = process.env.BASEROW_TABLE_ID;
      if (!tableId) {
        return { success: false, error: 'BASEROW_TABLE_ID não configurado' };
      }

      // Mapear campos do Frontend para o Baserow
      const baserowData = {
        'Nome': leadData.nome || 'Lead s/ Nome',
        'Telefone': leadData.telefone || '',
        'Email': leadData.email || '',
        'Status': leadData.status ? leadData.status.charAt(0).toUpperCase() + leadData.status.slice(1) : 'Novo',
        'Origem': leadData.origem || 'Dashboard',
        'Notas': leadData.notas || '',
        'Data Cadastrado': new Date().toISOString()
      };

      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true`,
        baserowData,
        { headers }
      );

      return {
        success: true,
        lead: response.data
      };
    } catch (error) {
      console.error('Erro ao criar lead:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updateLead(leadId, leadData) {
    try {
      const tableId = process.env.BASEROW_TABLE_ID;
      if (!tableId) {
        return { success: false, error: 'BASEROW_TABLE_ID não configurado' };
      }

      // Mapear campos do Frontend para o Baserow
      const baserowData = {};
      if (leadData.nome !== undefined) baserowData['Nome'] = leadData.nome;
      if (leadData.telefone !== undefined) baserowData['Telefone'] = leadData.telefone;
      if (leadData.email !== undefined) baserowData['Email'] = leadData.email;
      if (leadData.status !== undefined) {
        baserowData['Status'] = leadData.status.charAt(0).toUpperCase() + leadData.status.slice(1);
      }
      if (leadData.origem !== undefined) baserowData['Origem'] = leadData.origem;
      if (leadData.notas !== undefined) baserowData['Notas'] = leadData.notas;

      const headers = await this.getHeaders();
      const response = await axios.patch(
        `${this.apiUrl}/api/database/rows/table/${tableId}/${leadId}/?user_field_names=true`,
        baserowData,
        { headers }
      );

      return {
        success: true,
        lead: response.data
      };
    } catch (error) {
      console.error('Erro ao atualizar lead:', error.message);
      return { success: false, error: error.message };
    }
  }

  async deleteLead(leadId) {
    try {
      const tableId = process.env.BASEROW_TABLE_ID;
      if (!tableId) {
        return { success: false, error: 'BASEROW_TABLE_ID não configurado' };
      }

      const headers = await this.getHeaders();
      await axios.delete(
        `${this.apiUrl}/api/database/rows/table/${tableId}/${leadId}/`,
        { headers }
      );

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar lead:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BaserowService();
