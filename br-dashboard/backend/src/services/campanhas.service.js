const fs = require('fs');
const path = require('path');

class CampanhasService {
  constructor() {
    this.storagePath = path.join(__dirname, '../data/campanhas.json');
    this.ensureStorage();
  }

  ensureStorage() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.storagePath)) {
      fs.writeFileSync(this.storagePath, JSON.stringify([], null, 2));
    }
  }

  async getCampanhas() {
    try {
      const data = fs.readFileSync(this.storagePath, 'utf8');
      const campanhas = JSON.parse(data);

      return {
        success: true,
        campanhas: campanhas,
        total: campanhas.length,
        ultimaAtualizacao: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao ler campanhas do arquivo:', error.message);
      return {
        success: false,
        campanhas: [],
        error: 'Erro ao carregar campanhas'
      };
    }
  }

  async getCampanhasTexto() {
    try {
      const result = await this.getCampanhas();
      const ativas = result.campanhas.filter(c => c.ativa);

      if (!result.success || ativas.length === 0) {
        return "No momento não temos campanhas ativas.";
      }

      const texto = ativas.map(c =>
        `Campanha: ${c.nome}\nDescrição: ${c.descricao}\nLink: ${c.link}`
      ).join('\n\n');

      return texto;

    } catch (error) {
      return "Houve um erro ao buscar as campanhas para a IA.";
    }
  }

  async addCampanha(campanhaData) {
    try {
      const result = await this.getCampanhas();
      const campanhas = result.campanhas;

      const novaCampanha = {
        id: Date.now().toString(),
        nome: campanhaData.nome || 'Campanha sem nome',
        descricao: campanhaData.descricao || '',
        link: campanhaData.link || '',
        ativa: campanhaData.ativa !== false,
        criadoEm: new Date().toISOString()
      };

      campanhas.push(novaCampanha);
      fs.writeFileSync(this.storagePath, JSON.stringify(campanhas, null, 2));

      return {
        success: true,
        message: 'Campanha adicionada com sucesso!',
        campanha: novaCampanha
      };
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      throw error;
    }
  }

  async updateCampanha(id, updateData) {
    try {
      const result = await this.getCampanhas();
      const campanhas = result.campanhas;
      const index = campanhas.findIndex(c => c.id === id);

      if (index === -1) {
        throw new Error('Campanha não encontrada');
      }

      campanhas[index] = { ...campanhas[index], ...updateData };
      fs.writeFileSync(this.storagePath, JSON.stringify(campanhas, null, 2));

      return {
        success: true,
        campanha: campanhas[index]
      };
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      throw error;
    }
  }

  async deleteCampanha(id) {
    try {
      const result = await this.getCampanhas();
      const filtered = result.campanhas.filter(c => c.id !== id);

      fs.writeFileSync(this.storagePath, JSON.stringify(filtered, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar campanha:', error);
      throw error;
    }
  }

  clearCache() {
    // Não temos mais cache de memória, pois lemos direto do arquivo (ou poderíamos manter um cache volátil)
    console.log('🗑️ Operação clearCache ignorada (armazenamento local ativo)');
  }
}

module.exports = new CampanhasService();
