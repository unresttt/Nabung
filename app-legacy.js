// ===== Firebase Init =====
const firebaseConfig = {
  apiKey: "AIzaSyC7boFrn964XUBRZf0xdyjqst3bsk_s_AE",
  authDomain: "tabungan-kita-a2b49.firebaseapp.com",
  databaseURL: "https://tabungan-kita-a2b49-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tabungan-kita-a2b49",
  storageBucket: "tabungan-kita-a2b49.appspot.com",
  messagingSenderId: "203588830235",
  appId: "1:203588830235:web:b3d7adb92b0647953264be"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== Helper =====
function formatRupiah(n){return "Rp " + n.toLocaleString("id-ID");}
function byId(id){return document.getElementById(id);}
function now(){return new Date().toLocaleString("id-ID",{hour12:false});}

// ===== Elemen =====
const meetAmt = byId("meet-amount");
const penaltyAmt = byId("penalty-amount");
const totalAmt = byId("total-amount");
const txList = byId("transactions-list");
const dots = byId("dots");

// ===== Data Lokal =====
let meet = 0, penalty = 0, history = [];

// ===== Firebase Sync =====
const refRoot = db.ref("sharedData");
refRoot.on("value", snap=>{
  const data = snap.val();
  if(!data) return;
  meet = data.meet||0;
  penalty = data.penalty||0;
  history = data.history||[];
  updateDisplay();
});

function saveFirebase(){
  refRoot.set({meet, penalty, history});
}

// ===== Update Tampilan =====
function updateDisplay(){
  meetAmt.textContent = formatRupiah(meet);
  penaltyAmt.textContent = formatRupiah(penalty);
  totalAmt.textContent = formatRupiah(meet + penalty);
  renderHistory();
}

function renderHistory(){
  txList.innerHTML = history.length ? "" : "<li><i>Belum ada transaksi</i></li>";
  history.forEach(item=>{
    const li=document.createElement("li");
    li.textContent=`[${item.time}] +${formatRupiah(item.amount)} (${item.type})`;
    txList.appendChild(li);
  });
}

// ===== Tombol Aksi =====
byId("meet-add").onclick=()=>{
  meet+=5000;
  history.unshift({time:now(),type:"Tabungan Tiap Ketemu",amount:5000});
  saveFirebase(); updateDisplay();
};
byId("meet-reset").onclick=()=>{
  if(confirm("Reset tabungan ke 0?")){meet=0; saveFirebase(); updateDisplay();}
};
byId("penalty-add").onclick=()=>{
  penalty+=50000;
  history.unshift({time:now(),type:"Denda",amount:50000});
  saveFirebase(); updateDisplay();
};
byId("penalty-reset").onclick=()=>{
  if(confirm("Reset denda ke 0?")){penalty=0; saveFirebase(); updateDisplay();}
};
byId("clear-history").onclick=()=>{
  if(confirm("Hapus semua riwayat?")){history=[]; saveFirebase(); updateDisplay();}
};

// ===== Swipe Tabs =====
const tabs = document.querySelectorAll(".tab");
let currentTab=0;
function showTab(i){
  currentTab=i;
  tabs.forEach((t,idx)=>t.style.transform=`translateX(${100*(idx-i)}%)`);
  updateDots();
}
function updateDots(){
  dots.innerHTML="";
  tabs.forEach((_,i)=>{
    const d=document.createElement("span");
    d.className="dot"+(i===currentTab?" active":"");
    d.onclick=()=>showTab(i);
    dots.appendChild(d);
  });
}
let startX=0;
document.querySelector(".tabs").addEventListener("touchstart",e=>startX=e.touches[0].clientX);
document.querySelector(".tabs").addEventListener("touchend",e=>{
  const diff=e.changedTouches[0].clientX-startX;
  if(Math.abs(diff)>50){
    if(diff<0 && currentTab<tabs.length-1) currentTab++;
    else if(diff>0 && currentTab>0) currentTab--;
    showTab(currentTab);
  }
});

// ===== Tema =====
const themeBtn = byId("toggle-theme");
themeBtn.onclick=()=>{
  document.body.classList.toggle("dark");
  themeBtn.textContent=document.body.classList.contains("dark")?"☀":"🌙";
};

// ===== Inisialisasi =====
showTab(0);
updateDisplay();
