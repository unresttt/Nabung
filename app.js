let tabungan = 0;
let denda = 0;
let riwayat = [];
let target = 0;

const tabunganDisplay = document.getElementById("tabunganDisplay");
const dendaDisplay = document.getElementById("dendaDisplay");
const totalDisplay = document.getElementById("totalDisplay");
const riwayatList = document.getElementById("riwayatList");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

function formatRupiah(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

function updateDisplay() {
  const total = tabungan + denda;
  tabunganDisplay.textContent = formatRupiah(tabungan);
  dendaDisplay.textContent = formatRupiah(denda);
  totalDisplay.textContent = formatRupiah(total);

  if (target > 0) {
    const percent = Math.min((total / target) * 100, 100);
    progressText.textContent = `Progress: ${formatRupiah(total)} / ${formatRupiah(target)} (${Math.floor(percent)}%)`;
    progressFill.style.width = `${percent}%`;
  } else {
    progressText.textContent = `Progress: ${formatRupiah(total)} / Rp 0 (0%)`;
    progressFill.style.width = `0%`;
  }
}

// ===== Tombol Aksi =====
document.getElementById("tabungBtnKetemu").addEventListener("click", () => {
  tabungan += 5000;
  addRiwayat(5000, "Tabungan Tiap Ketemu");
});

document.getElementById("tabungBtnDenda").addEventListener("click", () => {
  denda += 50000;
  addRiwayat(50000, "Denda");
});

document.getElementById("resetKetemu").addEventListener("click", () => {
  tabungan = 0;
  updateDisplay();
});

document.getElementById("resetDenda").addEventListener("click", () => {
  denda = 0;
  updateDisplay();
});

document.getElementById("hapusRiwayat").addEventListener("click", () => {
  riwayat = [];
  renderRiwayat();
});

document.getElementById("setTarget").addEventListener("click", () => {
  const input = document.getElementById("targetInput").value;
  target = parseInt(input) || 0;
  updateDisplay();
});

// ===== Riwayat =====
function addRiwayat(amount, type) {
  const now = new Date();
  const timeStr = `[${now.toLocaleDateString("id-ID")} ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}]`;
  riwayat.unshift(`${timeStr} +${formatRupiah(amount)} (${type})`);
  renderRiwayat();
}

function renderRiwayat() {
  riwayatList.innerHTML = riwayat.length
    ? riwayat.map(r => `<li>${r}</li>`).join("")
    : "<li><em>Belum ada transaksi</em></li>";
  updateDisplay();
}

// ===== Swipe Tabs =====
const tabsContainer = document.getElementById("tabsContainer");
const dots = document.querySelectorAll(".dot");
let currentTab = 0;

function updateDots() {
  dots.forEach((d, i) => d.classList.toggle("active", i === currentTab));
}

let startX = 0;
let isDragging = false;

tabsContainer.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  isDragging = true;
});

tabsContainer.addEventListener("touchend", e => {
  if (!isDragging) return;
  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentTab < 2) currentTab++; // geser kiri → tab berikut
    if (diff < 0 && currentTab > 0) currentTab--; // geser kanan → tab sebelumnya
  }
  tabsContainer.scrollTo({ left: currentTab * tabsContainer.offsetWidth, behavior: "smooth" });
  updateDots();
  isDragging = false;
});

dots.forEach((dot, i) =>
  dot.addEventListener("click", () => {
    currentTab = i;
    tabsContainer.scrollTo({ left: i * tabsContainer.offsetWidth, behavior: "smooth" });
    updateDots();
  })
);

// ===== Mode Terang / Gelap =====
const themeToggle = document.getElementById("theme-toggle");
let currentTheme = localStorage.getItem("theme") || "light";
document.body.classList.add(currentTheme);
themeToggle.textContent = currentTheme === "light" ? "🌙" : "☀";

themeToggle.addEventListener("click", () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    themeToggle.textContent = "☀";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.replace("dark", "light");
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

updateDisplay();
