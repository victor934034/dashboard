import { useState, useEffect, useCallback } from 'react';
import { Table, AlertTriangle, Plus, Trash2, Loader2, RefreshCcw, Package, Tag, Hash, ShieldAlert } from 'lucide-react';
import { stockApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Product {
  id: string | number;
  name: string;
  quantity: number;
  minimum_stock: number;
  category: string;
}

export default function EstoqueManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    minimum_stock: 0,
    category: 'Geral'
  });

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const response = await stockApi.getProducts();
      if (response.data.success) {
        setProducts(response.data.products || []);

        // Calcular estoque baixo localmente ou via API
        const low = (response.data.products || []).filter(
          (p: Product) => p.quantity < p.minimum_stock
        );
        setLowStockProducts(low);
      }
    } catch (error) {
      if (!silent) toast.error('Erro ao carregar estoque');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateQuantity = async (id: string | number, newQty: string) => {
    const qty = parseInt(newQty);
    if (isNaN(qty)) return;

    try {
      await stockApi.updateQuantity(id, qty);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: qty } : p));

      // Atualizar alertas
      const updatedProducts = products.map(p => p.id === id ? { ...p, quantity: qty } : p);
      setLowStockProducts(updatedProducts.filter(p => p.quantity < p.minimum_stock));

      toast.success('Quantidade atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar quantidade');
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) {
      toast.error('O nome do produto é obrigatório');
      return;
    }

    try {
      setIsAdding(true);
      const response = await stockApi.addProduct(newProduct);
      if (response.data.success) {
        toast.success('Produto adicionado ao estoque');
        setIsDialogOpen(false);
        setNewProduct({ name: '', quantity: 0, minimum_stock: 0, category: 'Geral' });
        loadData(true);
      }
    } catch (error) {
      toast.error('Erro ao adicionar produto');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!confirm('Tem certeza que deseja excluir este produto do estoque?')) return;

    try {
      const response = await stockApi.deleteProduct(id);
      if (response.data.success) {
        toast.success('Produto removido');
        setProducts(prev => prev.filter(p => p.id !== id));
        setLowStockProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      toast.error('Erro ao remover produto');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Alertas de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive text-lg font-bold">
              <ShieldAlert className="w-5 h-5" />
              Alerta de Reposição ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map((item) => (
                <Badge key={item.id} variant="outline" className="bg-white text-destructive border-destructive">
                  {item.name}: {item.quantity} (mín: {item.minimum_stock})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cabeçalho e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Gestão de Estoque
          </h1>
          <p className="text-sm text-muted-foreground">Controle seus produtos e níveis de estoque em tempo real (Supabase)</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData()} disabled={isRefreshing || loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Sincronizar'}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar ao Estoque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" /> Nome do Produto
                  </label>
                  <Input
                    placeholder="Ex: Camiseta Branca G"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" /> Quantidade
                    </label>
                    <Input
                      type="number"
                      value={newProduct.quantity}
                      onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" /> Estoque Mínimo
                    </label>
                    <Input
                      type="number"
                      value={newProduct.minimum_stock}
                      onChange={e => setNewProduct({ ...newProduct, minimum_stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Input
                    placeholder="Ex: Vestuário"
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddProduct} disabled={isAdding}>
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Produto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <Card className="shadow-sm border-muted">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <UITable>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40%]">Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-center">Mínimo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground font-medium">Carregando estoque...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Nenhum produto cadastrado no Supabase.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleUpdateQuantity(product.id, e.target.value)}
                            className={`w-20 h-8 text-center ${product.quantity < product.minimum_stock ? 'border-destructive text-destructive font-bold' : ''}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{product.minimum_stock}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </UITable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
