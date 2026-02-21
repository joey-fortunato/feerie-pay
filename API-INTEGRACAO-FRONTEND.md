# Documentação da API Feerie Pay — Integração Frontend

Este documento descreve de forma completa a API para permitir uma integração correta com o frontend.

---

## 1. Informações Gerais

| Item | Valor |
|------|-------|
| **Base URL** | `{dominio}/api/v1` |
| **Exemplo** | `https://api.exemplo.com/api/v1` ou `http://localhost:8000/api/v1` |
| **Content-Type** | `application/json` |
| **Autenticação** | Cookie httpOnly + Secure (Laravel Sanctum) |

---

## 2. Autenticação

### 2.1. Como autenticar (Cookie httpOnly + Secure)

O token é armazenado num **cookie** com flags `HttpOnly` e `Secure`:

- **HttpOnly** — JavaScript não consegue ler o cookie (proteção XSS)
- **Secure** — Cookie enviado apenas via HTTPS (em produção)

**Fluxo:**

1. **Login** → A API define o cookie na resposta. O browser armazena-o automaticamente.
2. **Requisições seguintes** → O browser envia o cookie em todas as chamadas ao domínio da API.

**Obrigatório no frontend:** usar `credentials: 'include'` (fetch) ou `withCredentials: true` (Axios):

```javascript
// Fetch
fetch('https://api.exemplo.com/api/v1/me', { credentials: 'include' });

// Axios
axios.get('/api/v1/me', { withCredentials: true });
```

**Alternativa:** Se o cliente enviar o token no header `Authorization: Bearer {token}`, também funciona (útil para apps nativos ou testes).

### 2.2. Rotas públicas vs protegidas

- **Públicas**: não exigem token (`login`, `orders`, `forgot-password`, `password/reset`).
- **Protegidas**: exigem token (`/me`, `logout`, produtos, utilizadores, listagem de orders).

### 2.3. Respostas de erro comuns

| Código | Situação | Exemplo de mensagem |
|--------|----------|---------------------|
| 401 | Token ausente ou inválido | `"Não autenticado."` |
| 403 | Sem permissão (ex: não-admin) | `"Não autorizado."` |
| 404 | Recurso não encontrado | `"Recurso não encontrado."` |
| 422 | Erros de validação | Objeto com `message` e `errors` |
| 429 | Rate limit excedido | `"Muitas tentativas. Aguarde antes de tentar novamente."` |

---

## 3. Endpoints

### 3.1. Autenticação

#### POST `/login`

Autentica o utilizador e define o cookie de autenticação na resposta.

**Rate limit:** 3 tentativas por minuto.

**Request:**
```json
{
  "email": "utilizador@exemplo.com",
  "password": "senha123"
}
```

**Response 200:** O token é enviado no **cookie** `feerie_token` (httpOnly, Secure). O corpo da resposta:

```json
{
  "message": "Login realizado com sucesso",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "user": {
    "id": "ulid",
    "name": "Nome",
    "email": "email@exemplo.com",
    "role": "admin"
  }
}
```

**Importante:** O token não vem no JSON. O frontend deve confiar no cookie e usar `credentials: 'include'` nas requisições.

**Response 401** — Mensagens específicas conforme o erro. O frontend deve mostrar `message` em destaque e pode usar `errors` para exibir junto aos campos:

- Email não encontrado ou inválido:
```json
{
  "message": "Email não encontrado ou inválido.",
  "errors": {
    "email": ["Email não encontrado ou inválido."]
  }
}
```

- Password incorreta (email existe):
```json
{
  "message": "Password incorreta.",
  "errors": {
    "password": ["Password incorreta."]
  }
}
```

**Response 422** (validação — campos vazios ou formato inválido):
```json
{
  "message": "O email é obrigatório.",
  "errors": {
    "email": ["O email é obrigatório."],
    "password": ["A password é obrigatória."]
  }
}
```

**Como exibir no frontend:**
- `response.data.message` → mensagem geral (toast, banner)
- `response.data.errors.email[0]` → erro no campo email
- `response.data.errors.password[0]` → erro no campo password

**Response 429 (rate limit — 3 tentativas/minuto):**
```json
{
  "message": "Muitas tentativas. Aguarde antes de tentar novamente."
}
```
O header `Retry-After` indica os segundos até poder tentar de novo. O frontend pode exibir um contador ou desativar o botão até o tempo indicado.

---

#### POST `/logout` 🔒

Encerra a sessão atual (invalida o token e remove o cookie).

**Autenticação:** Cookie enviado automaticamente ou header `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "message": "Desconectado com sucesso"
}
```

---

#### GET `/me` 🔒

Retorna os dados do utilizador autenticado.

**Autenticação:** Cookie enviado automaticamente ou header `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "user": {
    "id": "ulid",
    "name": "Nome",
    "email": "email@exemplo.com",
    "role": "admin"
  }
}
```

---

### 3.2. Recuperação de password

#### POST `/forgot-password`

Envia um link de redefinição de password para o email.

**Request:**
```json
{
  "email": "utilizador@exemplo.com"
}
```

**Response 200:**
```json
{
  "message": "Link enviado."
}
```

**Response 404:**
```json
{
  "message": "Email não encontrado."
}
```

---

#### POST `/password/reset`

Define uma nova password usando o token recebido por email.

**Request:**
```json
{
  "token": "token-do-email",
  "email": "utilizador@exemplo.com",
  "password": "novaSenha123",
  "password_confirmation": "novaSenha123"
}
```

**Regras:** `password` mínimo 8 caracteres, obrigatório `password_confirmation` igual.

**Response 200:**
```json
{
  "message": "Password definida com sucesso."
}
```

**Response 400:**
```json
{
  "message": "Token inválido ou expirado."
}
```

---

### 3.3. Orders (Encomendas)

#### POST `/orders` (público)

Cria uma nova encomenda. **Não requer autenticação.**

**Request:**
```json
{
  "name": "Nome do cliente",
  "email": "cliente@exemplo.com",
  "phone": "+244 999 999 999",
  "product_id": "ulid-do-produto",
  "coupon_code": "PROMO10",
  "gateway": "appypay"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | Sim | Nome do cliente |
| email | string (email) | Sim | Email do cliente |
| phone | string | Não | Telefone |
| product_id | string (ULID) | Sim | ID do produto (deve existir) |
| coupon_code | string | Não | Código do cupom de desconto |
| gateway | string | Sim | Valor: `appypay` ou `ekwanza` |

**Response 201:**
```json
{
  "order": {
    "id": "ulid",
    "customer_id": "ulid",
    "product_id": "ulid",
    "subtotal": "100.00",
    "discount_amount": "10.00",
    "total": "90.00",
    "status": "pending",
    "created_at": "2025-02-20T10:00:00.000000Z",
    "updated_at": "2025-02-20T10:00:00.000000Z"
  },
  "payment": {
    "id": "ulid",
    "order_id": "ulid",
    "gateway": "appypay",
    "amount": "90.00",
    "status": "pending",
    "created_at": "2025-02-20T10:00:00.000000Z"
  }
}
```

**Importante:** O frontend deve usar o `order.id` e os dados do `payment` para redirecionar o utilizador ao gateway de pagamento (AppyPay ou Ekwanza). O fluxo de pagamento externo é tratado pelos webhooks/callbacks desses gateways.

---

#### GET `/orders` 🔒 👑

Lista todas as encomendas (paginação). **Apenas admin.**

**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "data": [
    {
      "id": "ulid",
      "customer_id": "ulid",
      "product_id": "ulid",
      "subtotal": "100.00",
      "discount_amount": "0.00",
      "total": "100.00",
      "status": "pending",
      "customer": {
        "id": "ulid",
        "name": "Cliente",
        "email": "cliente@exemplo.com",
        "phone": "+244 999 999 999"
      },
      "product": {
        "id": "ulid",
        "name": "Produto X",
        "price": "100.00",
        "type": "ebook"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 50
  }
}
```

**Estados possíveis de `status`:** `pending`, `paid`, `failed`, `cancelled`, `refunded`

---

### 3.4. Produtos

Todos os endpoints de produtos exigem autenticação. Apenas **admin** pode criar, atualizar e apagar produtos.

#### GET `/products` 🔒

Lista produtos com paginação.

**Response 200:**
```json
{
  "data": [
    {
      "id": "ulid",
      "name": "E-book Exemplo",
      "description": null,
      "price": "29.99",
      "type": "ebook",
      "file_path": "products/xxxx.pdf",
      "external_link": null,
      "instructions": null,
      "status": null
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 10
  }
}
```

**Tipos de produto:** `ebook`, `course`, `file`, `service`

---

#### GET `/products/{id}` 🔒

Detalhe de um produto.

**Response 200:** Objeto do produto (como no array acima).

---

#### POST `/products` 🔒 👑

Cria um produto. **Apenas admin.**

**Request:** `multipart/form-data` (por causa do ficheiro)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string (max 255) | Sim | Nome do produto |
| price | numeric (≥ 0) | Sim | Preço |
| type | string | Sim | `ebook`, `course`, `file` ou `service` |
| file | file (max 10MB) | Se type=ebook ou file | Ficheiro do produto |
| external_link | url | Se type=course | URL do curso externo |
| instructions | string | Se type=service | Instruções do serviço |

**Exemplo (form-data):**
- `name`: "Meu E-book"
- `price`: 19.99
- `type`: ebook
- `file`: [ficheiro PDF]

**Response 201:** Objeto do produto criado.

---

#### PUT/PATCH `/products/{id}` 🔒 👑

Atualiza um produto. **Apenas admin.**

**Request:** `multipart/form-data` — todos os campos opcionais (`sometimes`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string (max 255) | Nome |
| price | numeric (≥ 0) | Preço |
| type | string | `ebook`, `course`, `file`, `service` |
| file | file (max 10MB) | Novo ficheiro (substitui o anterior) |
| external_link | url | Link externo |
| instructions | string | Instruções |

**Response 200:** Objeto do produto atualizado.

---

#### DELETE `/products/{id}` 🔒 👑

Apaga um produto. **Apenas admin.**

**Response 204:** Sem corpo (sucesso).

---

#### GET `/products/{id}/download` 🔒

Faz download do ficheiro do produto (se existir).

**Response:** Stream do ficheiro (Content-Disposition: attachment).

**Nota:** No frontend, use um link ou `window.open()` com o token no header, ou uma requisição que trate o blob para download. O ficheiro só existe para tipos `ebook` e `file`; para `course` e `service` pode retornar 404.

---

### 3.5. Utilizadores (Admin)

Todos exigem autenticação e **role admin**.

#### POST `/users` 🔒 👑

Cria um utilizador. Uma password temporária é gerada e um link para definição de password é enviado por email.

**Request:**
```json
{
  "name": "Novo Utilizador",
  "email": "novo@exemplo.com",
  "role": "editor"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string (max 255) | Sim | Nome |
| email | string (email) | Sim | Email único |
| role | string | Sim | `admin`, `editor` ou `viewer` |

**Response 201:**
```json
{
  "message": "Utilizador criado. Email para definir password enviado."
}
```

---

#### PUT/PATCH `/users/{id}` 🔒 👑

Atualiza um utilizador.

**Request:**
```json
{
  "name": "Nome Atualizado",
  "email": "novoemail@exemplo.com",
  "role": "admin"
}
```

Todos os campos são opcionais.

**Response 200:**
```json
{
  "message": "Utilizador atualizado com sucesso.",
  "data": {
    "id": "ulid",
    "name": "Nome",
    "email": "email@exemplo.com",
    "role": "admin"
  }
}
```

---

#### DELETE `/users/{id}` 🔒 👑

Apaga um utilizador. Não é possível apagar a própria conta.

**Response 200:**
```json
{
  "message": "Utilizador apagado com sucesso."
}
```

**Response 403:**
```json
{
  "message": "Não pode apagar a sua própria conta."
}
```

---

### 3.6. Admin

#### GET `/admin` 🔒 👑

Rota de teste para verificar acesso admin.

**Response 200:**
```json
{
  "message": "Área restrita a administradores.",
  "user": { /* objeto do utilizador */ }
}
```

---

## 4. Erros de validação (422)

Quando a validação falha, a API retorna:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["O campo email é obrigatório."],
    "gateway": ["O gateway selecionado é inválido."]
  }
}
```

O frontend deve exibir `errors` por campo para feedback ao utilizador.

---

## 5. IDs (ULID)

Todos os IDs principais (Order, Product, User, Customer, Payment) usam **ULID** em vez de inteiros:

- Exemplo: `01ARZ3NDEKTSV4RRFFQ69G5FAV`
- Sempre string, nunca número
- Útil para URLs e referências externas sem expor sequências

---

## 6. Resumo de permissões

| Rota | Autenticado | Admin |
|------|-------------|-------|
| POST /login | Não | — |
| POST /logout | Sim | Não |
| GET /me | Sim | Não |
| POST /forgot-password | Não | — |
| POST /password/reset | Não | — |
| POST /orders | Não | — |
| GET /orders | Sim | Sim |
| GET /products | Sim | Não |
| GET /products/{id} | Sim | Não |
| GET /products/{id}/download | Sim | Não |
| POST /products | Sim | Sim |
| PUT/PATCH /products/{id} | Sim | Sim |
| DELETE /products/{id} | Sim | Sim |
| POST /users | Sim | Sim |
| PUT/PATCH /users/{id} | Sim | Sim |
| DELETE /users/{id} | Sim | Sim |
| GET /admin | Sim | Sim |

---

## 7. Fluxo recomendado no frontend

1. **Login** → Usar `credentials: 'include'`. O cookie é definido pelo servidor e guardado automaticamente pelo browser.
2. **Guardar `user`** → Armazenar os dados do utilizador em estado (ex: React Context, Zustand, Pinia) para uso na UI.
3. **Requisições protegidas** → Usar `credentials: 'include'` ou `withCredentials: true`. O cookie é enviado automaticamente.
4. **401** → Redirecionar para login (o cookie foi invalidado ou expirou).
5. **403** → Mostrar mensagem de falta de permissão.
6. **Criar order** → Usar `order` e `payment` para integrar com AppyPay/Ekwanza (URLs de checkout fornecidas pelos gateways).
7. **Produtos com ficheiro** → Para download, usar endpoint com credenciais e tratar resposta como blob/ficheiro.

---

## 8. CORS e cookies

A API tem `supports_credentials: true` ativado. O frontend deve estar em `allowed_origins` do `config/cors.php`. O domínio do cookie pode ser configurado em `AUTH_COOKIE_DOMAIN` (ex: `.exemplo.com` para partilhar entre `app.exemplo.com` e `api.exemplo.com`).

---

**Última atualização:** fevereiro 2025
