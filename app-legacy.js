/* ================================
   APP_VERSION = '2.1.0'
   Aplikasi Tabungan Realtime
   ================================ */

// ====== Inisialisasi Firebase ======
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
const refRoot = db.ref("sharedData");

// ====== Helper Function ======
const byId = id => document.getElementById(id);
const formatRupiah = n => "Rp " + n.toLocaleString("id-ID");
const now = () => new Date().toLocaleString("id-ID", { hour12: false });

// ====== Variabel Data ======
let meet = 0, penalty = 0, targets = [], history = [];

// ====== Ambil Data Realtime ======
refRoot.on("value", snap => {
  const data = snap.val();
  if (!data) return;
  meet = data.meet || 0;
  penalty = data.penalty || 0;
  targets = data.targets || [];
  history = data.history || [];
  updateDisplay();
});

// ====== Simpan ke Firebase ======
function saveFirebase() {
  refRoot.set({ meet, penalty, targets, history });
}

// ====== Update Tampilan ======
function updateDisplay() {
  byId("meet-amount").textContent = formatRupiah(meet);
  byId("penalty-amount").textContent = formatRupiah(penalty);
  byId("total-amount").textContent = formatRupiah(meet + penalty + totalTarget());
  renderTargets();
  renderHistory();
}

// ====== Target Tabungan ======
function totalTarget() {
  return targets.reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
}
function renderTargets() {
  const list = byId("targets-list");
  list.innerHTML = "";
  if (!targets.length) {
    list.innerHTML = "<p class='muted'><i>Belum ada target tabungan</i></p>";
    return;
  }
  targets.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h4>${t.name}</h4>
      <p class="amount">${formatRupiah(t.amount)}</p>
      <div class="controls">
        <button class="btn blue" onclick="editTarget(${i})">Edit</button>
        <button class="btn red" onclick="deleteTarget(${i})">Hapus</button>
      </div>`;
    list.appendChild(div);
  });
}
function addTarget(name, amount) {
  targets.push({ name, amount: parseInt(amount) || 0 });
  saveFirebase();
}
function editTarget(index) {
  const t = targets[index];
  const name = prompt("Ubah nama target:", t.name);
  if (name === null) return;
  const amount = prompt("Ubah nominal:", t.amount);
  if (amount === null) return;
  targets[index] = { name, amount: parseInt(amount) || 0 };
  saveFirebase();
}
function deleteTarget(index) {
  if (confirm("Hapus target ini?")) {
    targets.splice(index, 1);
    saveFirebase();
  }
}

// ====== Riwayat ======
function renderHistory() {
  const list = byId("transactions-list");
  list.innerHTML = "";
  if (!history.length) {
    list.innerHTML = "<li><i>Belum ada transaksi</i></li>";
    return;
  }
  history.forEach(h => {
    const li = document.createElement("li");
    li.textContent = `[${h.time}] +${formatRupiah(h.amount)} (${h.type})`;
    list.appendChild(li);
  });
}
function addHistory(type, amount) {
  history.unshift({ time: now(), type, amount });
  if (history.length > 50) history.pop();
  saveFirebase();
}

// ====== Tombol Tabungan & Denda ======
byId("meet-add").onclick = () => {
  meet += 5000;
  addHistory("Tabungan Tiap Ketemu", 5000);
};
byId("meet-reset").onclick = () => {
  if (confirm("Reset tabungan ke 0?")) { meet = 0; saveFirebase(); }
};
byId("penalty-add").onclick = () => {
  penalty += 50000;
  addHistory("Denda", 50000);
};
byId("penalty-reset").onclick = () => {
  if (confirm("Reset denda ke 0?")) { penalty = 0; saveFirebase(); }
};
byId("clear-history").onclick = () => {
  if (confirm("Hapus semua riwayat transaksi?")) { history = []; saveFirebase(); }
};

// ====== Tambah Target ======
byId("btn-add-target").onclick = () => {
  byId("modal").classList.remove("hidden");
  byId("modal-title").textContent = "Tambah Target";
  byId("target-name").value = "";
  byId("target-amount").value = "";
};
byId("modal-cancel").onclick = () => byId("modal").classList.add("hidden");
byId("modal-save").onclick = () => {
  const name = byId("target-name").value.trim();
  const amount = byId("target-amount").value.trim();
  if (!name || !amount) return alert("Isi semua kolom!");
  addTarget(name, amount);
  byId("modal").classList.add("hidden");
};

// ====== Swipe Tabs ======
const tabsContainer = document.querySelector(".tabs-inner");
const dots = document.querySelector("#dots");
const tabs = document.querySelectorAll(".tab");
let currentTab = 0;

function updateDots() {
  dots.innerHTML = "";
  tabs.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "dot" + (i === currentTab ? " active" : "");
    d.onclick = () => showTab(i);
    dots.appendChild(d);
  });
}
function showTab(i) {
  currentTab = i;
  tabsContainer.style.transform = `translateX(-${i * 100}%)`;
  updateDots();
}
let startX = 0;
tabsContainer.addEventListener("touchstart", e => (startX = e.touches[0].clientX));
tabsContainer.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (Math.abs(diff) > 60) {
    if (diff < 0 && currentTab < tabs.length - 1) currentTab++;
    if (diff > 0 && currentTab > 0) currentTab--;
    showTab(currentTab);
  }
});

// ====== Mode Gelap ======
byId("toggle-theme").onclick = () => {
  document.body.classList.toggle("dark");
  byId("toggle-theme").textContent = document.body.classList.contains("dark") ? "☀" : "🌙";
};

// ====== Inisialisasi ======
function init() {
  updateDots();
  showTab(0);
  updateDisplay();
}
init();

// === SISTEM SWIPE ANTAR TAB ===
let startX = 0;
let currentTab = 0;
const tabs = document.querySelectorAll('.tab');
const dots = document.querySelectorAll('.dot');

function showTab(index) {
  if (index < 0) index = tabs.length - 1;
  if (index >= tabs.length) index = 0;
  tabs.forEach((tab, i) => {
    tab.style.transform = `translateX(${100 * (i - index)}%)`;
  });
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  currentTab = index;
}

document.querySelector('#tabs').addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});

document.querySelector('#tabs').addEventListener('touchend', e => {
  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;
  if (Math.abs(diff) > 50) {
    showTab(currentTab + (diff > 0 ? 1 : -1));
  }
});

// Inisialisasi posisi tab
showTab(0);
