import { useState, useEffect, useCallback, memo } from 'react';
import { Table, AlertTriangle, Plus, Trash2, Save, Link as LinkIcon, Loader2, RefreshCcw } from 'lucide-react';
import { sheetsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { EstoqueItem } from '@/types';

// Componente de Linha Memoizado para performance máxima
const EstoqueRow = memo(({
  row,
  rowIdx,
  handleCellChange,
  syncCell,
  deleteRow
}: {
  row: string[],
  rowIdx: number,
  handleCellChange: (rowIndex: number, colIndex: number, value: string) => void,
  syncCell: (rowIndex: number, colIndex: number, value: string) => Promise<void>,
  deleteRow: (rowIndex: number) => Promise<void>
}) => {
  return (
    <TableRow>
      {row.map((cell, colIdx) => (
        <TableCell key={colIdx}>
          <Input
            value={cell || ''}
            onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
            onBlur={(e) => syncCell(rowIdx, colIdx, e.target.value)}
            className="min-w-[100px] focus:bg-accent focus:ring-1 transition-colors"
          />
        </TableCell>
      ))}
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => deleteRow(rowIdx)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

EstoqueRow.displayName = 'EstoqueRow';

export default function EstoqueManager() {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [lowStock, setLowStock] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId] = useState('user-1');

  // Confinguração Hardcoded para estabilidade
  const HARDCODED_URL = 'https://docs.google.com/spreadsheets/d/1aZG7JO1McXNI1NQck_Q7ZvsVIQyofARObMbVPYIVIaA/edit';
  const SHEET_NAME = 'Relatório de Produtos';
  const SHEET_ID = 757360320; // GID

  const [newRow, setNewRow] = useState<string[]>([]);

  const loadLowStock = useCallback(async () => {
    try {
      const response = await sheetsApi.getLowStock(userId);
      setLowStock(response.data.products || []);
    } catch (error) {
      console.error('Erro ao carregar estoque baixo:', error);
    }
  }, [userId]);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent && data.length === 0) setLoading(true);
      else setIsRefreshing(true);

      const response = await sheetsApi.read(userId, undefined, SHEET_NAME);
      const values = response.data.data || [];

      if (values.length > 0) {
        setHeaders(values[0]);
        setData(values.slice(1));
        setNewRow(new Array(values[0].length).fill(''));
      }
    } catch (error) {
      if (!silent) toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, data.length]);

  const checkConnection = useCallback(async () => {
    try {
      const response = await sheetsApi.getStatus(userId);

      if (response.data.connected) {
        setIsConnected(true);
        loadData();
        loadLowStock();
      } else {
        // Auto-connect silencioso
        console.log('Auto-connecting to hardcoded sheet...');
        await sheetsApi.connect(userId, HARDCODED_URL);
        setIsConnected(true);
        loadData();
        loadLowStock();
      }
    } catch (error) {
      console.error('Erro ao verificar/conectar:', error);
      // Tentar conectar mesmo assim em caso de erro de status
      try {
        await sheetsApi.connect(userId, HARDCODED_URL);
        setIsConnected(true);
        loadData();
        loadLowStock();
      } catch (e) {
        console.error('Falha fatal na autoconexão', e);
      }
    }
  }, [userId, loadData, loadLowStock]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectSpreadsheet = useCallback(async () => {
    if (!spreadsheetUrl) {
      toast.error('Informe a URL da planilha');
      return;
    }

    try {
      setLoading(true);
      await sheetsApi.connect(userId, spreadsheetUrl);
      setIsConnected(true);
      toast.success('Planilha conectada com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao conectar planilha');
    } finally {
      setLoading(false);
    }
  }, [userId, spreadsheetUrl, loadData]);

  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setData(prev => {
      const newData = [...prev];
      if (newData[rowIndex]) {
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = value;
      }
      return newData;
    });
  }, []);

  const syncCell = useCallback(async (rowIndex: number, colIndex: number, value: string) => {
    try {
      const cellRef = `${String.fromCharCode(65 + colIndex)}${rowIndex + 2}`;
      await sheetsApi.updateCell(userId, cellRef, value, SHEET_NAME);
      loadLowStock();
    } catch (error) {
      toast.error('Erro ao sincronizar célula. Revertendo...');
      loadData(true);
    }
  }, [userId, loadData, loadLowStock]);

  const addRow = useCallback(async () => {
    if (newRow.some(cell => cell.trim() !== '')) {
      const rowToAdd = [...newRow];
      try {
        setData(prev => [...prev, rowToAdd]);
        setNewRow(new Array(headers.length).fill(''));

        await sheetsApi.addRow(userId, rowToAdd, SHEET_NAME);
        toast.success('Produto adicionado');
        loadData(true);
      } catch (error) {
        toast.error('Erro ao adicionar produto');
        loadData(true);
      }
    }
  }, [userId, newRow, headers.length, loadData]);

  const deleteRow = useCallback(async (rowIndex: number) => {
    let originalData: string[][] = [];
    setData(prev => {
      originalData = prev;
      return prev.filter((_, i) => i !== rowIndex);
    });

    try {
      await sheetsApi.deleteRow(userId, rowIndex + 1, SHEET_ID);
      toast.success('Linha removida');
      loadData(true);
    } catch (error) {
      toast.error('Erro ao remover linha');
      setData(originalData);
    }
  }, [userId, loadData]);

  if (!isConnected) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Conectar Planilha do Google Sheets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Informe a URL da planilha do Google Sheets para gerenciar seu estoque:
            </p>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
            />
            <Button onClick={connectSpreadsheet} disabled={loading} className="w-full">
              {loading ? 'Conectando...' : 'Conectar Planilha'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Alertas de Estoque Baixo */}
      {lowStock.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Estoque Baixo ({lowStock.length} produtos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((item, idx) => (
                <Badge key={idx} variant="destructive">
                  {item.name}: {item.quantity} (mín: {item.minimum})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Estoque */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5" />
            Gerenciamento de Estoque
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadData()} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4 mr-2" />
              )}
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {headers.map((header, idx) => (
                    <div key={idx}>
                      <label className="text-sm font-medium">{header}</label>
                      <Input
                        value={newRow[idx] || ''}
                        onChange={(e) => {
                          const updated = [...newRow];
                          updated[idx] = e.target.value;
                          setNewRow(updated);
                        }}
                      />
                    </div>
                  ))}
                  <Button onClick={addRow} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <UITable>
              <TableHeader>
                <TableRow>
                  {headers.map((header, idx) => (
                    <TableHead key={idx}>{header}</TableHead>
                  ))}
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIdx) => (
                  <EstoqueRow
                    key={rowIdx}
                    row={row}
                    rowIdx={rowIdx}
                    handleCellChange={handleCellChange}
                    syncCell={syncCell}
                    deleteRow={deleteRow}
                  />
                ))}
              </TableBody>
            </UITable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
