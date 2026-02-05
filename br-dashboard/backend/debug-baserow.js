const axios = require('axios');
require('dotenv').config();

const apiUrl = process.env.BASEROW_API_URL || 'https://api.baserow.io';
const email = process.env.BASEROW_EMAIL;
const password = process.env.BASEROW_PASSWORD;
const tableLeads = process.env.BASEROW_TABLE_ID;
const tablePedidos = process.env.BASEROW_PEDIDOS_TABLE_ID;
const tableCampanhas = process.env.BASEROW_CAMPANHAS_TABLE_ID;

async function testBaserow() {
    console.log('--- Diagnóstico Baserow ---');
    console.log('URL:', apiUrl);
    console.log('Email:', email ? 'Configurado' : 'MISSING');
    console.log('Password:', password ? 'Configurado' : 'MISSING');
    console.log('Table ID Leads:', tableLeads);
    console.log('Table ID Pedidos:', tablePedidos);
    console.log('Table ID Campanhas:', tableCampanhas);

    try {
        console.log('\n1. Autenticando...');
        const authResponse = await axios.post(`${apiUrl}/api/user/token-auth/`, { email, password });
        const token = authResponse.data.token;
        const headers = { 'Authorization': `JWT ${token}` };
        console.log('✅ Autenticação OK');

        const tables = [
            { name: 'Leads (CRM)', id: tableLeads },
            { name: 'Pedidos', id: tablePedidos },
            { name: 'Campanhas', id: tableCampanhas }
        ];

        for (const table of tables) {
            console.log(`\n--- Testando Tabela: ${table.name} (ID: ${table.id}) ---`);
            if (!table.id) {
                console.log('❌ ID da tabela não configurado');
                continue;
            }

            try {
                const response = await axios.get(`${apiUrl}/api/database/rows/table/${table.id}/?user_field_names=true&size=1`, { headers });
                console.log(`✅ Acesso OK! Total de registros: ${response.data.count}`);
                if (response.data.results.length > 0) {
                    console.log('Colunas detectadas:', Object.keys(response.data.results[0]));
                } else {
                    console.log('⚠️ Tabela vazia, não foi possível ler colunas.');
                }
            } catch (error) {
                console.error(`❌ Erro ao acessar ${table.name}:`, error.response?.data || error.message);
            }
        }

    } catch (error) {
        console.error('❌ Erro crítico:', error.response?.data || error.message);
    }
}

testBaserow();
