import { useState, useEffect } from 'react';
import { ShoppingCart, Package, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { pedidosApi } from '@/services/api';
import { initializeSocket } from '@/services/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Pedido } from '@/types';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
  processando: { label: 'Processando', color: 'bg-blue-500', icon: Package },
  concluido: { label: 'Concluído', color: 'bg-green-500', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle }
};

export default function PedidosList() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    processando: 0,
    concluidos: 0,
    cancelados: 0,
    faturamento: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPedidos();
    loadStats();
    
    const socket = initializeSocket();
    
    socket.on('novo-pedido', (pedido: Pedido) => {
      toast.success(`Novo pedido de ${pedido.cliente}!`);
      setPedidos(prev => [pedido, ...prev]);
      loadStats();
    });

    return () => {
      socket.off('novo-pedido');
    };
  }, []);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const response = await pedidosApi.getAll();
      if (response.data.success) {
        setPedidos(response.data.pedidos || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await pedidosApi.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await pedidosApi.updateStatus(id, status);
      toast.success('Status atualizado!');
      loadPedidos();
      loadStats();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShoppingCart className="w-6 h-6" />
        Gestão de Pedidos
      </h1>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendentes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.concluidos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.faturamento)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">Carregando...</div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum pedido recebido ainda
            </div>
          ) : (
            <div className="space-y-4">
              {pedidos.map(pedido => {
                const statusInfo = statusConfig[pedido.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={pedido.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{pedido.cliente}</h3>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pedido.itens}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{formatDate(pedido.data_hora)}</span>
                            <span>{pedido.whatsapp}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(pedido.total)}
                          </p>
                          <Select
                            value={pedido.status}
                            onValueChange={(value) => updateStatus(pedido.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="processando">Processando</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
