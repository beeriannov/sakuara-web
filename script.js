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

// MASUKKAN LINK APPS SCRIPT ANDA DI SINI
const API_URL = "https://script.google.com/macros/s/AKfycbxUt2ttLir1CdUa_z53KvSAjMF8bMriRB_vGdxlUHc34xZqDMUsMe0X9vJwCqPUEbKPUw/exec";

const translations = {
  id: { dashboard: "Dashboard", accounts: "Rekening", transactions: "Transaksi", budget: "Budget Planner", analytics: "Analitik", bills: "Tagihan", health: "Kesehatan", savings: "Target & Utang", settings: "Pengaturan" },
  en: { dashboard: "Dashboard", accounts: "Accounts", transactions: "Transactions", budget: "Budget Planner", analytics: "Analytics", bills: "Bills", health: "Health", savings: "Savings & Debts", settings: "Settings" }
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
      alert("Gagal masuk: " + createErr.message);
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
  try {
    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
  } catch (e) {}
  
  const titles = { dashboard: "Dashboard", accounts: "Kelola Rekening", transactions: "Riwayat Transaksi", budget: "Budget Planner", bills: "Tagihan Berencana", savings: "Target Tabungan", analytics: "Analitik", health: "Kesehatan Keuangan", settings: "Pengaturan" };
  document.getElementById('page-title').innerText = titles[page] || page;
  
  const content = document.getElementById('content-area');
  content.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success" role="status"></div></div>`;
  
  setTimeout(async () => {
    if(page === 'dashboard') await renderDashboard(content);
    else if(page === 'accounts') await renderAccounts(content);
    else if(page === 'transactions') await renderTransactions(content);
    else if(page === 'budget') await renderBudget(content);
    else if(page === 'bills') await renderBills(content);
    else if(page === 'savings') await renderSavings(content);
    else if(page === 'analytics') renderPlaceholder(content, "Grafik Analitik sedang dikembangkan");
    else if(page === 'health') renderPlaceholder(content, "Indikator Kesehatan sedang dikembangkan");
    else if(page === 'settings') renderSettingsPage(content);
  }, 100);
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

const formatRp = (num) => {
  const isNegative = Number(num) < 0;
  const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(num || 0));
  return isNegative ? `-${formatted}` : formatted;
};

// 1. DASHBOARD
async function renderDashboard(container) {
  const res = await callAPI('getDashboardData');
  
  const total = res?.totalBalance ?? 0;
  const arusKas = res?.arusKas ?? 0;
  const recentTxs = res?.recentTransactions ?? [];

  const txHtml = recentTxs.map(tx => `
    <div class="d-flex justify-content-between align-items-center py-3 border-bottom">
      <div>
        <h6 class="fw-bold mb-1 text-dark">${tx.name}</h6>
        <small class="text-muted" style="font-size: 13px;">${tx.date}</small>
      </div>
      <span class="fw-bold ${tx.amount < 0 ? 'text-danger' : 'text-success'}">
        ${formatRp(tx.amount)}
      </span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="row g-4 mb-4 fade-in">
      <div class="col-12 col-md-7">
        <div class="card p-4 text-white shadow-sm border-0 h-100" style="background-color: #173F35; border-radius: 12px;">
          <span class="mb-2" style="font-size: 15px;">Total Saldo</span>
          <h2 class="fw-bold mb-0">${formatRp(total)}</h2>
        </div>
      </div>
      <div class="col-12 col-md-5">
        <div class="card p-4 bg-white shadow-sm border-0 h-100" style="border-radius: 12px;">
          <span class="text-muted mb-2" style="font-size: 15px;">Arus Kas</span>
          <h3 class="fw-bold mb-0 ${arusKas < 0 ? 'text-danger' : 'text-success'}">${formatRp(arusKas)}</h3>
        </div>
      </div>
    </div>
    
    <h5 class="fw-bold text-dark mb-3 mt-4">Transaksi Terakhir</h5>
    <div class="card bg-white shadow-sm border-0 px-3 py-1" style="border-radius: 12px;">
      ${txHtml || '<p class="text-muted text-center py-4 mb-0">Belum ada transaksi</p>'}
    </div>
  `;
}

// 2. REKENING (ACCOUNTS)
async function renderAccounts(container) {
  const res = await callAPI('getAccountsData');
  const accs = (res && Array.isArray(res.accounts)) ? res.accounts : [];
  
  if (accs.length === 0) {
    container.innerHTML = `<div class="alert alert-warning fade-in">Belum ada data di sheet Accounts.</div>`;
    return;
  }

  let html = accs.map(acc => `
    <div class="col-12 col-md-4">
      <div class="card p-4 bg-white shadow-sm border-0 h-100" style="border-radius: 12px;">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="bg-success-subtle text-success p-3 rounded-circle">
            <i data-lucide="landmark" style="width: 24px; height: 24px;"></i>
          </div>
          <span class="badge bg-light text-secondary border">${acc.accountType || acc.type || 'Akun'}</span>
        </div>
        <h6 class="text-muted small mb-1">${acc.accountName || acc.name || '-'}</h6>
        <h4 class="fw-bold text-dark mb-0">${formatRp(acc.currentBalance || acc.openingBalance || acc.balance || 0)}</h4>
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div class="row g-4 fade-in">${html}</div>`;
  lucide.createIcons();
}

// 3. TRANSAKSI (TRANSACTIONS)
async function renderTransactions(container) {
  const res = await callAPI('getTransactionsData');
  const txs = (res && Array.isArray(res.transactions)) ? res.transactions : [];
  
  let rows = txs.length === 0 ? `<tr><td colspan="5" class="text-center py-4">Belum ada data transaksi.</td></tr>` : 
    txs.map(t => {
      let date = t.date || t.createdAt || t.tanggal || '-';
      if (date instanceof Date) date = date.toLocaleDateString('id-ID');
      const cat = t.category || t.categoryName || t.name || t.description || '-';
      const type = t.type || t.transactionType || '-';
      const amount = Number(t.amount || t.nominal || 0);
      const color = amount < 0 ? 'text-danger' : 'text-success';
      
      return `
        <tr>
          <td>${date}</td>
          <td class="fw-bold">${cat}</td>
          <td><span class="badge bg-light text-dark border">${type}</span></td>
          <td class="text-end fw-bold ${color}">${formatRp(amount)}</td>
        </tr>
      `;
    }).join('');

  container.innerHTML = `
    <div class="card p-4 bg-white shadow-sm fade-in border-0" style="border-radius: 12px;">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr><th>Tanggal</th><th>Kategori</th><th>Jenis</th><th class="text-end">Nominal</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// 4. BUDGET PLANNER
async function renderBudget(container) {
  const res = await callAPI('getBudgetData');
  const budgets = (res && Array.isArray(res.budgets)) ? res.budgets : [];
  
  if (budgets.length === 0) {
    container.innerHTML = `<div class="alert alert-warning fade-in">Belum ada data di sheet Budgets.</div>`;
    return;
  }

  let html = budgets.map(b => {
    const name = b.budgetName || b.category || '-';
    const limit = Number(b.amount || b.limit || 0);
    const spent = Number(b.spent || b.terpakai || 0);
    const percent = limit > 0 ? Math.min((spent / limit) * 100, 100).toFixed(1) : 0;
    const barColor = percent > 90 ? 'bg-danger' : percent > 75 ? 'bg-warning' : 'bg-success';
    
    return `
      <div class="mb-4">
        <div class="d-flex justify-content-between mb-1">
          <span class="fw-bold text-dark">${name}</span>
          <span class="text-muted small">${formatRp(spent)} / ${formatRp(limit)}</span>
        </div>
        <div class="progress" style="height: 10px;">
          <div class="progress-bar ${barColor}" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="card p-4 bg-white shadow-sm border-0 fade-in" style="border-radius: 12px;"><h5 class="fw-bold mb-4">Anggaran Bulanan</h5>${html}</div>`;
}

// 5. TAGIHAN (PLANNED PAYMENTS)
async function renderBills(container) {
  const res = await callAPI('getBillsData');
  const bills = (res && Array.isArray(res.bills)) ? res.bills : [];
  
  let rows = bills.length === 0 ? `<p class="text-center text-muted">Tidak ada tagihan.</p>` : 
    bills.map(b => `
      <div class="d-flex align-items-center justify-content-between border-bottom py-3">
        <div>
          <h6 class="fw-bold mb-1">${b.paymentName || b.name || '-'}</h6>
          <span class="text-muted small">Jatuh Tempo: ${b.dueDate || b.tanggal || '-'}</span>
        </div>
        <span class="fw-bold text-danger">${formatRp(b.amount || b.nominal || 0)}</span>
      </div>
    `).join('');

  container.innerHTML = `<div class="card p-4 bg-white shadow-sm border-0 fade-in" style="border-radius: 12px;"><h5 class="fw-bold mb-3">Daftar Tagihan</h5>${rows}</div>`;
}

// 6. TARGET TABUNGAN (SAVINGS GOALS)
async function renderSavings(container) {
  const res = await callAPI('getSavingsData');
  const savings = (res && Array.isArray(res.savings)) ? res.savings : [];
  
  let html = savings.length === 0 ? `<p class="text-muted">Belum ada target tabungan.</p>` :
    savings.map(s => {
      const name = s.goalName || s.name || '-';
      const target = Number(s.targetAmount || 0);
      const saved = Number(s.currentAmount || s.saved || 0);
      const percent = target > 0 ? ((saved / target) * 100).toFixed(1) : 0;
      
      return `
        <div class="card bg-light border-0 p-3 mb-3" style="border-radius: 12px;">
          <h6 class="fw-bold">${name}</h6>
          <div class="progress mb-2" style="height: 12px;">
            <div class="progress-bar bg-success" style="width: ${percent}%">${percent}%</div>
          </div>
          <div class="d-flex justify-content-between small">
            <span class="text-muted">Terkumpul: ${formatRp(saved)}</span>
            <span class="fw-bold">Target: ${formatRp(target)}</span>
          </div>
        </div>
      `;
    }).join('');

  container.innerHTML = `<div class="card p-4 bg-white shadow-sm border-0 fade-in" style="border-radius: 12px;"><h5 class="fw-bold mb-4">Target Finansial</h5>${html}</div>`;
}

function renderPlaceholder(container, title) {
  container.innerHTML = `<div class="card p-5 text-center bg-white shadow-sm fade-in" style="border-radius: 12px;"><h5 class="fw-bold text-secondary">${title}</h5></div>`;
}

function renderSettingsPage(container) {
  container.innerHTML = `
    <div class="card p-4 bg-white shadow-sm fade-in border-0" style="border-radius: 12px;">
      <h5 class="fw-bold mb-3">Pengaturan Akun</h5>
      <p class="text-muted small">Aplikasi tersinkronisasi penuh dengan Google Sheets.</p>
      <hr>
      <button class="btn btn-outline-danger btn-sm w-25" onclick="logout()">Keluar Akun</button>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => { lucide.createIcons(); });
