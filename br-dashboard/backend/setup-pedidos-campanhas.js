const axios = require('axios');
require('dotenv').config();

const BASEROW_API_URL = process.env.BASEROW_API_URL || 'https://api.baserow.io';
const BASEROW_EMAIL = process.env.BASEROW_EMAIL;
const BASEROW_PASSWORD = process.env.BASEROW_PASSWORD;
const PEDIDOS_TABLE_ID = process.env.BASEROW_PEDIDOS_TABLE_ID;
const CAMPANHAS_TABLE_ID = process.env.BASEROW_CAMPANHAS_TABLE_ID;

async function setup() {
    try {
        console.log('🚀 Autenticando no Baserow...');
        const authRes = await axios.post(`${BASEROW_API_URL}/api/user/token-auth/`, {
            email: BASEROW_EMAIL,
            password: BASEROW_PASSWORD
        });
        const token = authRes.data.token;
        const headers = {
            'Authorization': `JWT ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('✅ Autenticado!');

        // 1. Configurar Pedidos
        console.log(`\n📋 Configurando tabela de PEDIDOS (${PEDIDOS_TABLE_ID})...`);
        const pedidosFieldsRes = await axios.get(`${BASEROW_API_URL}/api/database/fields/table/${PEDIDOS_TABLE_ID}/`, { headers });
        const existingPedidosFields = pedidosFieldsRes.data.map(f => f.name.toLowerCase());

        const pedidosFields = [
            { name: 'Cliente', type: 'text' },
            { name: 'Itens', type: 'long_text' },
            { name: 'Total', type: 'number', number_decimal_places: 2 },
            { name: 'Endereco', type: 'long_text' },
            { name: 'Whatsapp', type: 'text' },
            { name: 'Data Hora', type: 'text' }, // Texto formatado vindo do n8n geralmente
            {
                name: 'Status',
                type: 'single_select',
                select_options: [
                    { value: 'pendente', color: 'yellow' },
                    { value: 'processando', color: 'blue' },
                    { value: 'concluido', color: 'green' },
                    { value: 'cancelado', color: 'red' }
                ]
            },
            { name: 'Origem', type: 'text' }
        ];

        for (const field of pedidosFields) {
            if (!existingPedidosFields.includes(field.name.toLowerCase())) {
                console.log(`➕ Criando campo "${field.name}" em Pedidos...`);
                await axios.post(`${BASEROW_API_URL}/api/database/fields/table/${PEDIDOS_TABLE_ID}/`, field, { headers });
            } else {
                console.log(`✔ Campo "${field.name}" já existe em Pedidos.`);
            }
        }

        // 2. Configurar Campanhas
        console.log(`\n📋 Configurando tabela de CAMPANHAS (${CAMPANHAS_TABLE_ID})...`);
        const campanhasFieldsRes = await axios.get(`${BASEROW_API_URL}/api/database/fields/table/${CAMPANHAS_TABLE_ID}/`, { headers });
        const existingCampanhasFields = campanhasFieldsRes.data.map(f => f.name.toLowerCase());

        const campanhasFields = [
            { name: 'Nome', type: 'text' },
            { name: 'Descricao', type: 'long_text' },
            { name: 'Link', type: 'text' },
            { name: 'Ativa', type: 'boolean' }
        ];

        for (const field of campanhasFields) {
            if (!existingCampanhasFields.includes(field.name.toLowerCase())) {
                console.log(`➕ Criando campo "${field.name}" em Campanhas...`);
                await axios.post(`${BASEROW_API_URL}/api/database/fields/table/${CAMPANHAS_TABLE_ID}/`, field, { headers });
            } else {
                console.log(`✔ Campo "${field.name}" já existe em Campanhas.`);
            }
        }

        console.log('\n✨ Todas as tabelas configuradas com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a configuração:');
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

setup();
