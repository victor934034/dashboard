# 🚀 Instalação e Configuração do n8n-MCP Server

## ✅ Status da Instalação

- ✅ **n8n-skills instaladas**: 7 skills em `.agent/skills/n8n-skills/`
- ✅ **EspoCRM skill criada**: `.agent/skills/espocrm-integration/`
- ✅ **MCP config criado**: `.agent/mcp_config.json`
- ⚠️ **n8n-mcp**: Já instalado globalmente (detectado)

## 📋 Configuração do MCP no Antigravity

### Passo 1: Localizar o arquivo de configuração

O arquivo de configuração do MCP no Antigravity está em:
```
C:\Users\escola\.gemini\antigravity\mcp_config.json
```

### Passo 2: Adicionar n8n-mcp ao MCP

Abra o arquivo `mcp_config.json` e adicione a seguinte configuração:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp@latest"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "https://vendas-n8n.zdc13k.easypanel.host/api/v1",
        "N8N_BASE_URL": "https://vendas-n8n.zdc13k.easypanel.host",
        "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1M2I2MTViMi1jMTRkLTQ3NmItODk4NC0zZWZhZjRlMzM2M2IiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5ODY2NTg1fQ.4Pglojh-LabHNTWsYO4R6KfmiYoZLreVhcbCtOzGaT0"
      }
    }
  }
}
```

### Passo 3: Obter a API Key do n8n

1. Acesse sua instância n8n: https://vendas-n8n.zdc13k.easypanel.host/
2. Faça login
3. Vá em **Settings** (Configurações)
4. Clique em **API**
5. Clique em **Create API Key** (Criar Chave API)
6. Copie a chave gerada
7. Cole no campo `N8N_API_KEY` do `mcp_config.json`

### Passo 4: Ativar o MCP Server

1. No Antigravity, clique nos **três pontos** `...` no canto superior direito
2. Clique em **MCP Servers**
3. Clique em **Manage MCP Servers**
4. Clique em **Refresh** para recarregar a configuração
5. Verifique se **n8n-mcp** aparece na lista com status ativo

## 🎯 Verificação da Instalação

Para verificar se tudo está funcionando, faça uma pergunta ao Antigravity:

```
"Pesquise nodes do n8n relacionados a webhook"
```

Se o MCP estiver configurado corretamente, você verá resultados da busca de nodes.

## 🛠️ Ferramentas Disponíveis

Com o n8n-MCP configurado, você terá acesso a 20 ferramentas:

### Ferramentas Core (Sempre Disponíveis)
1. `search_nodes` - Buscar nodes por palavra-chave
2. `get_node` - Obter informações detalhadas de um node
3. `validate_node` - Validar configuração de node
4. `validate_workflow` - Validar workflow completo
5. `search_templates` - Buscar templates de workflow
6. `get_template` - Obter detalhes de template
7. `tools_documentation` - Obter ajuda sobre ferramentas MCP

### Ferramentas de Gerenciamento n8n (Requer API Key)
8. `n8n_health_check` - Verificar status da instância
9. `n8n_list_workflows` - Listar todos os workflows
10. `n8n_get_workflow` - Obter workflow por ID
11. `n8n_create_workflow` - Criar novo workflow
12. `n8n_update_full_workflow` - Atualizar workflow completo
13. `n8n_update_partial_workflow` - Atualizar workflow incrementalmente
14. `n8n_delete_workflow` - Deletar workflow
15. `n8n_validate_workflow` - Validar workflow no n8n
16. `n8n_deploy_template` - Implantar template no n8n
17. `n8n_test_workflow` - Testar execução de workflow
18. `n8n_executions` - Gerenciar execuções de workflow
19. `n8n_autofix_workflow` - Corrigir erros comuns automaticamente
20. `n8n_workflow_versions` - Gerenciar versões de workflow

## 📚 Skills Instaladas

### n8n Skills (7 skills)
- **n8n Expression Syntax**: Sintaxe de expressões n8n
- **n8n MCP Tools Expert**: Guia de uso das ferramentas MCP
- **n8n Workflow Patterns**: 5 padrões arquiteturais
- **n8n Validation Expert**: Interpretação de erros
- **n8n Node Configuration**: Configuração de nodes
- **n8n Code JavaScript**: JavaScript em Code nodes
- **n8n Code Python**: Python em Code nodes

### Custom Skills
- **EspoCRM Integration**: Integração com EspoCRM CRM

## 🎓 Como Usar

### Exemplo 1: Buscar Nodes
```
"Encontre nodes do n8n para trabalhar com Google Sheets"
```

### Exemplo 2: Criar Workflow
```
"Crie um workflow n8n que recebe um webhook POST e salva os dados no Google Sheets"
```

### Exemplo 3: Validar Workflow
```
"Valide este workflow n8n: [cole o JSON do workflow]"
```

### Exemplo 4: Implantar Template
```
"Implante o template n8n ID 1234 na minha instância"
```

## 🔧 Solução de Problemas

### MCP Server Não Aparece
- Verifique se o arquivo `mcp_config.json` está no local correto
- Certifique-se de que o JSON está válido (sem erros de sintaxe)
- Reinicie o Antigravity

### Erro de Conexão com n8n
- Verifique se a URL do n8n está correta
- Confirme que a API Key está válida
- Teste o acesso ao n8n no navegador

### Skills Não Ativam
- Verifique se as skills estão em `.agent/skills/`
- Confirme que cada skill tem um arquivo `SKILL.md`
- Verifique o YAML frontmatter no início de cada SKILL.md

## 📖 Documentação Adicional

- **Guia Completo**: `Antigravity.md` (raiz do projeto)
- **Setup MCP**: `.agent/N8N_MCP_SETUP.md`
- **Skills n8n**: `.agent/skills/n8n-skills/`
- **Skill EspoCRM**: `.agent/skills/espocrm-integration/SKILL.md`

## 🎉 Próximos Passos

1. ✅ Configure a API Key no `mcp_config.json`
2. ✅ Ative o MCP Server no Antigravity
3. ✅ Teste com uma busca de nodes
4. ✅ Comece a criar workflows incríveis!

---

**Tudo pronto para criar workflows n8n de alta qualidade! 🚀**

## 📝 Notas Importantes

> [!IMPORTANT]
> Sempre teste workflows em ambiente de desenvolvimento antes de implantar em produção!

> [!WARNING]
> Nunca compartilhe sua API Key do n8n publicamente ou em repositórios Git!

> [!TIP]
> Use o comando `tools_documentation` para obter ajuda detalhada sobre qualquer ferramenta MCP.
