// Ambil elemen
const tabunganEl = document.getElementById("tabungan");
const dendaEl = document.getElementById("denda");
const totalEl = document.getElementById("total");
const btnTabungan = document.getElementById("btn-tabungan");
const btnDenda = document.getElementById("btn-denda");
const resetTabungan = document.getElementById("reset-tabungan");
const resetDenda = document.getElementById("reset-denda");

// Ambil data dari localStorage
let tabungan = Number(localStorage.getItem("tabungan")) || 0;
let denda = Number(localStorage.getItem("denda")) || 0;

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

// Update tampilan
function updateDisplay(animated = false) {
  if (animated) {
    animateValue(tabunganEl, parseInt(tabunganEl.textContent.replace(/\D/g, '')) || 0, tabungan, 300);
    animateValue(dendaEl, parseInt(dendaEl.textContent.replace(/\D/g, '')) || 0, denda, 300);
  } else {
    tabunganEl.textContent = formatRupiah(tabungan);
    dendaEl.textContent = formatRupiah(denda);
  }
  totalEl.textContent = formatRupiah(tabungan + denda);
  localStorage.setItem("tabungan", tabungan);
  localStorage.setItem("denda", denda);
}

// Event: tombol tabungan
btnTabungan.addEventListener("click", () => {
  tabungan += 5000;
  updateDisplay(true);
});

// Event: tombol denda
btnDenda.addEventListener("click", () => {
  denda += 50000;
  updateDisplay(true);
});

// Reset tombol
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

// Jalankan pertama kali
updateDisplay();
