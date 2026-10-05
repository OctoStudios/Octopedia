/* ==================================================
   OCTOPÉDIA — Firebase Configuration
   Autenticação + Banco de Dados Gratuito
   ================================================== */

// PASSO 1: Ir em https://firebase.google.com
// PASSO 2: Criar novo projeto
// PASSO 3: Copiar credenciais abaixo
// PASSO 4: Ativar Firestore + Authentication

const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

console.log('✅ Firebase iniciado com sucesso!');
