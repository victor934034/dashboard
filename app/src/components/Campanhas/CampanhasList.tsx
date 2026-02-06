import { useState, useEffect } from 'react';
import { Megaphone, RefreshCw, ExternalLink, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { campanhasApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Campanha } from '@/types';

export default function CampanhasList() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCampanha, setNewCampanha] = useState({
    nome: '',
    descricao: '',
    link: '',
    ativa: true
  });

  useEffect(() => {
    loadCampanhas(true); // Carregamento silencioso para aparecer instantâneo
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadCampanhas = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await campanhasApi.getAll();

      // Suporte para array direto (n8n compatible) ou objeto padrão
      if (Array.isArray(response.data)) {
        setCampanhas(response.data);
      } else if (response.data.success) {
        setCampanhas(response.data.campanhas || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar campanhas');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const createCampanha = async () => {
    if (!newCampanha.nome) {
      toast.error('O nome da campanha é obrigatório');
      return;
    }
    try {
      await campanhasApi.create(newCampanha);
      toast.success('Campanha criada com sucesso!');
      setNewCampanha({ nome: '', descricao: '', link: '', ativa: true });
      loadCampanhas();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao criar campanha');
    }
  };

  const deleteCampanha = async (id: string | number) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
    try {
      await campanhasApi.delete(id);
      toast.success('Campanha excluída!');
      loadCampanhas();
    } catch (error) {
      toast.error('Erro ao excluir campanha');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6" />
          Gestão de Campanhas
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadCampanhas()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={newCampanha.nome}
                    onChange={(e) => setNewCampanha({ ...newCampanha, nome: e.target.value })}
                    placeholder="Ex: Promoção de Verão"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={newCampanha.descricao}
                    onChange={(e) => setNewCampanha({ ...newCampanha, descricao: e.target.value })}
                    placeholder="Detalhes da oferta..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Link de Destino</label>
                  <Input
                    value={newCampanha.link}
                    onChange={(e) => setNewCampanha({ ...newCampanha, link: e.target.value })}
                    placeholder="https://sualoja.com/promo"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={newCampanha.ativa}
                    onCheckedChange={(checked) => setNewCampanha({ ...newCampanha, ativa: checked })}
                  />
                  <label className="text-sm font-medium">Campanha Ativa</label>
                </div>
                <Button onClick={createCampanha} className="w-full mt-4">
                  Criar e Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && campanhas.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Buscando campanhas...</p>
        </div>
      ) : campanhas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
            <Megaphone className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma campanha ativa</h3>
            <p className="max-w-[300px] mb-6">Crie sua primeira campanha para que ela apareça aqui e na IA do WhatsApp.</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Adicionar agora</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campanhas.map(campanha => (
            <Card key={campanha.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">{campanha.nome}</CardTitle>
                  <Badge className={campanha.ativa ? "bg-green-500 hover:bg-green-600" : "bg-slate-400"}>
                    {campanha.ativa ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">
                  {campanha.descricao || 'Sem descrição definida.'}
                </p>

                {campanha.link && (
                  <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                    <span className="text-xs truncate flex-1">{campanha.link}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(campanha.link)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t mt-4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Desde: {new Date(campanha.criadoEm).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8 px-2 hover:bg-destructive/10"
                    onClick={() => deleteCampanha(campanha.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-full mt-1">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary">Integração Automática</h4>
            <p className="text-xs text-muted-foreground mt-1">
              As campanhas salvas aqui são o <strong>ponto de verdade</strong> para o sistema.
              O n8n e a IA do WhatsApp consultam esta lista para oferecer seus produtos e links aos clientes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
