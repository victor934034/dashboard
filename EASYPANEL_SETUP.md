# Guia de Configuração no Easypanel

Para resolver o erro de "Service not reachable" e fazer o sistema abrir corretamente, você precisa ajustar os caminhos e as portas no painel do Easypanel.

## 1. Configuração do Frontend (`dashboard-frontend`)

1. Vá em **Settings** -> **Source** (ou Aba de Build/Github).
2. **Base Directory** (Diretório Base): `app`
3. **Dockerfile Path**: `Dockerfile`
4. Vá em **Networking** (ou Domínios).
5. **Internal Port** (Porta Interna): **3000**
6. **Save** e clique em **Deploy**.

## 2. Configuração do Backend (`dashboard_dashboard1`)

1. Vá em **Settings** -> **Source**.
2. **Base Directory** (Diretório Base): `br-dashboard/backend`
3. **Dockerfile Path**: `Dockerfile`
4. Vá em **General** (ou Environment).
5. Certifique-se que o serviço tem o nome exato: `dashboard_dashboard1`.
6. **Internal Port** (Porta Interna): **3000**
7. **Save** e clique em **Deploy**.

---

### Por que isso é necessário?
- **Base Directory**: Como o `Dockerfile` do front está dentro da pasta `app`, o Easypanel precisa entrar lá antes de tentar buildar. O mesmo vale para o backend.
- **Porta 3000**: Nós mudamos o código para rodar na porta 3000 para ser um padrão seu. O Easypanel tenta mandar o tráfego para a 80 por padrão, por isso o erro de "not reachable".

### Como testar
Após os deploys:
- **Site**: [https://dashboard-dashboard1.zdc13k.easypanel.host/](https://dashboard-dashboard1.zdc13k.easypanel.host/)
- **Status API**: [https://dashboard-dashboard1.zdc13k.easypanel.host/api/health](https://dashboard-dashboard1.zdc13k.easypanel.host/api/health)
