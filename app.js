// === Data Awal ===
let tabunganKetemu = parseInt(localStorage.getItem("tabunganKetemu")) || 0;
let tabunganDenda = parseInt(localStorage.getItem("tabunganDenda")) || 0;
let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
let target = parseInt(localStorage.getItem("target")) || 0;

// === Fungsi Display ===
function updateDisplay() {
  document.getElementById("totalDisplay").textContent =
    "Rp " + (tabunganKetemu + tabunganDenda).toLocaleString();

  // update progress target
  const progress = document.getElementById("progress");
  const progressText = document.getElementById("progressText");
  let total = tabunganKetemu + tabunganDenda;
  let percent = target ? Math.min((total / target) * 100, 100) : 0;

  progress.style.width = percent + "%";
  progressText.textContent = `Progress: Rp ${total.toLocaleString()} / Rp ${target.toLocaleString()} (${percent.toFixed(0)}%)`;

  // update riwayat
  const list = document.getElementById("riwayatList");
  list.innerHTML = riwayat.map((r) => `<li>${r}</li>`).join("");
}

// === Tombol Tabung ===
document.getElementById("tabungKetemu").addEventListener("click", () => {
  tabunganKetemu += 5000;
  localStorage.setItem("tabunganKetemu", tabunganKetemu);
  riwayat.unshift(`[${new Date().toLocaleString()}] +Rp 5.000 (Tabungan Tiap Ketemu)`);
  localStorage.setItem("riwayat", JSON.stringify(riwayat));
  updateDisplay();
});

document.getElementById("tabungDenda").addEventListener("click", () => {
  tabunganDenda += 50000;
  localStorage.setItem("tabunganDenda", tabunganDenda);
  riwayat.unshift(`[${new Date().toLocaleString()}] +Rp 50.000 (Denda)`);
  localStorage.setItem("riwayat", JSON.stringify(riwayat));
  updateDisplay();
});

// === Reset Tombol ===
document.getElementById("resetKetemu").addEventListener("click", () => {
  tabunganKetemu = 0;
  localStorage.setItem("tabunganKetemu", tabunganKetemu);
  updateDisplay();
});

document.getElementById("resetDenda").addEventListener("click", () => {
  tabunganDenda = 0;
  localStorage.setItem("tabunganDenda", tabunganDenda);
  updateDisplay();
});

document.getElementById("hapusRiwayat").addEventListener("click", () => {
  riwayat = [];
  localStorage.setItem("riwayat", JSON.stringify(riwayat));
  updateDisplay();
});

// === Target Tabungan ===
document.getElementById("setTarget").addEventListener("click", () => {
  target = parseInt(document.getElementById("targetInput").value) || 0;
  localStorage.setItem("target", target);
  updateDisplay();
});

// === Swipe Tabs ===
const tabsContainer = document.getElementById("tabsContainer");
const dots = document.querySelectorAll(".dot");
let currentTab = 0;

function updateDots() {
  dots.forEach((d, i) => d.classList.toggle("active", i === currentTab));
}

let x1 = null;
tabsContainer.addEventListener("touchstart", (e) => (x1 = e.touches[0].clientX));
tabsContainer.addEventListener("touchmove", (e) => {
  if (!x1) return;
  let diff = x1 - e.touches[0].clientX;
  if (diff > 50 && currentTab < 2) currentTab++;
  else if (diff < -50 && currentTab > 0) currentTab--;
  tabsContainer.scrollTo({ left: currentTab * tabsContainer.offsetWidth, behavior: "smooth" });
  updateDots();
  x1 = null;
});
dots.forEach((dot, i) =>
  dot.addEventListener("click", () => {
    currentTab = i;
    tabsContainer.scrollTo({ left: i * tabsContainer.offsetWidth, behavior: "smooth" });
    updateDots();
  })
);
tabsContainer.addEventListener("scroll", () => {
  const index = Math.round(tabsContainer.scrollLeft / tabsContainer.offsetWidth);
  if (index !== currentTab) {
    currentTab = index;
    updateDots();
  }
});

// === Tema Terang/Gelap ===
const themeToggle = document.getElementById("theme-toggle");
let currentTheme = localStorage.getItem("theme") || "light";
document.body.classList.add(currentTheme);
themeToggle.textContent = currentTheme === "light" ? "🌙" : "☀️";

themeToggle.addEventListener("click", () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.replace("dark", "light");
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

updateDisplay();
