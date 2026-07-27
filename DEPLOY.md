# 🚀 Deploy — Cloudflare Pages + Firebase

## Arquitetura

```
Usuário
  └─► Cloudflare Pages (CDN Global) ─► HTML/CSS/JS (build Vite)
                                              │
                                              ├─► Firebase Auth  (login/cadastro)
                                              └─► Firestore      (dados em tempo real)
```

**Por que essa combinação?**
- ⚡ **Cloudflare Pages**: assets na edge em ~200 cidades, HTTPS automático, domínio customizado grátis
- 🔥 **Firebase**: Auth + Firestore com onSnapshot em tempo real, sem servidor próprio
- 💰 **Custo**: os dois têm plano gratuito generoso — ideal para começar

---

## 1. Firebase — Configuração Inicial

### 1.1 Criar projeto
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. **Criar projeto** → dê um nome (ex: `pizzaria-saas`)
3. Desative Google Analytics (opcional)

### 1.2 Ativar Authentication
1. Build → Authentication → **Get started**
2. Sign-in method → **Email/Password** → Ativar

### 1.3 Ativar Firestore
1. Build → Firestore Database → **Create database**
2. Escolha **Production mode**
3. Selecione região (recomendado: `southamerica-east1` para Brasil)

### 1.4 Publicar Regras de Segurança
```bash
# Instale o Firebase CLI se não tiver
npm install -g firebase-tools

# Login
firebase login

# Inicialize no projeto (selecione Firestore)
firebase init firestore

# Publique as regras
firebase deploy --only firestore:rules
```

### 1.5 Obter as credenciais
1. Configurações do projeto → **Seus aplicativos** → Adicionar app (Web)
2. Registre o app → copie o objeto `firebaseConfig`

---

## 2. Cloudflare Pages — Deploy

### 2.1 Conectar repositório
1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. **Create a project** → **Connect to Git**
3. Autorize GitHub/GitLab → selecione o repositório `pizzaria-saas-v5`

### 2.2 Configurações de build
| Campo | Valor |
|---|---|
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js version | `18` ou superior |

### 2.3 Variáveis de ambiente
Em **Settings → Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `meu-projeto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `meu-projeto` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `meu-projeto.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1234567890` |
| `VITE_FIREBASE_APP_ID` | `1:123...` |

> Defina para **Production** e **Preview** se quiser preview deployments funcionando.

### 2.4 Deploy
Clique em **Save and Deploy** — o primeiro deploy leva ~2 minutos.

URL resultante: `https://pizzaria-saas-v5.pages.dev`

---

## 3. Firebase Auth — Domínio Autorizado

Após o deploy, adicione o domínio CF ao Firebase:

1. Firebase Console → Authentication → **Settings** → Authorized domains
2. **Add domain** → `pizzaria-saas-v5.pages.dev`
3. Se tiver domínio próprio: adicione também `minhapizzaria.com.br`

---

## 4. Domínio Customizado (opcional)

### No Cloudflare Pages:
1. Settings → Custom domains → **Set up a custom domain**
2. Digite o domínio → a CF adiciona o DNS automaticamente

### No Firebase Auth:
1. Adicione o domínio customizado em Authorized domains

---

## 5. URLs da Aplicação

| Página | URL |
|---|---|
| Landing Page | `https://seu-projeto.pages.dev/` |
| Login / Cadastro | `https://seu-projeto.pages.dev/auth.html` |
| Painel Admin | `https://seu-projeto.pages.dev/admin.html` |
| Cardápio da Loja | `https://seu-projeto.pages.dev/loja.html?loja=slug-da-pizzaria` |

---

## 6. Desenvolvimento Local

```bash
# Instale dependências
npm install

# Configure as variáveis locais
cp .env.example .env
# Edite .env com suas credenciais Firebase

# Desenvolvimento
npm run dev     # → http://localhost:5173

# Build de produção (testar localmente)
npm run build
npm run preview
```

---

## 7. Fluxo de Update

```
git push origin main
       │
       └─► Cloudflare Pages detecta o push
               └─► npm run build  (~90s)
                       └─► Deploy automático ✅
```

Cada PR gera um **preview deployment** com URL única.

---

## Diagrama de Dados (Firestore)

```
/stores/{uid}
  ├── slug, name, tagline, phone, addr, hours
  ├── color, template ('classic' | 'editorial' | 'dark')
  ├── fee, minOrder, deliveryTime, rating
  ├── promoTxt, promoTag, logo, features{}
  ├── categories[], products[], combos[], reviews[]

/slugs/{slug}
  └── uid  →  aponta para /stores/{uid}
```
