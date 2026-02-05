const axios = require('axios');
require('dotenv').config();

class BaserowService {
  constructor() {
    this.apiUrl = process.env.BASEROW_API_URL || 'https://api.baserow.io';
    this.email = process.env.BASEROW_EMAIL;
    this.password = process.env.BASEROW_PASSWORD;
    this.token = process.env.BASEROW_TOKEN; // Suporte a token direto (Database Token)
    this.tableIdLeads = process.env.BASEROW_TABLE_ID;
    this.tableIdPedidos = process.env.BASEROW_PEDIDOS_TABLE_ID;
    this.tableIdCampanhas = process.env.BASEROW_CAMPANHAS_TABLE_ID;
    this.jwtToken = null;

    if (!this.token && (!this.email || !this.password)) {
      console.warn('⚠️ Baserow: Nem TOKEN nem EMAIL/PASSWORD foram encontrados no ambiente.');
    }
  }

  async checkConnection() {
    const status = {
      credentials: !!(this.token || (this.email && this.password)),
      auth_method: this.token ? 'Token' : (this.email ? 'JWT (Email/Senha)' : 'Nenhum'),
      env_vars: {
        BASEROW_TOKEN: this.token ? `*** (len: ${this.token.length})` : 'MISSING',
        BASEROW_EMAIL: this.email ? `${this.email.substring(0, 3)}***` : 'MISSING',
        BASEROW_TABLE_ID: this.tableIdLeads || 'MISSING',
        BASEROW_PEDIDOS_TABLE_ID: this.tableIdPedidos || 'MISSING',
        BASEROW_CAMPANHAS_TABLE_ID: this.tableIdCampanhas || 'MISSING'
      },
      authenticated: false,
      tables_accessible: {
        leads: false,
        pedidos: false,
        campanhas: false
      },
      errors: []
    };

    try {
      const headers = await this.getHeaders();
      status.authenticated = true;

      const tables = [
        { key: 'leads', id: this.tableIdLeads },
        { key: 'pedidos', id: this.tableIdPedidos },
        { key: 'campanhas', id: this.tableIdCampanhas }
      ];

      for (const table of tables) {
        if (table.id) {
          try {
            await axios.get(`${this.apiUrl}/api/database/rows/table/${table.id}/?size=1`, { headers });
            status.tables_accessible[table.key] = true;
          } catch (e) {
            status.errors.push(`${table.key}: ${e.message}`);
          }
        }
      }
    } catch (error) {
      status.errors.push(`Auth Error: ${error.message}`);
    }

    return status;
  }

  async authenticate() {
    try {
      if (this.token) return this.token;

      if (!this.email || !this.password) {
        throw new Error('Credenciais do Baserow ausentes no servidor (BASEROW_EMAIL / BASEROW_PASSWORD)');
      }

      console.log(`🔑 Tentando autenticar no Baserow (${this.email.substring(0, 3)}***)`);

      const response = await axios.post(`${this.apiUrl}/api/user/token-auth/`, {
        email: this.email,
        password: this.password
      });

      this.token = response.data.token;
      return this.token;
    } catch (error) {
      console.error('❌ Erro de autenticação no Baserow:', error.message);
      throw error;
    }
  }

  async getHeaders() {
    // Se tivermos um Token direto (Database Token), usamos ele
    if (this.token) {
      return {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json'
      };
    }

    // Caso contrário, tenta autenticação JWT (Email/Senha)
    const token = await this.authenticate();
    return {
      'Authorization': `JWT ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // --- LEADS (CRM) ---
  async getLeads() {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.apiUrl}/api/database/rows/table/${this.tableIdLeads}/?user_field_names=true`, { headers });

      const results = response.data.results || [];
      const leads = results.map(row => ({
        id: row.id,
        nome: row.Nome || row.nome || row.Pushname || "Lead s/ Nome",
        telefone: row.Telefone || row.telefone || row.ID || "",
        email: row.Email || row.email || "",
        status: (row.Status?.value || row.status?.value || row.Status || row.status || "novo").toLowerCase(),
        origem: row.Origem || row.origem || "WhatsApp",
        notas: row.Notas || row.notas || "",
        data: row['Data Cadastrado'] || row['data_cadastrado'] || new Date().toISOString()
      }));

      return { success: true, leads };
    } catch (error) {
      console.error('❌ Erro ao buscar leads no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  async createLead(leadData) {
    try {
      const headers = await this.getHeaders();
      const baserowData = {
        'Nome': leadData.nome || 'Lead s/ Nome',
        'Telefone': leadData.telefone || '',
        'Email': leadData.email || '',
        'Status': leadData.status ? leadData.status.charAt(0).toUpperCase() + leadData.status.slice(1) : 'Novo',
        'Origem': leadData.origem || 'Dashboard',
        'Notas': leadData.notas || '',
        'Data Cadastrado': leadData.data || new Date().toISOString()
      };

      const response = await axios.post(`${this.apiUrl}/api/database/rows/table/${this.tableIdLeads}/?user_field_names=true`, baserowData, { headers });
      return { success: true, lead: response.data };
    } catch (error) {
      console.error('❌ Erro ao criar lead no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updateLead(leadId, leadData) {
    try {
      const headers = await this.getHeaders();
      const baserowData = {};
      if (leadData.nome !== undefined) baserowData['Nome'] = leadData.nome;
      if (leadData.telefone !== undefined) baserowData['Telefone'] = leadData.telefone;
      if (leadData.email !== undefined) baserowData['Email'] = leadData.email;
      if (leadData.status !== undefined) {
        baserowData['Status'] = leadData.status.charAt(0).toUpperCase() + leadData.status.slice(1);
      }
      if (leadData.origem !== undefined) baserowData['Origem'] = leadData.origem;
      if (leadData.notas !== undefined) baserowData['Notas'] = leadData.notas;

      const response = await axios.patch(`${this.apiUrl}/api/database/rows/table/${this.tableIdLeads}/${leadId}/?user_field_names=true`, baserowData, { headers });
      return { success: true, lead: response.data };
    } catch (error) {
      console.error('❌ Erro ao atualizar lead no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  async deleteLead(leadId) {
    try {
      const headers = await this.getHeaders();
      await axios.delete(`${this.apiUrl}/api/database/rows/table/${this.tableIdLeads}/${leadId}/`, { headers });
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar lead no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  // --- PEDIDOS ---
  async getPedidos() {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.apiUrl}/api/database/rows/table/${this.tableIdPedidos}/?user_field_names=true`, { headers });

      const results = response.data.results || [];
      const pedidos = results.map(row => ({
        id: row.id,
        cliente: row.Cliente || "",
        itens: row.Itens || "",
        total: parseFloat(row.Total) || 0,
        endereco: row.Endereco || "",
        whatsapp: row.Whatsapp || "",
        data_hora: row['Data Hora'] || row.data_hora || "",
        status: (row.Status?.value || row.status?.value || row.Status || row.status || "pendente"),
        origem: row.Origem || ""
      }));

      return { success: true, pedidos };
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  async createPedido(pedidoData) {
    try {
      const headers = await this.getHeaders();
      const baserowData = {
        'Cliente': pedidoData.cliente || '',
        'Itens': pedidoData.itens || '',
        'Total': parseFloat(pedidoData.total) || 0,
        'Endereco': pedidoData.endereco || '',
        'Whatsapp': pedidoData.whatsapp || '',
        'Data Hora': pedidoData.data_hora || new Date().toLocaleString('pt-BR'),
        'Status': pedidoData.status || 'pendente',
        'Origem': pedidoData.origem || 'n8n'
      };

      const response = await axios.post(`${this.apiUrl}/api/database/rows/table/${this.tableIdPedidos}/?user_field_names=true`, baserowData, { headers });
      return { success: true, pedido: response.data };
    } catch (error) {
      console.error('❌ Erro ao criar pedido no Baserow:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  async updatePedido(pedidoId, pedidoData) {
    try {
      const headers = await this.getHeaders();
      const baserowData = {};
      if (pedidoData.cliente !== undefined) baserowData['Cliente'] = pedidoData.cliente;
      if (pedidoData.itens !== undefined) baserowData['Itens'] = pedidoData.itens;
      if (pedidoData.total !== undefined) baserowData['Total'] = parseFloat(pedidoData.total);
      if (pedidoData.endereco !== undefined) baserowData['Endereco'] = pedidoData.endereco;
      if (pedidoData.whatsapp !== undefined) baserowData['Whatsapp'] = pedidoData.whatsapp;
      if (pedidoData.status !== undefined) baserowData['Status'] = pedidoData.status;

      const response = await axios.patch(`${this.apiUrl}/api/database/rows/table/${this.tableIdPedidos}/${pedidoId}/?user_field_names=true`, baserowData, { headers });
      return { success: true, pedido: response.data };
    } catch (error) {
      console.error('❌ Erro ao atualizar pedido no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  async deletePedido(pedidoId) {
    try {
      const headers = await this.getHeaders();
      await axios.delete(`${this.apiUrl}/api/database/rows/table/${this.tableIdPedidos}/${pedidoId}/`, { headers });
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar pedido no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  // --- CAMPANHAS ---
  async getCampanhas() {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.apiUrl}/api/database/rows/table/${this.tableIdCampanhas}/?user_field_names=true`, { headers });

      const results = response.data.results || [];
      const campanhas = results.map(row => ({
        id: row.id,
        nome: row.Nome || "",
        descricao: row.Descricao || "",
        link: row.Link || "",
        ativa: !!row.Ativa,
        criadoEm: row['Created on'] || new Date().toISOString()
      }));

      return { success: true, campanhas };
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  async createCampanha(campanhaData) {
    try {
      const headers = await this.getHeaders();
      const baserowData = {
        'Nome': campanhaData.nome || '',
        'Descricao': campanhaData.descricao || '',
        'Link': campanhaData.link || '',
        'Ativa': campanhaData.ativa !== false
      };

      const response = await axios.post(`${this.apiUrl}/api/database/rows/table/${this.tableIdCampanhas}/?user_field_names=true`, baserowData, { headers });
      return { success: true, campanha: response.data };
    } catch (error) {
      console.error('❌ Erro ao criar campanha no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updateCampanha(campanhaId, campanhaData) {
    try {
      const headers = await this.getHeaders();
      const baserowData = {};
      if (campanhaData.nome !== undefined) baserowData['Nome'] = campanhaData.nome;
      if (campanhaData.descricao !== undefined) baserowData['Descricao'] = campanhaData.descricao;
      if (campanhaData.link !== undefined) baserowData['Link'] = campanhaData.link;
      if (campanhaData.ativa !== undefined) baserowData['Ativa'] = !!campanhaData.ativa;

      const response = await axios.patch(`${this.apiUrl}/api/database/rows/table/${this.tableIdCampanhas}/${campanhaId}/?user_field_names=true`, baserowData, { headers });
      return { success: true, campanha: response.data };
    } catch (error) {
      console.error('❌ Erro ao atualizar campanha no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }

  async deleteCampanha(campanhaId) {
    try {
      const headers = await this.getHeaders();
      await axios.delete(`${this.apiUrl}/api/database/rows/table/${this.tableIdCampanhas}/${campanhaId}/`, { headers });
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar campanha no Baserow:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BaserowService();
