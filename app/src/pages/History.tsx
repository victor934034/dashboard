import { useEffect, useState, useCallback } from 'react';
import {
    Calendar,
    ShoppingCart,
    ChevronDown,
    ChevronUp,
    Clock,
    Search,
    RefreshCw,
    FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { pedidosApi } from '@/services/api';
import { toast } from 'sonner';

interface Pedido {
    id: string | number;
    cliente: string;
    itens: string;
    total: number;
    status: string;
    data_hora: string;
}

interface DayHistory {
    date: string;
    totalPedidos: number;
    faturamento: number;
    pedidos: Pedido[];
}

export default function History() {
    const [history, setHistory] = useState<DayHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadHistory = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await pedidosApi.getHistory();
            if (response.data.success) {
                setHistory(response.data.history);
            }
        } catch (error) {
            toast.error('Erro ao carregar histórico');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const toggleDay = (date: string) => {
        setExpandedDay(expandedDay === date ? null : date);
    };

    const filteredHistory = history.filter(day =>
        day.date.includes(searchTerm) ||
        day.pedidos.some(p => p.cliente.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary" />
                        Histórico Diário
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Acompanhe o faturamento e pedidos realizados dia a dia.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por data ou cliente..."
                            className="pl-9 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => loadHistory()} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {loading && history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <RefreshCw className="w-10 h-10 text-primary animate-spin opacity-20" />
                        <p className="text-muted-foreground animate-pulse">Carregando histórico do Baserow...</p>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">Nenhum registro encontrado</p>
                        <p className="text-sm text-muted-foreground">Tente um termo de busca diferente ou aguarde novos pedidos.</p>
                    </div>
                ) : (
                    filteredHistory.map((day) => (
                        <Card key={day.date} className="overflow-hidden border-muted/60 hover:border-primary/30 transition-all shadow-sm">
                            <div
                                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors flex items-center justify-between"
                                onClick={() => toggleDay(day.date)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Data</span>
                                        <span className="text-xl font-bold">{day.date}</span>
                                    </div>

                                    <div className="h-10 w-px bg-border hidden md:block" />

                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Faturamento</span>
                                        <span className="text-xl font-bold text-green-600">{formatCurrency(day.faturamento)}</span>
                                    </div>

                                    <div className="h-10 w-px bg-border hidden md:block" />

                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Pedidos</span>
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xl font-bold">{day.totalPedidos}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="hidden sm:flex">
                                        {day.pedidos.filter(p => p.status === 'concluido').length} concluídos
                                    </Badge>
                                    {expandedDay === day.date ? (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {expandedDay === day.date && (
                                <CardContent className="border-t bg-muted/10 p-0">
                                    <div className="divide-y">
                                        {day.pedidos.map((pedido) => (
                                            <div key={pedido.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-background transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {pedido.cliente.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{pedido.cliente}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {pedido.data_hora.includes(' ') ? pedido.data_hora.split(' ')[1] : ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex-1 max-w-md">
                                                    <p className="text-sm text-muted-foreground truncate italic">
                                                        {pedido.itens}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-6 justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <p className="font-mono font-bold text-primary">{formatCurrency(pedido.total)}</p>
                                                        <Badge variant={
                                                            pedido.status === 'concluido' ? 'default' :
                                                                pedido.status === 'cancelado' ? 'destructive' : 'warning'
                                                        } className={`text-[10px] uppercase ${pedido.status === 'concluido' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                                                            {pedido.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
