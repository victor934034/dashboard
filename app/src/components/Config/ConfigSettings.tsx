import { useState, useEffect } from 'react';
import { Settings, Save, Server, Database, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function ConfigSettings() {
    const [config, setConfig] = useState({
        apiUrl: import.meta.env.VITE_API_URL || '',
        n8nWebhook: 'https://vendas-n8n.zdc13k.easypanel.host/webhook/agente01',
        baserowId: '361090',
        tableId: '818438'
    });

    const handleSave = () => {
        // Em um app real, isso salvaria no backend ou localStorage
        // Aqui apenas simulamos
        localStorage.setItem('app_config', JSON.stringify(config));
        toast.success('Configurações salvas com sucesso!');
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    Configurações do Sistema
                </h1>
                <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="w-5 h-5" />
                            Conexão Backend
                        </CardTitle>
                        <CardDescription>
                            URLs de conexão com os serviços principais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiUrl">API URL (Backend)</Label>
                            <Input
                                id="apiUrl"
                                value={config.apiUrl}
                                onChange={e => setConfig({ ...config, apiUrl: e.target.value })}
                                placeholder="http://localhost:3001"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="n8nWebhook">Webhook Principal n8n</Label>
                            <Input
                                id="n8nWebhook"
                                value={config.n8nWebhook}
                                onChange={e => setConfig({ ...config, n8nWebhook: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Integração CRM (Baserow)
                        </CardTitle>
                        <CardDescription>
                            Credenciais de acesso ao banco de dados
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="baserowId">Database ID</Label>
                            <Input
                                id="baserowId"
                                value={config.baserowId}
                                onChange={e => setConfig({ ...config, baserowId: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">ID do banco de dados no Baserow</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tableId">Table ID</Label>
                            <Input
                                id="tableId"
                                value={config.tableId}
                                onChange={e => setConfig({ ...config, tableId: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">ID da tabela de Leads</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 text-muted-foreground bg-muted/20 border-dashed">
                    <CardContent className="p-6 flex items-center justify-center text-sm">
                        Para alterar configurações sensíveis como senhas e tokens API, acesse diretamente o arquivo .env no servidor.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
