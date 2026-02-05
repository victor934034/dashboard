const axios = require('axios');
const baserowService = require('./src/services/baserow.service');
require('dotenv').config();

async function testIntegration() {
    try {
        console.log('🚀 Iniciando Teste de Pedidos e Campanhas...');

        // 1. Testar Pedidos
        console.log('\n📦 Testando PEDIDOS...');
        const novoPedido = {
            cliente: 'Cliente Teste Baserow',
            itens: '1x Produto A, 2x Produto B',
            total: 150.50,
            endereco: 'Rua de Teste, 123',
            whatsapp: '5511988887777',
            status: 'pendente',
            origem: 'Script de Teste'
        };
        const resPedido = await baserowService.createPedido(novoPedido);
        if (resPedido.success) {
            console.log('✅ Pedido criado com sucesso! ID:', resPedido.pedido.id);

            const listRes = await baserowService.getPedidos();
            const found = listRes.pedidos.find(p => p.id === resPedido.pedido.id);
            console.log(found ? '✅ Pedido encontrado na listagem!' : '❌ Pedido NÃO encontrado!');

            await baserowService.deletePedido(resPedido.pedido.id);
            console.log('✅ Pedido de teste deletado.');
        } else {
            console.error('❌ Erro ao criar pedido:', resPedido.error);
        }

        // 2. Testar Campanhas
        console.log('\n📢 Testando CAMPANHAS...');
        const novaCampanha = {
            nome: 'Campanha Teste Baserow',
            descricao: 'Descrição da campanha de teste',
            link: 'https://teste.com',
            ativa: true
        };
        const resCampanha = await baserowService.createCampanha(novaCampanha);
        if (resCampanha.success) {
            console.log('✅ Campanha criada com sucesso! ID:', resCampanha.campanha.id);

            const listCRes = await baserowService.getCampanhas();
            const foundC = listCRes.campanhas.find(c => c.id === resCampanha.campanha.id);
            console.log(foundC ? '✅ Campanha encontrada na listagem!' : '❌ Campanha NÃO encontrada!');

            await baserowService.deleteCampanha(resCampanha.campanha.id);
            console.log('✅ Campanha de teste deletada.');
        } else {
            console.error('❌ Erro ao criar campanha:', resCampanha.error);
        }

        console.log('\n✨ Todos os testes concluídos!');

    } catch (error) {
        console.error('❌ Erro fatal no teste:', error.message);
    }
}

testIntegration();
