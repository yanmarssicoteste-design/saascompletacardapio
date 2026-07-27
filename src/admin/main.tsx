import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tailwind.css';
import { auth } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getStoreByUid } from '../lib/store-repo.js';
import App from './App';

const authGate = document.getElementById('authGate')!;
const rootEl   = document.getElementById('root')!;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = './auth.html';
    return;
  }

  const doc = await getStoreByUid(user.uid);
  if (!doc) {
    await signOut(auth);
    window.location.href = './auth.html?erro=sem-loja';
    return;
  }

  authGate.style.display = 'none';
  rootEl.style.display = 'block';

  createRoot(rootEl).render(
    <React.StrictMode>
      <App uid={user.uid} initialStore={doc} />
    </React.StrictMode>
  );
});
