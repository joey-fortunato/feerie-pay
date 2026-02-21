# Configuração Backend Laravel — Cookie httpOnly + Secure

O frontend está configurado para usar autenticação por **cookie httpOnly e Secure**. O token **nunca** é exposto ao JavaScript.

## Alterações necessárias no Laravel

### 1. CORS — Permitir credenciais

Em `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'supports_credentials' => true,
'allowed_origins' => [
    'http://localhost:3000',        // Dev (frontend Vite)
    'https://app.seudominio.com',   // Produção
],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

**Importante:** Com `supports_credentials => true`, **não** use `'allowed_origins' => ['*']`. Deve listar origens explícitas.

---

### 2. Cookie — Configuração de sessão (opcional, para Sanctum CSRF)

Se usar o endpoint `/sanctum/csrf-cookie`, em `config/sanctum.php`:

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost',
    env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

No `.env`:
```env
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,localhost:3000
```

---

### 3. Controller de Login — Guardar token em cookie

No controller que trata `POST /login` (ex.: `AuthController`):

```php
public function login(Request $request)
{
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($credentials)) {
        return response()->json(['message' => 'Credenciais inválidas'], 401);
    }

    $user = Auth::user();
    $token = $user->createToken('auth')->plainTextToken;

    // Definir cookie httpOnly + Secure
    $isProduction = app()->environment('production');
    $cookie = cookie(
        'feerie_token',
        $token,
         config('sanctum.expiration', 43200), // minutos (ex: 30 dias)
        '/',
        null,
        $isProduction,  // Secure: true em produção, false em localhost
        true,           // httpOnly
        false,
        $isProduction ? 'lax' : 'lax'  // SameSite
    );

    return response()->json([
        'message' => 'Login realizado com sucesso',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ],
    ])->cookie($cookie);
}
```

**Nota:** Em localhost (HTTP), use `Secure: false`. Em produção (HTTPS), use `Secure: true`.

---

### 4. Middleware — Ler token do cookie

O Sanctum, por defeito, lê o token do header `Authorization`. É preciso aceitar também o cookie.

Crie um middleware `EnsureTokenFromCookie` ou altere o `Authenticate`:

```php
// app/Http/Middleware/EnsureTokenFromCookie.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class EnsureTokenFromCookie
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->bearerToken()) {
            return $next($request);
        }

        $token = $request->cookie('feerie_token');
        if ($token) {
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        return $next($request);
    }
}
```

Registe o middleware e use-o antes do Sanctum nas rotas `api`:

Em `bootstrap/app.php` (Laravel 11) ou `app/Http/Kernel.php`:

```php
// Adicione o middleware às rotas api
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        \App\Http\Middleware\EnsureTokenFromCookie::class,
    ]);
})
```

---

### 5. Logout — Limpar cookie

No controller de logout:

```php
public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    $cookie = cookie()->forget('feerie_token');

    return response()->json(['message' => 'Desconectado com sucesso'])
        ->cookie($cookie);
}
```

---

### 6. Resumo

| Ficheiro / Config | Alteração |
|-------------------|-----------|
| `config/cors.php` | `supports_credentials => true`, origens explícitas |
| `config/sanctum.php` | `stateful` com localhost |
| Controller Login | Guardar token em cookie `feerie_token` (httpOnly, Secure em prod) |
| Middleware | Ler `feerie_token` do cookie e definir `Authorization` |
| Controller Logout | `cookie()->forget('feerie_token')` |

---

### Produção

- Usar **HTTPS** no frontend e na API.
- Definir `Secure: true` no cookie.
- Definir `SameSite=Lax` ou `Strict`.
- Garantir que o frontend e a API partilham o mesmo domínio de topo (ex.: `app.dominio.com` e `api.dominio.com`) para o cookie ser enviado correctamente.
