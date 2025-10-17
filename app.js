/*******************************
 * app.js
 * Firebase Realtime sync + UI
 *******************************/

/* ---------- Firebase config (you already provided) ---------- */
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

/* Initialize (compat build loaded in index.html) */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* Database structure used:
 /app/
   targets: { id: {name, target, saved, step} }
   savings: { meet: number, fine: number }
   history: [{ts, text}]
*/

/* ---------- Helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const money = v => "Rp " + Number(v).toLocaleString('id-ID');

/* ---------- UI elements ---------- */
const tabs = $$('.tab');
const dots = $('#dots');
const themeToggle = $('#themeToggle');

const targetsList = $('#targetsList');
const addTargetBtn = $('#addTargetBtn');

const meetSaveBtn = $('#meetSaveBtn');
const fineSaveBtn = $('#fineSaveBtn');
const resetMeetBtn = $('#resetMeetBtn');
const resetFineBtn = $('#resetFineBtn');
const meetAmountLabel = $('#meetAmountLabel');
const fineAmountLabel = $('#fineAmountLabel');

const totalAmountEl = $('#totalAmount');
const historyList = $('#historyList');
const clearHistoryBtn = $('#clearHistoryBtn');

/* ---------- Tab swipe + dots + fade transition ---------- */
let currentTab = 0;
function renderDots() {
  dots.innerHTML = '';
  for (let i=0;i<tabs.length;i++){
    const b = document.createElement('button');
    b.className = i===currentTab ? 'active' : '';
    b.addEventListener('click', ()=>setTab(i));
    dots.appendChild(b);
  }
}
function setTab(i){
  tabs.forEach(t=>t.classList.remove('active'));
  tabs[i].classList.add('active');
  currentTab = i;
  renderDots();
}
renderDots();
setTab(0);

/* swipe on middle area */
let sx=null;
const tabsContainer = document.getElementById('tabsContainer');
tabsContainer.addEventListener('touchstart', e=> sx = e.touches[0].clientX);
tabsContainer.addEventListener('touchmove', e=>{
  if (!sx) return;
  const dx = e.touches[0].clientX - sx;
  if (dx > 80 && currentTab>0){ setTab(currentTab-1); sx=null; }
  if (dx < -80 && currentTab<tabs.length-1){ setTab(currentTab+1); sx=null; }
});
tabsContainer.addEventListener('touchend', ()=> sx=null);

/* ---------- Sync with Firebase ---------- */
const appRef = db.ref('app');

/* Local cache */
let state = {
  targets: {},
  savings: {meet:5000, fine:50000},
  history: []
};

/* Listen for entire app data */
appRef.on('value', snap=>{
  const val = snap.val() || {};
  // merge safely with defaults
  state.targets = val.targets || {};
  state.savings = Object.assign({meet:5000,fine:50000}, val.savings || {});
  state.history = val.history || [];
  renderAll();
});

/* ---------- UI rendering ---------- */
function renderAll(){
  renderTargets();
  meetAmountLabel.textContent = money(state.savings.meet);
  fineAmountLabel.textContent = money(state.savings.fine);
  renderTotal();
  renderHistory();
}

/* Targets list */
function renderTargets(){
  targetsList.innerHTML = '';
  const keys = Object.keys(state.targets);
  if (!keys.length){
    targetsList.innerHTML = '<div class="card muted">Belum ada target</div>';
    return;
  }
  keys.forEach(id=>{
    const t = state.targets[id];
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `
      <div class="target-title">${escapeHtml(t.name || 'Untitled')}</div>
      <div class="muted">Target: ${money(t.target)}<br/>Tersimpan: ${money(t.saved||0)}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${calcPercent(t)}%"></div></div>
      <div class="target-actions">
        <button class="btn blue add-to-target">+Rp ${Number(t.step||500).toLocaleString('id-ID')}</button>
        <button class="btn yellow edit-target">Mengatur ulang</button>
        <button class="btn red delete-target">Hapus</button>
      </div>
    `;
    // events
    c.querySelector('.add-to-target').addEventListener('click', ()=> addToTarget(id, Number(t.step||500)));
    c.querySelector('.edit-target').addEventListener('click', ()=> editTargetDialog(id));
    c.querySelector('.delete-target').addEventListener('click', ()=> deleteTarget(id));
    targetsList.appendChild(c);
  });
}

/* total */
function renderTotal(){
  // sum of all saved targets + savings.meet + savings.fine
  const targetsSum = Object.values(state.targets).reduce((s,t)=> s + Number(t.saved||0),0);
  const total = targetsSum + Number(state.savings.meet||0) + Number(state.savings.fine||0);
  totalAmountEl.textContent = money(total);
}

/* history */
function renderHistory(){
  historyList.innerHTML = '';
  if (!state.history || !state.history.length){
    historyList.innerHTML = '<li class="muted">Belum ada transaksi</li>';
    return;
  }
  state.history.slice().reverse().forEach(entry=>{
    const li = document.createElement('li');
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

/* ---------- Actions (write to firebase) ---------- */
function pushHistory(text){
  const h = state.history.slice();
  h.push(`[${timestampNow()}] ${text}`);
  appRef.child('history').set(h);
}

/* meet & fine operations */
meetSaveBtn.addEventListener('click', ()=>{
  // increment meet savings
  const cur = Number(state.savings.meet||0);
  appRef.child('savings/meet').set(cur);
  // also push simple history and total as separate record
  pushHistory(`+Rp ${Number(state.savings.meet).toLocaleString('id-ID')} (Tabungan Tiap Ketemu)`);
  // For simplicity we keep meet as step amount not accumulated separately.
  // If you want maintain total meet saved separately, implement savings.totalMeet in state.
});

fineSaveBtn.addEventListener('click', ()=>{
  pushHistory(`+Rp ${Number(state.savings.fine).toLocaleString('id-ID')} (Denda)`);
});

/* Reset buttons just write history and set amounts to 0 locally if user wants */
resetMeetBtn.addEventListener('click', ()=>{
  appRef.child('savings/meet').set(0);
  pushHistory(`Reset Tabungan Tiap Ketemu`);
});
resetFineBtn.addEventListener('click', ()=>{
  appRef.child('savings/fine').set(0);
  pushHistory(`Reset Denda`);
});

/* Targets: add, edit, delete, addToTarget */
addTargetBtn.addEventListener('click', ()=> {
  const name = prompt('Nama target');
  if (!name) return;
  const target = Number(prompt('Masukkan nominal target (angka)', '100000')) || 0;
  const step = Number(prompt('Step setiap klik (angka)', '10000')) || 10000;
  const id = 't'+Date.now();
  const newTargets = Object.assign({}, state.targets, {[id]: { name, target, saved:0, step }});
  appRef.child('targets').set(newTargets);
  pushHistory(`Buat target "${name}" Rp ${target.toLocaleString('id-ID')}`);
});

function addToTarget(id, step){
  const t = state.targets[id];
  if (!t) return;
  const updated = Object.assign({}, state.targets);
  updated[id] = Object.assign({}, t, { saved: Number(t.saved||0) + Number(step) });
  appRef.child('targets').set(updated);
  pushHistory(`+Rp ${Number(step).toLocaleString('id-ID')} ke target "${t.name}"`);
}

function editTargetDialog(id){
  const t = state.targets[id];
  if (!t) return;
  const name = prompt('Nama target', t.name) || t.name;
  const target = Number(prompt('Nominal target', t.target)) || t.target;
  const step = Number(prompt('Step per klik', t.step)) || t.step;
  const updated = Object.assign({}, state.targets);
  updated[id] = Object.assign({}, t, { name, target, step });
  appRef.child('targets').set(updated);
  pushHistory(`Edit target "${name}"`);
}

function deleteTarget(id){
  if (!confirm('Hapus target ini?')) return;
  const updated = Object.assign({}, state.targets);
  const name = (updated[id] && updated[id].name) || 'target';
  delete updated[id];
  appRef.child('targets').set(updated);
  pushHistory(`Hapus target "${name}"`);
}

/* clear history */
clearHistoryBtn.addEventListener('click', ()=>{
  if (!confirm('Hapus semua riwayat?')) return;
  appRef.child('history').set([]);
});

/* ---------- Utility ---------- */
function calcPercent(t){
  const target = Number(t.target||0);
  const saved = Number(t.saved||0);
  if (!target) return 0;
  return Math.min(100, Math.round((saved/target)*100));
}
function timestampNow(){
  const d = new Date();
  return `${d.getDate().toString().padStart(2,'0')}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}.${d.getMinutes().toString().padStart(2,'0')}`;
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

/* ---------- Make text stronger if dim overlay applied earlier (example) ---------- */
// No heavy dim here; if you applied dimming, remove .dimmed class to increase opacity

/* ---------- End of app.js ---------- */
