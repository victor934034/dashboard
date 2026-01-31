const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function runTests() {
    console.log('🚀 Starting Integration Tests...');

    // 1. Health Check
    try {
        console.log('\nTesting GET /health...');
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check Passed:', health.data);
    } catch (error) {
        console.error('❌ Health Check Failed:', error.response ? error.response.status : error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('CRITICAL: Cannot connect to server. Is it running on port 80?');
            process.exit(1);
        }
    }

    // 2. Campanhas (GET)
    try {
        console.log('\nTesting GET /api/campanhas...');
        const campanhas = await axios.get(`${BASE_URL}/api/campanhas`);
        console.log('✅ Campanhas List:', campanhas.data);
    } catch (error) {
        console.error('❌ GET Campanhas Failed:', error.message);
    }

    // 3. Create Campanha (POST)
    let campanhaId;
    try {
        console.log('\nTesting POST /api/campanhas...');
        const newCampanha = {
            nome: "Teste Campanha Integrada",
            descricao: "Teste de persistência e PUT",
            link: "https://wa.me/5511999999999",
            ativa: true
        };
        const res = await axios.post(`${BASE_URL}/api/campanhas`, newCampanha);
        console.log('✅ Campanha Created:', res.data);
        if (res.data.success) {
            campanhaId = res.data.campanha.id;
        }
    } catch (error) {
        console.error('❌ POST Campanha Failed:', error.message);
    }

    // 4. Update Campanha (PUT) - THE NEW FEATURE
    if (campanhaId) {
        try {
            console.log(`\nTesting PUT /api/campanhas/${campanhaId}...`);
            const updateData = {
                nome: "Campanha Atualizada",
                ativa: false
            };
            const res = await axios.put(`${BASE_URL}/api/campanhas/${campanhaId}`, updateData);
            console.log('✅ Campanha Updated:', res.data);
        } catch (error) {
            console.error('❌ PUT Campanha Failed:', error.message);
        }
    }

    // 5. Test Webhook Pedido (POST)
    try {
        console.log('\nTesting POST /webhook/pedido...');
        const pedido = {
            cliente: "Cliente Teste Integração",
            itens: "2x Teste Item",
            total: "200.00",
            endereco: "Rua Teste Integration",
            whatsapp: "5511888888888"
        };
        const res = await axios.post(`${BASE_URL}/webhook/pedido`, pedido);
        console.log('✅ Webhook Pedido Success:', res.data);
    } catch (error) {
        console.error('❌ Webhook Pedido Failed:', error.message);
    }

    // 6. Verify Pedido Persistence (GET)
    try {
        console.log('\nTesting GET /api/pedidos to verify persistence...');
        const res = await axios.get(`${BASE_URL}/api/pedidos`);
        const pedidos = res.data.pedidos;
        const found = pedidos.find(p => p.cliente === "Cliente Teste Integração");
        if (found) {
            console.log('✅ Persistence Verified! Found pedido:', found.id);
        } else {
            console.error('❌ Persistence Fail: Pedido not found in list.');
        }
    } catch (error) {
        console.error('❌ GET Pedidos Failed:', error.message);
    }

}

runTests();
