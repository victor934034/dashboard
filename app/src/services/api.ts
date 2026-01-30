import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// WhatsApp API
export const whatsappApi = {
  getChats: () => api.get('/whatsapp/chats'),
  getMessages: (chatId: string, limit = 50) =>
    api.get(`/whatsapp/chats/${chatId}/messages?limit=${limit}`),
  sendMessage: (chatId: string, message: string) =>
    api.post('/whatsapp/send', { chatId, message }),
  blockAI: (chatId: string) =>
    api.post(`/whatsapp/block-ai/${chatId}`),
  unblockAI: (chatId: string) =>
    api.post(`/whatsapp/unblock-ai/${chatId}`),
  getAIStatus: (chatId: string) =>
    api.get(`/whatsapp/ai-status/${chatId}`),
  getStatus: () => api.get('/whatsapp/status')
};

// Google Sheets API
export const sheetsApi = {
  connect: (userId: string, spreadsheetUrl: string) =>
    api.post('/sheets/connect', { userId, spreadsheetUrl }),
  read: (userId: string, range?: string, sheetName?: string) =>
    api.get('/sheets/read', { params: { userId, range, sheetName } }),
  update: (userId: string, range: string, values: any[], sheetName?: string) =>
    api.put('/sheets/update', { userId, range, values, sheetName }),
  addRow: (userId: string, values: any[], sheetName?: string) =>
    api.post('/sheets/add-row', { userId, values, sheetName }),
  deleteRow: (userId: string, rowIndex: number, sheetId?: number) =>
    api.delete(`/sheets/delete-row/${rowIndex}`, { data: { userId, sheetId } }),
  updateCell: (userId: string, cell: string, value: any, sheetName?: string) =>
    api.put('/sheets/update-cell', { userId, cell, value, sheetName }),
  getLowStock: (userId: string) =>
    api.get('/sheets/low-stock', { params: { userId } }),
  getStatus: (userId: string) =>
    api.get('/sheets/status', { params: { userId } })
};

// CRM API
export const crmApi = {
  getLeads: () => api.get('/crm/leads'),
  createLead: (data: any) => api.post('/crm/leads', data),
  updateLead: (id: string, data: any) => api.patch(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`)
};

// Pedidos API
export const pedidosApi = {
  getAll: (params?: { status?: string; limit?: number }) =>
    api.get('/pedidos', { params }),
  getById: (id: string) => api.get(`/pedidos/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/pedidos/${id}/status`, { status }),
  getStats: () => api.get('/pedidos/stats/overview')
};

// Campanhas API
export const campanhasApi = {
  getAll: (useCache = true) =>
    api.get('/campanhas', { params: { cache: useCache } }),
  getTexto: () => api.get('/campanhas/texto'),
  clearCache: () => api.post('/campanhas/clear-cache'),
  create: (data: any) => api.post('/campanhas', data),
  delete: (id: string) => api.delete(`/campanhas/${id}`)
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify')
};
