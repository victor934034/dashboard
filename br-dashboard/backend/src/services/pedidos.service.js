const baserowService = require('./baserow.service');

class PedidosService {
    async getPedidos(filters = {}) {
        try {
            const result = await baserowService.getPedidos();
            if (!result.success) return result;

            let pedidos = result.pedidos;

            // Aplicar filtros
            if (filters.status) {
                pedidos = pedidos.filter(p => p.status === filters.status);
            }

            if (filters.limit) {
                pedidos = pedidos.slice(0, parseInt(filters.limit));
            }

            return {
                success: true,
                pedidos: pedidos,
                total: pedidos.length
            };
        } catch (error) {
            console.error('❌ Erro ao buscar pedidos no Baserow:', error.message);
            return {
                success: false,
                pedidos: [],
                error: 'Erro ao carregar pedidos'
            };
        }
    }

    async getPedidoById(id) {
        try {
            const result = await this.getPedidos();
            const pedido = result.pedidos.find(p => String(p.id) === String(id));

            if (!pedido) {
                return { success: false, error: 'Pedido não encontrado' };
            }

            return { success: true, pedido };
        } catch (error) {
            console.error('Erro ao buscar pedido:', error.message);
            return { success: false, error: error.message };
        }
    }

    async addPedido(pedidoData) {
        try {
            // Mapeia campos do n8n/agente
            const dataToSave = {
                cliente: pedidoData.cliente || 'Cliente não informado',
                itens: typeof pedidoData.itens === 'string' ? pedidoData.itens : JSON.stringify(pedidoData.itens),
                total: parseFloat(pedidoData.total) || 0,
                endereco: pedidoData.endereco || 'Não informado',
                whatsapp: pedidoData.whatsapp || 'Não informado',
                data_hora: pedidoData.data_hora || new Date().toLocaleString('pt-BR'),
                status: pedidoData.status_pedido || pedidoData.status || 'pendente',
                origem: pedidoData.origem || 'whatsapp'
            };

            const result = await baserowService.createPedido(dataToSave);

            if (result.success) {
                console.log('✅ Pedido salvo no Baserow:', result.pedido.id);
            }

            return result;
        } catch (error) {
            console.error('Erro ao salvar pedido:', error);
            throw error;
        }
    }

    async updatePedido(id, updateData) {
        try {
            return await baserowService.updatePedido(id, updateData);
        } catch (error) {
            console.error('Erro ao atualizar pedido:', error);
            throw error;
        }
    }

    async deletePedido(id) {
        try {
            return await baserowService.deletePedido(id);
        } catch (error) {
            console.error('Erro ao deletar pedido:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const result = await this.getPedidos();
            if (!result.success) return result;

            const pedidos = result.pedidos;

            const total = pedidos.length;
            const pendentes = pedidos.filter(p => p.status === 'pendente').length;
            const processando = pedidos.filter(p => p.status === 'processando').length;
            const concluidos = pedidos.filter(p => p.status === 'concluido').length;
            const cancelados = pedidos.filter(p => p.status === 'cancelado').length;

            const faturamento = pedidos
                .filter(p => p.status === 'concluido')
                .reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0);

            return {
                success: true,
                stats: {
                    total,
                    pendentes,
                    processando,
                    concluidos,
                    cancelados,
                    faturamento
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getHistory() {
        try {
            const result = await this.getPedidos();
            if (!result.success) return result;

            const pedidos = result.pedidos;
            const historyMap = {};

            pedidos.forEach(p => {
                // Tenta extrair a data do campo data_hora
                // Formatos possíveis: "DD/MM/YYYY HH:MM:SS" ou ISO string
                let dateStr = 'Data indefinida';
                try {
                    if (p.data_hora.includes('/')) {
                        dateStr = p.data_hora.split(' ')[0];
                    } else {
                        dateStr = new Date(p.data_hora).toLocaleDateString('pt-BR');
                    }
                } catch (e) {
                    console.error('Erro ao processar data:', p.data_hora);
                }

                if (!historyMap[dateStr]) {
                    historyMap[dateStr] = {
                        date: dateStr,
                        totalPedidos: 0,
                        faturamento: 0,
                        pedidos: []
                    };
                }

                historyMap[dateStr].totalPedidos++;
                if (p.status === 'concluido') {
                    historyMap[dateStr].faturamento += (parseFloat(p.total) || 0);
                }
                historyMap[dateStr].pedidos.push(p);
            });

            // Converter para array e ordenar por data decrescente (mais recente primeiro)
            const history = Object.values(historyMap).sort((a, b) => {
                const [dayA, monthA, yearA] = a.date.split('/');
                const [dayB, monthB, yearB] = b.date.split('/');
                const dateA = new Date(yearA, monthA - 1, dayA);
                const dateB = new Date(yearB, monthB - 1, dayB);
                return dateB.getTime() - dateA.getTime();
            });

            return {
                success: true,
                history
            };
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new PedidosService();
