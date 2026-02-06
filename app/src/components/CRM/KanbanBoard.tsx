import { useState, useEffect } from 'react';
import { Kanban, Plus, User, Phone, Mail, MoreHorizontal, RefreshCw } from 'lucide-react';
import { crmApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Lead } from '@/types';

const columns = [
  { id: 'novo', label: 'Novo', color: 'bg-blue-500' },
  { id: 'contatado', label: 'Contatado', color: 'bg-yellow-500' },
  { id: 'qualificado', label: 'Qualificado', color: 'bg-purple-500' },
  { id: 'proposta', label: 'Proposta', color: 'bg-orange-500' },
  { id: 'fechado', label: 'Fechado', color: 'bg-green-500' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-500' }
];

export default function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    nome: '',
    email: '',
    telefone: '',
    status: 'novo',
    origem: '',
    notas: ''
  });

  useEffect(() => {
    loadLeads(true); // Carregamento silencioso para aparecer instantâneo
  }, []);

  const loadLeads = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await crmApi.getLeads();
      if (response.data.success) {
        setLeads(response.data.leads || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar leads');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const createLead = async () => {
    try {
      await crmApi.createLead(newLead);
      toast.success('Lead criado com sucesso!');
      setNewLead({
        nome: '',
        email: '',
        telefone: '',
        status: 'novo',
        origem: '',
        notas: ''
      });
      loadLeads();
    } catch (error) {
      toast.error('Erro ao criar lead');
    }
  };

  const updateLeadStatus = async (leadId: string | number, newStatus: string) => {
    try {
      // Formatar status para o Baserow (Primeira Letra Maiúscula)
      const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      await crmApi.updateLead(String(leadId), { status: formattedStatus });
      toast.success('Status atualizado!');
      loadLeads();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Kanban className="w-6 h-6" />
          CRM - Pipeline de Vendas
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => loadLeads()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={newLead.nome}
                    onChange={(e) => setNewLead({ ...newLead, nome: e.target.value })}
                    placeholder="Nome do lead"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={newLead.telefone}
                    onChange={(e) => setNewLead({ ...newLead, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Origem</label>
                  <Input
                    value={newLead.origem}
                    onChange={(e) => setNewLead({ ...newLead, origem: e.target.value })}
                    placeholder="WhatsApp, Site, Indicação..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notas</label>
                  <Input
                    value={newLead.notas}
                    onChange={(e) => setNewLead({ ...newLead, notas: e.target.value })}
                    placeholder="Observações..."
                  />
                </div>
                <Button onClick={createLead} className="w-full">
                  Criar Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && leads.length === 0 ? (
        <div className="text-center py-10">Carregando...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <div key={column.id} className="min-w-[280px] flex-shrink-0">
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      {column.label}
                    </CardTitle>
                    <Badge variant="secondary">
                      {getLeadsByStatus(column.id).length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[200px]">
                  {getLeadsByStatus(column.id).map(lead => (
                    <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{lead.nome}</span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalhes do Lead</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Nome</label>
                                  <p>{lead.nome}</p>
                                </div>
                                {lead.email && (
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p className="flex items-center gap-2">
                                      <Mail className="w-4 h-4" />
                                      {lead.email}
                                    </p>
                                  </div>
                                )}
                                {lead.telefone && (
                                  <div>
                                    <label className="text-sm font-medium">Telefone</label>
                                    <p className="flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      {lead.telefone}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <label className="text-sm font-medium">Mover para</label>
                                  <Select
                                    value={lead.status}
                                    onValueChange={(value) => updateLeadStatus(lead.id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {columns.map(col => (
                                        <SelectItem key={col.id} value={col.id}>
                                          {col.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {lead.notas && (
                                  <div>
                                    <label className="text-sm font-medium">Notas</label>
                                    <p className="text-sm text-muted-foreground">{lead.notas}</p>
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  Cadastrado em: {new Date(lead.data).toLocaleString()}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {lead.telefone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.telefone}
                          </p>
                        )}
                        {lead.origem && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {lead.origem}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
