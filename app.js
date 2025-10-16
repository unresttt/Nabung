/* app.js - realtime shared tabungan (compat API) */

/* ========== Firebase config (sesuaikan jika perlu) ========== */
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

/* Initialize */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* DB paths */
const SHARED_ROOT = 'shared_v1'; // namespace (simple versioning)
const dbTargets = db.ref(`${SHARED_ROOT}/targets`);
const dbMeet = db.ref(`${SHARED_ROOT}/meet`);       // single numeric value
const dbFines = db.ref(`${SHARED_ROOT}/fines`);     // single numeric value
const dbTransactions = db.ref(`${SHARED_ROOT}/transactions`);

/* UI refs */
const tabsContainer = document.getElementById('tabsContainer');
const dots = Array.from(document.querySelectorAll('.dot'));
const targetsList = document.getElementById('targetsList');
const historyList = document.getElementById('historyList');
const totalAmountEl = document.getElementById('totalAmount');
const themeToggle = document.getElementById('theme-toggle');

/* Meet/denda buttons */
const btnMeetAdd = document.getElementById('btn-meet-add');
const btnMeetReset = document.getElementById('btn-meet-reset');
const btnFineAdd = document.getElementById('btn-fine-add');
const btnFineReset = document.getElementById('btn-fine-reset');

const btnAddTarget = document.getElementById('btn-add-target');
const btnClearHistory = document.getElementById('btn-clear-history');

/* local cache */
let targets = {}; // {id:{title,target,saved,step}}
let meetValue = 0;
let fineValue = 0;
let transactions = [];

/* --- Helper utilities --- */
function formatRp(n){
  if(!n && n !== 0) return 'Rp 0';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}
function nowLabel(){
  const d = new Date();
  return `[${d.getDate()}/${("0"+(d.getMonth()+1)).slice(-2)}/${d.getFullYear()} ${("0"+d.getHours()).slice(-2)}.${("0"+d.getMinutes()).slice(-2)}]`;
}
function pushTransaction(text){
  const t = {ts: Date.now(), label: `${nowLabel()} ${text}`};
  dbTransactions.push(t);
}

/* ========== Realtime listeners ========== */

/* Targets (object keyed by push-id) */
dbTargets.on('value', snap => {
  const val = snap.val() || {};
  targets = val;
  renderTargets();
  updateTotal();
});

/* meet value */
dbMeet.on('value', snap => {
  meetValue = snap.val() || 0;
  // no separate UI number here; meet used in total and history
  updateTotal();
});

/* fines */
dbFines.on('value', snap => {
  fineValue = snap.val() || 0;
  updateTotal();
});

/* transactions */
dbTransactions.on('value', snap => {
  const val = snap.val() || {};
  transactions = Object.values(val).sort((a,b)=>b.ts - a.ts);
  renderHistory();
});

/* ========== UI render functions ========== */
function renderTargets(){
  targetsList.innerHTML = '';
  const ids = Object.keys(targets);
  if(ids.length === 0){
    const p = document.createElement('div'); p.className='muted'; p.textContent = 'Belum ada target';
    targetsList.appendChild(p); return;
  }
  ids.forEach(id => {
    const t = targets[id];
    const item = document.createElement('div'); item.className='target-item';
    // header
    const head = document.createElement('div'); head.className='target-head';
    const title = document.createElement('div'); title.className='target-title'; title.textContent = t.title || 'Target';
    const del = document.createElement('button'); del.className='btn red'; del.textContent = 'Hapus';
    del.onclick = ()=> removeTarget(id);
    head.appendChild(title); head.appendChild(del);

    const body = document.createElement('div');
    const pTarget = document.createElement('div'); pTarget.className='muted'; pTarget.textContent = `Target: ${formatRp(t.target)}`;
    const pSaved = document.createElement('div'); pSaved.className='muted'; pSaved.textContent = `Tersimpan: ${formatRp(t.saved)}`;
    const progress = document.createElement('div'); progress.className='progress-bar';
    const fill = document.createElement('div'); fill.className='progress-fill';
    const pct = t.target ? Math.min(100, Math.round((t.saved / t.target)*100)) : 0;
    fill.style.width = pct + '%';
    progress.appendChild(fill);

    const row = document.createElement('div'); row.className='row actions';
    const addBtn = document.createElement('button'); addBtn.className='btn blue'; addBtn.textContent = (t.step ? `+Rp ${Number(t.step).toLocaleString('id-ID')}` : '+Tabung');
    addBtn.onclick = ()=> addToTarget(id, t.step || 0);
    const editBtn = document.createElement('button'); editBtn.className='btn yellow'; editBtn.textContent='Mengatur ulang';
    editBtn.onclick = ()=> editTargetPrompt(id);
    row.appendChild(addBtn); row.appendChild(editBtn);

    body.appendChild(pTarget); body.appendChild(pSaved); body.appendChild(progress); body.appendChild(row);

    item.appendChild(head); item.appendChild(body);
    targetsList.appendChild(item);
  });
}

function renderHistory(){
  historyList.innerHTML = '';
  if(transactions.length === 0){
    const li = document.createElement('li'); li.className='muted'; li.textContent='Belum ada transaksi';
    historyList.appendChild(li); return;
  }
  transactions.forEach(tx => {
    const li = document.createElement('li'); li.textContent = tx.label; historyList.appendChild(li);
  });
}

function updateTotal(){
  // total is sum of all target saved + meetValue + fineValue
  const sumTargets = Object.values(targets).reduce((s,t)=> s + (Number(t.saved)||0), 0);
  const total = sumTargets + (Number(meetValue)||0) + (Number(fineValue)||0);
  totalAmountEl.textContent = formatRp(total);
}

/* ========== CRUD actions (sync to DB) ========== */

function addToTarget(id, amount){
  amount = Number(amount) || 0;
  if(amount === 0) return;
  // atomic update: get current, increment
  const targetRef = dbTargets.child(id);
  targetRef.transaction(current => {
    if(!current) return current;
    current.saved = (Number(current.saved)||0) + amount;
    return current;
  }).then(()=> {
    pushTransaction(`+Rp ${amount.toLocaleString('id-ID')} ke target "${targets[id].title}"`);
  });
}

function removeTarget(id){
  dbTargets.child(id).remove();
  pushTransaction(`[Target Dihapus] ${targets[id] ? targets[id].title : id}`);
}

function editTargetPrompt(id){
  const t = targets[id];
  const newTitle = prompt('Nama Target:', t.title);
  if(newTitle === null) return;
  const newTarget = prompt('Jumlah Target (angka):', t.target);
  if(newTarget === null) return;
  const newStep = prompt('Step tambah (misal 5000):', t.step || 0);
  if(newTarget !== null){
    dbTargets.child(id).update({
      title: newTitle,
      target: Number(newTarget),
      step: Number(newStep||0)
    });
  }
}

/* create new target */
function createTarget(){
  const title = prompt('Nama target (contoh: Beli Helm)');
  if(!title) return;
  const target = Number(prompt('Jumlah target (angka):', '100000')) || 0;
  const step = Number(prompt('Step tambah default (angka):', '10000')) || 0;
  const payload = {title, target, saved:0, step};
  dbTargets.push(payload);
}

/* meet / fines handlers */
function incMeet(amount){
  amount = Number(amount)||0;
  dbMeet.transaction(curr => (Number(curr)||0) + amount);
  pushTransaction(`+Rp ${amount.toLocaleString('id-ID')} (Tabungan Tiap Ketemu)`);
}
function resetMeet(){
  dbMeet.set(0);
  pushTransaction(`Reset Tabungan Tiap Ketemu`);
}

function incFine(amount){
  amount = Number(amount)||0;
  dbFines.transaction(curr => (Number(curr)||0) + amount);
  pushTransaction(`+Rp ${amount.toLocaleString('id-ID')} (Denda)`);
}
function resetFine(){
  dbFines.set(0);
  pushTransaction(`Reset Denda`);
}

/* clear history */
function clearHistory(){
  if(!confirm('Hapus semua riwayat transaksi?')) return;
  dbTransactions.remove();
}

/* ========== Events binding ========= */
btnAddTarget.addEventListener('click', createTarget);
btnMeetAdd.addEventListener('click', ()=> incMeet(5000));
btnMeetReset.addEventListener('click', resetMeet);
btnFineAdd.addEventListener('click', ()=> incFine(50000));
btnFineReset.addEventListener('click', resetFine);
btnClearHistory.addEventListener('click', clearHistory);

/* addToTarget via per-target add is in renderTargets */

/* ========== theme toggle (local only) ========== */
function loadTheme(){
  const t = localStorage.getItem('theme') || 'dark';
  if(t === 'light') document.body.classList.add('light');
  themeToggle.textContent = (t === 'light' ? '☀' : '🌙');
}
themeToggle.addEventListener('click', ()=>{
  if(document.body.classList.contains('light')){
    document.body.classList.remove('light');
    localStorage.setItem('theme','dark');
    themeToggle.textContent = '🌙';
  } else {
    document.body.classList.add('light');
    localStorage.setItem('theme','light');
    themeToggle.textContent = '☀';
  }
});
loadTheme();

/* ========== swipe tabs & dot controls (minimal) ========== */
let currentTab = 0;
const tabCount = 4;
const swipeArea = tabsContainer;
let startX = null;
function setTab(i){
  currentTab = Math.max(0, Math.min(tabCount-1, i));
  tabsContainer.style.transform = `translateX(-${currentTab * 100}%)`;
  dots.forEach((d,idx)=> d.classList.toggle('active', idx===currentTab));
}
dots.forEach((d, idx)=> d.addEventListener('click', ()=> setTab(idx)));

/* touch handlers */
swipeArea.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});
swipeArea.addEventListener('touchmove', e => {
  if(!startX) return;
  const diff = e.touches[0].clientX - startX;
  // allow vertical scroll: only react if horizontal drag beyond threshold
  if(Math.abs(diff) > 40){
    if(diff < -50) setTab(currentTab + 1);
    else if(diff > 50) setTab(currentTab - 1);
    startX = null;
  }
});
swipeArea.addEventListener('touchend', ()=> startX = null);

/* init default tab pos */
setTab(0);

/* ========== initial seeds (if DB empty, set default structure so UI neat) ========== */
function ensureSeeds(){
  db.ref(SHARED_ROOT).once('value', snap => {
    const v = snap.val();
    if(!v){
      // create defaults: two targets sample, meet & fines 0
      dbTargets.push({title:'Beli Helm', target:300000, saved:100000, step:100000});
      dbTargets.push({title:'Bikin Rumah', target:100000000, saved:0, step:1000000});
      dbMeet.set(0);
      dbFines.set(0);
    }
  });
}
ensureSeeds();

/* End of app.js */
