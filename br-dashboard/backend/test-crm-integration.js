require('dotenv').config();
const baserowService = require('./src/services/baserow.service');

async function testCRM() {
    console.log('🚀 Iniciando Teste de Integração CRM (Direto no Serviço)...');

    try {
        // 1. Criar Lead
        console.log('\n📝 Criando novo lead...');
        const newLead = {
            nome: 'Teste Integracao ' + new Date().getTime(),
            telefone: '5511999999999',
            email: 'teste@integracao.com',
            status: 'novo',
            origem: 'Teste Script Direto',
            notas: 'Lead criado via script de teste direto no serviço'
        };

        const createRes = await baserowService.createLead(newLead);
        if (!createRes.success) throw new Error('Falha ao criar lead: ' + createRes.error);
        const leadId = createRes.lead.id;
        console.log(`✅ Lead criado! ID: ${leadId}`);

        // 2. Listar Leads
        console.log('\n🔍 Listando leads...');
        const listRes = await baserowService.getLeads();
        if (!listRes.success) throw new Error('Falha ao listar leads: ' + listRes.error);
        const leads = listRes.leads || [];
        const found = leads.find(l => l.id === leadId);
        if (found) {
            console.log('✅ Lead encontrado na listagem!');
            console.log('Dados recuperados:', JSON.stringify(found, null, 2));
        } else {
            console.error('❌ Lead não encontrado na listagem.');
        }

        // 3. Atualizar Lead
        console.log('\n🔄 Atualizando status do lead...');
        const updateRes = await baserowService.updateLead(leadId, {
            status: 'Contatado'
        });
        if (updateRes.success) {
            console.log('✅ Status atualizado com sucesso!');
        } else {
            console.error('❌ Falha ao atualizar status:', updateRes.error);
        }

        // 4. Deletar Lead (Opcional, mas bom para limpeza)
        console.log('\n🗑️ Deletando lead de teste...');
        const deleteRes = await baserowService.deleteLead(leadId);
        if (deleteRes.success) {
            console.log('✅ Lead deletado com sucesso!');
        }

        console.log('\n✨ Todos os testes de CRM passaram!');

    } catch (error) {
        console.error('❌ Erro no teste CRM:');
        console.error(error.message);
    }
}

testCRM();
