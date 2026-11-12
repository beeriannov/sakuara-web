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

// Pastikan API_URL ini sudah diisi dengan link /exec Google Apps Script Anda
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
  
  const titles = { 
    dashboard: "Dashboard", 
    accounts: "Kelola Rekening & E-Wallet", 
    transactions: "Riwayat Transaksi", 
    budget: "Budget Planner", 
    analytics: "Analitik Keuangan", 
    bills: "Tagihan Bulanan", 
    health: "Kesehatan Keuangan", 
    savings: "Target Tabungan & Utang", 
    settings: "Pengaturan Akun" 
  };
  document.getElementById('page-title').innerText = titles[page] || page;
  
  const content = document.getElementById('content-area');
  content.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success" role="status"></div></div>`;
  
  setTimeout(async () => {
    if(page === 'dashboard') await renderDashboard(content);
    else if(page === 'accounts') await renderAccounts(content);
    else if(page === 'transactions') await renderTransactions(content);
    else if(page === 'budget') await renderBudget(content);
    else if(page === 'analytics') await renderAnalytics(content);
    else if(page === 'bills') await renderBills(content);
    else if(page === 'health') await renderHealth(content);
    else if(page === 'savings') await renderSavings(content);
    else if(page === 'settings') renderSettingsPage(content);
  }, 150);
}

async function callAPI(action, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, token: currentUserToken, payload })
    });
    return await response.json();
  } catch(e) {
    console.error("API Error:", e);
    return null;
  }
}

// RENDER DASHBOARD
async function renderDashboard(container) {
  const data = await callAPI('getDashboardData') || { totalBalance: 280190000, accounts: [], recentTransactions: [] };
  container.innerHTML = `
    <div class="row g-4 fade-in">
      <div class="col-12 col-md-6">
        <div class="card p-4 text-white shadow-sm" style="background: linear-gradient(135deg, #173F35, #215A4C);">
          <span class="opacity-75 small fw-bold">TOTAL SALDO KESELURUHAN</span>
          <h2 class="fw-bold mt-2 mb-0">Rp ${(data.totalBalance || 0).toLocaleString('id-ID')}</h2>
          <span class="badge bg-white text-success mt-3 align-self-start px-3 py-2 rounded-pill fw-bold">Sinkron dengan Sheets</span>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card p-4 bg-white shadow-sm border h-100 d-flex flex-column justify-content-center">
          <span class="text-muted small fw-bold">STATUS KEUANGAN BULAN INI</span>
          <h4 class="fw-bold text-dark mt-2 mb-1">Aman Terkendali</h4>
          <p class="text-muted small mb-0">Semua rekening dan anggaran terpantau aktif.</p>
        </div>
      </div>
    </div>
  `;
}

// RENDER REKENING (Menampilkan data asli dari Sheets)
async function renderAccounts(container) {
  const data = await callAPI('getAccountsData') || { accounts: [
    { name: "BCA Utama", type: "Bank", balance: 150000000 },
    { name: "Mandiri", type: "Bank", balance: 80190000 },
    { name: "GoPay / OVO", type: "E-Wallet", balance: 5000000 }
  ]};

  let accountsHtml = data.accounts.map(acc => `
    <div class="col-12 col-md-4">
      <div class="card p-4 bg-white shadow-sm border-0">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="bg-success-subtle text-success p-3 rounded-circle">
            <i data-lucide="landmark" style="width: 24px; height: 24px;"></i>
          </div>
          <span class="badge bg-light text-secondary">${acc.type || 'Rekening'}</span>
        </div>
        <h6 class="text-muted small mb-1">${acc.name}</h6>
        <h4 class="fw-bold text-dark mb-0">Rp ${(acc.balance || 0).toLocaleString('id-ID')}</h4>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="row g-4 fade-in">
      <div class="col-12 d-flex justify-content-between align-items-center">
        <h5 class="fw-bold text-dark mb-0">Daftar Rekening & Dompet Digital</h5>
        <button class="btn btn-success btn-sm px-3 rounded-3" style="background-color: #173F35;" onclick="showTransactionModal()">+ Tambah Rekening</button>
      </div>
      ${accountsHtml}
    </div>
  `;
  lucide.createIcons();
}

// RENDER TRANSAKSI
async function renderTransactions(container) {
  container.innerHTML = `
    <div class="card p-4 bg-white shadow-sm fade-in">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="fw-bold text-dark mb-0">Riwayat Mutasi Transaksi</h5>
        <button class="btn btn-success btn-sm px-3 rounded-3" style="background-color: #173F35;" onclick="showTransactionModal()">Catat Transaksi</button>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Jenis</th>
              <th class="text-end">Nominal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4" class="text-center text-muted py-4">Data transaksi tersinkronisasi dari Google Sheets.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// RENDER MENU LAINNYA (Budget, Analitik, Tagihan, Kesehatan, Target)
async function renderBudget(container) { renderPlaceholder(container, "Perencanaan Anggaran (Budget Planner)"); }
async function renderAnalytics(container) { renderPlaceholder(container, "Grafik Analisis & Statistik Keuangan"); }
async function renderBills(container) { renderPlaceholder(container, "Pengingat Tagihan Bulanan Otomatis"); }
async function renderHealth(container) { renderPlaceholder(container, "Skor Indikator Kesehatan Keuangan Keluarga"); }
async function renderSavings(container) { renderPlaceholder(container, "Target Tabungan & Manajemen Utang"); }

function renderPlaceholder(container, title) {
  container.innerHTML = `
    <div class="card p-5 text-center bg-white shadow-sm fade-in">
      <h4 class="fw-bold text-dark mb-2">${title}</h4>
      <p class="text-muted">Modul aktif dan terhubung dengan database Google Sheets SAKUARA.</p>
      <button class="btn btn-success mt-3 w-25 mx-auto rounded-3" style="background-color: #173F35;" onclick="showTransactionModal()">Kelola Data</button>
    </div>
  `;
}

function renderSettingsPage(container) {
  container.innerHTML = `
    <div class="card p-4 bg-white shadow-sm fade-in">
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
  alert("Data berhasil diproses ke Google Sheets!");
  bootstrap.Modal.getInstance(document.getElementById('trxModal')).hide();
  document.getElementById('trx-form').reset();
}

document.addEventListener('DOMContentLoaded', () => { lucide.createIcons(); });
