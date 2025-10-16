// Ambil elemen
const tabunganEl = document.getElementById("tabungan");
const dendaEl = document.getElementById("denda");
const totalEl = document.getElementById("total");
const historyList = document.getElementById("history-list");
const btnTabungan = document.getElementById("btn-tabungan");
const btnDenda = document.getElementById("btn-denda");
const resetTabungan = document.getElementById("reset-tabungan");
const resetDenda = document.getElementById("reset-denda");
const resetHistory = document.getElementById("reset-history");

// Target tabungan
const inputTarget = document.getElementById("input-target");
const setTargetBtn = document.getElementById("set-target");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

// Data awal
let tabungan = Number(localStorage.getItem("tabungan")) || 0;
let denda = Number(localStorage.getItem("denda")) || 0;
let history = JSON.parse(localStorage.getItem("history")) || [];
let targetTabungan = Number(localStorage.getItem("targetTabungan")) || 0;

// Format rupiah
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

// Update semua tampilan
function updateDisplay() {
  tabunganEl.textContent = formatRupiah(tabungan);
  dendaEl.textContent = formatRupiah(denda);
  totalEl.textContent = formatRupiah(tabungan + denda);
  renderHistory();
  updateTargetDisplay();

  localStorage.setItem("tabungan", tabungan);
  localStorage.setItem("denda", denda);
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("targetTabungan", targetTabungan);
}

// Tambah riwayat
function addHistory(jenis, jumlah) {
  const waktu = new Date();
  const waktuStr = waktu.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
  history.unshift({ waktu: waktuStr, jenis, jumlah });
  if (history.length > 50) history.pop();
  updateDisplay();
}

// Render riwayat
function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.innerHTML = "<li><i>Belum ada transaksi</i></li>";
    return;
  }
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `[${item.waktu}] +${formatRupiah(item.jumlah)} (${item.jenis})`;
    historyList.appendChild(li);
  });
}

// Update target
function updateTargetDisplay() {
  if (targetTabungan <= 0) {
    progressText.textContent = "Belum ada target";
    progressFill.style.width = "0%";
    return;
  }
  const total = tabungan + denda;
  const progress = Math.min((total / targetTabungan) * 100, 100);
  progressFill.style.width = progress + "%";
  progressText.textContent = `Progress: ${formatRupiah(total)} / ${formatRupiah(targetTabungan)} (${Math.floor(progress)}%)`;
  if (progress >= 100) progressText.textContent += " 🎉 Target Tercapai!";
}

// Tombol event
btnTabungan.addEventListener("click", () => {
  tabungan += 5000;
  addHistory("Tabungan Tiap Ketemu", 5000);
});

btnDenda.addEventListener("click", () => {
  denda += 50000;
  addHistory("Denda", 50000);
});

resetTabungan.addEventListener("click", () => {
  if (confirm("Reset tabungan ke Rp 0?")) {
    tabungan = 0;
    updateDisplay();
  }
});

resetDenda.addEventListener("click", () => {
  if (confirm("Reset denda ke Rp 0?")) {
    denda = 0;
    updateDisplay();
  }
});

resetHistory.addEventListener("click", () => {
  if (confirm("Hapus semua riwayat?")) {
    history = [];
    updateDisplay();
  }
});

setTargetBtn.addEventListener("click", () => {
  const val = Number(inputTarget.value);
  if (val > 0) {
    targetTabungan = val;
    localStorage.setItem("targetTabungan", targetTabungan);
    updateTargetDisplay();
  } else {
    alert("Masukkan nominal target yang valid!");
  }
});

// Jalankan awal
updateDisplay();

// ===== Swipe Tabs =====
const tabsContainer = document.getElementById("tabsContainer");
const dots = document.querySelectorAll(".dot");
let currentTab = 0;

function updateDots() {
  dots.forEach((d, i) => d.classList.toggle("active", i === currentTab));
}

let x1 = null;
tabsContainer.addEventListener("touchstart", e => x1 = e.touches[0].clientX);
tabsContainer.addEventListener("touchmove", e => {
  if (!x1) return;
  let diff = x1 - e.touches[0].clientX;
  if (diff > 50 && currentTab < 2) currentTab++;
  else if (diff < -50 && currentTab > 0) currentTab--;
  tabsContainer.scrollTo({ left: currentTab * tabsContainer.offsetWidth, behavior: "smooth" });
  updateDots();
  x1 = null;
});

dots.forEach((dot, i) => dot.addEventListener("click", () => {
  currentTab = i;
  tabsContainer.scrollTo({ left: i * tabsContainer.offsetWidth, behavior: "smooth" });
  updateDots();
}));

tabsContainer.addEventListener("scroll", () => {
  const index = Math.round(tabsContainer.scrollLeft / tabsContainer.offsetWidth);
  if (index !== currentTab) {
    currentTab = index;
    updateDots();
  }
});

// ===== Tema Terang / Gelap =====
const themeToggle = document.getElementById("theme-toggle");
let currentTheme = localStorage.getItem("theme") || "light";
document.body.classList.add(currentTheme);
themeToggle.textContent = currentTheme === "light" ? "🌙 Gelap" : "☀️ Terang";

themeToggle.addEventListener("click", () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    themeToggle.textContent = "☀️ Terang";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.replace("dark", "light");
    themeToggle.textContent = "🌙 Gelap";
    localStorage.setItem("theme", "light");
  }
});
