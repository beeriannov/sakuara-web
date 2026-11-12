const firebaseConfig = {
  apiKey: "AIzaSyCtBQAlTq4hIk-3_AnzdJFyTIKULRoOlKY",
  authDomain: "sakuara-app.firebaseapp.com",
  projectId: "sakuara-app",
  storageBucket: "sakuara-app.firebasestorage.app",
  messagingSenderId: "588484564640",
  appId: "1:588484564640:web:e64c765a92171f6c4f5bc5"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
let currentUserToken = null;

// Ganti URL di bawah ini dengan URL Web App Apps Script Anda yang berakhiran /exec
const API_URL = "https://script.google.com/macros/s/AKfycbxUt2ttLir1CdUa_z53KvSAjMF8bMriRB_vGdxlUHc34xZqDMUsMe0X9vJwCqPUEbKPUw/exec";

lucide.createIcons();

auth.onAuthStateChanged(async user => {
  if (user) {
    currentUserToken = await user.getIdToken();
    document.getElementById('auth-view').classList.add('d-none');
    document.getElementById('app-view').classList.remove('d-none');
    loadDashboard();
  } else {
    document.getElementById('auth-view').classList.remove('d-none');
    document.getElementById('app-view').classList.add('d-none');
  }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const pwd = document.getElementById('password').value;
  try {
    await auth.signInWithEmailAndPassword(email, pwd);
  } catch (err) {
    await auth.createUserWithEmailAndPassword(email, pwd);
  }
});

function logout() { auth.signOut(); }

function navigate(page) {
  document.getElementById('page-title').innerText = page.charAt(0).toUpperCase() + page.slice(1);
  if(page === 'dashboard') loadDashboard();
  else if(page === 'health') loadHealthPage();
  else document.getElementById('content-area').innerHTML = `<div class="p-4 text-center text-muted">Fitur segera hadir</div>`;
}

async function callAPI(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action, token: currentUserToken, payload })
  });
  return response.json();
}

async function loadDashboard() {
  const content = document.getElementById('content-area');
  content.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-success"></div></div>`;
  
  try {
    // Contoh pemanggilan data via fetch API ke Google Apps Script
    const data = await callAPI('getDashboardData');
    content.innerHTML = `
      <div class="card shadow-sm p-4 bg-success text-white">
        <h5>Total Saldo</h5>
        <h2>Rp ${(data.totalBalance || 0).toLocaleString('id-ID')}</h2>
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="alert alert-danger">Gagal memuat data: ${e.message}</div>`;
  }
}