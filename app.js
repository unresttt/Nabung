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

// 🎯 Elemen target tabungan
const inputTarget = document.getElementById("input-target");
const setTargetBtn = document.getElementById("set-target");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

// Ambil data dari localStorage
let tabungan = Number(localStorage.getItem("tabungan")) || 0;
let denda = Number(localStorage.getItem("denda")) || 0;
let history = JSON.parse(localStorage.getItem("history")) || [];
let targetTabungan = Number(localStorage.getItem("targetTabungan")) || 0;

// Format Rupiah
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

// Fungsi animasi angka naik
function animateValue(el, start, end, duration) {
  const range = end - start;
  let startTime = null;
  function step(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    el.textContent = formatRupiah(Math.floor(start + range * progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Tampilkan semua data
function updateDisplay(animated = false) {
  if (animated) {
    animateValue(tabunganEl, parseInt(tabunganEl.textContent.replace(/\D/g, '')) || 0, tabungan, 300);
    animateValue(dendaEl, parseInt(dendaEl.textContent.replace(/\D/g, '')) || 0, denda, 300);
  } else {
    tabunganEl.textContent = formatRupiah(tabungan);
    dendaEl.textContent = formatRupiah(denda);
  }

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
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  history.unshift({
    waktu: waktuStr,
    jenis: jenis,
    jumlah: jumlah
  });
  if (history.length > 50) history.pop(); // batasi max 50 entri
  updateDisplay();
}

// Render riwayat ke tampilan
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

// 🎯 Update tampilan target tabungan
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

  if (progress >= 100) {
    progressText.textContent += " 🎉 Target Tercapai!";
  }
}

// Event tombol
btnTabungan.addEventListener("click", () => {
  tabungan += 5000;
  addHistory("Tabungan Tiap Ketemu", 5000);
  updateDisplay(true);
});

btnDenda.addEventListener("click", () => {
  denda += 50000;
  addHistory("Denda", 50000);
  updateDisplay(true);
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
  if (confirm("Hapus semua riwayat transaksi?")) {
    history = [];
    updateDisplay();
  }
});

// 🎯 Set target baru
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

// ====== Swipe Tabs ======
const tabsContainer = document.getElementById("tabsContainer");
const dots = document.querySelectorAll(".dot");
let currentTab = 0;

function updateDots() {
  dots.forEach((d, i) => {
    d.classList.toggle("active", i === currentTab);
  });
}

tabsContainer.addEventListener("touchstart", handleTouchStart, false);
tabsContainer.addEventListener("touchmove", handleTouchMove, false);

let x1 = null;
function handleTouchStart(e) {
  x1 = e.touches[0].clientX;
}

function handleTouchMove(e) {
  if (!x1) return;
  let x2 = e.touches[0].clientX;
  let diff = x1 - x2;

  if (diff > 50 && currentTab < 2) currentTab++; // geser kiri
  else if (diff < -50 && currentTab > 0) currentTab--; // geser kanan

  tabsContainer.style.transform = `translateX(-${currentTab * 100}%)`;
  updateDots();
  x1 = null;
}

// Klik dot juga bisa pindah tab
dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    currentTab = index;
    tabsContainer.style.transform = `translateX(-${index * 100}%)`;
    updateDots();
  });
});
