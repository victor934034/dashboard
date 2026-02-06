import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

// WhatsApp API - REMOVED
/*
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
*/

// CRM API
export const crmApi = {
  getLeads: () => api.get('/crm/leads'),
  createLead: (data: any) => api.post('/crm/leads', data),
  updateLead: (id: string | number, data: any) => api.patch(`/crm/leads/${id}`, data),
  deleteLead: (id: string | number) => api.delete(`/crm/leads/${id}`)
};

// Pedidos API
export const pedidosApi = {
  getAll: (params?: { status?: string; limit?: number }) =>
    api.get('/pedidos', { params }),
  getById: (id: string) => api.get(`/pedidos/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/pedidos/${id}/status`, { status }),
  getStats: () => api.get('/pedidos/stats/overview'),
  getHistory: () => api.get('/pedidos/history'),
  delete: (id: string | number) => api.delete(`/pedidos/${id}`)
};

// Campanhas API
export const campanhasApi = {
  getAll: (useCache = true) =>
    api.get('/campanhas', { params: { cache: useCache } }),
  getTexto: () => api.get('/campanhas/texto'),
  clearCache: () => api.post('/campanhas/clear-cache'),
  create: (data: any) => api.post('/campanhas', data),
  update: (id: string | number, data: any) => api.put(`/campanhas/${id}`, data),
  delete: (id: string | number) => api.delete(`/campanhas/${id}`)
};

// Stock API (Supabase)
export const stockApi = {
  getProducts: () => api.get('/stock/products'),
  getLowStock: () => api.get('/stock/low-stock'),
  updateQuantity: (id: string | number, quantity: number) =>
    api.patch(`/stock/products/${id}/quantity`, { quantity }),
  updateProduct: (id: string | number, data: any) =>
    api.put(`/stock/products/${id}`, data),
  addProduct: (data: any) => api.post('/stock/products', data),
  deleteProduct: (id: string | number) => api.delete(`/stock/products/${id}`)
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify')
};
