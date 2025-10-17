<!-- app-legacy.js -->
<script>
// Firebase SDK (compat version, tanpa import module)
const firebaseConfig = {
  apiKey: "AIzaSyC7boFrn964XUBRZf0xdyjqst3bsk_s_AE",
  authDomain: "tabungan-kita-a2b49.firebaseapp.com",
  databaseURL: "https://tabungan-kita-a2b49-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tabungan-kita-a2b49",
  storageBucket: "tabungan-kita-a2b49.firebasedatabase.app",
  messagingSenderId: "203588830235",
  appId: "1:203588830235:web:b3d7adb92b0647953264be",
  measurementId: "G-7D99H7QWHK"
};

// pastikan Firebase compat library dipanggil lebih dulu
</script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js"></script>

<script>
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// sisanya sama seperti di app.js versi modular,
// tapi ubah semua:
//   ref(db, 'path')
// menjadi:
//   db.ref('path')
//
// dan ubah semua:
//   onValue(ref(db, ...))
// menjadi:
//   db.ref(...).on('value', (snap)=>{ ... })
//
// serta semua:
//   set(ref(db,...), value)
// menjadi:
//   db.ref(...).set(value)
//
//   push(ref(db,...), obj)
// menjadi:
//   db.ref(...).push(obj)
//
//  update(ref(db,...), obj)
// menjadi:
//   db.ref(...).update(obj)
//
//  remove(ref(db,...))
// menjadi:
//   db.ref(...).remove()
//
// Setelah kamu ubah itu, fungsi tombol & swipe pasti aktif lagi.
// (kalau mau aku bantu ubah otomatis seluruh script-nya juga bisa)
</script>
