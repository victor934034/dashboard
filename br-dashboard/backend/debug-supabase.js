const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhgmitrybhmwwihznopj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZ21pdHJ5Ymhtd3dpaHpub3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTIxMzA2NywiZXhwIjoyMDg0Nzg5MDY3fQ.fKlFPDuvkUAGiF3TBsKBZt17e9i692BRM7oRMcJaYsE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('--- Testando Conexão Supabase ---');
    try {
        const { data, error, status } = await supabase
            .from('estoque')
            .select('*');

        if (error) {
            console.error('❌ Erro no SELECT:', error);
        } else {
            console.log('✅ SELECT Sucesso! Status:', status);
            console.log('Itens encontrados:', data.length);
            if (data.length > 0) {
                console.log('Primeiro item:', data[0]);
                console.log('Colunas disponíveis:', Object.keys(data[0]));
            }
        }

        console.log('\n--- Testando Inserção (Simulada) ---');
        const testProduct = {
            nome: 'Teste de Conexão ' + Date.now(),
            estoque: 10,
            categoria_nivel_1: 'Teste'
        };

        const { error: insertError } = await supabase
            .from('estoque')
            .insert([testProduct])
            .select();

        if (insertError) {
            console.error('❌ Erro no INSERT:', insertError);
            if (insertError.message.includes('column "estoque_minimo" does not exist')) {
                console.log('💡 DIAGNÓSTICO: A coluna "estoque_minimo" está faltando na tabela do banco.');
            }
        } else {
            console.log('✅ INSERT Sucesso!');
        }

    } catch (e) {
        console.error('❌ Erro inesperado:', e);
    }
}

test();
