// app.js (type=module expected)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, onValue, set, push, update, remove, child, get
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

/* ============ Firebase config =============
   (pakai config yang kamu share sebelumnya)
   Jika mau ganti project -> edit object dibawah
===========================================*/
const firebaseConfig = {
  apiKey: "AIzaSyC7boFrn964XUBRZf0xdyjqst3bsk_s_AE",
  authDomain: "tabungan-kita-a2b49.firebaseapp.com",
  databaseURL: "https://tabungan-kita-a2b49-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tabungan-kita-a2b49",
  storageBucket: "tabungan-kita-a2b49.firebasedatabase.app",
  messagingSenderId: "203588830235",
  appId: "1:203588830235:web:b3d7adb92b0647953264be",
  measurementId: "G-7D99H7QWHK"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* --- DB paths used:
   /targets  -> object of targets
   /tiap     -> value number (tabungan tiap ketemu)
   /denda    -> value number
   /history  -> push items (timestamp, message)
*/

/* ---------- Helpers ---------- */
const cents = n => Number(n) || 0;
const fmt = (n) => {
  const num = cents(n);
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};
const el = id => document.getElementById(id);

/* ---------- UI refs ---------- */
const targetsList = el('targets-list');
const addTargetBtn = el('add-target-btn');
const tiapValEl = el('tiap-value');
const dendaValEl = el('denda-value');
const tiapAddBtn = el('tiap-add');
const tiapResetBtn = el('tiap-reset');
const dendaAddBtn = el('denda-add');
const dendaResetBtn = el('denda-reset');
const totalValueEl = el('total-value');
const historyList = el('history-list');
const clearHistoryBtn = el('clear-history');
const installBtn = el('install-btn');

/* ---------- Tabs swipe UI ---------- */
const tabsEl = document.getElementById('tabs');
const slides = Array.from(document.querySelectorAll('.slide'));
const dotsContainer = document.getElementById('dots');
let currentIndex = 0;
const makeDots = () => {
  dotsContainer.innerHTML = '';
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.addEventListener('click', () => goTo(i));
    if (i === 0) b.classList.add('active');
    dotsContainer.appendChild(b);
  });
};
makeDots();
const refreshDots = () => {
  Array.from(dotsContainer.children).forEach((b, i) => {
    b.classList.toggle('active', i === currentIndex);
  });
};
function goTo(i){
  currentIndex = Math.max(0, Math.min(i, slides.length-1));
  tabsEl.style.transform = `translateX(-${currentIndex * 100}%)`;
  refreshDots();
}
/* Touch / swipe */
let startX = 0, deltaX = 0, isTouch = false;
tabsEl.addEventListener('touchstart', e => {
  isTouch = true;
  startX = e.touches[0].clientX;
});
tabsEl.addEventListener('touchmove', e => {
  if(!isTouch) return;
  deltaX = e.touches[0].clientX - startX;
  tabsEl.style.transition = 'none';
  tabsEl.style.transform = `translateX(${ -currentIndex*100 + (deltaX / window.innerWidth * 100)}%)`;
});
tabsEl.addEventListener('touchend', e => {
  isTouch = false;
  tabsEl.style.transition = '';
  if (Math.abs(deltaX) > 50) {
    if (deltaX < 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
  } else {
    goTo(currentIndex);
  }
  deltaX = 0;
});

/* ---------- DB listeners ---------- */
const targetsRef = ref(db, 'targets');
const tiapRef = ref(db, 'tiap');
const dendaRef = ref(db, 'denda');
const historyRef = ref(db, 'history');

function pushHistory(msg){
  const h = push(ref(db, 'history'));
  set(h, { ts: Date.now(), text: msg });
}

/* listen targets */
onValue(targetsRef, snap => {
  const data = snap.val() || {};
  renderTargets(data);
  recalcTotal(data);
});

/* listen tiap & denda */
onValue(tiapRef, snap => {
  const v = snap.val() || 0;
  tiapValEl.textContent = fmt(v);
  recalcTotal();
});
onValue(dendaRef, snap => {
  const v = snap.val() || 0;
  dendaValEl.textContent = fmt(v);
  recalcTotal();
});

/* listen history */
onValue(historyRef, snap => {
  const data = snap.val() || {};
  renderHistory(data);
});

/* ---------- UI render functions ---------- */
function renderTargets(targets){
  targetsList.innerHTML = '';
  const keys = Object.keys(targets).sort((a,b) => (targets[b].created||0) - (targets[a].created||0));
  if (keys.length === 0){
    const none = document.createElement('div');
    none.className = 'target-item';
    none.textContent = 'Belum ada target';
    targetsList.appendChild(none);
    return;
  }
  keys.forEach(k => {
    const t = targets[k];
    const item = document.createElement('div');
    item.className = 'target-item';
    const header = document.createElement('div'); header.className='target-header';
    const name = document.createElement('div'); name.className='target-name'; name.textContent = t.name || 'Target';
    const del = document.createElement('button'); del.className='btn btn-danger'; del.textContent='Hapus';
    del.onclick = async () => {
      if(!confirm(`Hapus target "${t.name}"?`)) return;
      await remove(child(targetsRef, k));
      pushHistory(`[${timeLabel()}] Hapus target "${t.name}"`);
    };
    header.appendChild(name); header.appendChild(del);

    const info = document.createElement('div'); info.className='target-info';
    info.innerHTML = `Target: ${fmt(t.target||0)}<br>Tersimpan: ${fmt(t.saved||0)}`;

    const progressOuter = document.createElement('div'); progressOuter.className='progress-outer';
    const progressInner = document.createElement('div'); progressInner.className='progress-inner';
    const pct = t.target ? Math.min(100, Math.round(((t.saved||0)/t.target)*100)) : 0;
    progressInner.style.width = pct + '%';
    progressOuter.appendChild(progressInner);

    const row = document.createElement('div'); row.style.display='flex'; row.style.gap='10px'; row.style.marginTop='8px';
    const tabungBtn = document.createElement('button'); tabungBtn.className='btn btn-primary'; tabungBtn.textContent = `+Rp ${formatNumber(t.step || 1000)}`;
    tabungBtn.onclick = async () => {
      const increment = Number(t.step) || 0;
      const updates = {};
      updates[`/targets/${k}/saved`] = (t.saved || 0) + increment;
      await update(ref(db), updates);
      pushHistory(`[${timeLabel()}] +Rp ${formatNumber(increment)} ke target "${t.name}"`);
    };
    const editBtn = document.createElement('button'); editBtn.className='btn btn-warning'; editBtn.textContent='Mengatur ulang';
    editBtn.onclick = async () => {
      const newTarget = prompt('Masukkan target (angka tanpa titik):', t.target || 0);
      if (newTarget === null) return;
      const newStep = prompt('Masukkan step tabungan default (contoh 10000):', t.step || 1000);
      await update(child(targetsRef, k), { target: Number(newTarget)||0, step: Number(newStep)||0 });
      pushHistory(`[${timeLabel()}] Edit target "${t.name}"`);
    };

    row.appendChild(tabungBtn);
    row.appendChild(editBtn);

    item.appendChild(header);
    item.appendChild(info);
    item.appendChild(progressOuter);
    item.appendChild(row);

    targetsList.appendChild(item);
  });
}

/* history render */
function renderHistory(data){
  const arr = Object.entries(data || {}).sort((a,b)=> b[1].ts - a[1].ts);
  historyList.innerHTML = '';
  if (arr.length === 0){
    const li = document.createElement('li'); li.textContent = 'Belum ada transaksi'; historyList.appendChild(li);
    return;
  }
  arr.forEach(([k,v]) => {
    const li = document.createElement('li');
    li.textContent = `[${timeLabel(v.ts)}] ${v.text}`;
    historyList.appendChild(li);
  });
}

/* --- calc total */
async function recalcTotal(targetsData){
  // read current tiap/denda if not provided
  if (!targetsData){
    const tSnap = await get(targetsRef);
    targetsData = tSnap.val() || {};
  }
  let totalTargets = 0;
  Object.values(targetsData).forEach(t => totalTargets += (t.saved||0));
  // get tiap/denda from DB
  const tiapSnap = await get(tiapRef);
  const dendaSnap = await get(dendaRef);
  const tiapVal = tiapSnap.val() || 0;
  const dendaVal = dendaSnap.val() || 0;
  const total = totalTargets + Number(tiapVal) + Number(dendaVal);
  totalValueEl.textContent = fmt(total);
}

/* ---------- small utilities ---------- */
function timeLabel(ts = Date.now()){
  const d = new Date(ts);
  const date = d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  const time = d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  return `${date} ${time}`;
}
function formatNumber(n){ return new Intl.NumberFormat('id-ID', { maximumFractionDigits:0 }).format(Number(n)||0); }

/* ---------- actions ---------- */
addTargetBtn.addEventListener('click', async () => {
  const name = prompt('Nama target (contoh: Beli Helm):', '');
  if (!name) return;
  const target = Number(prompt('Masukkan nilai target (angka tanpa pemisah):', '100000')) || 0;
  const step = Number(prompt('Step tabungan default (contoh 10000):', '10000')) || 0;
  const p = push(targetsRef);
  await set(p, { name, target, saved: 0, step, created: Date.now() });
  pushHistory(`[${timeLabel()}] Tambah target "${name}"`);
});

/* tiap/denda control */
tiapAddBtn.addEventListener('click', async () => {
  const defaultStep = 5000;
  const increment = Number(prompt('Masukkan nominal tambah Tabungan Tiap Ketemu:', defaultStep)) || 0;
  const snap = await get(tiapRef);
  const now = (snap.val()||0) + increment;
  await set(tiapRef, now);
  pushHistory(`[${timeLabel()}] +Rp ${formatNumber(increment)} (Tabungan Tiap Ketemu)`);
});
tiapResetBtn.addEventListener('click', async () => {
  if (!confirm('Reset Tabungan Tiap Ketemu ke 0?')) return;
  await set(tiapRef, 0);
  pushHistory(`[${timeLabel()}] Reset Tabungan Tiap Ketemu`);
});
dendaAddBtn.addEventListener('click', async () => {
  const increment = Number(prompt('Masukkan nominal tambah Denda:', 50000)) || 0;
  const snap = await get(dendaRef);
  const now = (snap.val()||0) + increment;
  await set(dendaRef, now);
  pushHistory(`[${timeLabel()}] +Rp ${formatNumber(increment)} (Denda)`);
});
dendaResetBtn.addEventListener('click', async () => {
  if (!confirm('Reset Denda ke 0?')) return;
  await set(dendaRef, 0);
  pushHistory(`[${timeLabel()}] Reset Denda`);
});

/* clear history */
clearHistoryBtn.addEventListener('click', async () => {
  if (!confirm('Hapus seluruh riwayat?')) return;
  await set(historyRef, null);
  pushHistory(`[${timeLabel()}] Hapus semua riwayat`);
});

/* install PWA prompt (optional) */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return alert('Install tidak tersedia sekarang.');
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

/* initial goTo */
goTo(0);

/* make sure read initial data exist */
(async function ensureInitial(){
  const tiap = await get(tiapRef);
  if (!tiap.exists()) await set(tiapRef, 0);
  const denda = await get(dendaRef);
  if (!denda.exists()) await set(dendaRef, 0);
})();
