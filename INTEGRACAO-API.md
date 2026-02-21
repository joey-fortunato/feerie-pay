# Integração API Laravel — Feerie Pay

Este documento descreve a integração do frontend React com a API Laravel.

## Estrutura criada

```
feerie-pay/
├── api/
│   └── types.ts          # Tipos da API (ApiUser, ApiOrder, etc.)
├── contexts/
│   └── AuthContext.tsx   # Autenticação, token, logout
├── services/
│   ├── api.ts            # Cliente HTTP centralizado (Bearer, 401/403/422)
│   ├── authApi.ts        # login, logout, me, forgotPassword
│   ├── ordersApi.ts      # create, list
│   ├── productsApi.ts    # list, get, create, update, delete
│   └── usersApi.ts       # create, update, delete
```

## Configuração

### Variáveis de ambiente (`.env.local`)

```env
# Em desenvolvimento (com proxy Vite): não defina VITE_API_BASE_URL
# O frontend usa /api/v1 e o Vite faz proxy para http://localhost:8000

# Em produção (domínio diferente):
VITE_API_BASE_URL=https://api.seudominio.com/api/v1
```

### Proxy em desenvolvimento

O `vite.config.ts` inclui um proxy para `/api` → `http://localhost:8000`. Assim, em dev não há CORS: o browser envia para `localhost:3000/api/v1/...` e o Vite encaminha para o Laravel.

## Segurança

1. **Cookie httpOnly + Secure** — O token fica apenas no cookie, nunca em JavaScript. Ver `BACKEND-COOKIE-AUTH.md` para configurar o Laravel.
2. **401** — Cliente chama `logout()` automaticamente.
3. **403** — Erro de permissão exibido ao utilizador.
4. **422** — Erros de validação com `errors` por campo, exibidos nos formulários.
5. **HTTPS em produção** — Use sempre HTTPS para a API em produção.

## Uso nos componentes

### Autenticação

```tsx
import { useAuth } from '../contexts/AuthContext';

const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
```

### Chamadas à API

```tsx
import { ordersApi } from '../services/ordersApi';
import { ApiError } from '../services/api';

try {
  const { order, payment } = await ordersApi.create({
    name: 'Cliente',
    email: 'cliente@exemplo.com',
    product_id: '...',
    gateway: 'ekwanza',
  });
} catch (err) {
  if (err instanceof ApiError && err.status === 422) {
    // err.errors = { email: ['O campo email é obrigatório.'] }
  }
}
```

### Produtos (multipart/form-data)

```tsx
const formData = new FormData();
formData.append('name', 'Produto');
formData.append('price', '29.99');
formData.append('type', 'ebook');
formData.append('file', fileInput.files[0]);

await productsApi.create(formData);
```

## Próximos passos

1. **Checkout** — Integrar `ordersApi.create()` no `Checkout.tsx` em vez de chamar e-kwanza diretamente.
2. **Produtos** — Substituir dados mock por `productsApi.list()` e CRUD.
3. **Transações/Orders** — Usar `ordersApi.list()` para a lista de encomendas (admin).
4. **Team** — Usar `usersApi` para gestão de utilizadores.
5. **Esqueceu a senha** — Implementar fluxo com `authApi.forgotPassword` e página de reset.
