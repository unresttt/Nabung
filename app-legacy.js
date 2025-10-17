// app-legacy.js (Final Responsive Stable)
const APP_VERSION = "v1.2.8"; // ← otomatis update di setiap rilis

console.log("Aplikasi Tabungan - " + APP_VERSION);

// Cek update otomatis
(async () => {
  const cacheKey = 'app_version_cache';
  const stored = localStorage.getItem(cacheKey);
  if (stored !== APP_VERSION) {
    localStorage.setItem(cacheKey, APP_VERSION);
    console.log("Versi baru terdeteksi:", APP_VERSION);
    if ('caches' in window) {
      const names = await caches.keys();
      for (let name of names) await caches.delete(name);
    }
  }
})();

// ========================
//   DATA & UTILITAS
// ========================
const el = id => document.getElementById(id);
const fmt = n => "Rp " + n.toLocaleString("id-ID");

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch { return fallback; }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ========================
//   STATE APLIKASI
// ========================
let state = {
  targets: load("targets", []),
  meet: load("meet", 0),
  penalty: load("penalty", 0),
  transactions: load("transactions", [])
};

// ========================
//   RENDER FUNGSI
// ========================
function renderTargets() {
  const list = el("targets-list");
  list.innerHTML = "";
  if (state.targets.length === 0) {
    list.innerHTML = "<p class='muted'>Belum ada target tabungan</p>";
    return;
  }

  state.targets.forEach((t, i) => {
    const card = document.createElement("div");
    card.className = "target-card";
    card.innerHTML = `
      <div class="target-title">
        <strong>${t.name}</strong>
        <button class="btn red" data-del="${i}">Hapus</button>
      </div>
      <p>Target: ${fmt(t.amount)}</p>
      <p>Tersimpan: ${fmt(t.saved)}</p>
      <div class="controls">
        <button class="btn blue" data-add="${i}">+Rp 10.000</button>
        <button class="btn muted" data-reset="${i}">Mengatur ulang</button>
      </div>
    `;
    list.appendChild(card);
  });
  save("targets", state.targets);
}

function renderTotals() {
  const total = state.meet + state.penalty + state.targets.reduce((a, b) => a + b.saved, 0);
  el("total-amount").textContent = fmt(total);
  save("meet", state.meet);
  save("penalty", state.penalty);
}

function renderHistory() {
  const list = el("transactions-list");
  list.innerHTML = state.transactions.length
    ? state.transactions.map(tx => `<li>${tx}</li>`).join("")
    : "<p class='muted'>Belum ada transaksi</p>";
  save("transactions", state.transactions);
}

// ========================
//   EVENT HANDLERS
// ========================
document.body.addEventListener("click", e => {
  const t = e.target;

  if (t.id === "btn-add-target") {
    el("modal").classList.remove("hidden");
    el("target-name").value = "";
    el("target-amount").value = "";
  }

  if (t.id === "modal-cancel") el("modal").classList.add("hidden");

  if (t.id === "modal-save") {
    const name = el("target-name").value.trim();
    const amount = parseInt(el("target-amount").value) || 0;
    if (!name || !amount) return alert("Isi nama dan nominal target!");
    state.targets.push({ name, amount, saved: 0 });
    state.transactions.unshift(`[${new Date().toLocaleString("id-ID")}] Tambah target baru: ${name} (${fmt(amount)})`);
    el("modal").classList.add("hidden");
    renderTargets();
    renderTotals();
    renderHistory();
  }

  if (t.matches("[data-del]")) {
    const i = +t.dataset.del;
    const delName = state.targets[i].name;
    state.targets.splice(i, 1);
    state.transactions.unshift(`[${new Date().toLocaleString("id-ID")}] Hapus target: ${delName}`);
    renderTargets(); renderTotals(); renderHistory();
  }

  if (t.matches("[data-add]")) {
    const i = +t.dataset.add;
    state.targets[i].saved += 10000;
    state.transactions.unshift(`[${new Date().toLocaleString("id-ID")}] +Rp 10.000 ke ${state.targets[i].name}`);
    renderTargets(); renderTotals(); renderHistory();
  }

  if (t.matches("[data-reset]")) {
    const i = +t.dataset.reset;
    state.targets[i].saved = 0;
    state.transactions.unshift(`[${new Date().toLocaleString("id-ID")}] Reset tabungan untuk ${state.targets[i].name}`);
    renderTargets(); renderTotals(); renderHistory();
  }

  if (t.id === "meet-add") {
    state.meet += 5000;
    state.transactions.unshift(`[${new Date().toLocaleString("id-ID")}] +Rp 5.000 (Tabungan Tiap Ketemu)`);
    renderTotals(); renderHistory();
  }

  if (t.id === "meet-reset") {
    state.meet = 0;
    state.transactions.unshift(`[${new Date().toLocaleString("id-ID")}] Reset Tabungan Tiap Ketemu`);
    renderTotals(); renderHistory();
  }

  if (t.id === "penalty-add") {
    state.penalty += 50000;
    state.transactions.unshift(`[${new Date().toLocaleString("id-ID")}] +Rp 50.000 (Denda)`);
    renderTotals(); renderHistory();
  }

  if (t.id === "penalty-reset") {
    state.penalty = 0;
    state.transactions.unshift(`[${new Date().toLocaleString("id-ID")}] Reset Denda`);
    renderTotals(); renderHistory();
  }

  if (t.id === "clear-history") {
    if (confirm("Yakin ingin menghapus semua riwayat?")) {
      state.transactions = [];
      renderHistory();
    }
  }
});

// ========================
//   SWIPE NAVIGASI
// ========================
const tabsWrapper = document.getElementById("tabs-wrapper");
const tabsInner = document.querySelector(".tabs-inner");
const dots = document.getElementById("dots");

let currentTab = 0;
let startX = 0;

for (let i = 0; i < 4; i++) {
  const dot = document.createElement("button");
  dot.addEventListener("click", () => goToTab(i));
  dots.appendChild(dot);
}
function goToTab(i) {
  currentTab = i;
  tabsInner.style.transform = `translateX(-${i * 100}vw)`;
  dots.querySelectorAll("button").forEach((b, n) => b.classList.toggle("active", n === i));
}
goToTab(0);

tabsWrapper.addEventListener("touchstart", e => startX = e.touches[0].clientX);
tabsWrapper.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (Math.abs(diff) > 50) {
    if (diff < 0 && currentTab < 3) goToTab(currentTab + 1);
    else if (diff > 0 && currentTab > 0) goToTab(currentTab - 1);
  }
});

// ========================
//   TEMA
// ========================
el("toggle-theme").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// Inisialisasi awal
renderTargets();
renderTotals();
renderHistory();
