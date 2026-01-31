const fs = require('fs');
const path = require('path');

class PedidosService {
    constructor() {
        this.storagePath = path.join(__dirname, '../data/pedidos.json');
        this.ensureStorage();
    }

    ensureStorage() {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.storagePath)) {
            fs.writeFileSync(this.storagePath, JSON.stringify([], null, 2));
        }
    }

    async getPedidos(filters = {}) {
        try {
            const data = fs.readFileSync(this.storagePath, 'utf8');
            let pedidos = JSON.parse(data);

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
            console.error('❌ Erro ao ler pedidos do arquivo:', error.message);
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
            const pedido = result.pedidos.find(p => p.id === id);

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
            const result = await this.getPedidos();
            const pedidos = result.pedidos;

            const novoPedido = {
                id: pedidoData.id || `PED-${Date.now()}`,
                cliente: pedidoData.cliente || 'Cliente não informado',
                itens: typeof pedidoData.itens === 'string' ? pedidoData.itens : JSON.stringify(pedidoData.itens),
                total: parseFloat(pedidoData.total) || 0,
                endereco: pedidoData.endereco || 'Não informado',
                whatsapp: pedidoData.whatsapp || 'Não informado',
                data_hora: pedidoData.data_hora || new Date().toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo'
                }),
                status: pedidoData.status_pedido || pedidoData.status || 'pendente', // Mapeia status_pedido do n8n
                etapa: pedidoData.etapa || 'Novo', // Mapeia etapa do CRM
                origem: pedidoData.origem || 'whatsapp',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            pedidos.unshift(novoPedido); // Adiciona no início (mais recentes primeiro)
            fs.writeFileSync(this.storagePath, JSON.stringify(pedidos, null, 2));

            console.log('✅ Pedido salvo:', novoPedido.id);

            return {
                success: true,
                message: 'Pedido registrado com sucesso!',
                pedido: novoPedido
            };
        } catch (error) {
            console.error('Erro ao salvar pedido:', error);
            throw error;
        }
    }

    async updatePedido(id, updateData) {
        try {
            const result = await this.getPedidos();
            const pedidos = result.pedidos;
            const index = pedidos.findIndex(p => p.id === id);

            if (index === -1) {
                return { success: false, error: 'Pedido não encontrado' };
            }

            pedidos[index] = {
                ...pedidos[index],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            fs.writeFileSync(this.storagePath, JSON.stringify(pedidos, null, 2));

            return {
                success: true,
                pedido: pedidos[index]
            };
        } catch (error) {
            console.error('Erro ao atualizar pedido:', error);
            throw error;
        }
    }

    async deletePedido(id) {
        try {
            const result = await this.getPedidos();
            const filtered = result.pedidos.filter(p => p.id !== id);

            fs.writeFileSync(this.storagePath, JSON.stringify(filtered, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar pedido:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const result = await this.getPedidos();
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
}

module.exports = new PedidosService();
