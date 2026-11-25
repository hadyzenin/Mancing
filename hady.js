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
const WORLD_W = 1200, WORLD_H = 1800;
const ZOOM = 2.0;
let camX = 0, camY = 0;
const TOKO = { x: 600, y: 340, w: 170, h: 120 };
const DARAT = { x1: 100, x2: 1100, y1: 20, y2: 1700 };
const KOLAM = { cx: 600, cy: 1150, rx: 230, ry: 160 };
const TILE = 40;
let players = [];
let me = { x: 600, y: WORLD_H-100, dx: 0, dy: 0, dir: 1, jalan: 0, mancing: false, lastFish: "", lastFishAt: 0, lastFishNama: "", chatText: "", chatAt: 0 };
let inv = [], yen = 500, xp = 0, xpMax = 100, lv = 1, nama = "hady", myID = "FISH-DEMO", rodIdx = 0, ownedRods = [0];
let casting = false, curFish = null, zoneL = 35;
let animTime = 0, ripples = [], daun = [];
for(let i=0;i<30;i++) daun.push({x: 150+Math.random()*(WORLD_W-300), y: Math.random()*WORLD_H, s: Math.random()*2+1, speed: Math.random()*0.5+0.3});
let ikanLaut = [];
for(let i=0;i<6;i++) ikanLaut.push({ zona: "kiri", x: 30+Math.random()*50, y: 300+Math.random()*1200, speed: 0.4+Math.random()*0.5, dir: 1, warna: ["#f97316","#38bdf8","#facc15","#f472b6","#a78bfa"][i%5], ukuran: 0.7+Math.random()*0.5, fase: Math.random()*6 });
for(let i=0;i<6;i++) ikanLaut.push({ zona: "kanan", x: 1120+Math.random()*50, y: 300+Math.random()*1200, speed: 0.4+Math.random()*0.5, dir: -1, warna: ["#f97316","#38bdf8","#facc15","#f472b6"][i%4], ukuran: 0.7+Math.random()*0.5, fase: Math.random()*6 });
for(let i=0;i<6;i++) ikanLaut.push({ zona: "bawah", x: 150+Math.random()*900, y: 1730+Math.random()*40, speed: 0.5+Math.random()*0.5, dir: Math.random()<0.5?1:-1, warna: ["#f97316","#38bdf8","#facc15","#f472b6"][i%4], ukuran: 0.8+Math.random()*0.5, fase: Math.random()*6 });
let ikanKolam = [];
for(let i=0;i<5;i++) ikanKolam.push({ a: Math.random()*Math.PI*2, r: 60+Math.random()*120, speed: 0.008+Math.random()*0.008, warna: ["#fb923c","#38bdf8","#f472b6","#facc15"][i%4], ukuran: 0.7+Math.random()*0.4, fase: Math.random()*6 });
let cooldownUntil = 0, cooldownTimer = null;
function sisaCooldown(){ return Math.max(0, cooldownUntil - Date.now()); }
function mulaiCooldown(){
  cooldownUntil = Date.now() + 3000;
  let btn = document.getElementById("btnFish");
  if(cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(()=>{
    let sisa = sisaCooldown();
    if(sisa <= 0){ clearInterval(cooldownTimer); if(btn){ btn.disabled = false; updateTombolAksi(); } renderHUD(); return; }
    if(btn){ btn.disabled = true; btn.innerHTML = `⏳<br>${Math.ceil(sisa/1000)}s`; }
  }, 100);
}
let lastChatAt = 0, chatOpen = false;
function toggleChat(e){
  if(e) e.stopPropagation();
  chatOpen = !chatOpen;
  document.getElementById("chatInputBar").style.display = chatOpen ? "flex" : "none";
  if(chatOpen){ document.getElementById("chatBadge").style.display = "none"; setTimeout(()=>document.getElementById("chatInput").focus(), 100); }
  else document.getElementById("chatInput").blur();
}
function tutupChat(){
  if(!chatOpen) return;
  chatOpen = false;
  document.getElementById("chatInputBar").style.display = "none";
  document.getElementById("chatInput").blur();
}
function kirimChat(e){
  if(e) e.stopPropagation();
  let inp = document.getElementById("chatInput");
  let teks = inp.value.trim();
  if(!teks) return;
  let sisa = 5000 - (Date.now() - lastChatAt);
  if(sisa > 0){ toast(`⏳ Chat cooldown ${Math.ceil(sisa/1000)} detik lagi...`); return; }
  if(!db){ toast("Chat belum tersambung..."); return; }
  lastChatAt = Date.now(); inp.value = "";
  document.getElementById("chatCooldown").textContent = "⏳ Cooldown 5 detik...";
  setTimeout(()=>{ document.getElementById("chatCooldown").textContent = ""; }, 5000);
  me.chatText = teks; me.chatAt = Date.now();
  db.ref("chat").push({ nama, teks, waktu: Date.now(), id: myID });
  tambahChatKeList(nama, teks, true);
}
function tambahChatKeList(namaPengirim, teks, isMe){
  let feed = document.getElementById("chatFeed");
  if(!feed) return;
  let div = document.createElement("div");
  div.className = "chat-line" + (isMe ? " me" : "");
  div.innerHTML = `<b>${namaPengirim}:</b> ${teks.replace(/</g,"&lt;")}`;
  feed.appendChild(div);
  while(feed.children.length > 5) feed.removeChild(feed.firstChild);
  setTimeout(()=>{ if(div.parentNode) div.remove(); }, 6000);
  if(!chatOpen) document.getElementById("chatBadge").style.display = "block";
}
let tarikPos = 50, tarikDir = 1, tarikRaf = null, tarikTimeout = null, tarikKecepatan = 2, tarikZonaW = 30, tarikSisaWaktu = 8000, tarikWaktuMulai = 0, tarikLastFrame = 0, tarikBarEl = null, tarikIkanEl = null, tarikTimerEl = null;
function jarakKolam(x, y){ let dx = (x - KOLAM.cx) / KOLAM.rx; let dy = (y - KOLAM.cy) / KOLAM.ry; return Math.sqrt(dx*dx + dy*dy); }
function diDalamKolam(x, y){ return jarakKolam(x, y) < 1; }
function diPinggirKolam(){ let d = jarakKolam(me.x, me.y); return d >= 0.92 && d <= 1.18; }
function lagiDiAir(){
  let diBawah = me.y >= WORLD_H-108 && me.y <= WORLD_H-92;
  let diKiri  = me.x >= 92 && me.x <= 108 && me.y > 160;
  let diKanan = me.x >= WORLD_W-108 && me.x <= WORLD_W-92 && me.y > 160;
  return diBawah || diKiri || diKanan || diPinggirKolam();
}
function posisiRiak(){
  if(diPinggirKolam()) return { x: KOLAM.cx + (me.x - KOLAM.cx)*0.7, y: KOLAM.cy + (me.y - KOLAM.cy)*0.7 };
  if(me.y >= WORLD_H-112) return { x: me.x + 10, y: WORLD_H-50 };
  if(me.x <= 112) return { x: 50, y: me.y + 20 };
  if(me.x >= WORLD_W-112) return { x: WORLD_W-50, y: me.y + 20 };
  return { x: me.x + 30, y: me.y + 40 };
}
function lagiDiToko(){ return Math.abs(me.x - TOKO.x) < 110 && Math.abs(me.y - (TOKO.y + TOKO.h)) < 110; }
function kunciDiDarat(){
  me.x = Math.max(DARAT.x1, Math.min(DARAT.x2, me.x));
  me.y = Math.max(DARAT.y1, Math.min(DARAT.y2, me.y));
  if(diDalamKolam(me.x, me.y)){
    let dx = me.x - KOLAM.cx, dy = me.y - KOLAM.cy;
    let len = Math.sqrt(dx*dx + dy*dy) || 1;
    me.x = KOLAM.cx + dx/len * KOLAM.rx * 1.06;
    me.y = KOLAM.cy + dy/len * KOLAM.ry * 1.06;
    me.x = Math.max(DARAT.x1, Math.min(DARAT.x2, me.x));
    me.y = Math.max(DARAT.y1, Math.min(DARAT.y2, me.y));
  }
}
function updateTombolAksi(){
  let btn = document.getElementById("btnFish");
  if(!btn) return;
  if(casting) return;
  if(sisaCooldown() > 0) return;
  if(lagiDiToko()){
    btn.disabled = false; btn.innerHTML = "🏪<br>Toko";
    btn.style.background = "linear-gradient(180deg,#fbbf24,#d97706)";
    btn.style.boxShadow = "0 6px 0 #92400e,0 10px 20px rgba(245,158,11,.5)";
  } else if(lagiDiAir()){
    btn.disabled = false; btn.innerHTML = "🎣<br>Joran";
    btn.style.background = "linear-gradient(180deg,#38bdf8,#0284c7)";
    btn.style.boxShadow = "0 6px 0 #0c4a6e,0 10px 20px rgba(56,189,248,.5)";
  } else {
    btn.disabled = false; btn.innerHTML = "🎣<br>Joran";
    btn.style.background = "linear-gradient(180deg,#94a3b8,#64748b)";
    btn.style.boxShadow = "0 6px 0 #334155,0 10px 20px rgba(0,0,0,.3)";
  }
}
function klikTombolAksi(){
  if(casting) return;
  if(sisaCooldown() > 0){ toast(`⏳ Tunggu ${Math.ceil(sisaCooldown()/1000)} detik lagi...`); return; }
  if(lagiDiToko()){ openToko("jual"); return; }
  mulaiMancing();
}
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
  try{ let res = await apiPost("/api/buat-id", { nama: nm }); if(res.id) id = res.id; }catch(e){}
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
  if(id.length < 6){ id = "FISH-" + Math.random().toString(36).slice(2,8).toUpperCase(); idEl.value = id; toast("ID otomatis dibuat: " + id); }
  if(!id.startsWith("FISH-")) id = "FISH-" + id;
  idEl.value = id; myID = id; nama = nm;
  try{
    let ctrl = new AbortController(); setTimeout(()=>ctrl.abort(), 2000);
    let res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, nama: nm }), signal: ctrl.signal }).then(r=>r.json());
    let d = res.data;
    if(d){ inv=d.inv||[]; yen=d.yen ?? 500; xp=d.xp||0; xpMax=d.xpMax||100; lv=d.lv||1; rodIdx=d.rodIdx||0; ownedRods=d.ownedRods||[0]; }
  }catch(e){
    let lama = JSON.parse(localStorage.getItem(getKey(id))||"null");
    if(lama){ inv=lama.inv||[]; yen=lama.yen ?? 500; xp=lama.xp||0; xpMax=lama.xpMax||100; lv=lama.lv||1; rodIdx=lama.rodIdx||0; ownedRods=lama.ownedRods||[0]; }
  }
  startGame();
}
function startGame(){
  document.getElementById("login").style.display="none";
  document.getElementById("game").style.display="block";
  me.x = WORLD_W/2; me.y = WORLD_H-100;
  kunciDiDarat();
  camX = me.x - (innerWidth/2)/ZOOM; camY = me.y - (innerHeight/2)/ZOOM;
  save(); renderHUD(); renderInv(); draw();
  toast("Ada kolam di tengah! Bisa mancing di sana juga 🎣");
  document.getElementById("chatInput").addEventListener("keydown", e=>{ if(e.key==="Enter") kirimChat(); });
  let gameEl = document.getElementById("game");
  gameEl.addEventListener("click", (e)=>{
    if(!chatOpen) return;
    if(e.target.closest("#chatInputBar") || e.target.closest("#btnChat") || e.target.closest("#joy") || e.target.closest("#btnFish") || e.target.closest("#modal")) return;
    tutupChat();
  });
  document.getElementById("cv").addEventListener("touchstart", ()=>{ if(chatOpen) tutupChat(); });
}
function renderHUD(){
  document.getElementById("pNama").textContent=nama;
  document.getElementById("pLv").textContent=lv;
  document.getElementById("pXP").textContent=xp;
  document.getElementById("pXPMax").textContent=xpMax;
  document.getElementById("xpBar").style.width=(xp/xpMax*100)+"%";
  document.getElementById("pYen").textContent=yen.toLocaleString("id-ID");
  document.getElementById("buffs").innerHTML=`<i>🎣 ${RODS[rodIdx].nama}</i><i>💴 ${yen.toLocaleString()} Yen</i>`;
  updateTombolAksi();
}
function renderInv(){
  let el=document.getElementById("inv");
  el.innerHTML="";
  for(let i=0;i<5;i++){ let f=inv[i]; el.innerHTML+=`<div class="slot ${i===0?'active':''}">${f?f.emoji:""}<span>${f?(f.berat).toFixed(2):""}</span></div>`; }
  el.innerHTML+=`<div class="slot" onclick="openTas()" style="font-size:20px">🎒<span style="font-size:10px;font-weight:800;color:#16a34a">${inv.length}/45</span></div>`;
}
function toast(t){ let e=document.getElementById("toast"); e.textContent=t; e.style.display="block"; setTimeout(()=>e.style.display="none",3000); }
function openTas(){
  let gridHtml = "";
  if(!inv.length) gridHtml = "<p style='text-align:center;color:#666;padding:16px'>Tas masih kosong, mancing dulu!</p>";
  else gridHtml = `<div class="tas-grid">` + inv.map(f=>`<div class="tas-slot ${f.tier}"><div class="emoji">${f.emoji}</div><div class="berat">${Number(f.berat).toFixed(2)} kg</div></div>`).join("") + `</div><p style="font-size:11px;color:#999;text-align:center;margin-top:8px">Warna border = tier ikan • Abu Common • Hijau Uncommon • Biru Rare • Ungu Epic • Orange Legendary</p>`;
  showModal(`<h2>🎒 Tas Ikan</h2><p style="font-size:13px;color:#666">${inv.length}/45 ikan</p>${gridHtml}<button onclick="closeModal()">Tutup</button>`);
}
function openToko(tab, dariDalam){
  if(!dariDalam && !lagiDiToko()){ toast("🚫 Harus deket Toko dulu! Jalan ke darat atas 🏪"); return; }
  tab = tab || "jual";
  let total = inv.reduce((a,f)=>a+f.yen,0);
  let jualHtml = "";
  if(!inv.length) jualHtml = "<p style='text-align:center;color:#666;padding:12px'>Gak ada ikan buat dijual.<br>Mancing dulu!</p>";
  else jualHtml = inv.map((f,i)=>`<div class="row"><span><b>${f.emoji} ${f.nama}</b><br><small>${f.tier} • ${Number(f.berat).toFixed(2)} kg</small></span><div style="display:flex;gap:6px;align-items:center"><b>💴 ${f.yen.toLocaleString()}</b><button class="btn-jual-satu" onclick="jualSatu(${i})">Jual</button></div></div>`).join("");
  let rodsHtml = RODS.map((r,i)=>{
    let punya = ownedRods.includes(i); let btn = "";
    if(i===rodIdx) btn = `<button style="background:#22c55e">Dipakai ✓</button>`;
    else if(punya) btn = `<button onclick="pilihJoran(${i})">Pakai</button>`;
    else if(lv<r.lv) btn = `<button disabled style="background:#999">🔒 Lv ${r.lv}</button>`;
    else if(yen<r.harga) btn = `<button disabled style="background:#ef4444">Butuh 💴 ${r.harga.toLocaleString()}</button>`;
    else btn = `<button onclick="beliJoran(${i})" style="background:#f59e0b">Beli 💴 ${r.harga.toLocaleString()}</button>`;
    return `<div class="row"><span><b>${r.icon} ${r.nama}</b><br><small>${r.desc} • Lv ${r.lv} • ${punya?"Sudah Punya":"Harga 💴 "+r.harga.toLocaleString()}</small></span><div style="min-width:110px">${btn}</div></div>`;
  }).join("");
  let isi = tab==="jual" ? `<div class="toko-total">Total kalau jual semua: 💴 ${total.toLocaleString()} Yen</div><div class="list">${jualHtml}</div>${inv.length?`<button onclick="jualSemua()" style="background:#22c55e">Jual Semua Ikan 💴 ${total.toLocaleString()}</button>`:""}` : `<div class="list">${rodsHtml}</div>`;
  showModal(`<h2>🏪 Toko</h2><div class="toko-tabs"><button class="${tab==="jual"?"on":""}" onclick="openToko('jual', true)">💴 Jual Ikan (${inv.length})</button><button class="${tab==="joran"?"on":""}" onclick="openToko('joran', true)">🎣 Beli Joran</button></div>${isi}<button onclick="closeModal()">Tutup</button>`);
}
function jualSatu(i){
  let f = inv[i]; if(!f) return;
  inv.splice(i,1); yen += f.yen; save(); renderHUD(); renderInv();
  toast(`Terjual ${f.emoji} ${f.nama} +💴 ${f.yen.toLocaleString()}`); openToko("jual", true);
}
function jualSemua(){
  let total=inv.reduce((a,f)=>a+f.yen,0);
  if(!total){ toast("Gak ada ikan buat dijual"); return; }
  yen+=total; inv=[]; save(); renderHUD(); renderInv();
  showModal(`<div style="font-size:48px">💴</div><h2>Terjual!</h2><p>Kamu dapet <b>💴 ${total.toLocaleString()} Yen</b></p><button onclick="closeModal()">Mantap!</button>`);
}
function beliJoran(i){
  let r=RODS[i];
  if(lv<r.lv){ toast("Butuh Lv "+r.lv); return; }
  if(yen<r.harga){ toast("Yen kurang! Butuh 💴 "+r.harga.toLocaleString()); return; }
  yen-=r.harga; ownedRods.push(i); rodIdx=i; save(); renderHUD();
  toast("🎉 Berhasil beli "+r.nama+"!"); openToko("joran", true);
}
function pilihJoran(i){ if(!ownedRods.includes(i)){ toast("Beli dulu jorannya"); return; } rodIdx=i; save(); renderHUD(); toast("Joran diganti jadi "+RODS[rodIdx].nama); openToko("joran", true); }
function showModal(html){ document.getElementById("modalBox").innerHTML=html; document.getElementById("modal").style.display="flex"; }
function closeModal(){ document.getElementById("modal").style.display="none"; }
function mulaiMancing(){
  if(casting) return;
  if(sisaCooldown() > 0){ toast(`⏳ Tunggu ${Math.ceil(sisaCooldown()/1000)} detik lagi...`); return; }
  if(lagiDiToko()){ openToko("jual"); return; }
  if(!lagiDiAir()){ toast("🚫 Cari pinggir air / kolam dulu! 🌊"); return; }
  casting=true; me.mancing=true;
  document.getElementById("btnFish").disabled=true;
  document.getElementById("btnFish").innerHTML="⏳<br>Lempar...";
  let riak = posisiRiak();
  ripples.push({x: riak.x, y: riak.y, r: 2, alpha: 1});
  setTimeout(()=>{
    if(!casting) return;
    if(!lagiDiAir()){ batalMancing("🚫 Kamu jalan ke darat! Mancing batal 🥲"); return; }
    let power=RODS[rodIdx].power;
    let pool=[]; FISH.forEach(f=>{ let w=f.w; if(f.tier==="Rare") w*=1+power/100; if(f.tier==="Epic") w*=1+power/150; if(f.tier==="Legendary") w*=1+power/200; pool.push({f,w}); });
    let total=pool.reduce((a,b)=>a+b.w,0); let r=Math.random()*total; curFish=pool[0].f;
    for(let p of pool){ if(r<p.w){curFish=p.f;break;} r-=p.w; }
    mulaiTantangan();
  },1200+Math.random()*1000);
}
function tarikLoop(now){
  if(!casting) return;
  if(!tarikLastFrame) tarikLastFrame = now;
  let dt = Math.min(32, now - tarikLastFrame); tarikLastFrame = now;
  let step = tarikKecepatan * (dt / 16.6);
  tarikPos += tarikDir * step;
  if(tarikPos > 92){ tarikPos = 92; tarikDir = -1; }
  if(tarikPos < 2){ tarikPos = 2; tarikDir = 1; }
  if(tarikBarEl && tarikIkanEl){
    let barW = tarikBarEl.offsetWidth;
    let x = (tarikPos / 100) * barW - 18;
    tarikIkanEl.style.transform = `translate(${x}px,-50%)`;
  }
  if(tarikTimerEl){
    let sisa = tarikSisaWaktu - (now - tarikWaktuMulai);
    let pct = Math.max(0, sisa / tarikSisaWaktu * 100);
    tarikTimerEl.style.width = pct + "%";
  }
  tarikRaf = requestAnimationFrame(tarikLoop);
}
function mulaiTantangan(){
  let cfg = { Common: { zona: 38, speed: 1.4, waktu: 8000 }, Uncommon: { zona: 30, speed: 2.0, waktu: 7000 }, Rare: { zona: 22, speed: 2.8, waktu: 6000 }, Epic: { zona: 15, speed: 3.6, waktu: 5000 }, Legendary: { zona: 10, speed: 4.6, waktu: 4000 } };
  let c = cfg[curFish.tier] || cfg.Common;
  tarikZonaW = c.zona; tarikKecepatan = c.speed; tarikSisaWaktu = c.waktu;
  tarikPos = 50; tarikDir = Math.random() > 0.5 ? 1 : -1;
  zoneL = 20 + Math.random() * (70 - c.zona);
  document.getElementById("tantanganIkan").textContent = curFish.emoji;
  let tierEl = document.getElementById("tantanganTier");
  tierEl.textContent = curFish.tier.toUpperCase(); tierEl.className = "tarik-tier " + curFish.tier;
  document.getElementById("tantanganNama").textContent = curFish.nama + " Nyangkut!";
  let zoneEl = document.getElementById("barZone"); zoneEl.style.left = zoneL + "%"; zoneEl.style.width = tarikZonaW + "%";
  let perfectEl = document.getElementById("barZonePerfect"); let perfectW = tarikZonaW * 0.35;
  perfectEl.style.left = (zoneL + tarikZonaW/2 - perfectW/2) + "%"; perfectEl.style.width = perfectW + "%";
  document.getElementById("barGame").style.display = "block";
  document.getElementById("tarikTimerBar").style.width = "100%";
  tarikBarEl = document.querySelector(".tarik-bar"); tarikIkanEl = document.getElementById("ikanGerak"); tarikTimerEl = document.getElementById("tarikTimerBar");
  tarikIkanEl.textContent = curFish.emoji;
  tarikWaktuMulai = performance.now(); tarikLastFrame = 0;
  if(tarikRaf) cancelAnimationFrame(tarikRaf); clearTimeout(tarikTimeout);
  tarikRaf = requestAnimationFrame(tarikLoop);
  tarikTimeout = setTimeout(()=>{ if(casting) gagalMancing("⏰ Kelamaan! Ikannya lepas..."); }, tarikSisaWaktu);
}
function cobaTarik(){
  if(!casting) return;
  if(tarikRaf) cancelAnimationFrame(tarikRaf); clearTimeout(tarikTimeout);
  let zonaAwal = zoneL; let zonaAkhir = zoneL + tarikZonaW;
  let perfectAwal = zoneL + tarikZonaW/2 - (tarikZonaW*0.35)/2; let perfectAkhir = perfectAwal + tarikZonaW*0.35;
  if(tarikPos >= perfectAwal && tarikPos <= perfectAkhir){ selesaiMancing(true); return; }
  if(tarikPos >= zonaAwal - 2 && tarikPos <= zonaAkhir){ selesaiMancing(false); return; }
  gagalMancing("❌ Meleset! Ikannya lepas... 🥲");
}
function batalMancing(pesan){
  if(!casting) return;
  if(tarikRaf) cancelAnimationFrame(tarikRaf); clearTimeout(tarikTimeout);
  casting=false; me.mancing=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; updateTombolAksi();
  toast(pesan || "Mancing batal!"); mulaiCooldown(); renderHUD();
}
function gagalMancing(pesan){
  if(tarikRaf) cancelAnimationFrame(tarikRaf); clearTimeout(tarikTimeout);
  casting=false; me.mancing=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; updateTombolAksi();
  toast(pesan || "Yah, ikannya lepas! 🥲"); mulaiCooldown(); renderHUD();
}
function selesaiMancing(isPerfect){
  if(tarikRaf) cancelAnimationFrame(tarikRaf); clearTimeout(tarikTimeout);
  casting=false; me.mancing=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; updateTombolAksi();
  let berat=curFish.min+Math.random()*(curFish.max-curFish.min);
  let bonus=1+RODS[rodIdx].power/200; if(isPerfect) bonus *= 1.2; berat=berat*bonus;
  let ikan={...curFish,berat:berat,yen:Math.round(curFish.yen*bonus)};
  inv.unshift(ikan); if(inv.length>45) inv.pop();
  xp+=curFish.xp; if(isPerfect) xp += 20;
  let naik=false; while(xp>=xpMax){ xp-=xpMax; lv++; xpMax=Math.round(xpMax*1.4); naik=true; }
  me.lastFish = ikan.emoji; me.lastFishNama = ikan.nama; me.lastFishAt = Date.now();
  save(); renderHUD(); renderInv(); mulaiCooldown();
  showModal(`<div class="fish-big">${ikan.emoji}</div>${isPerfect ? `<div style="background:#facc15;color:#000;padding:6px 12px;border-radius:20px;font-weight:900;display:inline-block;margin:6px 0">⭐ PERFECT! +20% YEN ⭐</div><br>` : ``}<span class="tier ${ikan.tier}">${ikan.tier.toUpperCase()}</span><h2>${ikan.nama}</h2><p style="font-size:18px;font-weight:800">${berat.toFixed(2)} kg</p><p style="color:#666;font-size:13px">+${curFish.xp + (isPerfect?20:0)} XP • 💴 ${ikan.yen.toLocaleString()} Yen • Joran: ${RODS[rodIdx].nama}</p>${naik?`<p style="color:#16a34a;font-weight:800">🎉 NAIK LEVEL! Sekarang Lv ${lv}</p>`:""}<button onclick="closeModal()">Simpan ke Tas 🎒</button>`);
}
let joy=document.getElementById("joy"), stick=document.getElementById("stick"), dragging=false;
function moveJoy(e){
  let r=joy.getBoundingClientRect();
  let cx=e.touches?e.touches[0].clientX:e.clientX;
  let cy=e.touches?e.touches[0].clientY:e.clientY;
  let dx=cx-(r.left+r.width/2), dy=cy-(r.top+r.height/2);
  let d=Math.sqrt(dx*dx+dy*dy); let max=26;
  if(d>max){dx=dx/d*max; dy=dy/d*max;}
  stick.style.left=(26+dx)+"px"; stick.style.top=(26+dy)+"px";
  if(casting && d > 4){ stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0; batalMancing("🚶 Kamu gerak! Mancing batal 🥲"); return; }
  me.dx=dx/max*2.2; me.dy=dy/max*2.2; if(dx!==0) me.dir = dx>0?1:-1;
}
joy.addEventListener("touchstart",e=>{dragging=true; moveJoy(e)}); joy.addEventListener("touchmove",e=>{if(dragging) moveJoy(e)}); joy.addEventListener("touchend",()=>{dragging=false; stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;});
joy.addEventListener("mousedown",e=>{dragging=true; moveJoy(e)}); window.addEventListener("mousemove",e=>{if(dragging) moveJoy(e)}); window.addEventListener("mouseup",()=>{dragging=false; stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;});
const cv=document.getElementById("cv"), ctx=cv.getContext("2d");
let cvW = 0, cvH = 0;
function gambarIkanHidup(x, y, s, warna, dir, fase){
  let goyang = Math.sin(animTime*6 + fase) * 4;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  ctx.fillStyle = warna;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-24, -8 + goyang, -28, -12 + goyang); ctx.quadraticCurveTo(-22, 0, -28, 12 + goyang); ctx.quadraticCurveTo(-24, 8 + goyang, -14, 0); ctx.fill();
  let g = ctx.createLinearGradient(-14, -10, 14, 10); g.addColorStop(0, warna); g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = warna; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.quadraticCurveTo(2, -15, 8, -8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 1;
  for(let i=-8;i<=8;i+=5){ ctx.beginPath(); ctx.arc(i, 0, 6, -0.8, 0.8); ctx.stroke(); }
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(9, -2, 3.2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(10, -2, 1.6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(10.5, -2.5, 0.6, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#111"; ctx.beginPath(); ctx.arc(13, 3, 2, 0.3, 1.4); ctx.stroke();
  ctx.restore();
}
function gambarKarakter(x, y, namaP, dir, jalan, mancing, isMe, fishEmoji, fishNama, fishAt, chatText, chatAt){
  let jalanHalus = jalan > 0.1 ? 1 : 0;
  let nafas = Math.sin(animTime*2.5 + x*0.01) * 1.2;
  let ayunKaki = Math.sin(animTime*10) * (jalanHalus ? 5 : 0);
  let ayunTangan = Math.sin(animTime*10) * (jalanHalus ? 4 : 0);
  let lompat = 0;
  let sisaIkan = fishAt ? (Date.now() - fishAt) : 99999;
  let lagiPamer = fishEmoji && sisaIkan < 4000;
  if(lagiPamer) lompat = -Math.abs(Math.sin(animTime*5))*7;
  if(chatText && Date.now() - chatAt < 4000){
    ctx.font="bold 11px sans-serif"; ctx.textAlign="center";
    let w = ctx.measureText(chatText).width + 18;
    ctx.fillStyle="rgba(255,255,255,0.97)"; ctx.beginPath(); ctx.roundRect(x - w/2, y-74, w, 24, 12); ctx.fill();
    ctx.fillStyle="#111"; ctx.fillText(chatText, x, y-58);
    ctx.beginPath(); ctx.moveTo(x-4, y-50); ctx.lineTo(x+4, y-50); ctx.lineTo(x, y-44); ctx.closePath(); ctx.fill();
  }
  let bayangan = lagiPamer ? 10 : 14;
  ctx.fillStyle="rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(x, y+16, bayangan, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.save(); ctx.translate(x, y + nafas*0.3 + lompat); ctx.scale(dir, 1);
  ctx.fillStyle="#1e293b"; ctx.beginPath(); ctx.roundRect(-8, 6 + ayunKaki, 7, 10, 3); ctx.fill(); ctx.beginPath(); ctx.roundRect(1, 6 - ayunKaki, 7, 10, 3); ctx.fill();
  ctx.fillStyle="#fff"; ctx.beginPath(); ctx.roundRect(-8, 13 + ayunKaki, 7, 3, 2); ctx.fill(); ctx.beginPath(); ctx.roundRect(1, 13 - ayunKaki, 7, 3, 2); ctx.fill();
  ctx.fillStyle="#2b3a67"; ctx.fillRect(-7, 0, 14, 8);
  let warnaKaos = isMe ? "#ff6b9d" : "#4a90e2";
  let gBadan = ctx.createLinearGradient(-10, -4, 10, 12); gBadan.addColorStop(0, warnaKaos); gBadan.addColorStop(1, "#00000033");
  ctx.fillStyle = gBadan; ctx.beginPath(); ctx.roundRect(-10, -4, 20, 14, 6); ctx.fill();
  ctx.fillStyle="rgba(255,255,255,0.9)"; ctx.beginPath(); ctx.ellipse(0, -3, 4, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle="#ffdbac"; ctx.beginPath(); ctx.roundRect(-14, -2 + ayunTangan, 5, 10, 3); ctx.fill(); ctx.beginPath(); ctx.roundRect(9, -2 - ayunTangan, 5, 10, 3); ctx.fill();
  ctx.fillStyle="#ffdbac"; ctx.beginPath(); ctx.roundRect(-9, -22, 18, 18, 7); ctx.fill();
  ctx.fillStyle="rgba(255,120,150,0.5)"; ctx.beginPath(); ctx.ellipse(-6, -10, 2.5, 1.8, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(6, -10, 2.5, 1.8, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle="#3b2314"; ctx.beginPath(); ctx.roundRect(-9, -22, 18, 7, 4); ctx.fill(); ctx.beginPath(); ctx.moveTo(-9, -18); ctx.quadraticCurveTo(-4, -12, -2, -18); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, -18); ctx.quadraticCurveTo(5, -12, 9, -18); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#ffd93d"; ctx.beginPath(); ctx.roundRect(-11, -26, 22, 5, 3); ctx.fill(); ctx.beginPath(); ctx.roundRect(-5, -32, 10, 7, 3); ctx.fill();
  let kedip = (animTime % 3) < 0.12;
  if(kedip){ ctx.strokeStyle="#111"; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(4, -12); ctx.stroke(); }
  else { ctx.fillStyle="#111"; ctx.beginPath(); ctx.arc(2, -12, 1.8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(2.6, -12.6, 0.6, 0, Math.PI*2); ctx.fill(); }
  ctx.strokeStyle="#7c2d12"; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(2, -8, 3, 0.2, 1.2); ctx.stroke();
  if(mancing){
    let lengkung = Math.sin(animTime*5)*2;
    ctx.strokeStyle="#8b4513"; ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(9, 2); ctx.quadraticCurveTo(22, -10, 28, -24 + lengkung); ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,0.9)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(28, -24 + lengkung); ctx.quadraticCurveTo(30, -5, 28, 20); ctx.stroke();
    ctx.fillStyle="#ef4444"; ctx.beginPath(); ctx.arc(28 + Math.sin(animTime*4)*2, 20, 3, 0, Math.PI*2); ctx.fill();
  } else if(!lagiPamer){
    ctx.strokeStyle="#8b4513"; ctx.lineWidth=2.2; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(9, 2); ctx.lineTo(22, -18); ctx.stroke();
  }
  ctx.restore();
  if(lagiPamer){
    let warnaIkan = fishNama === "Leviathan" || fishNama === "Hiu Paus" ? "#f59e0b" : fishNama === "Naga Laut" ? "#a855f7" : fishNama === "Arwana" || fishNama === "Pari Manta" ? "#3b82f6" : fishNama === "Kakap" || fishNama === "Tuna" ? "#22c55e" : "#94a3b8";
    gambarIkanHidup(x, y-58 + lompat, 1.1, warnaIkan, 1, 0);
    for(let i=0;i<3;i++){ let by = y-70 + lompat - ((animTime*20 + i*12) % 20); ctx.fillStyle="rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.arc(x-16+i*14, by, 2, 0, Math.PI*2); ctx.fill(); }
    ctx.font="bold 11px sans-serif"; ctx.textAlign="center"; ctx.fillStyle="#fff"; ctx.strokeStyle="rgba(0,0,0,0.8)"; ctx.lineWidth=3; ctx.strokeText(fishNama, x, y-82 + lompat); ctx.fillText(fishNama, x, y-82 + lompat);
  }
  ctx.font="bold 11px sans-serif"; ctx.textAlign="center"; ctx.fillStyle="#fff"; ctx.strokeStyle="rgba(0,0,0,0.7)"; ctx.lineWidth=3; ctx.strokeText(namaP, x, y-36); ctx.fillText(namaP, x, y-36); ctx.textAlign="left";
}
// === MAP PIXEL - DIGAMBAR SEKALI, GAK GERAK-GERAK ===
function rndSeed(x, y){ let n = Math.sin(x*12.9898 + y*78.233) * 43758.5453; return n - Math.floor(n); }
function jenisTile(tx, ty){
  let x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
  if(x < DARAT.x1 || x > DARAT.x2 || y < DARAT.y1 || y > DARAT.y2) return "air";
  if(jarakKolam(x, y) < 1) return "kolam";
  if(jarakKolam(x, y) < 1.22) return "pasir_kolam";
  // Jalan: vertikal dari toko ke kolam + horizontal bawah kolam
  if(x >= 560 && x <= 640 && y >= 460 && y <= 1150) return "jalan";
  if(y >= 1320 && y <= 1390 && x >= 300 && x <= 900) return "jalan";
  if(x >= 300 && x <= 370 && y >= 940 && y <= 1390) return "jalan";
  // Pasir: 1 tile dari pinggir darat
  if(x < DARAT.x1+40 || x > DARAT.x2-40 || y < DARAT.y1+40 || y > DARAT.y2-40) return "pasir";
  return "rumput";
}
let mapCanvas = null;
function buatMapCanvas(){
  if(mapCanvas) return mapCanvas;
  mapCanvas = document.createElement("canvas");
  mapCanvas.width = WORLD_W; mapCanvas.height = WORLD_H;
  let m = mapCanvas.getContext("2d");
  let cols = WORLD_W / TILE, rows = WORLD_H / TILE;
  for(let ty=0; ty<rows; ty++){
    for(let tx=0; tx<cols; tx++){
      let t = jenisTile(tx, ty);
      let x = tx*TILE, y = ty*TILE;
      let r = rndSeed(tx, ty);
      if(t === "air"){
        m.fillStyle = r > 0.5 ? "#1a6fc4" : "#1e7ad9";
        m.fillRect(x, y, TILE, TILE);
        // Pixel air - kotak kecil kayak di SS
        m.fillStyle = "rgba(255,255,255,0.10)"; if(r > 0.7) m.fillRect(x+6, y+10, 14, 5);
        m.fillStyle = "rgba(0,0,0,0.08)"; if(r < 0.3) m.fillRect(x+18, y+26, 14, 5);
      } else if(t === "pasir" || t === "pasir_kolam"){
        m.fillStyle = r > 0.5 ? "#f2d492" : "#fbe8b8";
        m.fillRect(x, y, TILE, TILE);
        m.fillStyle = "rgba(180,140,60,0.22)"; if(r > 0.6) m.fillRect(x+8, y+12, 8, 4);
        m.fillStyle = "rgba(255,255,255,0.35)"; if(r < 0.3) m.fillRect(x+20, y+24, 8, 4);
      } else if(t === "kolam"){
        // Kolam: tosca pinggir, biru tengah
        let d = jarakKolam(x+TILE/2, y+TILE/2);
        m.fillStyle = d < 0.5 ? "#2a9ad9" : "#3bb5e0";
        m.fillRect(x, y, TILE, TILE);
        m.fillStyle = "rgba(255,255,255,0.15)"; if(r > 0.7) m.fillRect(x+6, y+10, 14, 4);
      } else if(t === "jalan"){
        m.fillStyle = r > 0.5 ? "#e8c87a" : "#e2c07a";
        m.fillRect(x, y, TILE, TILE);
        m.fillStyle = "rgba(0,0,0,0.08)"; if(r > 0.6) m.fillRect(x+10, y+18, 10, 4);
      } else {
        // Rumput pixel - 2 variasi ijo + bintik
        m.fillStyle = r > 0.5 ? "#57a844" : "#5cb84a";
        m.fillRect(x, y, TILE, TILE);
        m.fillStyle = "rgba(0,0,0,0.08)"; if(r > 0.65) m.fillRect(x+6, y+10, 10, 4);
        m.fillStyle = "rgba(255,255,255,0.12)"; if(r < 0.25) m.fillRect(x+22, y+24, 10, 4);
        if(r > 0.93){ m.fillStyle = r > 0.97 ? "#ff6b9d" : "#facc15"; m.fillRect(x+16, y+14, 5, 5); }
      }
    }
  }
  // Grid halus antar tile biar kerasa pixel
  m.strokeStyle = "rgba(0,0,0,0.04)"; m.lineWidth = 1;
  for(let i=0;i<=cols;i++){ m.beginPath(); m.moveTo(i*TILE, 0); m.lineTo(i*TILE, WORLD_H); m.stroke(); }
  for(let i=0;i<=rows;i++){ m.beginPath(); m.moveTo(0, i*TILE); m.lineTo(WORLD_W, i*TILE); m.stroke(); }
  // Teratai di kolam
  m.fillStyle = "#2fae4f";
  m.beginPath(); m.ellipse(KOLAM.cx-120, KOLAM.cy+60, 16, 10, 0, 0, Math.PI*2); m.fill();
  m.beginPath(); m.ellipse(KOLAM.cx+130, KOLAM.cy-50, 14, 9, 0, 0, Math.PI*2); m.fill();
  m.fillStyle = "#ff6b9d"; m.beginPath(); m.arc(KOLAM.cx-120, KOLAM.cy+60, 4, 0, Math.PI*2); m.fill();
  return mapCanvas;
}
function gambarEfekAir(){
  // Ombak jalan di laut luar
  for(let i=0;i<6;i++){
    let yy = ((animTime*22 + i*300) % (WORLD_H+120)) - 60;
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for(let x=0;x<=WORLD_W;x+=40){
      let wy = yy + Math.sin(animTime*2 + x*0.012 + i)*5;
      if(x===0) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  // Buih di pinggir darat + kolam
  let b = 5 + Math.sin(animTime*1.8)*3;
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.fillRect(DARAT.x1-4, 0, 6+b, WORLD_H);
  ctx.fillRect(DARAT.x2-2, 0, 6+b, WORLD_H);
  ctx.fillRect(0, DARAT.y2-4, WORLD_W, 6+b);
  ctx.strokeStyle = `rgba(255,255,255,${0.6 + Math.sin(animTime*2)*0.2})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(KOLAM.cx, KOLAM.cy, KOLAM.rx+4, KOLAM.ry+4, 0, 0, Math.PI*2); ctx.stroke();
  // Riak kolam
  for(let i=0;i<3;i++){
    let rr = 40 + ((animTime*30 + i*50) % 160);
    ctx.strokeStyle = `rgba(255,255,255,${0.35 - rr/500})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(KOLAM.cx, KOLAM.cy, rr, rr*0.65, 0, 0, Math.PI*2); ctx.stroke();
  }
  ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 3;
  ctx.strokeText("🎣 KOLAM MANCING", KOLAM.cx, KOLAM.cy - KOLAM.ry - 12);
  ctx.fillText("🎣 KOLAM MANCING", KOLAM.cx, KOLAM.cy - KOLAM.ry - 12);
  ctx.textAlign = "left";
}
function gambarKarang(x, y, s, warna){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(0, 18, 46, 9, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = warna;
  ctx.beginPath(); ctx.roundRect(-10, -22, 20, 42, 7); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-38, -12, 28, 12, 6); ctx.fill();
  ctx.beginPath(); ctx.roundRect(10, -12, 28, 12, 6); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-30, -32, 14, 20, 6); ctx.fill();
  ctx.beginPath(); ctx.roundRect(16, -32, 14, 20, 6); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(-2, -14, 6, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
function gambarRumputLaut(x, y, s){
  ctx.strokeStyle = "#0e9a6a"; ctx.lineWidth = 4; ctx.lineCap = "round";
  for(let i=-1;i<=1;i++){
    ctx.beginPath(); ctx.moveTo(x+i*8, y);
    ctx.quadraticCurveTo(x+i*8+Math.sin(animTime*2+i)*6, y-18, x+i*8+Math.sin(animTime*2+i*2)*10, y-34);
    ctx.stroke();
  }
}
function gambarPohon(x, y, s){
  let goyang = Math.sin(animTime*1.2 + x)*2.5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(2, 16, 24, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#7a4a22";
  ctx.beginPath(); ctx.moveTo(-7, 16); ctx.quadraticCurveTo(-4, -8, 0, -14); ctx.lineTo(10, -14); ctx.quadraticCurveTo(8, -2, 11, 16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#5a3415"; ctx.lineWidth = 2;
  for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(-4, 10-i*6); ctx.lineTo(8, 10-i*6); ctx.stroke(); }
  for(let lapis=0; lapis<2; lapis++){
    for(let i=0;i<8;i++){
      let sudut = -Math.PI + i*(Math.PI/7) + lapis*0.2;
      let dx = Math.cos(sudut)*(26+lapis*6) + goyang;
      let dy = Math.sin(sudut)*(13+lapis*4) - 14;
      ctx.strokeStyle = lapis===0 ? "#145c2e" : "#1e8a3c"; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(4, -14); ctx.quadraticCurveTo(4+dx*0.55, -14+dy*0.55, 4+dx, -14+dy+9); ctx.stroke();
      ctx.strokeStyle = "#2fae4f"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(4, -14); ctx.quadraticCurveTo(4+dx*0.55, -14+dy*0.55, 4+dx, -14+dy+7); ctx.stroke();
    }
  }
  ctx.fillStyle = "#6b4423"; ctx.beginPath(); ctx.arc(-2, -8, 4.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(8, -8, 4.5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
function gambarSemak(x, y, s){
  ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.beginPath(); ctx.ellipse(x, y+14, 26*s, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#157a32"; ctx.beginPath(); ctx.arc(x, y, 24*s, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#22a344"; ctx.beginPath(); ctx.arc(x-9, y-7, 15*s, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+9, y-5, 13*s, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#ff6b6b"; ctx.fillRect(x-11, y-9, 4, 4); ctx.fillRect(x+7, y-11, 4, 4);
  ctx.fillStyle = "#facc15"; ctx.fillRect(x, y-12, 4, 4);
}
function gambarToko(){
  let x = TOKO.x, y = TOKO.y;
  ctx.fillStyle="rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(x, y+TOKO.h+8, 110, 14, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = lagiDiToko() ? "rgba(245,158,11,0.9)" : "rgba(255,255,255,0.6)"; ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y+TOKO.h, 105, 0, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle="#fff7ed"; ctx.fillRect(x-TOKO.w/2, y, TOKO.w, TOKO.h);
  ctx.fillStyle="#f59e0b"; ctx.fillRect(x-TOKO.w/2, y, TOKO.w, 8);
  ctx.fillStyle="#dc2626"; ctx.beginPath(); ctx.moveTo(x-TOKO.w/2-14, y); ctx.lineTo(x, y-42); ctx.lineTo(x+TOKO.w/2+14, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#78350f"; ctx.fillRect(x-18, y+60, 36, 60);
  ctx.fillStyle="#fef3c7"; ctx.fillRect(x-68, y+42, 38, 34); ctx.fillRect(x+30, y+42, 38, 34);
  ctx.fillStyle="#92400e"; ctx.fillRect(x-68, y+42, 38, 4); ctx.fillRect(x+30, y+42, 38, 4);
  ctx.fillStyle="#1e293b"; ctx.fillRect(x-52, y+8, 104, 26);
  ctx.font="bold 15px sans-serif"; ctx.textAlign="center"; ctx.fillStyle="#facc15"; ctx.fillText("🏪 TOKO", x, y+26); ctx.textAlign="left";
}
function draw(){
  if(cv.width !== innerWidth || cv.height !== innerHeight){ cv.width = innerWidth; cv.height = innerHeight; cvW = innerWidth; cvH = innerHeight; }
  animTime += 0.016;
  if(casting && !lagiDiAir()){ batalMancing("🚫 Kamu keluar dari pinggir air! Mancing batal 🥲"); return requestAnimationFrame(draw); }
  let targetCamX = me.x - (cvW/2)/ZOOM; let targetCamY = me.y - (cvH/2)/ZOOM;
  targetCamX = Math.max(0, Math.min(WORLD_W - cvW/ZOOM, targetCamX)); targetCamY = Math.max(0, Math.min(WORLD_H - cvH/ZOOM, targetCamY));
  camX += (targetCamX - camX) * 0.18; camY += (targetCamY - camY) * 0.18;
  ctx.save(); ctx.scale(ZOOM, ZOOM); ctx.translate(-camX, -camY);
  // MAP PIXEL - gambar sekali, tinggal tempel
  ctx.drawImage(buatMapCanvas(), 0, 0);
  gambarEfekAir();
  gambarKarang(50, 500, 1, "#ff8a7a");
  gambarKarang(1150, 450, 1.2, "#e879f9");
  gambarKarang(1150, 1250, 1, "#fb923c");
  gambarKarang(50, 1350, 0.9, "#ff8a7a");
  gambarRumputLaut(40, 800, 1); gambarRumputLaut(1155, 800, 1); gambarRumputLaut(40, 1600, 1); gambarRumputLaut(1155, 1600, 1);
  ctx.fillStyle = "#94a3b8"; ctx.beginPath(); ctx.arc(1150, 1550, 34, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.arc(1135, 1535, 15, 0, Math.PI*2); ctx.fill();
  ikanLaut.forEach(f=>{
    if(f.zona === "kiri" || f.zona === "kanan"){ f.y += f.speed * f.dir; if(f.y > 1550) f.dir = -1; if(f.y < 250) f.dir = 1; }
    else { f.x += f.speed * f.dir; if(f.x > 1080) f.dir = -1; if(f.x < 120) f.dir = 1; }
    gambarIkanHidup(f.x, f.y + Math.sin(animTime*3 + f.fase)*3, f.ukuran, f.warna, f.zona === "bawah" ? f.dir : (f.zona === "kiri" ? 1 : -1), f.fase);
  });
  ikanKolam.forEach(f=>{
    f.a += f.speed;
    let fx = KOLAM.cx + Math.cos(f.a) * f.r;
    let fy = KOLAM.cy + Math.sin(f.a) * f.r * 0.65;
    gambarIkanHidup(fx, fy, f.ukuran, f.warna, Math.cos(f.a) > 0 ? 1 : -1, f.fase);
  });
  gambarPohon(200, 220, 1.4); gambarPohon(980, 220, 1.5); gambarPohon(180, 620, 1.2); gambarPohon(1000, 700, 1.3);
  gambarPohon(220, 1450, 1.2); gambarPohon(980, 1500, 1.3); gambarPohon(320, 820, 1.1); gambarPohon(880, 850, 1.1);
  gambarPohon(300, 520, 1); gambarPohon(900, 560, 1);
  gambarSemak(420, 650, 1.3); gambarSemak(780, 700, 1.1); gambarSemak(350, 1450, 1); gambarSemak(850, 1500, 1.1);
  gambarToko();
  ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.arc(240, 1560, 10, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(280, 1560, 10, 0, Math.PI*2); ctx.fill();
  let api2 = 1 + Math.sin(animTime*8)*0.2; ctx.font = `${Math.round(26*api2)}px serif`; ctx.fillText("🔥", 250, 1560);
  ctx.fillStyle = "#334155"; ctx.fillRect(TOKO.x-110, TOKO.y+TOKO.h+60, 6, 42);
  ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(TOKO.x-107, TOKO.y+TOKO.h+56, 8, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "rgba(250,204,21,0.25)"; ctx.beginPath(); ctx.arc(TOKO.x-107, TOKO.y+TOKO.h+56, 18, 0, Math.PI*2); ctx.fill();
  ripples = ripples.filter(r=>r.alpha>0);
  ripples.forEach(r=>{ r.r+=1.2; r.alpha-=0.02; ctx.strokeStyle=`rgba(255,255,255,${r.alpha})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 0, Math.PI*2); ctx.stroke(); });
  daun.forEach(d=>{ d.y+=d.speed; d.x+=Math.sin(animTime+d.y)*0.5; if(d.y>WORLD_H) d.y=0; if(d.x>WORLD_W) d.x=0; ctx.font="12px serif"; ctx.fillText("🍃", d.x, d.y); });
  players.forEach(p=>{
    let tx = p.tx ?? p.x, ty = p.ty ?? p.y;
    let vx = (tx - (p.px ?? tx)) * 0.5; let vy = (ty - (p.py ?? ty)) * 0.5;
    p.px = tx; p.py = ty; let targetX = tx + vx, targetY = ty + vy;
    p.x += (targetX - p.x) * 0.18; p.y += (targetY - p.y) * 0.18;
    if(Math.abs(targetX - p.x) > 120) p.x = targetX; if(Math.abs(targetY - p.y) > 120) p.y = targetY;
    p.x = Math.max(DARAT.x1, Math.min(DARAT.x2, p.x)); p.y = Math.max(DARAT.y1, Math.min(DARAT.y2, p.y));
    if(diDalamKolam(p.x, p.y)){ let dx = p.x-KOLAM.cx, dy = p.y-KOLAM.cy, len = Math.sqrt(dx*dx+dy*dy)||1; p.x = KOLAM.cx + dx/len*KOLAM.rx*1.06; p.y = KOLAM.cy + dy/len*KOLAM.ry*1.06; }
    let dx = targetX - p.x;
    if(Math.abs(dx) > 1.5){ p.jalan = 1; p.dir = dx > 0 ? 1 : -1; } else p.jalan = 0;
    gambarKarakter(p.x, p.y, p.nama, p.dir || 1, p.jalan, p.mancing, false, p.lastFish, p.lastFishNama, p.lastFishAt, p.chatText, p.chatAt);
  });
  let jalan = Math.abs(me.dx)+Math.abs(me.dy); me.jalan = jalan;
  gambarKarakter(me.x, me.y, nama, me.dir, jalan, me.mancing, true, me.lastFish, me.lastFishNama, me.lastFishAt, me.chatText, me.chatAt);
  if(!casting){ me.x+=me.dx; me.y+=me.dy; }
  kunciDiDarat();
  if(me.x > TOKO.x-TOKO.w/2-14 && me.x < TOKO.x+TOKO.w/2+14 && me.y > TOKO.y-20 && me.y < TOKO.y+TOKO.h+10){
    if(me.y < TOKO.y+TOKO.h/2) me.y = TOKO.y-20; else me.y = TOKO.y+TOKO.h+10;
  }
  kunciDiDarat();
  ctx.restore();
  if(!casting) updateTombolAksi();
  requestAnimationFrame(draw);
}
setInterval(()=>{ let d=new Date(); document.getElementById("jam").textContent=d.toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"})+" · "+d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+" WITA"; },1000);
let lastID = localStorage.getItem("mancing_lastID");
if(lastID){ document.getElementById("inputID").value = lastID; let d = JSON.parse(localStorage.getItem(getKey(lastID)) || "null"); if(d) document.getElementById("inputNama").value = d.nama; }
const firebaseConfig = { apiKey: "AIzaSyCt1hGe42I6Xg9ji9IDt9vbcnbZQYFw1Vw", authDomain: "hady-c34e8.firebaseapp.com", databaseURL: "https://hady-c34e8-default-rtdb.asia-southeast1.firebasedatabase.app", projectId: "hady-c34e8", storageBucket: "hady-c34e8.appspot.com", messagingSenderId: "879025180790", appId: "1:879025180790:web:eca33cce19a31388174f57" };
let db = null;
try{ firebase.initializeApp(firebaseConfig); db = firebase.database(); }catch(e){}
setInterval(()=>{
  if(!db || !myID || myID==="FISH-DEMO") return;
  let nx = Math.round(me.x / WORLD_W * 10000); let ny = Math.round(me.y / WORLD_H * 10000);
  db.ref("online/" + myID).set({ nama, x: nx, y: ny, lv, mancing: me.mancing, dir: me.dir, lastFish: me.lastFish || "", lastFishNama: me.lastFishNama || "", lastFishAt: me.lastFishAt || 0, chatText: me.chatText || "", chatAt: me.chatAt || 0, lastSeen: Date.now() });
}, 80);
if(db){
  db.ref("online").on("value", (snap)=>{
    let data = snap.val() || {}; let sekarang = Date.now();
    Object.keys(data).forEach(id=>{
      if(id === myID) return; let p = data[id];
      if(sekarang - p.lastSeen > 5000) return;
      let px = p.x / 10000 * WORLD_W; let py = p.y / 10000 * WORLD_H;
      let lama = players.find(q=>q.id===id);
      if(lama){ lama.tx = px; lama.ty = py; lama.nama = p.nama; lama.mancing = p.mancing; lama.dir = p.dir || 1; lama.lastFish = p.lastFish; lama.lastFishNama = p.lastFishNama; lama.lastFishAt = p.lastFishAt; lama.chatText = p.chatText || ""; lama.chatAt = p.chatAt || 0; lama.lastSeen = sekarang; }
      else players.push({id, nama:p.nama, x:px, y:py, tx:px, ty:py, px:px, py:py, dir:p.dir||1, jalan:0, mancing:p.mancing, lastFish:p.lastFish, lastFishNama:p.lastFishNama, lastFishAt:p.lastFishAt, chatText:p.chatText||"", chatAt:p.chatAt||0, lastSeen: sekarang});
    });
    players = players.filter(p=> data[p.id] && sekarang - data[p.id].lastSeen < 5000);
  });
  db.ref("chat").limitToLast(30).on("child_added", (snap)=>{
    let c = snap.val(); if(!c) return; if(Date.now() - c.waktu > 60000) return; if(c.id === myID) return;
    tambahChatKeList(c.nama, c.teks, false);
    if(c.id === myID){ me.chatText = c.teks; me.chatAt = Date.now(); }
    else { let p = players.find(q=>q.id===c.id); if(p){ p.chatText = c.teks; p.chatAt = Date.now(); } }
  });
}
window.addEventListener("beforeunload", ()=>{ if(db && myID) db.ref("online/" + myID).remove(); });
