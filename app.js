const el = id => document.getElementById(id);

// ===== Data Storage =====
let data = JSON.parse(localStorage.getItem("nabungData")) || {
  save: 0, fine: 0, targets: [], history: []
};
function saveData() {
  localStorage.setItem("nabungData", JSON.stringify(data));
}

// ===== Update UI =====
function updateUI() {
  el("saveDisplay").textContent = format(data.save);
  el("fineDisplay").textContent = format(data.fine);
  updateTargetList();
  el("totalDisplay").textContent = format(totalAll());
  updateHistory();
  saveData();
}
function format(n) {
  return "Rp " + n.toLocaleString("id-ID");
}

// ===== Tabungan & Denda =====
el("addSave").onclick = () => addMoney("save", 5000, "Tabungan");
el("addFine").onclick = () => addMoney("fine", 50000, "Denda");
el("resetSave").onclick = () => reset("save");
el("resetFine").onclick = () => reset("fine");

function addMoney(type, amount, label) {
  data[type] += amount;
  data.history.unshift(`[${waktu()}] +${format(amount)} (${label})`);
  updateUI();
}
function reset(type) {
  data[type] = 0;
  updateUI();
}
function waktu() {
  return new Date().toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
}
function totalAll() {
  let tTarget = data.targets.reduce((a, t) => a + t.saved, 0);
  return data.save + data.fine + tTarget;
}

// ===== Target Tabungan =====
el("addTargetBtn").onclick = () => {
  let name = prompt("Nama target:");
  let goal = +prompt("Nominal target:");
  let step = +prompt("Nominal tiap tambah:");
  if (!name || !goal || !step) return;
  data.targets.push({ name, goal, saved: 0, step });
  updateUI();
};

function updateTargetList() {
  const list = el("targetList");
  list.innerHTML = "";
  data.targets.forEach((t, i) => {
    let card = document.createElement("div");
    card.className = "target-card";
    let progress = Math.min((t.saved / t.goal) * 100, 100);
    card.innerHTML = `
      <h3>${t.name}</h3>
      <p>Target: ${format(t.goal)}</p>
      <p>Tersimpan: ${format(t.saved)}</p>
      <div class="progress" style="width:${progress}%"></div>
      <div>
        <button class="btn blue" onclick="addToTarget(${i})">+${format(t.step)}</button>
        <button class="btn red" onclick="deleteTarget(${i})">Hapus</button>
      </div>`;
    list.appendChild(card);
  });
}
function addToTarget(i) {
  data.targets[i].saved += data.targets[i].step;
  data.history.unshift(`[${waktu()}] +${format(data.targets[i].step)} ke target "${data.targets[i].name}"`);
  updateUI();
}
function deleteTarget(i) {
  if (confirm("Hapus target ini?")) {
    data.targets.splice(i, 1);
    updateUI();
  }
}

// ===== History =====
function updateHistory() {
  const list = el("historyList");
  list.innerHTML = data.history.length
    ? data.history.map(h => `<li>${h}</li>`).join("")
    : "<li><i>Belum ada transaksi</i></li>";
}
el("clearHistory").onclick = () => {
  if (confirm("Hapus semua riwayat?")) {
    data.history = [];
    updateUI();
  }
};

// ===== Theme Toggle =====
const themeToggle = el("theme-toggle");
let theme = localStorage.getItem("theme") || "light";
document.body.classList.toggle("dark", theme === "dark");
themeToggle.textContent = theme === "light" ? "🌙" : "☀";
themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  themeToggle.textContent = dark ? "☀" : "🌙";
};

// ===== Swipe Tabs =====
function swipeTabs() {
  const cont = el("tabsContainer"),
        dots = el("dots"),
        tabs = [...document.querySelectorAll(".tab-page")];
  dots.innerHTML = "";
  tabs.forEach((_, i) => {
    const d = document.createElement("div");
    d.onclick = () => scrollToTab(i);
    dots.appendChild(d);
  });

  function scrollToTab(i) {
    cont.scrollTo({ left: i * cont.offsetWidth, behavior: "smooth" });
    setActive(i);
  }

  function setActive(i) {
    tabs.forEach((t, j) => t.classList.toggle("hidden", j !== i));
    dots.querySelectorAll("div").forEach((d, j) => d.classList.toggle("active", j === i));
  }

  cont.addEventListener("scroll", () => {
    const i = Math.round(cont.scrollLeft / cont.offsetWidth);
    setActive(i);
  });

  setActive(0);
}

swipeTabs();
updateUI();
