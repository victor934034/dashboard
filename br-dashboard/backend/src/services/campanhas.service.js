const baserowService = require('./baserow.service');

class CampanhasService {
  async getCampanhas() {
    try {
      const result = await baserowService.getCampanhas();

      return {
        ...result,
        total: result.campanhas?.length || 0,
        ultimaAtualizacao: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas no Baserow:', error.message);
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
      return await baserowService.createCampanha(campanhaData);
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      throw error;
    }
  }

  async updateCampanha(id, updateData) {
    try {
      return await baserowService.updateCampanha(id, updateData);
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      throw error;
    }
  }

  async deleteCampanha(id) {
    try {
      return await baserowService.deleteCampanha(id);
    } catch (error) {
      console.error('Erro ao deletar campanha:', error);
      throw error;
    }
  }

  clearCache() {
    console.log('🗑️ Cache limpo (Baserow ativo)');
  }
}

module.exports = new CampanhasService();
