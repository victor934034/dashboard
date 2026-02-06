import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, RefreshCcw, Package, ShieldAlert, Image as ImageIcon, Wallet, Info, Search, Save, Edit } from 'lucide-react';
import { stockApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Product {
  id: string | number;
  name: string;
  quantity: number;
  minimum_stock: number;
  category: string;
  price?: string;
  brand?: string;
  color?: string;
  image?: string;
}

export default function EstoqueManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    minimum_stock: 0,
    category: 'Geral',
    price: '0,00',
    brand: '',
    color: '',
    image: ''
  });

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const response = await stockApi.getProducts();
      if (response.data.success) {
        const allProducts = response.data.products || [];
        setProducts(allProducts);
        setFilteredProducts(allProducts);

        // Calcular estoque baixo (limite de 10 conforme solicitado)
        const low = allProducts.filter(
          (p: Product) => p.quantity < 10
        );
        setLowStockProducts(low);
      }
    } catch (error) {
      if (!silent) toast.error('Erro ao carregar estoque do Supabase');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtro de Busca
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredProducts(
      products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term))
      )
    );
  }, [searchTerm, products]);

  const handleUpdateQuantity = async (id: string | number, newQty: string) => {
    const qty = parseInt(newQty);
    if (isNaN(qty)) return;

    try {
      await stockApi.updateQuantity(id, qty);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: qty } : p));
      toast.success('Estoque atualizado');
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

      let response;
      if (editingProduct) {
        response = await stockApi.updateProduct(editingProduct.id, {
          name: newProduct.name,
          quantity: newProduct.quantity,
          category: newProduct.category,
          price: newProduct.price,
          brand: newProduct.brand,
          color: newProduct.color,
          image: newProduct.image
        });
      } else {
        response = await stockApi.addProduct(newProduct);
      }

      if (response.data.success) {
        toast.success(editingProduct ? 'Produto atualizado' : 'Produto cadastrado');
        setIsDialogOpen(false);
        setEditingProduct(null);
        setNewProduct({ name: '', quantity: 0, minimum_stock: 0, category: 'Geral', price: '0,00', brand: '', color: '', image: '' });
        loadData(true);
      } else {
        toast.error(`${editingProduct ? 'Erro ao atualizar' : 'Erro ao cadastrar'}: ${response.data.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      toast.error(editingProduct ? 'Erro ao atualizar' : 'Erro ao cadastrar');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      quantity: product.quantity,
      minimum_stock: product.minimum_stock,
      category: product.category,
      price: product.price || '0,00',
      brand: product.brand || '',
      color: product.color || '',
      image: product.image || ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenAddDialog = () => {
    setEditingProduct(null);
    setNewProduct({ name: '', quantity: 0, minimum_stock: 0, category: 'Geral', price: '0,00', brand: '', color: '', image: '' });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!confirm('Deseja realmente remover este item do estoque?')) return;

    try {
      const response = await stockApi.deleteProduct(id);
      if (response.data.success) {
        toast.success('Produto removido');
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      toast.error('Erro ao remover produto');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Alertas Críticos */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive bg-destructive/5 animate-in fade-in slide-in-from-top duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive text-lg font-bold">
              <ShieldAlert className="w-5 h-5 font-bold" />
              Reposição Necessária ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map((item) => (
                <Badge key={item.id} variant="outline" className="bg-white text-destructive border-destructive shadow-sm">
                  {item.name}: {item.quantity} un (mín: {item.minimum_stock})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header & Dashboard Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-7 h-7 text-primary" />
            </div>
            Gestão de Inventário
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualizando dados da tabela <code className="bg-muted px-1 rounded text-primary">estoque</code> no Supabase
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, categoria..."
              className="pl-9 h-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Button variant="outline" className="h-10" onClick={() => loadData()} disabled={isRefreshing || loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>

          <Button className="h-10 bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95" onClick={handleOpenAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto no Estoque'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 border-b pb-1">
                    <Info className="w-4 h-4 text-primary" /> Informações Básicas
                  </label>
                  <Input
                    placeholder="Nome completo do produto"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Input
                    placeholder="Ex: Painel Ripado"
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Marca</label>
                  <Input
                    placeholder="Marca do produto"
                    value={newProduct.brand}
                    onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" /> Preço (R$)
                  </label>
                  <Input
                    placeholder="67,90"
                    value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cor</label>
                  <Input
                    placeholder="Ex: PRETO"
                    value={newProduct.color}
                    onChange={e => setNewProduct({ ...newProduct, color: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Qtd Inicial</label>
                  <Input
                    type="number"
                    value={newProduct.quantity}
                    onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-destructive">Estoque de Alerta</label>
                  <Input
                    type="number"
                    value={newProduct.minimum_stock}
                    onChange={e => setNewProduct({ ...newProduct, minimum_stock: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" /> URL da Imagem
                  </label>
                  <Input
                    placeholder="https://..."
                    value={newProduct.image}
                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddProduct} disabled={isAdding} className="px-8">
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingProduct ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-lg border-muted/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <UITable>
              <TableHeader className="bg-muted/40 h-14">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px] text-center">Foto</TableHead>
                  <TableHead className="min-w-[200px]">Produto</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="text-center">Preço</TableHead>
                  <TableHead className="text-center w-[120px]">Qtd. Atual</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                          <Package className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground animate-pulse">Sincronizando com Supabase...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground bg-muted/5">
                      <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                        <Search className="w-12 h-12 mb-2" />
                        <p className="font-medium text-lg">Nenhum produto encontrado</p>
                        <p className="text-sm">Tente ajustar sua busca ou cadastrar um novo item.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/20 transition-all group">
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-muted-foreground/10">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{product.name}</span>
                          <span className="text-xs text-muted-foreground mt-0.5 uppercase font-medium">{product.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {product.brand && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{product.brand}</Badge>}
                          {product.color && <Badge variant="outline" className="px-1.5 py-0 text-[10px] border-muted-foreground/20">{product.color}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-bold text-green-600">R$ {product.price || '---'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleUpdateQuantity(product.id, e.target.value)}
                          className={`w-20 mx-auto text-center font-bold h-9 bg-white transition-all ${product.quantity < 10 ? 'border-destructive text-destructive bg-destructive/5' : 'focus:border-primary'}`}
                        />
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Alerta: &lt; 10
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => handleEditClick(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
