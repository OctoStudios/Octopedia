# 🔥 Como Configurar Firebase na Octopédia

## PASSO A PASSO (5 minutos)

### 1. Criar Projeto Firebase

1. Acesse: https://firebase.google.com
2. Clique em **"Ir para console"**
3. Clique em **"Criar projeto"**
4. Nome: `octopedia`
5. Continue normalmente

### 2. Ativar Autenticação

1. No console do Firebase, vá em **"Authentication"** (no menu esquerdo)
2. Clique em **"Começar"**
3. Ative os seguintes provedores:
   - ✅ Email/Senha
   - ✅ Google
   - ✅ GitHub (opcional)

### 3. Ativar Firestore (Banco de Dados)

1. Vá em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Modo de segurança: **"Iniciar no modo de teste"** (depois mudar)
4. Localização: Escolha mais próxima do Brasil

### 4. Copiar Credenciais

1. Vá em **Configurações do Projeto** (⚙️ no canto superior)
2. Abra a aba **"Seu aplicativo"**
3. Clique em **"Adicionar app > Web"**
4. Copie o config:

```javascript
const firebaseConfig = {
  apiKey: "Cole aqui",
  authDomain: "Cole aqui",
  projectId: "Cole aqui",
  storageBucket: "Cole aqui",
  messagingSenderId: "Cole aqui",
  appId: "Cole aqui"
};
```

### 5. Adicionar ao Seu Site

1. No `index.html`, adicione **antes** de `</body>`:

```html
<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"></script>

<!-- Seus arquivos -->
<script src="firebase-config.js"></script>
<script src="firebase-auth.js"></script>
<script src="firebase-comments.js"></script>
```

2. No `firebase-config.js`, substitua as credenciais.

### 6. Adicionar Navbar com Login

No `index.html`, no `<header>`, adicione:

```html
<div class="navbar">
  <h2 style="margin: 0;">Octopédia</h2>
  <div class="user-section"></div>
</div>
```

### 7. Adicionar Comentários em Cada Página

Em `chapters/chapter-1.html` (e outros), antes de `</main>`, adicione:

```html
<script>
  // Inicializar comentários quando página carregar
  document.addEventListener('DOMContentLoaded', () => {
    initFirebaseCommentsSection('chapter-1', 'Capítulo 1 — As Primeiras Lendas');
  });
</script>
```

### 8. Testar!

1. Abra seu site
2. Clique em **"Login / Cadastro"**
3. Teste com Google ou Email
4. Publique um comentário
5. 🎉 Pronto! Sistema funcionando!

---

## 🔒 Regras de Segurança (Firestore)

Depois de testar, proteja seu banco:

1. No Firestore, vá em **"Regras"**
2. Substitua o conteúdo por:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários - qualquer pessoa logada pode ler/escrever seu próprio perfil
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Comentários - qualquer pessoa logada pode ler
    match /comments/{document=**} {
      allow read: if request.auth != null;
      // Qualquer pessoa logada pode criar
      allow create: if request.auth != null;
      // Só pode editar/deletar se for o autor
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

3. Clique em **"Publicar"**

---

## 📊 Limites Gratuitos (Generosos!)

- **1GB** armazenamento
- **50,000** leituras/dia
- **20,000** escritas/dia
- **1,000,000** delete
- Perfeito para até **1000 usuários ativos**

---

## 🆘 Troubleshooting

**"Error: Firebase is not defined"**
- Certifique-se que os scripts do Firebase estão antes de firebase-config.js

**"Permissão negada ao escrever"**
- Verifique as regras de segurança do Firestore
- Ou use modo de teste temporariamente

**"Comentários não carregam"**
- Abra o DevTools (F12) e verifique erros no console
- Certifique-se que Firestore está ativado

---

**Parabéns! 🎉 Você tem um site com login + comentários 100% gratuito!**
