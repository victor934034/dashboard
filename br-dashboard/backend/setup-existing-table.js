const axios = require('axios');
require('dotenv').config();

const BASEROW_API_URL = process.env.BASEROW_API_URL || 'https://api.baserow.io';
const BASEROW_EMAIL = process.env.BASEROW_EMAIL;
const BASEROW_PASSWORD = process.env.BASEROW_PASSWORD;
const TABLE_ID = process.env.BASEROW_TABLE_ID;

async function setupExistingTable() {
    try {
        console.log(`🚀 Configurando campos na tabela existente: ${TABLE_ID}...`);

        // 1. Autenticar
        console.log('🔐 Autenticando...');
        const authRes = await axios.post(`${BASEROW_API_URL}/api/user/token-auth/`, {
            email: BASEROW_EMAIL,
            password: BASEROW_PASSWORD
        });
        const token = authRes.data.token;
        const headers = {
            'Authorization': `JWT ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('✅ Autenticado com sucesso!');

        // 2. Verificar/Criar campos
        console.log('📋 Verificando campos...');
        const existingFieldsRes = await axios.get(`${BASEROW_API_URL}/api/database/fields/table/${TABLE_ID}/`, { headers });
        const existingFields = existingFieldsRes.data.map(f => f.name.toLowerCase());

        const fieldsToCreate = [
            { name: 'Nome', type: 'text' },
            { name: 'Telefone', type: 'text' },
            { name: 'Email', type: 'email' },
            {
                name: 'Status',
                type: 'single_select',
                select_options: [
                    { value: 'Novo', color: 'blue' },
                    { value: 'Contatado', color: 'yellow' },
                    { value: 'Qualificado', color: 'purple' },
                    { value: 'Proposta', color: 'orange' },
                    { value: 'Fechado', color: 'green' },
                    { value: 'Perdido', color: 'red' }
                ]
            },
            { name: 'Origem', type: 'text' },
            { name: 'Notas', type: 'long_text' },
            { name: 'Data Cadastrado', type: 'date', date_format: 'EU', date_include_time: true }
        ];

        for (const field of fieldsToCreate) {
            if (!existingFields.includes(field.name.toLowerCase())) {
                console.log(`➕ Criando campo "${field.name}"...`);
                await axios.post(`${BASEROW_API_URL}/api/database/fields/table/${TABLE_ID}/`, field, { headers });
            } else {
                console.log(`✔ Campo "${field.name}" já existe.`);
            }
        }

        console.log('\n✨ Configuração concluída com sucesso!');
        console.log(`A tabela ${TABLE_ID} agora está pronta para o CRM.`);

    } catch (error) {
        console.error('❌ Erro durante a configuração:');
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

setupExistingTable();
