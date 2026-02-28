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

### 2.2. Níveis de acesso (roles)

A API devolve o `role` do utilizador em `/login` e `/me`. O frontend deve usar este valor para mostrar ou ocultar funcionalidades.

| Código | Valor API | Descrição |
|--------|-----------|-----------|
| **A** | `admin` | **Administrador** — Acesso total: financeiro, configurações, equipe e saques. |
| **E** | `editor` | **Editor** — Pode editar produtos, cupons e ver clientes. Sem acesso financeiro. |
| **V** | `viewer` | **Visualizador** — Apenas visualização. Ideal para suporte nível 1. |

**Exemplo no frontend:**
```javascript
const { user } = await api.get('/me');

// Permissões por role
const canEditProducts = ['admin', 'editor'].includes(user.role);
const canViewOrders = user.role === 'admin';           // Financeiro
const canManageTeam = user.role === 'admin';           // Utilizadores
const canManageCustomers = user.role === 'admin';      // CRUD clientes
const canViewCustomers = ['admin', 'editor', 'viewer'].includes(user.role);
const isViewerOnly = user.role === 'viewer';
```

### 2.3. Rotas públicas vs protegidas

- **Públicas**: não exigem token (`login`, `orders`, `forgot-password`, `password/reset`).
- **Protegidas**: exigem token (`/me`, `logout`, produtos, clientes, utilizadores, listagem de pedidos).

### 2.4. Respostas de erro comuns

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

### 3.3. Orders (Pedidos) e Payments (Transações)

#### Estrutura de páginas no frontend

O sistema terá **duas páginas distintas**:

| Página | Fonte de dados | Foco |
|--------|----------------|------|
| **Pedidos** | `GET /orders` (Order) | O que foi comprado: cliente, produto, total, estado do pedido. Visão comercial. |
| **Transações** | payments (via `order.payments` ou endpoint dedicado) | Movimento financeiro: gateway, valor, status, datas. Visão financeira. |

**Exemplo:** Um pedido #123 pode ter 2 transações (1ª falhou no AppyPay, 2ª sucedeu no Ekwanza). Na página **Pedidos** mostra-se o pedido como "Pago". Na página **Transações** mostram-se as duas tentativas com o respetivo resultado.

#### Diferença entre Order (Pedido) e Payment (Transação)

| Conceito | Order (Pedido) | Payment (Transação) |
|----------|----------------|---------------------|
| **O que representa** | O pedido de compra (o quê, quem, quanto) | A tentativa de pagamento (como, onde, resultado) |
| **Exemplo** | "Cliente X quer comprar Produto Y por 90€" | "Pagamento via AppyPay, pendente" |
| **Dados principais** | customer, product, subtotal, desconto, total, status | order_id, gateway, amount, status |
| **Relacionamento** | 1 pedido → N transações | 1 transação → 1 pedido |
| **Estados** | pending, processing, paid, failed, cancelled, refunded, expired | pending, processing, paid, failed, cancelled, expired |

**Resumo:**
- **Order (Pedido)** = A compra em si (o que o cliente quer). Um pedido pode ter várias transações (ex.: tentativa 1 falhou, tentativa 2 sucedeu).
- **Payment (Transação)** = O movimento financeiro num gateway (GPO, REF ou E-Kwanza Ticket). Pode estar ligado a um pedido (`order_id` preenchido) ou ser **standalone** (`order_id` null) — links de pagamento com valor livre. O campo `gateway` pode ser: `gpo`, `ref`, `ekwanza_ticket`.

#### Estrutura completa — `Order` (base de dados)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string (ULID) | ID único do pedido |
| customer_id | string (ULID) | ID do cliente |
| product_id | string (ULID) | ID do produto |
| subtotal | decimal | Valor antes do desconto |
| discount_amount | decimal | Valor do desconto aplicado |
| total | decimal | Valor final a pagar |
| currency | string | Moeda (ex: AOA) |
| status | string | `pending`, `processing`, `paid`, `failed`, `cancelled`, `refunded`, `expired` |
| paid_at | datetime\|null | Data/hora em que foi pago |
| created_at | datetime | Data de criação |
| updated_at | datetime | Data de atualização |

**Relações carregadas em `GET /orders`:** `customer`, `product`, `payments`

#### Estrutura completa — `Payment` (base de dados)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string (ULID) | ID único do pagamento |
| order_id | string (ULID)\|null | ID do pedido (null se standalone) |
| gateway | string | `gpo`, `ref` ou `ekwanza_ticket` |
| merchant_transaction_id | string | ID único da transação (15 chars alfanuméricos) |
| gateway_transaction_id | string\|null | ID da transação no gateway |
| gateway_code | string\|null | Código do ticket (E-Kwanza) ou referência (REF) |
| gateway_reference | string\|null | **REF:** entidade + referência (ex: "10111 180162314") |
| status | string | `pending`, `processing`, `paid`, `failed`, `cancelled`, `expired` |
| amount | decimal | Valor a cobrar |
| currency | string | Moeda (ex: AOA) |
| description | string\|null | Descrição opcional do pagamento |
| payload | object\|null | Dados auxiliares |
| raw_response | object\|null | Resposta completa do gateway |
| paid_at | datetime\|null | Data/hora do pagamento (quando status=paid) |
| expires_at | datetime\|null | Data limite (QR Ticket, REF) |
| created_at | datetime | Data de criação |
| updated_at | datetime | Data de atualização |

#### Como mostrar no frontend

| Contexto | O que mostrar | Fonte |
|----------|---------------|-------|
| **Página Pedidos** | Status do pedido, total, cliente, produto | `order.status`, `order.total`, `order.customer` |
| **Detalhe do pedido** | Toda a info do pedido + histórico de transações | `order` + `order.payments` |
| **Página Transações** | Transações por gateway, valores, datas, status | `order.payments` em cada order |
| **Checkout (após criar)** | Exibir QR (Ticket), referência (REF) ou mensagem (GPO) usando `gateway_response` | `payment` + `gateway_response` de POST /orders ou POST /payments |

**Sugestão de labels na UI:**
- **Order** → "Pedido", "#PED-{short_id}"
- **Payment** → "Transação", "Pagamento"
- Status order `pending` + payment `pending` ou `processing` → "A aguardar pagamento"
- Status order `paid` → "Pago" (mostrar data em `order.paid_at`)

---

#### POST `/orders` (público)

Cria um novo pedido e inicia o pagamento no gateway escolhido. **Não requer autenticação.**

**Request:**
```json
{
  "name": "Nome do cliente",
  "email": "cliente@exemplo.com",
  "phone": "+244 999 999 999",
  "product_id": "ulid-do-produto",
  "coupon_code": "PROMO10",
  "payment_method": "ekwanza_ticket",
  "phone_number": "+244 900 123 456",
  "mobile_number": "900123456"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | Sim | Nome do cliente |
| email | string (email) | Sim | Email do cliente |
| phone | string (max 50) | Sim | Telefone do cliente |
| product_id | string (ULID) | Sim | ID do produto (deve existir) |
| coupon_code | string | Não | Código do cupom de desconto |
| payment_method | string | Sim | `gpo` (Multicaixa Express), `ref` (EMIS) ou `ekwanza_ticket` (QR E-Kwanza) |
| phone_number | string (max 50) | Sim se `payment_method=gpo` | Telefone para push Multicaixa Express (formato: +244 9XX XXX XXX) |
| mobile_number | string (max 50) | Sim se `payment_method=ekwanza_ticket` | Número para associação ao ticket E-Kwanza (apenas dígitos, ex: 900123456) |

**Regras de validação:**
- `phone_number` obrigatório quando `payment_method` = `gpo`
- `mobile_number` obrigatório quando `payment_method` = `ekwanza_ticket`
- `ref` não requer `phone_number` nem `mobile_number`

**Response 201:**
```json
{
  "order": { "id": "...", "customer_id": "...", "product_id": "...", "subtotal": "100.00", "discount_amount": "10.00", "total": "90.00", "currency": "AOA", "status": "pending", "paid_at": null, "created_at": "...", "updated_at": "..." },
  "payment": {
    "id": "ulid",
    "order_id": "ulid",
    "gateway": "ekwanza_ticket",
    "merchant_transaction_id": "ABC12XYZ3456789",
    "gateway_transaction_id": null,
    "gateway_code": null,
    "gateway_reference": null,
    "status": "processing",
    "amount": "90.00",
    "currency": "AOA",
    "description": null,
    "raw_response": { "Code": "...", "QRCode": "data:image/png;base64,...", "ExpirationDate": "..." },
    "paid_at": null,
    "expires_at": "2025-02-20T10:15:00.000000Z",
    "created_at": "...",
    "updated_at": "..."
  },
  "gateway_response": { "Code": "...", "QRCode": "data:image/png;base64,...", "ExpirationDate": "..." }
}
```

**Importante:** O objeto `payment` contém todos os campos da base de dados (ver *Estrutura completa — Payment* na secção 3.3). Use `payment.gateway_reference`, `payment.expires_at`, `payment.raw_response` conforme o método. O `gateway_response` é a resposta bruta do gateway; a estrutura varia — ver secção **4. Gateways de Pagamento**.

**Páginas no frontend:** Usar dados dos pedidos na página **Pedidos** e dados das transações (`payments`) na página **Transações**.

---

#### POST `/payments` (público) — Links de pagamento (valor livre)

Cria um pagamento **standalone** (sem produto nem pedido). Ideal para links de pagamento com valor definido livremente (ex.: doações, pagamentos por referência, QR com valor custom).

**Não requer autenticação.**

**Request:**
```json
{
  "amount": 5000,
  "currency": "AOA",
  "payment_method": "ekwanza_ticket",
  "mobile_number": "900123456",
  "description": "Pagamento de serviço X"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| amount | number | Sim | Valor a cobrar (mínimo 1) |
| currency | string (3 chars) | Não | `AOA`, `USD`, `EUR` (default: `AOA`) |
| payment_method | string | Sim | `gpo`, `ref` ou `ekwanza_ticket` |
| phone_number | string (max 50) | Sim se `payment_method=gpo` | Telefone para Multicaixa Express |
| mobile_number | string (max 50) | Sim se `payment_method=ekwanza_ticket` | Número para E-Kwanza Ticket (QR) |
| description | string (max 500) | Não | Descrição do pagamento (para referência) |

**Response 201:**
```json
{
  "payment": {
    "id": "ulid",
    "order_id": null,
    "gateway": "ekwanza_ticket",
    "merchant_transaction_id": "ulid",
    "amount": "5000.00",
    "currency": "AOA",
    "description": "Pagamento de serviço X",
    "status": "processing",
    "expires_at": "2025-02-20T10:15:00.000000Z",
    "created_at": "2025-02-20T10:00:00.000000Z"
  },
  "gateway_response": { }
}
```

**Diferença para POST /orders:** Não há `order` na resposta. Use `payment.id` e `gateway_response` da mesma forma para exibir QR, referência ou mensagem de aprovação.

---

#### GET `/payments/{id}` (público) — Consultar status

Retorna o pagamento e o seu status atual. Útil para **polling** na página de checkout (ex.: a cada 5–10 segundos até `status` ser `paid`, `failed`, `cancelled` ou `expired`).

**Request:** `GET /api/v1/payments/{payment_id}`

**Response 200:**
```json
{
  "payment": {
    "id": "ulid",
    "order_id": null,
    "gateway": "ekwanza_ticket",
    "merchant_transaction_id": "ABC12XYZ3456789",
    "gateway_transaction_id": null,
    "gateway_code": null,
    "gateway_reference": null,
    "status": "paid",
    "amount": "5000.00",
    "currency": "AOA",
    "description": null,
    "raw_response": { },
    "paid_at": "2025-02-20T10:05:00.000000Z",
    "expires_at": "2025-02-20T10:15:00.000000Z",
    "created_at": "...",
    "updated_at": "...",
    "order": null
  }
}
```

O objeto `payment` inclui todos os campos da base de dados (`gateway_reference`, `raw_response`, `expires_at`, etc.). Para pagamentos com pedido associado, `order` virá preenchido.

---

#### GET `/orders` 🔒 👑

Lista todos os pedidos (paginação). **Apenas admin.**

**Headers:** `Authorization: Bearer {token}`

**Response 200:** Cada pedido inclui `customer`, `product` e `payments` (lista completa de transações). **O frontend deve usar todos os campos abaixo** para exibir as informações corretas.

```json
{
  "data": [
    {
      "id": "01HXYZ1234567890ABCDEFGHIJ",
      "customer_id": "01HXYZ1234567890ABCDEFGHIJ",
      "product_id": "01HXYZ1234567890ABCDEFGHIJ",
      "subtotal": "100.00",
      "discount_amount": "0.00",
      "total": "100.00",
      "currency": "AOA",
      "status": "pending",
      "paid_at": null,
      "created_at": "2025-02-20T10:00:00.000000Z",
      "updated_at": "2025-02-20T10:00:00.000000Z",
      "customer": {
        "id": "01HXYZ1234567890ABCDEFGHIJ",
        "name": "Cliente",
        "email": "cliente@exemplo.com",
        "phone": "+244 999 999 999"
      },
      "product": {
        "id": "01HXYZ1234567890ABCDEFGHIJ",
        "name": "Produto X",
        "price": "100.00",
        "type": "ebook",
        "description": null,
        "cover_image_url": "http://localhost/storage/products/covers/xxxx.jpg"
      },
      "payments": [
        {
          "id": "01HXYZ1234567890ABCDEFGHIJ",
          "order_id": "01HXYZ1234567890ABCDEFGHIJ",
          "gateway": "ref",
          "merchant_transaction_id": "ABC12XYZ3456789",
          "gateway_transaction_id": "transacao-appypay-id",
          "gateway_code": "180162314",
          "gateway_reference": "10111 180162314",
          "status": "pending",
          "amount": "100.00",
          "currency": "AOA",
          "description": null,
          "raw_response": {
            "id": "transacao-appypay-id",
            "responseStatus": {
              "reference": {
                "entity": "10111",
                "referenceNumber": "180162314",
                "dueDate": "2025-02-25T23:59:59.000Z"
              }
            }
          },
          "paid_at": null,
          "expires_at": "2025-02-25T23:59:59.000000Z",
          "created_at": "2025-02-20T10:00:00.000000Z",
          "updated_at": "2025-02-20T10:00:00.000000Z"
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 50
  }
}
```

**Importante para o frontend:** use os campos da base de dados em primeiro lugar. Para **REF**, exiba `payment.gateway_reference` (ex: "10111 180162314") e `payment.expires_at`. Para **Ticket**, use `payment.raw_response.QRCode` e `payment.expires_at`. O `raw_response` contém a resposta completa do gateway e pode ser usado como alternativa.

**Estados possíveis de `status` (Order):** `pending`, `processing`, `paid`, `failed`, `cancelled`, `refunded`, `expired`

---

### 3.4. Produtos

Todos os endpoints de produtos exigem autenticação. Apenas **admin** pode criar, atualizar e apagar produtos.

#### GET `/products` 🔒

Lista produtos com paginação.

**Query params:**

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| page | int | 1 | Página atual |
| per_page | int | 15 | Itens por página (máx. 50) |

**Exemplo:** `GET /products?page=2&per_page=20`

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
      "cover_image_path": "products/covers/xxxx.jpg",
      "cover_image_url": "http://localhost/storage/products/covers/xxxx.jpg",
      "external_link": null,
      "instructions": null,
      "status": null
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 10,
    "last_page": 1,
    "from": 1,
    "to": 10
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": null
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
| description | string (max 5000) | Não | Descrição do produto |
| price | numeric (≥ 0) | Sim | Preço |
| type | string | Sim | `ebook`, `course`, `file` ou `service` |
| file | file (max 10MB) | Se type=ebook ou file | Ficheiro do produto |
| cover_image | file (max 2MB) | Não | Imagem de capa. Recomendado: 1000×1500px. Formatos: JPG, PNG |
| external_link | url | Se type=course | URL do curso externo |
| instructions | string | Se type=service | Instruções do serviço |

**Exemplo (form-data):**
- `name`: "Meu E-book"
- `price`: 19.99
- `type`: ebook
- `file`: [ficheiro PDF]
- `cover_image`: [imagem JPG ou PNG, máx 2MB]

**Response 201:** Objeto do produto criado.

---

#### PUT/PATCH `/products/{id}` 🔒 👑

Atualiza um produto. **Apenas admin.**

**Request:** `multipart/form-data` — todos os campos opcionais (`sometimes`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string (max 255) | Nome |
| description | string (max 5000) | Descrição |
| price | numeric (≥ 0) | Preço |
| type | string | `ebook`, `course`, `file`, `service` |
| file | file (max 10MB) | Novo ficheiro (substitui o anterior) |
| cover_image | file (max 2MB) | Imagem de capa. JPG ou PNG. Recomendado: 1000×1500px |
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

### 3.5. Cupons (Coupons)

Exigem autenticação. **Admin** e **Editor** podem criar, atualizar e apagar cupons. **Viewer** pode listar e ver detalhe.

#### GET `/coupons` 🔒

Lista cupons com paginação.

**Query params:**

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| page | int | 1 | Página atual |
| per_page | int | 15 | Itens por página (máx. 50) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "ulid",
      "code": "PROMO10",
      "type": "percentage",
      "value": "10.00",
      "usage_limit": 100,
      "used_count": 5,
      "expires_at": "2025-12-31T23:59:59.000000Z",
      "is_active": true,
      "created_at": "2025-02-20T10:00:00.000000Z",
      "updated_at": "2025-02-20T10:00:00.000000Z"
    }
  ],
  "meta": { "current_page": 1, "per_page": 15, "total": 10, "last_page": 1 },
  "links": { "first": "...", "last": "...", "prev": null, "next": null }
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| code | string | Código do cupom (ex: PROMO10). Normalizado em maiúsculas |
| type | string | `percentage` ou `fixed` |
| value | decimal | Valor: % (0–100) ou valor fixo em moeda |
| usage_limit | int\|null | Número máximo de usos; null = ilimitado |
| used_count | int | Quantidade de vezes já usado (incrementa quando pedido é pago) |
| expires_at | datetime\|null | Data de expiração; null = sem expiração |
| is_active | bool | Se o cupom está ativo |

---

#### GET `/coupons/{id}` 🔒

Detalhe de um cupom.

---

#### POST `/coupons` 🔒 👑

Cria um cupom.

**Request:**
```json
{
  "code": "PROMO10",
  "type": "percentage",
  "value": 10,
  "usage_limit": 100,
  "expires_at": "2025-12-31T23:59:59",
  "is_active": true
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| code | string (max 50) | Sim | Código único. Convertido em maiúsculas |
| type | string | Sim | `percentage` ou `fixed` |
| value | number | Sim | Valor: % (0–100) para percentage, valor fixo para fixed |
| usage_limit | int | Não | Limite de usos; null = ilimitado |
| expires_at | datetime | Não | Data de expiração; deve ser futura |
| is_active | bool | Não | Default: true |

**Response 201:** Objeto do cupom criado.

---

#### PUT/PATCH `/coupons/{id}` 🔒 👑

Atualiza um cupom. Todos os campos são opcionais.

---

#### DELETE `/coupons/{id}` 🔒 👑

Apaga um cupom.

**Response 204:** Sem conteúdo.

**Nota:** O cupom pode ser apagado mesmo que já tenha sido usado. O histórico de pedidos mantém `coupon_id`; a relação fica órfã (null on delete na FK).

---

#### GET `/coupons/validate` (público) — Validação para preview no checkout

Valida um cupom e retorna o desconto calculado. **Não requer autenticação.** Permite ao frontend mostrar o desconto antes do utilizador clicar em "Pagar".

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| code | string | Código do cupom (ex: PROMO10) |
| amount | number | Valor subtotal em Kz (ex: 25000) |

**Response 200 (válido):**
```json
{
  "valid": true,
  "discount_amount": 2500,
  "type": "percentage",
  "value": 10
}
```

**Response 200 (inválido):**
```json
{
  "valid": false,
  "message": "Cupom inválido ou expirado."
}
```

**Nota:** Endpoint opcional. Se não existir, o frontend envia `coupon_code` no POST /orders e o backend valida na criação do pedido. Em caso de cupom inválido, o backend retorna 422 com mensagem apropriada.

---

### 3.6. Clientes (Customers) 👑

Todos exigem autenticação e **role admin**.

#### GET `/customers` 🔒 👑

Lista clientes com paginação.

**Query params:**

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| page | int | 1 | Página atual |
| per_page | int | 15 | Itens por página (máx. 50) |

**Exemplo:** `GET /customers?page=1&per_page=20`

**Response 200:**
```json
{
  "data": [
    {
      "id": "ulid",
      "name": "Nome do Cliente",
      "email": "cliente@exemplo.com",
      "phone": "+244 999 999 999",
      "status": "active",
      "orders_count": 3,
      "created_at": "2025-02-20T10:00:00.000000Z",
      "updated_at": "2025-02-20T10:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 50,
    "last_page": 4,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

**Estados possíveis de `status`:** `active`, `inactive`, `blocked`

---

#### GET `/customers/{id}` 🔒 👑

Detalhe de um cliente, incluindo os últimos 10 pedidos do cliente.

**Response 200:**
```json
{
  "id": "ulid",
  "name": "Nome do Cliente",
  "email": "cliente@exemplo.com",
  "phone": "+244 999 999 999",
  "status": "active",
  "orders": [
    {
      "id": "ulid",
      "customer_id": "ulid",
      "product_id": "ulid",
      "subtotal": "100.00",
      "total": "100.00",
      "status": "pending"
    }
  ],
  "created_at": "2025-02-20T10:00:00.000000Z",
  "updated_at": "2025-02-20T10:00:00.000000Z"
}
```

---

#### POST `/customers` 🔒 👑

Cria um cliente.

**Request:**
```json
{
  "name": "Nome do Cliente",
  "email": "cliente@exemplo.com",
  "phone": "+244 999 999 999",
  "status": "active"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string (max 255) | Sim | Nome do cliente |
| email | string (email) | Sim | Email único |
| phone | string (max 50) | Sim | Telefone único |
| status | string | Não | `active`, `inactive` ou `blocked` |

**Response 201:**
```json
{
  "id": "ulid",
  "name": "Nome do Cliente",
  "email": "cliente@exemplo.com",
  "phone": "+244 999 999 999",
  "status": "active",
  "created_at": "2025-02-20T10:00:00.000000Z",
  "updated_at": "2025-02-20T10:00:00.000000Z"
}
```

---

#### PUT/PATCH `/customers/{id}` 🔒 👑

Atualiza um cliente.

**Request:**
```json
{
  "name": "Nome Atualizado",
  "email": "novoemail@exemplo.com",
  "phone": "+244 888 888 888",
  "status": "inactive"
}
```

Todos os campos são opcionais.

**Response 200:**
```json
{
  "message": "Cliente atualizado com sucesso.",
  "data": {
    "id": "ulid",
    "name": "Nome Atualizado",
    "email": "novoemail@exemplo.com",
    "phone": "+244 888 888 888",
    "status": "inactive",
    "created_at": "2025-02-20T10:00:00.000000Z",
    "updated_at": "2025-02-21T12:00:00.000000Z"
  }
}
```

---

#### DELETE `/customers/{id}` 🔒 👑

Apaga um cliente. **Não é possível apagar** um cliente que tenha pedidos associados.

**Response 200:**
```json
{
  "message": "Cliente apagado com sucesso."
}
```

**Response 422:**
```json
{
  "message": "Não é possível apagar um cliente com pedidos associados."
}
```

---

### 3.7. Utilizadores (Admin)

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

### 3.8. Admin

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

## 4. Gateways de Pagamento (E-Kwanza / AppyPay)

A API integra três métodos de pagamento via E-Kwanza e Gateway App Pay (AppyPay).

**Documentação oficial AppyPay:**
- [Autenticação](https://appypay.stoplight.io/docs/appypay-payment-gateway/pfpvnxk9d44h2-appy-pay-authentication)
- [Get a token](https://appypay.stoplight.io/docs/appypay-payment-gateway/73a20f59c9d9d-get-a-token)
- [Post a Charge](https://appypay.stoplight.io/docs/appypay-payment-gateway/62b060530d899-post-a-charge)
- [Get all charges](https://appypay.stoplight.io/docs/appypay-payment-gateway/a295158c1a7db-get-all-charges) | [Get all charges (alt)](https://appypay.stoplight.io/docs/appypay-payment-gateway/vjru3853j010m-get-all-charges)
- [Get a charge](https://appypay.stoplight.io/docs/appypay-payment-gateway/b72da81707c4b-get-a-charge)
- [**Lista de erros**](https://appypay.stoplight.io/docs/appypay-payment-gateway/0xz2op2epwc6t-errors) — códigos de erro e possíveis soluções

### 4.1. Visão geral dos métodos

| payment_method | Nome | Descrição | Campos extra no request |
|----------------|------|-----------|-------------------------|
| `gpo` | Multicaixa Express | Push no telemóvel do cliente; aprovação na app Multicaixa | `phone_number` (obrigatório) |
| `ref` | EMIS (Referência) | Gera referência para pagamento em ATM/terminal | — |
| `ekwanza_ticket` | E-Kwanza QR Ticket | QR Code para pagar na app E-Kwanza | `mobile_number` (obrigatório) |

### 4.2. Estrutura de `gateway_response` por método

#### GPO (Multicaixa Express)

O cliente recebe um push na app Multicaixa Express e aprova o pagamento no telemóvel. O `gateway_response` contém a resposta do AppyPay (IDs, status, etc.).

**Exemplo de `gateway_response`:**
```json
{
  "id": "transacao-appypay-id",
  "merchantTransactionId": "ulid",
  "status": "...",
  "amount": 90.00,
  "currency": "AOA"
}
```

**O que mostrar no frontend:**
- Mensagem: "Aguardando aprovação no Multicaixa Express no seu telemóvel."
- Instrução: "Abra a app Multicaixa Express e confirme o pagamento."
- O status é atualizado automaticamente via webhook quando o cliente aprovar ou rejeitar.

---

#### REF (EMIS Referência)

Gera uma referência multibanco. O cliente pode pagar em ATM ou em terminais de pagamento. O pagamento pode ser efetuado horas ou dias depois.

**Exemplo de `gateway_response` (AppyPay):**
```json
{
  "id": "transacao-appypay-id",
  "merchantTransactionId": "ABC12XYZ3456789",
  "status": "pending",
  "amount": 90.00,
  "currency": "AOA",
  "responseStatus": {
    "reference": {
      "entity": "10111",
      "referenceNumber": "180162314",
      "dueDate": "2025-02-25T23:59:59.000Z"
    }
  }
}
```

| Campo (responseStatus.reference) | Tipo | Descrição |
|---------------------------------|------|-----------|
| entity | string | Código da entidade (ex: 10111) |
| referenceNumber | string | Referência de pagamento (ex: 180162314) |
| dueDate | string (ISO 8601) | Data limite para pagar |

**Campos guardados no Payment (base de dados):**
- `gateway_reference` = entidade + referência (ex: "10111 180162314") — **usar este para exibir**
- `gateway_code` = referenceNumber
- `expires_at` = dueDate convertida

**O que mostrar no frontend:**
- Exibir `payment.gateway_reference` em destaque (ou `gateway_response.responseStatus.reference.entity` + `referenceNumber`).
- Instrução: "Pague em qualquer ATM ou terminal com a referência acima."
- Mostrar `payment.expires_at` formatado (ex: "Válido até 25/02/2025 23:59").
- O status é atualizado automaticamente via webhook quando o pagamento for confirmado.

---

#### E-Kwanza Ticket (QR Code)

Cria um QR Code para o cliente escanear na app E-Kwanza. O `gateway_response` inclui o código e a imagem em base64.

**Exemplo de `gateway_response`:**
```json
{
  "Code": "TICKET_CODE_123",
  "QRCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "ExpirationDate": "2025-02-20T10:15:00.000Z"
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Code | string | Código interno do ticket (para reconciliação) |
| QRCode | string | Imagem do QR Code em **base64** (pode incluir ou não o prefixo `data:image/png;base64,`) |
| ExpirationDate | string (ISO 8601) | Data/hora de expiração do ticket |

**Como exibir o QR no frontend:**

```html
<!-- Opção 1: se o QRCode já vier com data URI -->
<img src="gateway_response.QRCode" alt="QR Code para pagamento" />

<!-- Opção 2: se vier só o base64 puro -->
<img src="data:image/png;base64,{{ gateway_response.QRCode }}" alt="QR Code para pagamento" />
```

```javascript
// React / Vue — garantir data URI
const qrSrc = gatewayResponse.QRCode?.startsWith('data:')
  ? gatewayResponse.QRCode
  : `data:image/png;base64,${gatewayResponse.QRCode}`;

<img src={qrSrc} alt="QR Code para pagamento" />
```

**O que mostrar no frontend:**
- Imagem do QR Code (decodificar base64).
- Mensagem: "Escaneie com a app E-Kwanza para pagar."
- Mostrar `ExpirationDate` formatada (ex.: "Válido até 20/02/2025 10:15").
- O status é atualizado automaticamente via webhook quando o cliente pagar, cancelar ou o ticket expirar.

### 4.3. Estados do pagamento (`payment.status`)

| Status | Significado |
|--------|-------------|
| `pending` | Aguardando ação do cliente |
| `processing` | Pagamento iniciado no gateway |
| `paid` | Pago com sucesso |
| `failed` | Falhou ou recusado |
| `cancelled` | Cancelado pelo cliente |
| `expired` | Expirado (ex.: QR ticket) |

### 4.4. Atualização de status (webhooks)

Os gateways enviam callbacks para a API. O frontend **não recebe** webhooks diretamente. As atualizações são feitas no backend; o frontend precisa de uma forma de obter o estado atual:

- **Opção 1:** Polling — implementar um endpoint público `GET /orders/{id}/status` (a definir) e fazer polling a cada 5–10 segundos na página de pagamento.
- **Opção 2:** O utilizador recarrega a página ou volta à página de confirmação; os dados virão de um endpoint que retorne o pedido atualizado.
- **Opção 3:** WebSockets ou Server-Sent Events (não implementados na API atual).

#### 4.4.1. Webhook AppyPay — como configurar

Documentação oficial: [Merchant Webhooks](https://appypay.stoplight.io/docs/appypay-payment-gateway/3325ef2da9b78-merchant-webhooks).

- **Endpoint da Feerie Pay para receber webhooks AppyPay:**
  - URL: `POST {DOMINIO_API}/api/v1/webhooks/appypay`
  - Exemplo: `https://api.exemplo.com/api/v1/webhooks/appypay`
- **Autenticação / segurança:**
  - Protegido por whitelist de IP: a middleware `WebhookIpWhitelist` verifica se o IP de origem está listado em `APPYPAY_WEBHOOK_ALLOWED_IPS` (mapeado em `services.appypay.webhook_allowed_ips`).
  - Em produção, é obrigatório configurar os IPs oficiais da AppyPay antes de ativar o webhook.
- **Chave de correlação usada pela Feerie Pay:**
  - O backend procura o pagamento por `merchantTransactionId` recebido no payload:
    - `Payment::where('merchant_transaction_id', payload.merchantTransactionId)`
- **Mapeamento de estado (campo `operationStatus` da AppyPay → `payment.status`):**
  - `1` → `paid`
  - `3` → `cancelled`
  - `4` ou `5` → `failed`
  - Outros valores → `failed`

**Passos para montar o webhook na AppyPay (backoffice):**
1. Aceder ao painel de comerciante AppyPay.
2. Localizar a área de **Merchant Webhooks**.
3. Configurar a URL do webhook como `https://{DOMINIO_API}/api/v1/webhooks/appypay`.
4. Confirmar que o método HTTP é `POST` e o formato é **JSON**.
5. Solicitar/confirmar com a AppyPay a lista oficial de IPs de origem dos webhooks e configurá-los em `APPYPAY_WEBHOOK_ALLOWED_IPS`.
6. Guardar/ativar o webhook.

Quando um pagamento muda de estado no AppyPay, o webhook é recebido, colocado na fila (`ProcessWebhookPayload`) e:
- Atualiza o `payment.status` e, se pago, o `payment.paid_at`.
- Se o pagamento estiver ligado a um `order`, atualiza o `order.status` para `paid` e define `order.paid_at`.
- Regista um `PaymentLog` com o payload recebido (auditoria).

Do ponto de vista do frontend, nada muda: continua a consultar o estado via endpoints (`GET /payments/{id}`, `GET /orders`) e vê os estados já atualizados pelo webhook.

### 4.5. Mapeamento: o que exibir no frontend por método

O frontend deve usar **sempre os campos do objeto `payment`** (ou `order.payments[]` em GET /orders). A API devolve todos os campos da base de dados.

| Método | Campo principal a exibir | Outros campos úteis |
|--------|--------------------------|---------------------|
| **GPO** | Mensagem fixa: "Aguardando aprovação no Multicaixa Express" | `payment.status`, `payment.amount`, `payment.currency` |
| **REF** | `payment.gateway_reference` (ex: "10111 180162314") | `payment.expires_at`, `payment.raw_response.responseStatus.reference` |
| **Ticket** | `payment.raw_response.QRCode` (ou `gateway_response.QRCode` na criação) | `payment.expires_at`, `payment.raw_response.ExpirationDate` |

**Lista de pedidos (GET /orders):** Cada `order.payments[]` inclui `gateway_reference`, `expires_at`, `raw_response`, `gateway`, `status`, etc. Use-os para montar a UI de cada transação (ex: badge com referência, data de validade, QR se disponível em raw_response).

### 4.6. Resumo de uso no frontend

| Passo | Ação |
|-------|------|
| 1 | Validar `payment_method` e campos obrigatórios (`phone_number` para GPO, `mobile_number` para Ticket) |
| 2 | Enviar POST `/orders` (ou POST `/payments` para link standalone) com os dados |
| 3 | Em caso de sucesso (201): ler `payment` e `gateway_response` conforme o `payment_method` |
| 4 | **GPO:** Mostrar mensagem de aguardar aprovação no Multicaixa |
| 5 | **REF:** Mostrar `payment.gateway_reference` e `payment.expires_at` para pagamento em ATM |
| 6 | **Ticket:** Renderizar QR com `payment.raw_response.QRCode` (ou `gateway_response.QRCode`) e exibir `payment.expires_at` |
| 7 | Em GET /orders: usar todos os campos de `order`, `customer`, `product` e `payments` para exibir a lista completa |
| 8 | Para obter atualizações: polling (quando endpoint existir) ou recarregar página |

### 4.7. Erros comuns nos gateways

- **422:** Validação — `phone_number` ou `mobile_number` em falta quando obrigatório.
- **500 / RuntimeException:** Falha ao contactar o gateway (timeout, credenciais, etc.). Mostrar mensagem genérica e sugerir nova tentativa.

### 4.8. Como listar transações diretamente na AppyPay

Esta secção é útil para **equipa financeira / suporte** quando for necessário conferir o que está registado no gateway AppyPay, para além dos dados que já existem na base de dados da Feerie Pay.

- Documentação oficial: [Get all charges](https://appypay.stoplight.io/docs/appypay-payment-gateway/a295158c1a7db-get-all-charges)
- Endpoint base (segundo a nossa integração): `GET {APPYPAY_BASE_URL}/v2.0/charges`
- Autenticação: **Bearer token** obtido via OAuth (mesmo fluxo descrito em `Get a token`)

**Exemplo em cURL (listar cobranças):**

```bash
curl -X GET "$APPYPAY_BASE_URL/v2.0/charges" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Notas importantes:**
- O token usado é o mesmo que a API Feerie Pay obtém via AppyPay (OAuth). Em produção, este pedido deve ser feito a partir de um backoffice/servidor seguro, nunca diretamente do browser público.
- A resposta é uma lista de cobranças (charges) com campos como `id`, `merchantTransactionId`, `amount`, `currency`, `status`, etc. A estrutura exata pode ser consultada na página oficial [Get all charges](https://appypay.stoplight.io/docs/appypay-payment-gateway/a295158c1a7db-get-all-charges).
- É possível filtrar/ordenar as cobranças conforme os parâmetros suportados pela AppyPay (datas, estado, etc.) — ver documentação oficial para os filtros disponíveis.

**Uso típico (equipa financeira):**
- Pesquisar transações por `merchantTransactionId` ou por datas para cruzar com os pagamentos registados na Feerie Pay.
- Validar estados (`status`) de cobranças diretamente no AppyPay quando houver alguma incongruência entre o gateway e a nossa base de dados.

---

## 5. Erros de validação (422)

Quando a validação falha, a API retorna:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["O campo email é obrigatório."],
    "payment_method": ["O método de pagamento selecionado é inválido."],
    "phone_number": ["O número de telefone é obrigatório para Multicaixa Express."]
  }
}
```

O frontend deve exibir `errors` por campo para feedback ao utilizador.

---

## 6. IDs (ULID)

Todos os IDs principais (Order, Product, User, Customer, Payment) usam **ULID** em vez de inteiros:

- Exemplo: `01ARZ3NDEKTSV4RRFFQ69G5FAV`
- Sempre string, nunca número
- Útil para URLs e referências externas sem expor sequências

---

## 7. Resumo de permissões por role

| Rota | Público | A (admin) | E (editor) | V (viewer) |
|------|---------|-----------|------------|------------|
| POST /login | ✓ | ✓ | ✓ | ✓ |
| POST /logout | — | ✓ | ✓ | ✓ |
| GET /me | — | ✓ | ✓ | ✓ |
| POST /forgot-password | ✓ | — | — | — |
| POST /password/reset | ✓ | — | — | — |
| POST /orders | ✓ | — | — | — |
| POST /payments | ✓ | — | — | — |
| GET /payments/{id} | ✓ | — | — | — |
| **GET /orders** (Pedidos) | — | ✓ | — | — |
| GET /products | — | ✓ | ✓ | ✓ |
| GET /products/{id} | — | ✓ | ✓ | ✓ |
| GET /products/{id}/download | — | ✓ | ✓ | ✓ |
| **POST /products** | — | ✓ | ✓ | — |
| **PUT/PATCH /products/{id}** | — | ✓ | ✓ | — |
| **DELETE /products/{id}** | — | ✓ | ✓ | — |
| GET /coupons | — | ✓ | ✓ | ✓ |
| GET /coupons/{id} | — | ✓ | ✓ | ✓ |
| **POST /coupons** | — | ✓ | ✓ | — |
| **PUT/PATCH /coupons/{id}** | — | ✓ | ✓ | — |
| **DELETE /coupons/{id}** | — | ✓ | ✓ | — |
| GET /customers | — | ✓ | ✓ | ✓ |
| GET /customers/{id} | — | ✓ | ✓ | ✓ |
| **POST /customers** | — | ✓ | — | — |
| **PUT/PATCH /customers/{id}** | — | ✓ | — | — |
| **DELETE /customers/{id}** | — | ✓ | — | — |
| **POST /users** | — | ✓ | — | — |
| **PUT/PATCH /users/{id}** | — | ✓ | — | — |
| **DELETE /users/{id}** | — | ✓ | — | — |
| GET /admin | — | ✓ | — | — |

**Legenda:**
- **A (admin)** — Acesso total: financeiro, configurações, equipe, saques.
- **E (editor)** — Edita produtos e cupons; vê clientes. Sem acesso financeiro.
- **V (viewer)** — Apenas visualização (produtos, clientes). Suporte nível 1.

*O CRUD de cupons está implementado. Editor pode criar, editar e apagar cupons.*

*A API implementa estes níveis de acesso nas rotas.*

---

## 8. Fluxo recomendado no frontend

1. **Login** → Usar `credentials: 'include'`. O cookie é definido pelo servidor e guardado automaticamente pelo browser.
2. **Guardar `user`** → Armazenar os dados do utilizador (incluindo `role`) em estado (ex: React Context, Zustand, Pinia) para uso na UI.
3. **Verificar `role`** → Mostrar/ocultar menus e ações conforme os níveis de acesso (ver secção 2.2 e 6).
4. **Requisições protegidas** → Usar `credentials: 'include'` ou `withCredentials: true`. O cookie é enviado automaticamente.
5. **401** → Redirecionar para login (o cookie foi invalidado ou expirou).
6. **403** → Mostrar mensagem de falta de permissão.
7. **Criar pedido** → Usar `payment_method` (gpo, ref, ekwanza_ticket), `phone_number` (GPO) e `mobile_number` (Ticket) conforme secção 4. Exibir QR (Ticket), referência (REF) ou mensagem de aprovação (GPO) conforme `payment` e `gateway_response` — ver mapeamento em 4.5.
8. **Listagem de pedidos (GET /orders)** → Usar **todos** os campos de `order`, `customer`, `product` e `order.payments[]` (incluindo `gateway_reference`, `raw_response`, `expires_at`, etc.) para exibir referências, QR codes e estados.
9. **Produtos com ficheiro** → Para download, usar endpoint com credenciais e tratar resposta como blob/ficheiro.

---

## 9. CORS e cookies

A API tem `supports_credentials: true` ativado. O frontend deve estar em `allowed_origins` do `config/cors.php`. O domínio do cookie pode ser configurado em `AUTH_COOKIE_DOMAIN` (ex: `.exemplo.com` para partilhar entre `app.exemplo.com` e `api.exemplo.com`).

---

**Última atualização:** fevereiro 2025 — Gateways E-Kwanza (GPO, REF, e-Kwanza Ticket) documentados. Estrutura completa de Order, Payment e mapeamento frontend atualizada.

**Próximos passos (planeados):** Checkout completo e links de pagamento (já existe POST /payments standalone).
