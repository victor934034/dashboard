const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SupabaseService {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (this.supabaseUrl && this.supabaseKey) {
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✅ Supabase Client inicializado');
        } else {
            console.warn('⚠️ Supabase credentials not found in environment');
        }
    }

    async getProducts() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return { success: true, products: data };
        } catch (error) {
            console.error('❌ Erro ao buscar produtos no Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }

    async getLowStock() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .filter('quantity', 'lt', 'minimum_stock');

            if (error) throw error;
            return { success: true, products: data };
        } catch (error) {
            console.error('❌ Erro ao buscar estoque baixo no Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }

    async updateQuantity(id, quantity) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .update({ quantity: parseInt(quantity) })
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
            const { data, error } = await this.supabase
                .from('products')
                .insert([{
                    name: productData.name,
                    quantity: parseInt(productData.quantity) || 0,
                    minimum_stock: parseInt(productData.minimum_stock) || 0,
                    category: productData.category || 'Geral'
                }])
                .select();

            if (error) throw error;
            return { success: true, product: data[0] };
        } catch (error) {
            console.error('❌ Erro ao adicionar produto no Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(id) {
        try {
            const { error } = await this.supabase
                .from('products')
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
            if (productData.name !== undefined) updatePayload.name = productData.name;
            if (productData.quantity !== undefined) updatePayload.quantity = parseInt(productData.quantity);
            if (productData.minimum_stock !== undefined) updatePayload.minimum_stock = parseInt(productData.minimum_stock);
            if (productData.category !== undefined) updatePayload.category = productData.category;

            const { data, error } = await this.supabase
                .from('products')
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
