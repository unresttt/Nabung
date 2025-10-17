// === app.js (versi final dengan perbaikan) ===

// Firebase config (gunakan konfigurasi dari project Firebase-mu)
const firebaseConfig = {
  apiKey: "AIzaSyC7boFrn964XUBRZf0xdyjqst3bsk_s_AE",
  authDomain: "tabungan-kita-a2b49.firebaseapp.com",
  databaseURL: "https://tabungan-kita-a2b49-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tabungan-kita-a2b49",
  storageBucket: "tabungan-kita-a2b49.firebasestorage.app",
  messagingSenderId: "203588830235",
  appId: "1:203588830235:web:b3d7adb92b0647953264be",
  measurementId: "G-7D99H7QWHK"
};

// Inisialisasi Firebase (compat mode dari script di index.html)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const appRef = db.ref('app');

// UI helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const money = v => "Rp " + Number(v).toLocaleString('id-ID');

// Elemen UI
const tabs = $$('.tab');
const dotsWrapper = $('#dots');
const themeToggle = $('#themeToggle');

const targetsList = $('#targetsList');
const addTargetBtn = $('#addTargetBtn');

const meetSaveBtn = $('#meetSaveBtn');
const resetMeetBtn = $('#resetMeetBtn');
const fineSaveBtn = $('#fineSaveBtn');
const resetFineBtn = $('#resetFineBtn');
const meetAmountLabel = $('#meetAmountLabel');
const fineAmountLabel = $('#fineAmountLabel');

const totalAmountEl = $('#totalAmount');
const historyList = $('#historyList');
const clearHistoryBtn = $('#clearHistoryBtn');

// Tab switching & fade transitions
let currentTab = 0;
function renderDots(){
  dotsWrapper.innerHTML = '';
  tabs.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = (i === currentTab ? 'active' : '');
    btn.onclick = () => setTab(i);
    dotsWrapper.appendChild(btn);
  });
}
function setTab(i){
  tabs.forEach((t, idx) => {
    if (idx === i) t.classList.add('active');
    else t.classList.remove('active');
  });
  currentTab = i;
  renderDots();
}
renderDots();
setTab(0);

// Touch swipe for tabs
let startX = null;
const container = document.getElementById('tabsContainer');
container.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});
container.addEventListener('touchmove', e => {
  if (startX === null) return;
  const diff = e.touches[0].clientX - startX;
  if (diff > 80 && currentTab > 0) {
    setTab(currentTab - 1);
    startX = null;
  } else if (diff < -80 && currentTab < tabs.length - 1) {
    setTab(currentTab + 1);
    startX = null;
  }
});
container.addEventListener('touchend', () => {
  startX = null;
});

// State lokal
let state = {
  targets: {},
  savings: {
    meet: 5000,
    fine: 50000,
    totalMeet: 0,
    totalFine: 0
  },
  history: []
};

// Sinkronisasi realtime dari Firebase
appRef.on('value', snap => {
  const val = snap.val() || {};
  state.targets = val.targets || {};
  state.savings = Object.assign({
    meet: 5000,
    fine: 50000,
    totalMeet: 0,
    totalFine: 0
  }, val.savings || {});
  state.history = val.history || [];
  renderAll();
});

// Rendering UI
function renderAll(){
  renderTargets();
  meetAmountLabel.textContent = money(state.savings.meet);
  fineAmountLabel.textContent = money(state.savings.fine);
  renderTotal();
  renderHistory();
}

function renderTargets(){
  targetsList.innerHTML = '';
  const keys = Object.keys(state.targets);
  if (keys.length === 0) {
    targetsList.innerHTML = '<div class="card muted">Belum ada target</div>';
    return;
  }
  keys.forEach(id => {
    const t = state.targets[id];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="target-title">${escapeHtml(t.name)}</div>
      <div class="muted">Target: ${money(t.target)}<br/>Tersimpan: ${money(t.saved || 0)}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${calcPercent(t)}%"></div></div>
      <div class="target-actions">
        <button class="btn blue add-to">+Rp ${Number(t.step||0).toLocaleString('id-ID')}</button>
        <button class="btn yellow edit">Mengatur ulang</button>
        <button class="btn red del">Hapus</button>
      </div>
    `;
    card.querySelector('.add-to').onclick = () => addToTarget(id, Number(t.step || 0));
    card.querySelector('.edit').onclick = () => editTarget(id);
    card.querySelector('.del').onclick = () => deleteTarget(id);
    targetsList.appendChild(card);
  });
}

function renderTotal(){
  const sumT = Object.values(state.targets).reduce((acc, t) => acc + Number(t.saved||0), 0);
  const tot = sumT + Number(state.savings.totalMeet||0) + Number(state.savings.totalFine||0);
  totalAmountEl.textContent = money(tot);
}

function renderHistory(){
  historyList.innerHTML = '';
  if (!state.history || state.history.length === 0) {
    historyList.innerHTML = '<li class="muted">Belum ada transaksi</li>';
    return;
  }
  // Tampilkan dari paling baru (akhir array) ke atas
  state.history.slice().reverse().forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    historyList.appendChild(li);
  });
}

// Operasi / Write ke Firebase
function pushHistory(text){
  const h = state.history.slice();
  h.push(`[${timestampNow()}] ${text}`);
  appRef.child('history').set(h);
}

meetSaveBtn.onclick = () => {
  const amt = Number(state.savings.meet || 0);
  const total = (state.savings.totalMeet || 0) + amt;
  appRef.child('savings/totalMeet').set(total);
  pushHistory(`+${money(amt)} (Tabungan Tiap Ketemu)`);
};

resetMeetBtn.onclick = () => {
  appRef.child('savings/totalMeet').set(0);
  pushHistory(`Reset Tabungan Tiap Ketemu`);
};

fineSaveBtn.onclick = () => {
  const amt = Number(state.savings.fine || 0);
  const total = (state.savings.totalFine || 0) + amt;
  appRef.child('savings/totalFine').set(total);
  pushHistory(`+${money(amt)} (Denda)`);
};

resetFineBtn.onclick = () => {
  appRef.child('savings/totalFine').set(0);
  pushHistory(`Reset Denda`);
};

addTargetBtn.onclick = () => {
  const name = prompt('Nama target:');
  if (!name) return;
  const target = Number(prompt('Nominal target (angka):', '100000')) || 0;
  const step = Number(prompt('Step tiap klik (angka):', '10000')) || 0;
  const id = 't' + Date.now();
  const newTargets = Object.assign({}, state.targets, {
    [id]: { name, target, saved: 0, step }
  });
  appRef.child('targets').set(newTargets);
  pushHistory(`Buat target "${name}" Rp ${target.toLocaleString('id-ID')}`);
};

function addToTarget(id, step) {
  const t = state.targets[id];
  if (!t) return;
  const updated = Object.assign({}, state.targets);
  updated[id] = Object.assign({}, t, { saved: (Number(t.saved||0) + Number(step)) });
  appRef.child('targets').set(updated);
  pushHistory(`+Rp ${Number(step).toLocaleString('id-ID')} ke target "${t.name}"`);
}

function editTarget(id) {
  const t = state.targets[id];
  if (!t) return;
  const name = prompt('Nama target:', t.name) || t.name;
  const target = Number(prompt('Nominal target:', t.target)) || t.target;
  const step = Number(prompt('Step tiap klik:', t.step)) || t.step;
  const updated = Object.assign({}, state.targets);
  updated[id] = { name, target, saved: t.saved || 0, step };
  appRef.child('targets').set(updated);
  pushHistory(`Edit target "${name}"`);
}

function deleteTarget(id) {
  if (!confirm('Hapus target ini?')) return;
  const t = state.targets[id];
  const updated = Object.assign({}, state.targets);
  delete updated[id];
  appRef.child('targets').set(updated);
  pushHistory(`Hapus target "${t?.name || ''}"`);
}

clearHistoryBtn.onclick = () => {
  if (!confirm('Hapus semua riwayat transaksi?')) return;
  appRef.child('history').set([]);
};

/* Utility functions */
function calcPercent(t) {
  const tg = Number(t.target||0);
  const sv = Number(t.saved||0);
  if (!tg) return 0;
  return Math.min(100, Math.round((sv / tg) * 100));
}
function timestampNow() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth()+1).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}.${min}`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => {
    return {
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c];
  });
    }
