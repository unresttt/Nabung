let tabungan = 0;
let denda = 0;
let riwayat = [];
let targets = JSON.parse(localStorage.getItem("targets")) || [];

// ===== Format Uang =====
function formatRupiah(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

// ===== Update Display =====
function updateDisplay() {
  document.getElementById("tabunganDisplay").textContent = formatRupiah(tabungan);
  document.getElementById("dendaDisplay").textContent = formatRupiah(denda);
  document.getElementById("totalDisplay").textContent = formatRupiah(tabungan + denda);
  renderTargets();
  renderRiwayat();
  saveData();
}

// ===== Simpan ke LocalStorage =====
function saveData() {
  localStorage.setItem("targets", JSON.stringify(targets));
  localStorage.setItem("riwayat", JSON.stringify(riwayat));
}

// ===== Render Riwayat =====
function renderRiwayat() {
  const list = document.getElementById("riwayatList");
  if (riwayat.length === 0) {
    list.innerHTML = "<li><em>Belum ada transaksi</em></li>";
  } else {
    list.innerHTML = riwayat.map(r => `<li>${r}</li>`).join("");
  }
}

// ===== Tambah Riwayat =====
function addRiwayat(amount, type) {
  const waktu = new Date().toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  riwayat.unshift(`[${waktu}] +${formatRupiah(amount)} (${type})`);
  saveData();
  renderRiwayat();
}

// ===== Tabungan & Denda =====
document.getElementById("tabungBtnKetemu").onclick = () => {
  tabungan += 5000;
  addRiwayat(5000, "Tabungan Tiap Ketemu");
  updateDisplay();
};

document.getElementById("tabungBtnDenda").onclick = () => {
  denda += 50000;
  addRiwayat(50000, "Denda");
  updateDisplay();
};

document.getElementById("resetKetemu").onclick = () => { tabungan = 0; updateDisplay(); };
document.getElementById("resetDenda").onclick = () => { denda = 0; updateDisplay(); };
document.getElementById("hapusRiwayat").onclick = () => { riwayat = []; updateDisplay(); };

// ===== Target Tabungan =====
function renderTargets() {
  const container = document.getElementById("targetList");
  container.innerHTML = "";
  if (targets.length === 0) {
    container.innerHTML = "<p><em>Belum ada target</em></p>";
    return;
  }

  targets.forEach((t, index) => {
    const div = document.createElement("div");
    div.className = "target-card";
    const progress = Math.min((t.saved / t.goal) * 100, 100);

    div.innerHTML = `
      <h4>${t.name}</h4>
      <p>Target: ${formatRupiah(t.goal)}</p>
      <p>Tersimpan: ${formatRupiah(t.saved)}</p>
      <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
      <button class="tabung" onclick="tabungTarget(${index})">+${formatRupiah(t.step)}</button>
      <button class="reset" onclick="hapusTarget(${index})">Hapus</button>
    `;
    container.appendChild(div);
  });
}

function tabungTarget(i) {
  targets[i].saved += targets[i].step;
  addRiwayat(targets[i].step, `Target: ${targets[i].name}`);
  updateDisplay();
}

function hapusTarget(i) {
  if (confirm("Hapus target ini?")) {
    targets.splice(i, 1);
    updateDisplay();
  }
}

// ===== Tambah Target Baru =====
document.getElementById("addTargetBtn").onclick = () => {
  const name = prompt("Nama target:");
  if (!name) return;

  const goal = parseInt(prompt("Nominal target (Rp):")) || 0;
  const step = parseInt(prompt("Nominal tabung per klik (Rp):")) || 0;

  if (goal <= 0 || step <= 0) {
    alert("Nominal tidak valid!");
    return;
  }

  targets.push({ name, goal, step, saved: 0 });
  updateDisplay();
};

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
    if (diff > 0 && currentTab < 2) currentTab++;
    if (diff < 0 && currentTab > 0) currentTab--;
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

// ===== Tema Terang/Gelap =====
const themeToggle = document.getElementById("theme-toggle");
let currentTheme = localStorage.getItem("theme") || "light";
document.body.classList.add(currentTheme);
themeToggle.textContent = currentTheme === "light" ? "🌙" : "☀";

themeToggle.onclick = () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    themeToggle.textContent = "☀";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.replace("dark", "light");
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
};

// ===== Jalankan Awal =====
updateDisplay();
