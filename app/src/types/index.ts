export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage?: {
    body: string;
    timestamp: number;
  };
  aiBlocked: boolean;
  contact?: {
    number: string;
    pushname?: string;
    isMyContact: boolean;
    profilePicUrl?: string | null;
  };
}

export interface Message {
  id: string;
  chatId: string;
  contactName?: string;
  contactNumber?: string;
  message: string;
  timestamp: Date | string;
  direction: 'incoming' | 'outgoing';
  fromBot: boolean;
  hasMedia?: boolean;
  type?: string;
}

export interface Pedido {
  id: string;
  cliente: string;
  itens: string;
  total: number;
  endereco: string;
  whatsapp: string;
  data_hora: string;
  status: 'pendente' | 'processando' | 'concluido' | 'cancelado';
  origem: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Campanha {
  id: string | number;
  nome: string;
  descricao: string;
  link: string;
  ativa: boolean;
  dataInicio?: string;
  dataFim?: string;
  criadoEm: string;
}

export interface Lead {
  id: string | number;
  nome: string;
  email?: string;
  telefone?: string;
  status: 'novo' | 'contatado' | 'qualificado' | 'proposta' | 'fechado' | 'perdido';
  origem?: string;
  notas?: string;
  data: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstoqueItem {
  rowIndex: number;
  name: string;
  quantity: number;
  minimum: number;
  row: any[];
}

export interface User {
  id: number;
  email: string;
  name: string;
}
