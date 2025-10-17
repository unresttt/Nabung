// app.js (type=module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, set, push, update, remove } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

/* ---------- FIREBASE CONFIG: pakai config projectmu ---------- */
/* kamu sebelumnya share config — aku pakai config yang sama */
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

/* ---------- DATABASE ROOT we agreed: 'digambar' ---------- */
const ROOT = 'digambar'; // IMPORTANT: jangan ganti kecuali DB node lain

/* paths */
const paths = {
  meet: `${ROOT}/meet`,             // tabungan tiap ketemu
  penalty: `${ROOT}/penalty`,       // denda
  targets: `${ROOT}/targets`,       // map of targets
  tx: `${ROOT}/transactions`        // history
};

/* ---------- UI refs ---------- */
const tabs = document.querySelector('#tabs');
const dots = document.querySelector('#dots');
const tabEls = document.querySelectorAll('.tab');

let currentIndex = 0;
const setTab = (i) => {
  currentIndex = i;
  tabs.style.transform = `translateX(-${i*100}%)`;
  document.querySelectorAll('.dot').forEach((d,idx)=>d.classList.toggle('active', idx===i));
};
function buildDots(){
  dots.innerHTML = '';
  for(let i=0;i<tabEls.length;i++){
    const el = document.createElement('div');
    el.className='dot'+(i===0?' active':'');
    el.addEventListener('click', ()=> setTab(i));
    dots.appendChild(el);
  }
}
buildDots();

/* swipe support */
let startX=0, endX=0;
tabs.addEventListener('touchstart', e=>{ startX = e.touches[0].clientX; });
tabs.addEventListener('touchmove', e=>{ endX = e.touches[0].clientX; });
tabs.addEventListener('touchend', e=>{
  const diff = endX - startX;
  if(Math.abs(diff) < 30) return;
  if(diff < 0 && currentIndex < tabEls.length-1) setTab(currentIndex+1);
  if(diff > 0 && currentIndex > 0) setTab(currentIndex-1);
});

/* ---------- UI elements for features ---------- */
/* targets */
const targetsList = document.getElementById('targets-list');
const btnAddTarget = document.getElementById('btn-add-target');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const targetNameInput = document.getElementById('target-name');
const targetAmountInput = document.getElementById('target-amount');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');

let editTargetId = null;

btnAddTarget.addEventListener('click', ()=>{
  modalTitle.textContent='Tambah Target';
  targetNameInput.value='';
  targetAmountInput.value='';
  editTargetId = null;
  modal.classList.remove('hidden');
});
modalCancel.addEventListener('click', ()=> modal.classList.add('hidden'));

modalSave.addEventListener('click', async ()=>{
  const name = (targetNameInput.value || '').trim();
  const amount = parseInt((targetAmountInput.value||'0').replace(/\D/g,''),10) || 0;
  if(!name || amount<=0) {
    alert('Nama target dan jumlah target harus diisi (angka > 0)');
    return;
  }
  if(editTargetId){
    // update target
    await update(ref(db, `${paths.targets}/${editTargetId}`), { name, target: amount });
  } else {
    // push new
    const newRef = push(ref(db, paths.targets));
    await set(newRef, { name, target: amount, saved: 0 });
  }
  modal.classList.add('hidden');
});

/* meet & penalty controls */
const meetAmountEl = document.getElementById('meet-amount');
const penaltyAmountEl = document.getElementById('penalty-amount');
const meetAddBtn = document.getElementById('meet-add');
const meetResetBtn = document.getElementById('meet-reset');
const penaltyAddBtn = document.getElementById('penalty-add');
const penaltyResetBtn = document.getElementById('penalty-reset');

meetAddBtn.addEventListener('click', ()=> modifySimpleAmount('meet', 1)); // one step
penaltyAddBtn.addEventListener('click', ()=> modifySimpleAmount('penalty', 1));
meetResetBtn.addEventListener('click', ()=> set(ref(db, paths.meet), 0));
penaltyResetBtn.addEventListener('click', ()=> set(ref(db, paths.penalty), 0));

/* step amounts (you can change step sizes here) */
const STEP_MEET = 5000; // Rp 5.000 default per click
const STEP_PENALTY = 50000; // Rp 50.000 default

async function modifySimpleAmount(kind, times=1){
  const path = kind==='meet' ? paths.meet : paths.penalty;
  const step = kind==='meet' ? STEP_MEET : STEP_PENALTY;
  const add = step * times;
  // read current, then update using set (atomic not used; for simple app it's okay)
  const snapshotRef = ref(db, path);
  onValue(snapshotRef, snap=>{
    const cur = Number(snap.val() || 0);
    // set updated value
    set(ref(db, path), cur + add);
    // push to transactions
    push(ref(db, paths.tx), {
      ts: Date.now(),
      human: new Date().toLocaleString(),
      amount: add,
      type: kind === 'meet' ? 'Tabungan Tiap Ketemu' : 'Denda'
    });
  }, { onlyOnce:true });
}

/* total */
const totalAmountEl = document.getElementById('total-amount');

/* transactions */
const txListEl = document.getElementById('transactions-list');
const clearHistoryBtn = document.getElementById('clear-history');
clearHistoryBtn.addEventListener('click', ()=> {
  if(confirm('Hapus semua riwayat transaksi?')) remove(ref(db, paths.tx));
});

/* realtime listeners */
onValue(ref(db, paths.meet), snap=>{
  const val = Number(snap.val()||0);
  meetAmountEl.textContent = formatRp(val);
  calcTotalUI();
});
onValue(ref(db, paths.penalty), snap=>{
  const val = Number(snap.val()||0);
  penaltyAmountEl.textContent = formatRp(val);
  calcTotalUI();
});

/* targets listener */
onValue(ref(db, paths.targets), snap=>{
  const data = snap.val() || {};
  renderTargets(data);
  calcTotalUI();
});

/* transactions listener */
onValue(ref(db, paths.tx), snap=>{
  const data = snap.val() || {};
  renderTransactions(data);
});

/* render helpers */
function renderTargets(map){
  targetsList.innerHTML = '';
  const entries = Object.entries(map);
  if(entries.length===0){
    const el = document.createElement('div');
    el.className='card';
    el.textContent='Belum ada target';
    targetsList.appendChild(el);
    return;
  }
  entries.forEach(([id, t])=>{
    const card = document.createElement('div');
    card.className='card';
    const title = document.createElement('h3');
    title.textContent = t.name || '—';
    const info = document.createElement('p');
    info.className='amount';
    info.textContent = `Target: ${formatRp(t.target||0)}  •  Tersimpan: ${formatRp(t.saved||0)}`;
    // progress bar simplified
    const progressBar = document.createElement('div');
    progressBar.style.height='8px';
    progressBar.style.borderRadius='8px';
    progressBar.style.background='rgba(255,255,255,.06)';
    progressBar.style.margin='8px 0';
    const inner = document.createElement('div');
    inner.style.height='100%';
    const per = t.target ? Math.min(100, Math.round(((t.saved||0)/t.target)*100)) : 0;
    inner.style.width = per + '%';
    inner.style.background = 'linear-gradient(90deg,#1be1c0,#1e90ff)';
    inner.style.borderRadius='8px';
    progressBar.appendChild(inner);

    const controls = document.createElement('div');
    controls.className='controls';
    const addBtn = document.createElement('button');
    addBtn.className='btn blue';
    addBtn.textContent = '+Rp 10.000';
    addBtn.addEventListener('click', async ()=>{
      const step=10000;
      const curSaved = Number(t.saved || 0);
      await update(ref(db, `${paths.targets}/${id}`), { saved: curSaved + step });
      // push transaction
      push(ref(db, paths.tx), { ts: Date.now(), human: new Date().toLocaleString(), amount: step, type: `ke target "${t.name}"` });
    });

    const editBtn = document.createElement('button');
    editBtn.className='btn yellow';
    editBtn.textContent = 'Mengatur ulang';
    editBtn.addEventListener('click', ()=>{
      editTargetId = id;
      modalTitle.textContent='Edit Target';
      targetNameInput.value = t.name || '';
      targetAmountInput.value = (t.target || 0);
      modal.classList.remove('hidden');
    });

    const delBtn = document.createElement('button');
    delBtn.className='btn red';
    delBtn.textContent = 'Hapus';
    delBtn.addEventListener('click', ()=> {
      if(confirm('Hapus target ini?')) {
        remove(ref(db, `${paths.targets}/${id}`));
        push(ref(db, paths.tx), { ts: Date.now(), human: new Date().toLocaleString(), amount: 0, type: `Hapus target "${t.name}"` });
      }
    });

    controls.append(addBtn, editBtn, delBtn);
    card.append(title, info, progressBar, controls);
    targetsList.appendChild(card);
  });
}

/* render transactions */
function renderTransactions(map){
  txListEl.innerHTML = '';
  const entries = Object.entries(map || {}).sort((a,b)=> b[1].ts - a[1].ts);
  entries.forEach(([_, tx])=>{
    const li = document.createElement('li');
    li.textContent = `[${tx.human}] ${tx.amount>=0 ? '+' : ''}${formatRp(tx.amount)} ${tx.type ? tx.type : ''}`;
    txListEl.appendChild(li);
  });
}

/* calculate total */
async function calcTotalUI(){
  // read latest values (onValue callbacks keep things updated)
  const meetVal = Number((await getOnce(paths.meet)) || 0);
  const penaltyVal = Number((await getOnce(paths.penalty)) || 0);

  // sum targets saved
  const targetsSnap = await getOnceObj(paths.targets);
  let sumTargetsSaved = 0;
  for(const id in targetsSnap){
    sumTargetsSaved += Number(targetsSnap[id].saved || 0);
  }
  const total = meetVal + penaltyVal + sumTargetsSaved;
  totalAmountEl.textContent = formatRp(total);
}

/* helper to read once */
function getOnce(path){
  return new Promise((res)=>{
    onValue(ref(db, path), snap=>{
      res(snap.val());
    }, { onlyOnce:true });
  });
}
function getOnceObj(path){
  return new Promise((res)=>{
    onValue(ref(db, path), snap=>{
      res(snap.val() || {});
    }, { onlyOnce:true });
  });
}

/* helpers */
function formatRp(num){
  if(!num) return 'Rp 0';
  const s = Number(num).toLocaleString('id-ID');
  return `Rp ${s}`;
}

/* simple initializations */
document.querySelectorAll('.hidden').forEach(n=>n.classList.remove('hidden')); // show if any were auto-hidden
// theme toggle
const themeBtn = document.getElementById('toggle-theme');
themeBtn.addEventListener('click', ()=> {
  document.body.classList.toggle('light');
});
