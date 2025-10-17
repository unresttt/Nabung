/* app-legacy.js
   Legacy style, uses firebase compat SDK included in index.html
*/

/* ---------- Firebase config (from your earlier message) ---------- */
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* Realtime paths under a single shared node so both devices use same db */
const rootPath = 'shared_v1';
const refTargets = db.ref(`${rootPath}/targets`);
const refMeet = db.ref(`${rootPath}/meet`);
const refPenalty = db.ref(`${rootPath}/penalty`);
const refTransactions = db.ref(`${rootPath}/transactions`);

/* ---------- Helpers ---------- */
function fmtRupiah(num){
  const n = Number(num) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}
function nowStamp(){
  const d = new Date();
  const Y = d.getFullYear();
  const M = String(d.getMonth()+1).padStart(2,'0');
  const D = String(d.getDate()).padStart(2,'0');
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `[${D}/${M}/${Y} ${hh}.${mm}]`;
}

/* ---------- UI refs ---------- */
const targetsList = document.getElementById('targets-list');
const btnAddTarget = document.getElementById('btn-add-target');

const meetAmountEl = document.getElementById('meet-amount');
const penaltyAmountEl = document.getElementById('penalty-amount');
const meetAddBtn = document.getElementById('meet-add');
const meetResetBtn = document.getElementById('meet-reset');
const penaltyAddBtn = document.getElementById('penalty-add');
const penaltyResetBtn = document.getElementById('penalty-reset');

const totalAmountEl = document.getElementById('total-amount');

const txList = document.getElementById('transactions-list');
const clearHistoryBtn = document.getElementById('clear-history');

/* Modal */
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const targetNameIn = document.getElementById('target-name');
const targetAmountIn = document.getElementById('target-amount');

/* Tabs / slider */
const tabsInner = document.querySelector('.tabs-inner');
const tabs = Array.from(document.querySelectorAll('.tab'));
const dotsContainer = document.getElementById('dots');
let activeIndex = 0;

/* create dots */
function renderDots(){
  dotsContainer.innerHTML = '';
  for(let i=0;i<tabs.length;i++){
    const b = document.createElement('button');
    b.dataset.idx = i;
    if(i===activeIndex) b.classList.add('active');
    b.addEventListener('click',()=>setActive(i));
    dotsContainer.appendChild(b);
  }
}
renderDots();

/* set active tab by index */
function setActive(i, animate = true){
  activeIndex = Math.max(0, Math.min(i, tabs.length-1));
  const px = -activeIndex * window.innerWidth;
  if(!animate) tabsInner.style.transition = 'none';
  else tabsInner.style.transition = 'transform 300ms ease';
  tabsInner.style.transform = `translateX(${px}px)`;
  // update dots
  Array.from(dotsContainer.children).forEach((d, idx)=> d.classList.toggle('active', idx===activeIndex));
  // ensure transition restored
  setTimeout(()=>tabsInner.style.transition = 'transform 300ms ease', 10);
}

/* handle resize to keep full-width tabs */
window.addEventListener('resize', ()=> setActive(activeIndex,false));

/* touch (swipe) support */
let startX = 0, deltaX = 0, touching = false;
tabsInner.addEventListener('touchstart', (e)=>{
  if(e.touches.length !== 1) return;
  touching = true;
  startX = e.touches[0].clientX;
  tabsInner.style.transition = 'none';
});
tabsInner.addEventListener('touchmove', (e)=>{
  if(!touching) return;
  deltaX = e.touches[0].clientX - startX;
  const px = -activeIndex * window.innerWidth + deltaX;
  tabsInner.style.transform = `translateX(${px}px)`;
});
tabsInner.addEventListener('touchend', (e)=>{
  touching = false;
  const threshold = window.innerWidth * 0.18;
  if(deltaX > threshold) setActive(activeIndex - 1);
  else if(deltaX < -threshold) setActive(activeIndex + 1);
  else setActive(activeIndex);
  deltaX = 0;
});

/* ---------- Realtime listeners / initial setup ---------- */

/* Targets list render */
function renderTargets(snapshot){
  const val = snapshot.val() || {};
  targetsList.innerHTML = '';
  // order by created key insertion (firebase push keys)
  Object.keys(val).forEach(key => {
    const t = val[key];
    const card = document.createElement('div');
    card.className = 'target-card';
    card.innerHTML = `
      <div class="target-title">
        <div>
          <strong style="font-size:18px">${escapeHtml(t.name || 'Target')}</strong>
          <div style="color:var(--muted); font-size:13px">Target: ${fmtRupiah(t.target||0)}</div>
          <div style="color:var(--muted); font-size:13px">Tersimpan: ${fmtRupiah(t.saved||0)}</div>
        </div>
        <div>
          <button class="btn red btn-remove" data-key="${key}">Hapus</button>
        </div>
      </div>
      <div style="height:10px"></div>
      <div class="controls">
        <button class="btn blue btn-add" data-key="${key}" data-amt="${t.increment || 10000}">+Rp ${numberToShort(t.increment||10000)}</button>
        <button class="btn yellow btn-edit" data-key="${key}">Mengatur ulang</button>
      </div>
    `;
    targetsList.appendChild(card);
  });
  // attach handlers
  Array.from(document.querySelectorAll('.btn-remove')).forEach(btn=>{
    btn.onclick = ()=> {
      const k = btn.dataset.key;
      if(!confirm('Hapus target ini?')) return;
      refTargets.child(k).remove();
      addTransaction(`Hapus target "${(document.querySelector(`[data-key="${k}"]`)?.closest('.target-card')?.querySelector('strong')?.textContent) || k}"`);
    };
  });
  Array.from(document.querySelectorAll('.btn-add')).forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.key;
      const inc = Number(btn.dataset.amt) || 0;
      refTargets.child(k).once('value', snap=>{
        const t = snap.val() || {};
        const newSaved = (Number(t.saved)||0) + inc;
        refTargets.child(k).update({ saved: newSaved });
        addTransaction(`+Rp ${numberToShort(inc)} ke target "${t.name||'Target'}"`, inc);
      });
    };
  });
  Array.from(document.querySelectorAll('.btn-edit')).forEach(btn=>{
    btn.onclick = ()=>{
      const k = btn.dataset.key;
      // open modal prefill
      refTargets.child(k).once('value', snap=>{
        const t = snap.val() || {};
        openModal('Edit Target', t.name || '', t.target || 0, ()=>{
          const nm = targetNameIn.value.trim();
          const amt = Number(targetAmountIn.value.replace(/[^\d]/g,'')) || 0;
          refTargets.child(k).update({ name: nm, target: amt });
          addTransaction(`Mengatur target "${nm}" Rp ${amt}`);
        });
      });
    };
  });
}

/* meet / penalty listeners (single values) */
refMeet.on('value', snap=>{
  const v = snap.val() || 0;
  meetAmountEl.textContent = fmtRupiah(v);
  calcTotal();
});
refPenalty.on('value', snap=>{
  const v = snap.val() || 0;
  penaltyAmountEl.textContent = fmtRupiah(v);
  calcTotal();
});

/* targets listener */
refTargets.on('value', renderTargets);

/* transactions listener */
refTransactions.on('value', snap=>{
  const v = snap.val() || {};
  txList.innerHTML = '';
  Object.keys(v).reverse().forEach(k=>{
    const t = v[k];
    const li = document.createElement('li');
    li.textContent = `${t.time || ''} ${t.note || ''}`;
    txList.appendChild(li);
  });
});

/* ---------- Event handlers ---------- */

/* Add target */
btnAddTarget.addEventListener('click', ()=> openModal('Tambah Target','',0, ()=>{
  const nm = targetNameIn.value.trim();
  const amt = Number(targetAmountIn.value.replace(/[^\d]/g,'')) || 0;
  if(!nm) { alert('Isi nama target'); return; }
  const newKey = refTargets.push().key;
  refTargets.child(newKey).set({ name: nm, target: amt, saved: 0, increment: 10000 });
  addTransaction(`Buat target "${nm}" Rp ${amt}`);
}));

/* Modal basic */
function openModal(title='', name='', amount=0, onSave){
  modalTitle.textContent = title;
  targetNameIn.value = name;
  targetAmountIn.value = amount || '';
  modal.classList.remove('hidden');
  modalSave.onclick = ()=>{
    if(typeof onSave === 'function') onSave();
    modal.classList.add('hidden');
  };
}
modalCancel.addEventListener('click', ()=> modal.classList.add('hidden'));

/* meet & penalty add/reset */
meetAddBtn.addEventListener('click', ()=> {
  const inc = 5000;
  refMeet.transaction(curr => (Number(curr)||0) + inc );
  addTransaction(`+Rp ${numberToShort(5000)} (Tabungan Tiap Ketemu)`, 5000);
});
meetResetBtn.addEventListener('click', ()=> {
  if(!confirm('Reset Tabungan Tiap Ketemu ke 0?')) return;
  refMeet.set(0);
  addTransaction(`Reset Tabungan Tiap Ketemu`);
});

penaltyAddBtn.addEventListener('click', ()=> {
  const inc = 50000;
  refPenalty.transaction(curr => (Number(curr)||0) + inc );
  addTransaction(`+Rp ${numberToShort(50000)} (Denda)`, 50000);
});
penaltyResetBtn.addEventListener('click', ()=> {
  if(!confirm('Reset Denda ke 0?')) return;
  refPenalty.set(0);
  addTransaction(`Reset Denda`);
});

/* clear history */
clearHistoryBtn.addEventListener('click', ()=>{
  if(!confirm('Hapus semua riwayat?')) return;
  refTransactions.remove();
});

/* Add transaction helper (push) */
function addTransaction(note, amount){
  const key = refTransactions.push().key;
  refTransactions.child(key).set({
    time: nowStamp(),
    note: note,
    amount: amount || 0
  });
}

/* calc total: meet + penalty + sum targets.saved */
function calcTotal(){
  Promise.all([
    refMeet.once('value'),
    refPenalty.once('value'),
    refTargets.once('value')
  ]).then(([m,p,t])=>{
    const meet = Number(m.val()) || 0;
    const pen = Number(p.val()) || 0;
    const targets = t.val() || {};
    let sumTargets = 0;
    Object.values(targets).forEach(x => sumTargets += Number(x.saved) || 0);
    const total = meet + pen + sumTargets;
    totalAmountEl.textContent = fmtRupiah(total);
  });
}

/* initial create default nodes if not exist */
function ensureDefaults(){
  refMeet.once('value', snap=> { if(snap.val() === null) refMeet.set(0); });
  refPenalty.once('value', snap=> { if(snap.val() === null) refPenalty.set(0); });
  refTargets.once('value', snap=> { if(snap.val() === null) refTargets.set({}); });
  refTransactions.once('value', snap=> { if(snap.val() === null) refTransactions.set({}); });
}
ensureDefaults();

/* utility: escape html for safety */
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

/* number short for buttons display */
function numberToShort(n){
  const v = Number(n)||0;
  if(v >= 1000000) return (v/1000000).toFixed(v%1000000?1:0) + '.000.000';
  if(v >= 1000) return v.toLocaleString('id-ID');
  return v;
}

/* ---------- Init ---------- */
setActive(0, false);

/* ensure tab width matches viewport on load */
window.addEventListener('load', ()=> {
  // small defer to ensure DOM ready
  setTimeout(()=> setActive(0,false), 60);
});
