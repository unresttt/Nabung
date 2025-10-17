// === APP VERSION ===
const app_version = "20251017.2";

// === Inisialisasi Data ===
let targets = JSON.parse(localStorage.getItem('targets') || '[]');
let meet = parseInt(localStorage.getItem('meet') || '0');
let penalty = parseInt(localStorage.getItem('penalty') || '0');
let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

// === Elemen DOM ===
const targetsList = document.getElementById('targets-list');
const meetAmount = document.getElementById('meet-amount');
const penaltyAmount = document.getElementById('penalty-amount');
const totalAmount = document.getElementById('total-amount');
const txList = document.getElementById('transactions-list');

// === Fungsi Utilitas ===
function formatRupiah(num) {
  return 'Rp ' + num.toLocaleString('id-ID');
}
function logTransaction(text) {
  const time = new Date().toLocaleString('id-ID');
  transactions.unshift(`[${time}] ${text}`);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  renderTransactions();
}

// === Render Data ===
function renderTargets() {
  targetsList.innerHTML = '';
  if (targets.length === 0) {
    targetsList.innerHTML = `<p><i>Belum ada target tabungan</i></p>`;
    return;
  }
  targets.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="target-title">
        <strong>${t.name}</strong>
        <button class="btn red" onclick="deleteTarget(${i})">Hapus</button>
      </div>
      <p>Target: ${formatRupiah(t.goal)}<br>Tersimpan: ${formatRupiah(t.saved)}</p>
      <div class="controls">
        <button class="btn blue" onclick="addToTarget(${i})">+Rp 10.000</button>
        <button class="btn muted" onclick="resetTarget(${i})">Mengatur ulang</button>
      </div>
    `;
    targetsList.appendChild(card);
  });
}

function renderTransactions() {
  txList.innerHTML = '';
  if (transactions.length === 0) {
    txList.innerHTML = `<li><i>Belum ada transaksi</i></li>`;
    return;
  }
  transactions.forEach(tx => {
    const li = document.createElement('li');
    li.textContent = tx;
    txList.appendChild(li);
  });
}

function renderAll() {
  meetAmount.textContent = formatRupiah(meet);
  penaltyAmount.textContent = formatRupiah(penalty);
  const total = meet + penalty + targets.reduce((sum, t) => sum + t.saved, 0);
  totalAmount.textContent = formatRupiah(total);
  renderTargets();
  renderTransactions();
}

// === Fungsi Tabungan & Denda ===
document.getElementById('meet-add').onclick = () => {
  meet += 5000;
  localStorage.setItem('meet', meet);
  logTransaction(`+Rp 5.000 (Tabungan Tiap Ketemu)`);
  renderAll();
};
document.getElementById('meet-reset').onclick = () => {
  meet = 0;
  localStorage.setItem('meet', meet);
  logTransaction(`Reset Tabungan Tiap Ketemu`);
  renderAll();
};

document.getElementById('penalty-add').onclick = () => {
  penalty += 50000;
  localStorage.setItem('penalty', penalty);
  logTransaction(`+Rp 50.000 (Denda)`);
  renderAll();
};
document.getElementById('penalty-reset').onclick = () => {
  penalty = 0;
  localStorage.setItem('penalty', penalty);
  logTransaction(`Reset Denda`);
  renderAll();
};

// === Fungsi Target ===
document.getElementById('btn-add-target').onclick = () => {
  document.getElementById('modal-add').classList.remove('hidden');
};
document.getElementById('cancel-add').onclick = () => {
  document.getElementById('modal-add').classList.add('hidden');
};
document.getElementById('save-add').onclick = () => {
  const name = document.getElementById('target-name').value.trim();
  const goal = parseInt(document.getElementById('target-goal').value);
  if (!name || isNaN(goal)) return alert('Isi nama dan nominal target!');
  targets.push({ name, goal, saved: 0 });
  localStorage.setItem('targets', JSON.stringify(targets));
  logTransaction(`Tambah target baru: ${name} (${formatRupiah(goal)})`);
  document.getElementById('modal-add').classList.add('hidden');
  renderAll();
};

function deleteTarget(i) {
  const name = targets[i].name;
  targets.splice(i, 1);
  localStorage.setItem('targets', JSON.stringify(targets));
  logTransaction(`Hapus target: ${name}`);
  renderAll();
}
function addToTarget(i) {
  targets[i].saved += 10000;
  localStorage.setItem('targets', JSON.stringify(targets));
  logTransaction(`+Rp 10.000 ke ${targets[i].name}`);
  renderAll();
}
function resetTarget(i) {
  targets[i].saved = 0;
  localStorage.setItem('targets', JSON.stringify(targets));
  logTransaction(`Reset tabungan untuk ${targets[i].name}`);
  renderAll();
}

document.getElementById('clear-history').onclick = () => {
  if (confirm('Hapus semua riwayat transaksi?')) {
    transactions = [];
    localStorage.removeItem('transactions');
    renderAll();
  }
};

// === Tema ===
const themeToggle = document.getElementById('theme-toggle');
let dark = true;
themeToggle.onclick = () => {
  dark = !dark;
  document.body.style.background = dark ? '#0f1112' : '#f7f7f7';
  document.body.style.color = dark ? '#fff' : '#000';
  themeToggle.textContent = dark ? '🌙' : '☀️';
};

// === SWIPE 4 TAB ===
let currentTab = 0;
const tabsInner = document.querySelector('.tabs-inner');
const totalTabs = document.querySelectorAll('.tab').length;
const dotsContainer = document.getElementById('dots');

dotsContainer.innerHTML = '';
for (let i = 0; i < totalTabs; i++) {
  const btn = document.createElement('button');
  if (i === 0) btn.classList.add('active');
  btn.addEventListener('click', () => showTab(i));
  dotsContainer.appendChild(btn);
}

function showTab(index) {
  if (index < 0) index = totalTabs - 1;
  if (index >= totalTabs) index = 0;
  currentTab = index;
  tabsInner.style.transform = `translateX(-${index * 100}vw)`;
  [...dotsContainer.children].forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

let startX = 0;
tabsInner.addEventListener('touchstart', e => startX = e.touches[0].clientX);
tabsInner.addEventListener('touchend', e => {
  const diff = startX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) showTab(currentTab + (diff > 0 ? 1 : -1));
});

// === Inisialisasi ===
renderAll();
showTab(0);
