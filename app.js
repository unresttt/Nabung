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

// Ambil data dari localStorage
let tabungan = Number(localStorage.getItem("tabungan")) || 0;
let denda = Number(localStorage.getItem("denda")) || 0;
let history = JSON.parse(localStorage.getItem("history")) || [];

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

  localStorage.setItem("tabungan", tabungan);
  localStorage.setItem("denda", denda);
  localStorage.setItem("history", JSON.stringify(history));
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

// Fungsi untuk memuat riwayat sesuai filter
function loadRiwayat(filteredType = "all") {
  const riwayatList = document.getElementById("riwayatList");
  riwayatList.innerHTML = "";

  riwayat.forEach(item => {
    if (
      filteredType === "all" ||
      (filteredType === "tabungan" && item.includes("Tabungan Tiap Ketemu")) ||
      (filteredType === "denda" && item.includes("Denda"))
    ) {
      const p = document.createElement("p");
      p.textContent = item;
      riwayatList.appendChild(p);
    }
  });
}

// Event untuk filter select
document.getElementById("filterRiwayat").addEventListener("change", (e) => {
  loadRiwayat(e.target.value);
});

// Jalankan awal
updateDisplay();
