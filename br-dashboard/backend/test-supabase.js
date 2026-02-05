const supabaseService = require('./src/services/supabase.service');
require('dotenv').config();

async function testSupabase() {
    try {
        console.log('🚀 Iniciando Teste de Integração Supabase Stock...');

        // 1. Testar Adição
        console.log('\n📦 Adicionando produto de teste...');
        const novoProduto = {
            name: 'Produto Teste Supabase',
            quantity: 10,
            minimum_stock: 5,
            category: 'Testes'
        };
        const resAdd = await supabaseService.addProduct(novoProduto);
        if (resAdd.success) {
            const pId = resAdd.product.id;
            console.log('✅ Produto adicionado! ID:', pId);

            // 2. Testar Listagem
            console.log('\n🔍 Listando produtos...');
            const resList = await supabaseService.getProducts();
            const found = resList.products.find(p => p.id === pId);
            console.log(found ? '✅ Produto encontrado na listagem!' : '❌ Produto NÃO encontrado!');

            // 3. Testar Atualização de Quantidade
            console.log('\n🔄 Atualizando quantidade...');
            const resUpdate = await supabaseService.updateQuantity(pId, 2);
            if (resUpdate.success && resUpdate.product.quantity === 2) {
                console.log('✅ Quantidade atualizada para 2!');

                // 4. Testar Alerta de Estoque Baixo
                console.log('\n⚠️ Verificando alerta de estoque baixo...');
                const resLow = await supabaseService.getLowStock();
                const alerting = resLow.products.find(p => p.id === pId);
                console.log(alerting ? '✅ Alerta gerado com sucesso (2 < 5)!' : '❌ Alerta NÃO gerado!');
            }

            // 5. Deletar Teste
            console.log('\n🗑️ Removendo produto de teste...');
            await supabaseService.deleteProduct(pId);
            console.log('✅ Produto de teste removido.');
        } else {
            console.error('❌ Erro ao adicionar produto:', resAdd.error);
        }

        console.log('\n✨ Todos os testes concluídos com sucesso!');

    } catch (error) {
        console.error('❌ Erro fatal no teste:', error.message);
    }
}

testSupabase();
