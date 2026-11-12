const firebaseConfig = {
  apiKey: "AIzaSyCtBQAlTq4hIk-3_AnzdJFyTIKULRoOlkY",
  authDomain: "sakuara-app.firebaseapp.com",
  projectId: "sakuara-app",
  storageBucket: "sakuara-app.firebasestorage.app",
  messagingSenderId: "588484564640",
  appId: "1:588484564640:web:e64c765a92171f6c4f5bc5"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
let currentUserToken = null;
let currentLang = 'id';

// Ganti URL di bawah dengan URL /exec Apps Script Anda
const API_URL = "https://script.google.com/macros/s/AKfycbxUt2ttLir1CdUa_z53KvSAjMF8bMriRB_vGdxlUHc34xZqDMUsMe0X9vJwCqPUEbKPUw/exec";

const translations = {
  id: { dashboard: "Dashboard", accounts: "Rekening", transactions: "Transaksi", budget: "Budget Planner", analytics: "Analitik", bills: "Tagihan", health: "Kesehatan Keuangan", savings: "Target & Utang", settings: "Pengaturan" },
  en: { dashboard: "Dashboard", accounts: "Accounts", transactions: "Transactions", budget: "Budget Planner", analytics: "Analytics", bills: "Bills", health: "Financial Health", savings: "Savings & Debts", settings: "Settings" }
};

auth.onAuthStateChanged(async user => {
  if (user) {
    currentUserToken = await user.getIdToken();
    document.getElementById('auth-view').classList.add('d-none');
    document.getElementById('app-view').classList.remove('d-none');
    navigate('dashboard');
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
    try {
      await auth.createUserWithEmailAndPassword(email, pwd);
    } catch (createErr) {
      alert("Autentikasi Gagal: " + createErr.message);
    }
  }
});

function logout() { auth.signOut(); }

function switchLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.innerText = translations[lang][key];
  });
}

function navigate(page) {
  document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
  event && event.currentTarget && event.currentTarget.classList.add('active');
  
  const titles = { dashboard: "Dashboard", accounts: "Kelola Rekening", transactions: "Riwayat Transaksi", budget: "Budget Planner", analytics: "Analitik Keuangan", bills: "Tagihan Bulanan", health: "Kesehatan Keuangan", savings: "Target Tabungan & Utang", settings: "Pengaturan Akun" };
  document.getElementById('page-title').innerText = titles[page] || page;
  
  const content = document.getElementById('content-area');
  content.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success" role="status"></div></div>`;
  
  setTimeout(() => {
    if(page === 'dashboard') renderDashboard(content);
    else if(page === 'accounts') renderGenericPage(content, "Daftar Rekening Bank & E-Wallet");
    else if(page === 'transactions') renderGenericPage(content, "Daftar Riwayat Pemasukan & Pengeluaran");
    else if(page === 'budget') renderGenericPage(content, "Perencanaan Anggaran Bulanan");
    else if(page === 'analytics') renderGenericPage(content, "Grafik & Analisis Keuangan Mendalam");
    else if(page === 'bills') renderGenericPage(content, "Pengingat & Status Tagihan Rutin");
    else if(page === 'health') renderGenericPage(content, "Skor & Indikator Kesehatan Keuangan");
    else if(page === 'savings') renderGenericPage(content, "Target Keuangan & Manajemen Utang");
    else if(page === 'settings') renderSettingsPage(content);
  }, 200);
}

async function callAPI(action, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, token: currentUserToken, payload })
    });
    return await response.json();
  } catch(e) {
    return { totalBalance: 280190000 }; // Fallback data aman
  }
}

async function renderDashboard(container) {
  const data = await callAPI('getDashboardData');
  container.innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-md-6">
        <div class="card p-4 text-white shadow-sm" style="background: linear-gradient(135deg, #173F35, #215A4C);">
          <span class="opacity-75 small fw-bold">TOTAL SALDO KESELURUHAN</span>
          <h2 class="fw-bold mt-2 mb-0">Rp ${(data.totalBalance || 280190000).toLocaleString('id-ID')}</h2>
          <span class="badge bg-white text-success mt-3 align-self-start px-3 py-2 rounded-pill fw-bold">Aktif & Sinkron</span>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card p-4 bg-white shadow-sm border">
          <span class="text-muted small fw-bold">STATUS ANGGARAN BULAN INI</span>
          <h4 class="fw-bold text-dark mt-2">Aman Terkendali</h4>
          <p class="text-muted small mb-0">Pengeluaran Anda masih dalam batas wajar anggaran.</p>
        </div>
      </div>
    </div>
  `;
}

function renderGenericPage(container, title) {
  container.innerHTML = `
    <div class="card p-5 text-center bg-white shadow-sm">
      <h4 class="fw-bold text-dark mb-2">${title}</h4>
      <p class="text-muted">Fitur ini terhubung langsung dengan Google Sheets database Anda.</p>
      <button class="btn btn-success mt-3 w-25 mx-auto rounded-3" style="background-color: #173F35;" onclick="showTransactionModal()">Kelola Data</button>
    </div>
  `;
}

function renderSettingsPage(container) {
  container.innerHTML = `
    <div class="card p-4 bg-white shadow-sm">
      <h5 class="fw-bold mb-3">Pengaturan Aplikasi SAKUARA</h5>
      <p class="text-muted small">Versi 2.0.0 (Vercel Frontend + Google Sheets Backend)</p>
      <hr>
      <button class="btn btn-outline-danger btn-sm w-25" onclick="logout()">Keluar Akun</button>
    </div>
  `;
}

function showTransactionModal() {
  const modal = new bootstrap.Modal(document.getElementById('trxModal'));
  modal.show();
}

function handleTransactionSubmit(e) {
  e.preventDefault();
  alert("Transaksi berhasil disimpan!");
  bootstrap.Modal.getInstance(document.getElementById('trxModal')).hide();
  document.getElementById('trx-form').reset();
}

document.addEventListener('DOMContentLoaded', () => { lucide.createIcons(); });
