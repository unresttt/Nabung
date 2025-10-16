const el=(id)=>document.getElementById(id);
let tabungan=+localStorage.tabungan||0,
    denda=+localStorage.denda||0,
    riwayat=JSON.parse(localStorage.riwayat||"[]"),
    targets=JSON.parse(localStorage.targets||"[]");

function rp(n){return"Rp "+(+n).toLocaleString("id-ID");}
function simpan(){
  localStorage.tabungan=tabungan;
  localStorage.denda=denda;
  localStorage.riwayat=JSON.stringify(riwayat);
  localStorage.targets=JSON.stringify(targets);
}
function tambahRiwayat(teks){
  const w=new Date().toLocaleString("id-ID",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"});
  riwayat.unshift(`[${w}] ${teks}`);if(riwayat.length>100)riwayat.pop();
  simpan();render();
}
function totalAll(){
  return tabungan+denda+targets.reduce((a,b)=>a+(+b.saved||0),0);
}
function render(){
  el("tabungan").textContent=rp(tabungan);
  el("denda").textContent=rp(denda);
  el("total").textContent=rp(totalAll());
  const r=el("riwayat");
  r.innerHTML=riwayat.length?riwayat.map(i=>`<li>${i}</li>`).join(""):"<li><i>Belum ada transaksi</i></li>";
  const list=el("targetList");
  list.innerHTML=targets.length?"":"<p><i>Belum ada target</i></p>";
  targets.forEach((t,i)=>{
    const p=Math.min((t.saved/t.goal)*100,100);
    list.innerHTML+=`
      <div class="target-card">
        <h4>${t.name}</h4>
        <p>Target: ${rp(t.goal)}</p><p>Tersimpan: ${rp(t.saved)}</p>
        <div class="progress" style="width:${p}%"></div>
        <button class='btn blue' onclick='tabungTarget(${i})'>+${rp(t.step)}</button>
        <button class='btn' style='background:#ffa500' onclick='editTarget(${i})'>✏️</button>
        <button class='btn red' onclick='hapusTarget(${i})'>Hapus</button>
      </div>`;
  });
}
function tabungTarget(i){
  targets[i].saved+=+targets[i].step;
  tambahRiwayat(`+${rp(targets[i].step)} ke target "${targets[i].name}"`);
}
function hapusTarget(i){
  if(confirm("Hapus target ini?"))targets.splice(i,1);
  simpan();render();
}
function editTarget(i){
  const t=targets[i];
  const n=prompt("Nama target:",t.name)||t.name;
  const g=+prompt("Nominal target:",t.goal)||t.goal;
  const s=+prompt("Nominal tabung per klik:",t.step)||t.step;
  targets[i]={...t,name:n,goal:g,step:s};
  simpan();render();
}
el("addTarget").onclick=()=>{
  const n=prompt("Nama target:");if(!n)return;
  const g=+prompt("Nominal target:")||0;
  const s=+prompt("Nominal tabung per klik:")||0;
  if(g<=0||s<=0)return alert("Nominal tidak valid!");
  targets.push({name:n,goal:g,step:s,saved:0});simpan();render();
};
el("btnTabungan").onclick=()=>{tabungan+=5e3;tambahRiwayat("+Rp5.000 (Tabungan)");};
el("btnDenda").onclick=()=>{denda+=5e4;tambahRiwayat("+Rp50.000 (Denda)");};
el("resetTabungan").onclick=()=>{if(confirm("Reset tabungan?"))tabungan=0;render();};
el("resetDenda").onclick=()=>{if(confirm("Reset denda?"))denda=0;render();};
el("resetRiwayat").onclick=()=>{if(confirm("Hapus riwayat?"))riwayat=[];render();};
function swipeTabs(){
  const cont=el("tabsContainer"),dots=el("dots"),tabs=[...document.querySelectorAll(".tab-page")];
  dots.innerHTML="";tabs.forEach((_,i)=>{const d=document.createElement("div");d.onclick=()=>cont.scrollTo({left:i*cont.offsetWidth,behavior:"smooth"});dots.appendChild(d);});
  const up=()=>{const a=Math.round(cont.scrollLeft/cont.offsetWidth);dots.querySelectorAll("div").forEach((d,i)=>d.classList.toggle("active",i===a));};
  cont.addEventListener("scroll",up);up();
}
function tema(){
  const btn=el("theme");
  let d=localStorage.theme==="dark";
  document.body.classList.toggle("dark",d);
  btn.textContent=d?"☀":"🌙";
  btn.onclick=()=>{
    d=!d;localStorage.theme=d?"dark":"light";
    document.body.classList.toggle("dark",d);
    btn.textContent=d?"☀":"🌙";
  };
}
tema();swipeTabs();render();
