require('dotenv').config();
const axios = require('axios');

async function testBaserow() {
    const apiUrl = process.env.BASEROW_API_URL || 'https://api.baserow.io';
    const email = process.env.BASEROW_EMAIL;
    const password = process.env.BASEROW_PASSWORD;
    const tableId = process.env.BASEROW_TABLE_ID;

    console.log('--- Configurações ---');
    console.log('API URL:', apiUrl);
    console.log('Email:', email);
    console.log('Table ID:', tableId);
    console.log('--------------------');

    try {
        console.log('🔐 Tentando autenticar...');
        const authRes = await axios.post(`${apiUrl}/api/user/token-auth/`, { email, password });
        const token = authRes.data.token;
        console.log('✅ Autenticado com sucesso!');

        console.log('📥 Buscando leads da tabela', tableId, '...');
        const headers = {
            'Authorization': `JWT ${token}`,
            'Content-Type': 'application/json'
        };

        const response = await axios.get(
            `${apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true`,
            { headers }
        );

        console.log('✅ Leads recuperados:', response.data.results?.length || 0);
        if (response.data.results?.length > 0) {
            console.log('Primeiro Lead:', JSON.stringify(response.data.results[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Erro no teste Baserow:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Mensagem:', error.message);
        }
    }
}

testBaserow();
