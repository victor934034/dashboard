const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SupabaseService {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.supabase = null;

        if (this.supabaseUrl && this.supabaseKey) {
            try {
                this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
                console.log('✅ Supabase Client inicializado');
            } catch (error) {
                console.error('❌ Erro ao inicializar Supabase Client:', error.message);
            }
        } else {
            console.warn('⚠️ Supabase credentials not found in environment (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
        }
    }

    async checkConnection() {
        const status = {
            url: !!this.supabaseUrl,
            key: !!this.supabaseKey,
            initialized: !!this.supabase,
            timestamp: new Date().toISOString(),
            table_accessible: false,
            error: null
        };

        if (!this.supabase) {
            status.error = "Client not initialized - Check environment variables";
            return status;
        }

        try {
            const { count, error } = await this.supabase
                .from('estoque')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            status.table_accessible = true;
            status.count = count;
        } catch (error) {
            status.error = error.message;
        }

        return status;
    }

    async getProducts() {
        try {
            if (!this.supabase) {
                return {
                    success: false,
                    error: "Supabase não configurado. Verifique as variáveis de ambiente no EasyPanel.",
                    products: []
                };
            }

            const { data, error } = await this.supabase
                .from('estoque')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;

            // Mapeamento flexível para nomes de colunas
            const products = data.map(item => ({
                id: item.id,
                name: item.nome || 'Produto sem nome',
                quantity: parseInt(item.estoque) || 0,
                minimum_stock: parseInt(item.estoque_minimo) || 0,
                category: item.categoria_nivel_1 || 'Geral',
                price: item.preco || '0,00',
                brand: item.marca || '',
                color: item.cor || '',
                image: item.Imagem || item.imagem || null // Suporta 'Imagem' ou 'imagem'
            }));

            return { success: true, products };
        } catch (error) {
            console.error('❌ Erro no Supabase getProducts:', error.message);
            return { success: false, error: error.message, products: [] };
        }
    }

    async getLowStock() {
        try {
            const { data, error } = await this.supabase
                .from('estoque')
                .select('*');

            if (error) throw error;

            const lowStock = data
                .map(item => ({
                    id: item.id,
                    name: item.nome,
                    quantity: parseInt(item.estoque) || 0,
                    minimum_stock: parseInt(item.estoque_minimo) || 0,
                    category: item.categoria_nivel_1 || 'Geral'
                }))
                .filter(item => item.quantity < item.minimum_stock);

            return { success: true, products: lowStock };
        } catch (error) {
            console.error('❌ Erro ao buscar estoque baixo no Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }

    async updateQuantity(id, quantity) {
        try {
            const { data, error } = await this.supabase
                .from('estoque')
                .update({ estoque: parseInt(quantity) })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, product: data[0] };
        } catch (error) {
            console.error('❌ Erro ao atualizar quantidade no Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }

    async addProduct(productData) {
        try {
            if (!this.supabase) throw new Error("Supabase não inicializado");

            const insertPayload = {
                nome: productData.name,
                estoque: parseInt(productData.quantity) || 0,
                categoria_nivel_1: productData.category || 'Geral',
                preco: productData.price || '0,00',
                marca: productData.brand || null,
                cor: productData.color || null,
                Imagem: productData.image || null // Usa 'Imagem' para manter compatibilidade com a tabela atual
            };

            // Somente inclui estoque_minimo se for fornecido (evita erro de coluna inexistente)
            if (productData.minimum_stock !== undefined && productData.minimum_stock !== null) {
                insertPayload.estoque_minimo = parseInt(productData.minimum_stock);
            }

            const { data, error } = await this.supabase
                .from('estoque')
                .insert([insertPayload])
                .select();

            if (error) {
                // Se o erro for coluna inexistente para estoque_minimo, tenta de novo sem ele
                if (error.message.includes('column "estoque_minimo" does not exist')) {
                    delete insertPayload.estoque_minimo;
                    const retry = await this.supabase.from('estoque').insert([insertPayload]).select();
                    if (retry.error) throw retry.error;
                    return { success: true, product: retry.data[0] };
                }
                throw error;
            }
            return { success: true, product: data[0] };
        } catch (error) {
            console.error('❌ Erro ao adicionar produto no Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(id) {
        try {
            const { error } = await this.supabase
                .from('estoque')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao deletar produto no Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(id, productData) {
        try {
            const updatePayload = {};
            if (productData.name !== undefined) updatePayload.nome = productData.name;
            if (productData.quantity !== undefined) updatePayload.estoque = parseInt(productData.quantity);
            if (productData.minimum_stock !== undefined) updatePayload.estoque_minimo = parseInt(productData.minimum_stock);
            if (productData.category !== undefined) updatePayload.categoria_nivel_1 = productData.category;
            if (productData.price !== undefined) updatePayload.preco = productData.price;

            const { data, error } = await this.supabase
                .from('estoque')
                .update(updatePayload)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, product: data[0] };
        } catch (error) {
            console.error('❌ Erro ao atualizar produto no Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SupabaseService();
