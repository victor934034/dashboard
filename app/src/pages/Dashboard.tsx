import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Clock,
  Megaphone,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initializeSocket } from '@/services/socket';
import { pedidosApi, sheetsApi, crmApi, campanhasApi } from '@/services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pendentes: 0,
    faturamento: 0,
    lowStock: 0,
    totalLeads: 0,
    activeCampanhas: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadStats = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [pedidosRes, estoqueRes, crmRes, campanhasRes] = await Promise.all([
        pedidosApi.getStats(),
        sheetsApi.getLowStock('user-1'),
        crmApi.getLeads(),
        campanhasApi.getAll()
      ]);

      setStats({
        totalPedidos: pedidosRes.data.stats?.total || 0,
        pendentes: pedidosRes.data.stats?.pendentes || 0,
        faturamento: pedidosRes.data.stats?.faturamento || 0,
        lowStock: estoqueRes.data.products?.length || 0,
        totalLeads: crmRes.data.leads?.length || 0,
        activeCampanhas: campanhasRes.data.total || 0
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();

    // Polling fallback a cada 30 segundos
    const interval = setInterval(() => {
      loadStats(true);
    }, 30000);

    const socket = initializeSocket();

    socket.on('novo-pedido', () => {
      loadStats(true);
    });

    // Listeners de estoque (Sheets)
    socket.on('sheets:updated', () => loadStats(true));
    socket.on('sheets:row-added', () => loadStats(true));
    socket.on('sheets:row-deleted', () => loadStats(true));

    return () => {
      clearInterval(interval);
      socket.off('novo-pedido');
      socket.off('sheets:updated');
      socket.off('sheets:row-added');
      socket.off('sheets:row-deleted');
    };
  }, [loadStats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Dashboard Geral
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Última atualização: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStats()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Atualizando...' : 'Atualizar agora'}
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Hoje
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.faturamento)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Leads (CRM)
            </CardTitle>
            <UserCheck className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Leads ativos no Baserow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campanhas Ativas
            </CardTitle>
            <Megaphone className="w-4 h-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.activeCampanhas}</div>
            <p className="text-xs text-muted-foreground">
              Campanhas no n8n
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Status Detalhados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={stats.pendentes > 0 ? "border-orange-500 shadow-sm" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className={`w-5 h-5 ${stats.pendentes > 0 ? "text-orange-500" : ""}`} />
              Pedidos Pendentes
            </CardTitle>
            <Badge variant={stats.pendentes > 0 ? "warning" : "secondary" as any}>
              {stats.pendentes} aguardando
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendentes}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalPedidos} total de pedidos hoje
            </p>
          </CardContent>
        </Card>

        <Card className={stats.lowStock > 0 ? "border-destructive shadow-sm" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${stats.lowStock > 0 ? "text-destructive" : ""}`} />
              Estoque Crítico
            </CardTitle>
            <Badge variant={stats.lowStock > 0 ? "destructive" : "secondary"}>
              {stats.lowStock} alertas
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.lowStock > 0 ? 'text-destructive' : ''}`}>
              {stats.lowStock}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Produtos com estoque abaixo do mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Sistemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> CRM Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total no Baserow:</span>
              <span className="font-medium">{stats.totalLeads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sincronização:</span>
              <span className="text-green-600">Ativa</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Campanhas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ativas no n8n:</span>
              <span className="font-medium">{stats.activeCampanhas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Webhook Status:</span>
              <span className="text-green-600">Operacional</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
