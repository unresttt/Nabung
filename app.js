// Inisialisasi nilai awal
let tabungan = 0;
let denda = 0;

// Ambil elemen DOM
const tabunganEl = document.getElementById("tabungan");
const dendaEl = document.getElementById("denda");
const btnTabungan = document.getElementById("btn-tabungan");
const btnDenda = document.getElementById("btn-denda");

// Fungsi format rupiah
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

// Event klik tombol Tabungan
btnTabungan.addEventListener("click", () => {
  tabungan += 5000;
  tabunganEl.textContent = formatRupiah(tabungan);
});

// Event klik tombol Denda
btnDenda.addEventListener("click", () => {
  denda += 50000;
  dendaEl.textContent = formatRupiah(denda);
});
