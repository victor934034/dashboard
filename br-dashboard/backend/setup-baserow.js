const axios = require('axios');
require('dotenv').config();

const BASEROW_API_URL = process.env.BASEROW_API_URL || 'https://api.baserow.io';
const BASEROW_EMAIL = process.env.BASEROW_EMAIL;
const BASEROW_PASSWORD = process.env.BASEROW_PASSWORD;
const DATABASE_ID = process.env.BASEROW_DATABASE_ID;

async function setupBaserow() {
    try {
        console.log('🚀 Iniciando configuração FORÇADA do Baserow...');

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

        // 2. Criar NOVA tabela "CRM Leads" (Sempre cria uma nova para o "refaça")
        console.log('🔨 Criando NOVA tabela "CRM Leads"...');
        const tableRes = await axios.post(`${BASEROW_API_URL}/api/database/tables/database/${DATABASE_ID}/`, {
            name: 'CRM Leads ' + new Date().toLocaleDateString()
        }, { headers });
        const tableId = tableRes.data.id;
        console.log(`✅ Tabela criada! ID: ${tableId}`);

        // 3. Criar campos
        console.log('📋 Configurando campos...');
        // A tabela nova vem com um campo padrão 'Name' (id 1 geralmente), vamos garantir os nossos
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
            console.log(`➕ Criando campo "${field.name}"...`);
            await axios.post(`${BASEROW_API_URL}/api/database/fields/table/${tableId}/`, field, { headers });
        }

        console.log('\n✨ Configuração concluída com sucesso!');
        console.log(`ID da Tabela: ${tableId}`);
        console.log(`POR FAVOR, ATUALIZE SEU .env: BASEROW_TABLE_ID=${tableId}`);

    } catch (error) {
        console.error('❌ Erro durante a configuração:');
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

setupBaserow();
