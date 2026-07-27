import '../styles/variables.css';
import '../styles/base.css';
import '../styles/auth.css';

import { auth } from '../firebase.js';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut,
} from 'firebase/auth';
import { provisionStore, getStoreByUid } from '../lib/store-repo.js';

const $ = (id) => document.getElementById(id);

// Se já está logado, vai direto pro painel
let initialAuthChecked = false;
let unsubInitialCheck;
unsubInitialCheck = onAuthStateChanged(auth, (user) => {
  if (initialAuthChecked) return;
  initialAuthChecked = true;
  if (unsubInitialCheck) unsubInitialCheck();
  if (user) window.location.href = './admin.html';
});

// Mensagem de erro de conta sem loja
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('erro') === 'sem-loja') {
  showError('Essa conta não tem nenhuma pizzaria associada. Exclua o usuário no Console do Firebase e crie a conta de novo pela aba "Criar conta grátis".');
}

function showError(msg, field = 'authError') {
  const el = $(field);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

function setLoading(isLoading) {
  document.querySelectorAll('.auth-submit').forEach((b) => (b.disabled = isLoading));
}

// Tabs
$('tabLogin').addEventListener('click', () => switchTab('login'));
$('tabSignup').addEventListener('click', () => switchTab('signup'));

function switchTab(tab) {
  $('tabLogin').classList.toggle('active', tab === 'login');
  $('tabSignup').classList.toggle('active', tab === 'signup');
  $('formLogin').style.display = tab === 'login' ? 'flex' : 'none';
  $('formSignup').style.display = tab === 'signup' ? 'flex' : 'none';
  showError(''); showError('', 'authError2');
}

// Login
$('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  setLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = './admin.html';
  } catch (err) {
    showError(friendlyAuthError(err));
  } finally {
    setLoading(false);
  }
});

// Cadastro
$('formSignup').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('', 'authError2');
  const storeName = $('signupStoreName').value.trim();
  const phone = $('signupPhone').value.trim();
  const email = $('signupEmail').value.trim();
  const password = $('signupPassword').value;

  if (!storeName || !email || password.length < 6) {
    showError('Preencha o nome da pizzaria, e-mail e uma senha com pelo menos 6 caracteres.', 'authError2');
    return;
  }

  setLoading(true);
  let cred = null;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
    await cred.user.getIdToken(true);
    await provisionStore({ uid: cred.user.uid, name: storeName, phone, email });
    window.location.href = './admin.html';
  } catch (err) {
    if (cred) { try { await signOut(auth); } catch (_) {} }
    showError(friendlyAuthError(err), 'authError2');
  } finally {
    setLoading(false);
  }
});

function friendlyAuthError(err) {
  const code = err?.code || '';
  if (code.includes('email-already-in-use')) return 'Este e-mail já está cadastrado. Tente fazer login.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'E-mail ou senha incorretos.';
  if (code.includes('weak-password')) return 'Senha muito curta (mínimo 6 caracteres).';
  if (code.includes('invalid-email')) return 'E-mail inválido.';
  return 'Ocorreu um erro: ' + (err?.message || 'tente novamente.');
}

window.__getStoreByUid = getStoreByUid;
