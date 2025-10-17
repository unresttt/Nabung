// Firebase Config
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

const ROOT = "digambar";
const tabs = document.querySelector("#tabs");
const dots = document.querySelector("#dots");
const tabEls = document.querySelectorAll(".tab");

let currentTab = 0;
function setTab(i) {
  currentTab = i;
  tabs.style.transform = `translateX(-${i * 100}%)`;
  document.querySelectorAll(".dot").forEach((d, j) => d.classList.toggle("active", j === i));
}

function buildDots() {
  dots.innerHTML = "";
  tabEls.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.onclick = () => setTab(i);
    dots.appendChild(d);
  });
}
buildDots();

// Swipe gesture
let startX = 0;
tabs.addEventListener("touchstart", e => (startX = e.touches[0].clientX));
tabs.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (Math.abs(diff) > 50) {
    if (diff < 0 && currentTab < tabEls.length - 1) setTab(currentTab + 1);
    if (diff > 0 && currentTab > 0) setTab(currentTab - 1);
  }
});

// Format Rp
function formatRp(n) {
  return "Rp " + (n || 0).toLocaleString("id-ID");
}

// ================== Fitur utama ==================
const meetAmountEl = document.getElementById("meet-amount");
const penaltyAmountEl = document.getElementById("penalty-amount");
const totalAmountEl = document.getElementById("total-amount");

const STEP_MEET = 5000;
const STEP_PENALTY = 50000;

// Fungsi update
function updateUI() {
  db.ref(`${ROOT}/meet`).once("value", s => meetAmountEl.textContent = formatRp(s.val() || 0));
  db.ref(`${ROOT}/penalty`).once("value", s => penaltyAmountEl.textContent = formatRp(s.val() || 0));
}
updateUI();

// Tombol aksi
document.getElementById("meet-add").onclick = () => add("meet", STEP_MEET);
document.getElementById("penalty-add").onclick = () => add("penalty", STEP_PENALTY);
document.getElementById("meet-reset").onclick = () => db.ref(`${ROOT}/meet`).set(0);
document.getElementById("penalty-reset").onclick = () => db.ref(`${ROOT}/penalty`).set(0);

function add(type, step) {
  const refPath = db.ref(`${ROOT}/${type}`);
  refPath.once("value", snap => {
    const val = (snap.val() || 0) + step;
    refPath.set(val);
    db.ref(`${ROOT}/transactions`).push({
      ts: Date.now(),
      text: `[${new Date().toLocaleString()}] +${formatRp(step)} (${type})`
    });
  });
}

// ================== Total & Riwayat ==================
db.ref(`${ROOT}/transactions`).on("value", s => {
  const txList = document.getElementById("transactions-list");
  txList.innerHTML = "";
  const data = s.val() || {};
  Object.values(data)
    .sort((a, b) => b.ts - a.ts)
    .forEach(tx => {
      const li = document.createElement("li");
      li.textContent = tx.text;
      txList.appendChild(li);
    });
});

db.ref(`${ROOT}/meet`).on("value", calcTotal);
db.ref(`${ROOT}/penalty`).on("value", calcTotal);
db.ref(`${ROOT}/targets`).on("value", calcTotal);
function calcTotal() {
  Promise.all([
    db.ref(`${ROOT}/meet`).once("value"),
    db.ref(`${ROOT}/penalty`).once("value"),
    db.ref(`${ROOT}/targets`).once("value")
  ]).then(([m, p, t]) => {
    const meet = m.val() || 0;
    const pen = p.val() || 0;
    const targets = t.val() || {};
    let total = meet + pen;
    for (let key in targets) total += targets[key].saved || 0;
    totalAmountEl.textContent = formatRp(total);
  });
}

// ================== Mode Gelap ==================
const btnTheme = document.getElementById("toggle-theme");
btnTheme.onclick = () => document.body.classList.toggle("light");
