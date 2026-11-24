// ===== DATA =====
const RODS = [
  { lv: 1,  nama: "Joran Bambu",     icon: "🎋", power: 0,  harga: 0,     desc: "Joran awal pemula" },
  { lv: 2,  nama: "Joran Kayu",      icon: "🪵", power: 8,  harga: 800,   desc: "+8% peluang Rare" },
  { lv: 4,  nama: "Joran Karbon",    icon: "🎣", power: 18, harga: 2500,  desc: "+18% peluang Rare" },
  { lv: 7,  nama: "Joran Titanium",  icon: "⚙️", power: 30, harga: 8000,  desc: "+30% peluang Epic" },
  { lv: 11, nama: "Joran Kristal",   icon: "💎", power: 45, harga: 20000, desc: "+45% peluang Epic" },
  { lv: 16, nama: "Joran Dewa Laut", icon: "👑", power: 70, harga: 50000, desc: "+70% peluang Legendary" },
];
const FISH = [
  { nama: "Gobi",      tier: "Common",    emoji: "🐟", min: 0.02, max: 0.08, yen: 50,   xp: 10,  w: 60 },
  { nama: "Mutiara",   tier: "Common",    emoji: "🐠", min: 0.02, max: 0.36, yen: 80,   xp: 12,  w: 55 },
  { nama: "Kakap",     tier: "Uncommon",  emoji: "🐡", min: 0.5,  max: 2.5,  yen: 250,  xp: 30,  w: 28 },
  { nama: "Tuna",      tier: "Uncommon",  emoji: "🐟", min: 1,    max: 8,    yen: 400,  xp: 45,  w: 22 },
  { nama: "Arwana",    tier: "Rare",      emoji: "🐋", min: 2,    max: 12,   yen: 900,  xp: 90,  w: 12 },
  { nama: "Pari Manta",tier: "Rare",      emoji: "🪼", min: 3,    max: 15,   yen: 1300, xp: 120, w: 8 },
  { nama: "Naga Laut", tier: "Epic",      emoji: "🐉", min: 5,    max: 25,   yen: 3000, xp: 280, w: 4 },
  { nama: "Hiu Paus",  tier: "Legendary", emoji: "🦈", min: 10,   max: 45,   yen: 9000, xp: 800, w: 1.5 },
  { nama: "Leviathan", tier: "Legendary", emoji: "🐙", min: 20,   max: 80,   yen: 20000,xp: 1500,w: 0.8 },
];

let players = [];
let me = { x: 320, y: 300, dx: 0, dy: 0, dir: 1, jalan: 0, mancing: false };
let inv = [], yen = 500, xp = 0, xpMax = 100, lv = 1, nama = "hady", myID = "FISH-DEMO", rodIdx = 0, ownedRods = [0];
let casting = false, barVal = 50, barTimer = null, curFish = null, zoneL = 35;
let animTime = 0, ripples = [], daun = [];
for(let i=0;i<20;i++) daun.push({x: Math.random()*1000, y: Math.random()*800, s: Math.random()*2+1, speed: Math.random()*0.5+0.3});

async function apiPost(url, body){
  let r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}
async function save(){
  localStorage.setItem("mancing_" + myID, JSON.stringify({ nama, myID, inv, yen, xp, xpMax, lv, rodIdx, ownedRods }));
  localStorage.setItem("mancing_lastID", myID);
  try{ await apiPost("/api/save", { id: myID, data: { nama, inv, yen, xp, xpMax, lv, rodIdx, ownedRods } }); }catch(e){}
}
function getKey(id){ return "mancing_" + id; }

async function buatIDBaru(){
  let nm = document.getElementById("inputNama").value.trim() || "Pemancing";
  let id = "FISH-" + Math.random().toString(36).slice(2,8).toUpperCase();
  try{
    let res = await apiPost("/api/buat-id", { nama: nm });
    if(res.id) id = res.id;
  }catch(e){}
  document.getElementById("inputID").value = id;
  document.getElementById("idBaruText").textContent = id;
  document.getElementById("idBaruBox").style.display = "block";
  toast("ID baru dibuat: " + id);
}
function salinID(){
  let id = document.getElementById("idBaruText").textContent;
  navigator.clipboard.writeText(id);
  toast("ID disalin: " + id);
}
async function login(){
  let idEl = document.getElementById("inputID");
  let nmEl = document.getElementById("inputNama");
  let id = idEl.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  let nm = nmEl.value.trim() || "Pemancing";
  if(id.length < 6){
    id = "FISH-" + Math.random().toString(36).slice(2,8).toUpperCase();
    idEl.value = id;
    toast("ID otomatis dibuat: " + id);
  }
  if(!id.startsWith("FISH-")) id = "FISH-" + id;
  idEl.value = id;
  myID = id; nama = nm;
  try{
    let ctrl = new AbortController();
    setTimeout(()=>ctrl.abort(), 2000);
    let res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nama: nm }),
      signal: ctrl.signal
    }).then(r=>r.json());
    let d = res.data;
    if(d){
      inv=d.inv||[]; yen=d.yen ?? 500; xp=d.xp||0; xpMax=d.xpMax||100; lv=d.lv||1; rodIdx=d.rodIdx||0; ownedRods=d.ownedRods||[0];
    }
  }catch(e){
    let lama = JSON.parse(localStorage.getItem(getKey(id))||"null");
    if(lama){ inv=lama.inv||[]; yen=lama.yen ?? 500; xp=lama.xp||0; xpMax=lama.xpMax||100; lv=lama.lv||1; rodIdx=lama.rodIdx||0; ownedRods=lama.ownedRods||[0]; }
  }
  startGame();
}
function startGame(){
  document.getElementById("login").style.display="none";
  document.getElementById("game").style.display="block";
  save(); renderHUD(); renderInv(); draw();
  toast("Selamat datang, "+nama+"! Yen: 💴 "+yen);
}
function renderHUD(){
  document.getElementById("pNama").textContent=nama;
  document.getElementById("pLv").textContent=lv;
  document.getElementById("pXP").textContent=xp;
  document.getElementById("pXPMax").textContent=xpMax;
  document.getElementById("xpBar").style.width=(xp/xpMax*100)+"%";
  document.getElementById("pYen").textContent=yen.toLocaleString("id-ID");
  document.getElementById("pTitle").textContent=RODS[rodIdx].nama;
  document.getElementById("buffs").innerHTML=`<i>🎣 ${RODS[rodIdx].nama}</i><i>💴 ${yen.toLocaleString()} Yen</i><i>🐟 ${inv.length}/45</i>`;
}
function renderInv(){
  let el=document.getElementById("inv");
  el.innerHTML="";
  for(let i=0;i<5;i++){ let f=inv[i]; el.innerHTML+=`<div class="slot ${i===0?'active':''}">${f?f.emoji:""}<span>${f?(f.berat).toFixed(2):""}</span></div>`; }
  el.innerHTML+=`<div class="slot" onclick="openMenu()" style="font-size:20px">🎒<span>${inv.length}/45</span></div>`;
}
function toast(t){ let e=document.getElementById("toast"); e.textContent=t; e.style.display="block"; setTimeout(()=>e.style.display="none",3000); }

function openMenu(){
  let rodsHtml=RODS.map((r,i)=>{
    let punya = ownedRods.includes(i);
    let btn = "";
    if(i===rodIdx) btn = `<button style="background:#22c55e">Dipakai ✓</button>`;
    else if(punya) btn = `<button onclick="pilihJoran(${i})">Pakai</button>`;
    else if(lv<r.lv) btn = `<button disabled style="background:#999">🔒 Lv ${r.lv}</button>`;
    else if(yen<r.harga) btn = `<button disabled style="background:#ef4444">Butuh 💴 ${r.harga.toLocaleString()}</button>`;
    else btn = `<button onclick="beliJoran(${i})" style="background:#f59e0b">Beli 💴 ${r.harga.toLocaleString()}</button>`;
    return `<div class="row"><span><b>${r.icon} ${r.nama}</b><br><small>${r.desc} • Lv ${r.lv} • ${punya?"Sudah Punya":"Harga 💴 "+r.harga.toLocaleString()}</small></span><div style="min-width:110px">${btn}</div></div>`;
  }).join("");
  let fishHtml=inv.length?inv.map(f=>`<div class="row"><span><b>${f.emoji} ${f.nama}</b><br><small>${f.tier} • ${f.berat} kg</small></span><b>💴 ${f.yen.toLocaleString()}</b></div>`).join(""):"<p style='text-align:center;color:#666;padding:12px'>Tas masih kosong, mancing dulu!</p>";
  showModal(`<h2>🎒 Tas & Toko Joran</h2><p style="font-size:14px">Yen kamu: <b>💴 ${yen.toLocaleString()}</b></p><div class="tabs"><button class="on" onclick="openMenu()">Toko Joran</button><button onclick="openTas()">Ikan (${inv.length})</button><button onclick="openJual()">Jual Semua</button></div><div class="list">${rodsHtml}</div><button onclick="closeModal()">Tutup</button>`);
  window._fishHtml=fishHtml;
}
function beliJoran(i){
  let r=RODS[i];
  if(lv<r.lv){ toast("Butuh Lv "+r.lv); return; }
  if(yen<r.harga){ toast("Yen kurang! Butuh 💴 "+r.harga.toLocaleString()); return; }
  yen-=r.harga; ownedRods.push(i); rodIdx=i; save(); renderHUD();
  toast("🎉 Berhasil beli "+r.nama+"!");
  openMenu();
}
function openTas(){ showModal(`<h2>🐟 Koleksi Ikan</h2><div class="list">${window._fishHtml||"Kosong"}</div><button onclick="closeModal()">Tutup</button><button onclick="openJual()" style="background:#22c55e">Jual Semua Ikan</button>`); }
function openJual(){
  let total=inv.reduce((a,f)=>a+f.yen,0);
  if(!total){ toast("Gak ada ikan buat dijual"); return; }
  yen+=total; inv=[]; save(); renderHUD(); renderInv();
  showModal(`<div style="font-size:48px">💴</div><h2>Terjual!</h2><p>Kamu dapet <b>💴 ${total.toLocaleString()} Yen</b></p><button onclick="closeModal()">Mantap!</button>`);
}
function pilihJoran(i){ if(!ownedRods.includes(i)){ toast("Beli dulu jorannya"); return; } rodIdx=i; save(); renderHUD(); toast("Joran diganti jadi "+RODS[rodIdx].nama); closeModal(); }
function showModal(html){ document.getElementById("modalBox").innerHTML=html; document.getElementById("modal").style.display="flex"; }
function closeModal(){ document.getElementById("modal").style.display="none"; }

function mulaiMancing(){
  if(casting) return; casting=true; me.mancing=true;
  document.getElementById("btnFish").disabled=true;
  document.getElementById("btnFish").innerHTML="⏳<br>Lempar...";
  toast("Joran dilempar... tunggu ikan nyangkut!");
  ripples.push({x: me.x+30, y: me.y+40, r: 2, alpha: 1});
  setTimeout(()=>{
    let power=RODS[rodIdx].power;
    let pool=[]; FISH.forEach(f=>{ let w=f.w; if(f.tier==="Rare") w*=1+power/100; if(f.tier==="Epic") w*=1+power/150; if(f.tier==="Legendary") w*=1+power/200; pool.push({f,w}); });
    let total=pool.reduce((a,b)=>a+b.w,0); let r=Math.random()*total; curFish=pool[0].f;
    for(let p of pool){ if(r<p.w){curFish=p.f;break;} r-=p.w; }
    document.getElementById("barGame").style.display="flex";
    barVal=50; zoneL=30+Math.random()*20;
    document.getElementById("barZone").style.left=zoneL+"%";
    clearInterval(barTimer);
    barTimer=setInterval(()=>{
      barVal-=1.2; if(barVal<0) barVal=0;
      document.getElementById("barFill").style.width=barVal+"%";
      if(barVal<=0){ gagalMancing(); }
    },80);
    setTimeout(()=>{ if(casting){ selesaiMancing(); } },6000);
  },1200+Math.random()*1000);
}
function tapBar(){ barVal=Math.min(100,barVal+9); document.getElementById("barFill").style.width=barVal+"%"; }
function gagalMancing(){
  clearInterval(barTimer); casting=false; me.mancing=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; document.getElementById("btnFish").innerHTML="🎣<br>Joran";
  toast("Yah, ikannya lepas! 🥲");
}
function selesaiMancing(){
  clearInterval(barTimer); casting=false; me.mancing=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; document.getElementById("btnFish").innerHTML="🎣<br>Joran";
  let berat=curFish.min+Math.random()*(curFish.max-curFish.min);
  let bonus=1+RODS[rodIdx].power/200;
  berat=berat*bonus;
  let ikan={...curFish,berat:berat,yen:Math.round(curFish.yen*bonus)};
  inv.unshift(ikan); if(inv.length>45) inv.pop();
  xp+=curFish.xp;
  let naik=false;
  while(xp>=xpMax){ xp-=xpMax; lv++; xpMax=Math.round(xpMax*1.4); naik=true; }
  save(); renderHUD(); renderInv();
  showModal(`<div class="fish-big">${ikan.emoji}</div><span class="tier ${ikan.tier}">${ikan.tier.toUpperCase()}</span><h2>${ikan.nama}</h2><p style="font-size:18px;font-weight:800">${berat.toFixed(2)} kg</p><p style="color:#666;font-size:13px">+${curFish.xp} XP • 💴 ${ikan.yen.toLocaleString()} Yen • Joran: ${RODS[rodIdx].nama}</p>${naik?`<p style="color:#16a34a;font-weight:800">🎉 NAIK LEVEL! Sekarang Lv ${lv}</p>`:""}<button onclick="closeModal()">Simpan ke Tas 🎒</button>`);
}

let joy=document.getElementById("joy"), stick=document.getElementById("stick"), dragging=false;
function moveJoy(e){ let r=joy.getBoundingClientRect(); let cx=e.touches?e.touches[0].clientX:e.clientX; let cy=e.touches?e.touches[0].clientY:e.clientY; let dx=cx-(r.left+r.width/2), dy=cy-(r.top+r.height/2); let d=Math.sqrt(dx*dx+dy*dy); let max=26; if(d>max){dx=dx/d*max; dy=dy/d*max;} stick.style.left=(26+dx)+"px"; stick.style.top=(26+dy)+"px"; me.dx=dx/max*2.2; me.dy=dy/max*2.2; if(dx!==0) me.dir = dx>0?1:-1; }
joy.addEventListener("touchstart",e=>{dragging=true; moveJoy(e)}); joy.addEventListener("touchmove",e=>{if(dragging) moveJoy(e)}); joy.addEventListener("touchend",()=>{dragging=false; stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;});
joy.addEventListener("mousedown",e=>{dragging=true; moveJoy(e)}); window.addEventListener("mousemove",e=>{if(dragging) moveJoy(e)}); window.addEventListener("mouseup",()=>{dragging=false; stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;});

const cv=document.getElementById("cv"), ctx=cv.getContext("2d");
function gambarKarakter(x, y, namaP, dir, jalan, mancing, isMe){
  let bob = Math.sin(animTime*4 + x)*1.5;
  if(jalan>0.1) bob = Math.abs(Math.sin(animTime*10))*3;
  ctx.fillStyle="rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(x, y+14, 14, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.save(); ctx.translate(x, y+bob); ctx.scale(dir, 1);
  let kaki = jalan>0.1 ? Math.sin(animTime*10)*4 : 0;
  ctx.fillStyle="#2b3a67"; ctx.fillRect(-6, 8+kaki, 5, 8); ctx.fillRect(1, 8-kaki, 5, 8);
  ctx.fillStyle="#000"; ctx.fillRect(-6, 15+kaki, 6, 3); ctx.fillRect(1, 15-kaki, 6, 3);
  ctx.fillStyle = isMe ? "#ff6b9d" : "#4a90e2";
  ctx.fillRect(-9, -2, 18, 12);
  ctx.fillStyle="#fff"; ctx.fillRect(-9, -2, 18, 3);
  ctx.fillStyle="#ffdbac"; ctx.fillRect(-8, -18, 16, 16);
  ctx.fillStyle="#3b2314"; ctx.fillRect(-8, -18, 16, 5); ctx.fillRect(-8, -18, 3, 10);
  ctx.fillStyle="#000"; ctx.fillRect(2, -11, 3, 3);
  ctx.fillStyle="#ffd93d"; ctx.fillRect(-10, -21, 20, 4); ctx.fillRect(-5, -26, 10, 6);
  if(mancing){
    ctx.strokeStyle="#8b4513"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(26, -22+Math.sin(animTime*6)*2); ctx.stroke();
    ctx.strokeStyle="#fff"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(26, -22); ctx.lineTo(26, 18); ctx.stroke();
  } else {
    ctx.strokeStyle="#8b4513"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(22, -18); ctx.stroke();
  }
  ctx.restore();
  ctx.font="bold 11px sans-serif"; ctx.textAlign="center";
  ctx.fillStyle="#fff"; ctx.strokeStyle="rgba(0,0,0,0.7)"; ctx.lineWidth=3;
  ctx.strokeText(namaP+" Lv"+(isMe?lv:""), x, y-32);
  ctx.fillText(namaP+" Lv"+(isMe?lv:""), x, y-32);
  ctx.textAlign="left";
}
function gambarPohon(x, y, s){
  let goyang = Math.sin(animTime*1.5 + x)*2;
  ctx.fillStyle="#8b4513"; ctx.fillRect(x-3, y, 6, 14*s);
  ctx.fillStyle="#2e9e4f";
  ctx.beginPath(); ctx.arc(x+goyang, y-6, 16*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle="#3bb85f";
  ctx.beginPath(); ctx.arc(x-4+goyang, y-10, 10*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle="#ff6b6b"; ctx.fillRect(x+6, y-8, 4, 4); ctx.fillRect(x-10, y-4, 4, 4);
}
function draw(){
  cv.width=innerWidth; cv.height=innerHeight;
  animTime += 0.016;
  ctx.fillStyle="#f6d67a"; ctx.fillRect(0,0,cv.width,cv.height);
  let grad = ctx.createLinearGradient(0,0,0,cv.height);
  grad.addColorStop(0,"#8ed860"); grad.addColorStop(1,"#5cb84a");
  ctx.fillStyle=grad; ctx.fillRect(30,50,cv.width-60,cv.height-130);
  ctx.fillStyle="#e8c87a"; ctx.fillRect(50,110,cv.width-100,70);
  ctx.fillStyle="#d4b36a"; ctx.fillRect(50,140,cv.width-100,8);
  ctx.fillStyle="#2aa5e0"; ctx.fillRect(0,cv.height-80,cv.width,80); ctx.fillRect(0,0,cv.width,24);
  ctx.fillStyle="rgba(255,255,255,0.5)";
  for(let i=0;i<cv.width;i+=60){
    let y = cv.height-78 + Math.sin(animTime*2 + i*0.1)*3;
    ctx.fillRect(i, y, 30, 3);
    let y2 = 4 + Math.sin(animTime*2 + i*0.1)*2;
    ctx.fillRect(i, y2, 30, 2);
  }
  ctx.font="14px serif";
  for(let i=0;i<10;i++){ ctx.fillText("🌸", 60+i*70, 90+Math.sin(i)*20); ctx.fillText("🌿", 80+i*60, cv.height-140); }
  gambarPohon(80, cv.height-150, 1);
  gambarPohon(cv.width-90, 170, 1.1);
  gambarPohon(90, 160, 0.9);
  let api = 1 + Math.sin(animTime*8)*0.2;
  ctx.font=`${Math.round(22*api)}px serif`; ctx.fillText("🔥", 90, cv.height-110);
  ctx.font="18px serif"; ctx.fillText("🪵", 110, cv.height-105);
  ctx.font="28px serif"; ctx.fillText("⛲", cv.width/2, cv.height/2-20);
  ripples = ripples.filter(r=>r.alpha>0);
  ripples.forEach(r=>{
    r.r+=1.2; r.alpha-=0.02;
    ctx.strokeStyle=`rgba(255,255,255,${r.alpha})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.stroke();
  });
  daun.forEach(d=>{
    d.y+=d.speed; d.x+=Math.sin(animTime+d.y)*0.5;
    if(d.y>cv.height) d.y=0;
    ctx.font="12px serif"; ctx.fillText("🍃", d.x % cv.width, d.y);
  });
  // PLAYER LAIN - LERP 0.35 BIAR MULUS
  players.forEach(p=>{
    p.x += ((p.tx ?? p.x) - p.x) * 0.35;
    p.y += ((p.ty ?? p.y) - p.y) * 0.35;
    let dx = (p.tx ?? p.x) - p.x;
    if(Math.abs(dx) > 2){ p.jalan = 1; p.dir = dx > 0 ? 1 : -1; } else { p.jalan = 0; }
    gambarKarakter(p.x, p.y, p.nama, p.dir || 1, p.jalan, false, false);
  });
  let jalan = Math.abs(me.dx)+Math.abs(me.dy);
  me.jalan = jalan;
  gambarKarakter(me.x, me.y, nama, me.dir, jalan, me.mancing, true);
  me.x+=me.dx; me.y+=me.dy;
  me.x=Math.max(40,Math.min(cv.width-40,me.x)); me.y=Math.max(70,Math.min(cv.height-110,me.y));
  requestAnimationFrame(draw);
}
setInterval(()=>{ let d=new Date(); document.getElementById("jam").textContent=d.toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"})+" · "+d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+" WITA"; },1000);

let lastID = localStorage.getItem("mancing_lastID");
if(lastID){
  document.getElementById("inputID").value = lastID;
  let d = JSON.parse(localStorage.getItem(getKey(lastID)) || "null");
  if(d) document.getElementById("inputNama").value = d.nama;
}

// ===== FIREBASE REALTIME - HADY-C34E8 - UDAH LENGKAP =====
const firebaseConfig = {
  apiKey: "AIzaSyCt1hGe42I6Xg9ji9IDt9vbcnbZQYFw1Vw",
  authDomain: "hady-c34e8.firebaseapp.com",
  databaseURL: "https://hady-c34e8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hady-c34e8",
  storageBucket: "hady-c34e8.appspot.com",
  messagingSenderId: "879025180790",
  appId: "1:879025180790:web:eca33cce19a31388174f57"
};

let db = null;
try{
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  console.log("Firebase nyambung!");
}catch(e){ console.log("Firebase gagal:", e); }

// Kirim posisi ke Firebase tiap 100ms
setInterval(()=>{
  if(!db || !myID || myID==="FISH-DEMO") return;
  let nx = Math.round(me.x / innerWidth * 1000);
  let ny = Math.round(me.y / innerHeight * 1000);
  db.ref("online/" + myID).set({ nama, x: nx, y: ny, lv, lastSeen: Date.now() });
}, 100);

// Dengerin temen secara langsung
if(db){
  db.ref("online").on("value", (snap)=>{
    let data = snap.val() || {};
    let sekarang = Date.now();
    Object.keys(data).forEach(id=>{
      if(id === myID) return;
      let p = data[id];
      if(sekarang - p.lastSeen > 5000) return;
      let px = p.x / 1000 * innerWidth;
      let py = p.y / 1000 * innerHeight;
      let lama = players.find(q=>q.id===id);
      if(lama){
        lama.tx = px; lama.ty = py; lama.nama = p.nama; lama.lv = p.lv; lama.lastSeen = sekarang;
      } else {
        players.push({id, nama:p.nama, lv:p.lv, x:px, y:py, tx:px, ty:py, dir:1, jalan:0, lastSeen: sekarang});
      }
    });
    players = players.filter(p=> data[p.id] && sekarang - data[p.id].lastSeen < 5000);
  });
}

window.addEventListener("beforeunload", ()=>{
  if(db && myID) db.ref("online/" + myID).remove();
});
