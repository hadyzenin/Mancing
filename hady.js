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

let players = [];
let me = { x: 600, y: WORLD_H-100, dx: 0, dy: 0, dir: 1, jalan: 0, mancing: false, lastFish: "", lastFishAt: 0, lastFishNama: "", chatText: "", chatAt: 0 };
let inv = [], yen = 500, xp = 0, xpMax = 100, lv = 1, nama = "hady", myID = "FISH-DEMO", rodIdx = 0, ownedRods = [0];
let casting = false, curFish = null, zoneL = 35;
let animTime = 0, ripples = [], daun = [];
for(let i=0;i<30;i++) daun.push({x: Math.random()*WORLD_W, y: Math.random()*WORLD_H, s: Math.random()*2+1, speed: Math.random()*0.5+0.3});

let cooldownUntil = 0, cooldownTimer = null;
function sisaCooldown(){ return Math.max(0, cooldownUntil - Date.now()); }
function mulaiCooldown(){
  cooldownUntil = Date.now() + 3000;
  let btn = document.getElementById("btnFish");
  if(cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(()=>{
    let sisa = sisaCooldown();
    if(sisa <= 0){
      clearInterval(cooldownTimer);
      if(btn){ btn.disabled = false; btn.innerHTML = "🎣<br>Joran"; }
      renderHUD();
      return;
    }
    if(btn){ btn.disabled = true; btn.innerHTML = `⏳<br>${Math.ceil(sisa/1000)}s`; }
  }, 100);
}

// === CHAT GLOBAL - COOLDOWN 5 DETIK ===
let lastChatAt = 0, chatOpen = false;
function toggleChat(){
  chatOpen = !chatOpen;
  document.getElementById("chatBox").style.display = chatOpen ? "block" : "none";
  if(chatOpen){
    document.getElementById("chatBadge").style.display = "none";
    setTimeout(()=>document.getElementById("chatInput").focus(), 100);
  }
}
function kirimChat(){
  let inp = document.getElementById("chatInput");
  let teks = inp.value.trim();
  if(!teks) return;
  let sisa = 5000 - (Date.now() - lastChatAt);
  if(sisa > 0){ toast(`⏳ Chat cooldown ${Math.ceil(sisa/1000)} detik lagi...`); return; }
  if(!db){ toast("Chat belum tersambung..."); return; }
  lastChatAt = Date.now();
  inp.value = "";
  document.getElementById("chatCooldown").textContent = "⏳ Cooldown 5 detik...";
  setTimeout(()=>{ document.getElementById("chatCooldown").textContent = ""; }, 5000);
  // Bubble di atas kepala sendiri
  me.chatText = teks; me.chatAt = Date.now();
  db.ref("chat").push({ nama, teks, waktu: Date.now(), id: myID });
}
function tambahChatKeList(namaPengirim, teks, isMe){
  let list = document.getElementById("chatList");
  if(!list) return;
  let div = document.createElement("div");
  div.className = "chat-msg" + (isMe ? " me" : "");
  div.innerHTML = `<b>${namaPengirim}:</b> ${teks.replace(/</g,"&lt;")}`;
  list.appendChild(div);
  while(list.children.length > 30) list.removeChild(list.firstChild);
  list.scrollTop = list.scrollHeight;
  if(!chatOpen) document.getElementById("chatBadge").style.display = "block";
}

let tarikPos = 50, tarikDir = 1, tarikRaf = null, tarikTimeout = null, tarikKecepatan = 2, tarikZonaW = 30, tarikSisaWaktu = 8000, tarikWaktuMulai = 0, tarikLastFrame = 0, tarikBarEl = null, tarikIkanEl = null, tarikTimerEl = null;

// === ZONA MANCING FIX ATAS: KAKI HARUS NYEMPLUNG KE AIR, BUKAN DI RUMPUT ===
// Air atas: y 0-100, garis putih di y=100. Jadi boleh mancing cuma kalau y 88-112 (kaki nyentuh air)
// Sebelumnya 105-128 -> itu masih rumput hijau di bawah air, makanya di screenshot cuki di rumput bisa mancing
// Air bawah: y WORLD_H-100 - WORLD_H, boleh kalau y WORLD_H-112 - WORLD_H-88
// Air kiri: x 0-100, boleh kalau x 88-112. Air kanan: x WORLD_W-100 - WORLD_W, boleh kalau x WORLD_W-112 - WORLD_W-88
function lagiDiAir(){
  let diAtas  = me.y >= 88 && me.y <= 112;
  let diBawah = me.y >= WORLD_H-112 && me.y <= WORLD_H-88;
  let diKiri  = me.x >= 88 && me.x <= 112;
  let diKanan = me.x >= WORLD_W-112 && me.x <= WORLD_W-88;
  return diAtas || diBawah || diKiri || diKanan;
}
function posisiRiak(){
  if(me.y <= 112) return { x: me.x + 10, y: 50 };
  if(me.y >= WORLD_H-112) return { x: me.x + 10, y: WORLD_H-50 };
  if(me.x <= 112) return { x: 50, y: me.y + 20 };
  if(me.x >= WORLD_W-112) return { x: WORLD_W-50, y: me.y + 20 };
  return { x: me.x + 30, y: me.y + 40 };
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
  camX = me.x - (innerWidth/2)/ZOOM; camY = me.y - (innerHeight/2)/ZOOM;
  save(); renderHUD(); renderInv(); draw();
  toast("Jalan sampe kakimu nyemplung ke air! 🌊");
  // Enter di input chat = kirim
  document.getElementById("chatInput").addEventListener("keydown", e=>{ if(e.key==="Enter") kirimChat(); });
}
function renderHUD(){
  document.getElementById("pNama").textContent=nama;
  document.getElementById("pLv").textContent=lv;
  document.getElementById("pXP").textContent=xp;
  document.getElementById("pXPMax").textContent=xpMax;
  document.getElementById("xpBar").style.width=(xp/xpMax*100)+"%";
  document.getElementById("pYen").textContent=yen.toLocaleString("id-ID");
  document.getElementById("buffs").innerHTML=`<i>🎣 ${RODS[rodIdx].nama}</i><i>💴 ${yen.toLocaleString()} Yen</i>`;
  let btn = document.getElementById("btnFish");
  if(btn && !casting && sisaCooldown() <= 0){
    if(lagiDiAir()){
      btn.style.background = "linear-gradient(180deg,#38bdf8,#0284c7)";
      btn.style.boxShadow = "0 6px 0 #0c4a6e,0 10px 20px rgba(56,189,248,.5)";
    } else {
      btn.style.background = "linear-gradient(180deg,#94a3b8,#64748b)";
      btn.style.boxShadow = "0 6px 0 #334155,0 10px 20px rgba(0,0,0,.3)";
    }
  }
}
function renderInv(){
  let el=document.getElementById("inv");
  el.innerHTML="";
  for(let i=0;i<5;i++){ let f=inv[i]; el.innerHTML+=`<div class="slot ${i===0?'active':''}">${f?f.emoji:""}<span>${f?(f.berat).toFixed(2):""}</span></div>`; }
  el.innerHTML+=`<div class="slot" onclick="openMenu()" style="font-size:20px">🎒<span style="font-size:10px;font-weight:800;color:#16a34a">${inv.length}/45</span></div>`;
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
  let fishHtml=inv.length?inv.map(f=>`<div class="row"><span><b>${f.emoji} ${f.nama}</b><br><small>${f.tier} • ${Number(f.berat).toFixed(2)} kg</small></span><b>💴 ${f.yen.toLocaleString()}</b></div>`).join(""):"<p style='text-align:center;color:#666;padding:12px'>Tas masih kosong, mancing dulu!</p>";
  showModal(`<h2>🎒 Tas & Toko Joran</h2><p style="font-size:14px">Yen kamu: <b>💴 ${yen.toLocaleString()}</b></p><div class="tabs"><button class="on" onclick="openMenu()">Toko Joran</button><button onclick="openTas()">Ikan (${inv.length})</button></div><div class="list">${rodsHtml}</div><button onclick="closeModal()">Tutup</button>`);
  window._fishHtml=fishHtml;
}
function beliJoran(i){
  let r=RODS[i];
  if(lv<r.lv){ toast("Butuh Lv "+r.lv); return; }
  if(yen<r.harga){ toast("Yen kurang! Butuh 💴 "+r.harga.toLocaleString()); return; }
  yen-=r.harga; ownedRods.push(i); rodIdx=i; save(); renderHUD();
  toast("🎉 Berhasil beli "+r.nama+"!"); openMenu();
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
  if(casting) return;
  if(sisaCooldown() > 0){ toast(`⏳ Tunggu ${Math.ceil(sisaCooldown()/1000)} detik lagi...`); return; }
  if(!lagiDiAir()){ toast("🚫 Masih di darat! Kakimu harus nyemplung ke air dulu 🌊"); return; }
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
  let dt = Math.min(32, now - tarikLastFrame);
  tarikLastFrame = now;
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
  let cfg = {
    Common:    { zona: 38, speed: 1.4, waktu: 8000 },
    Uncommon:  { zona: 30, speed: 2.0, waktu: 7000 },
    Rare:      { zona: 22, speed: 2.8, waktu: 6000 },
    Epic:      { zona: 15, speed: 3.6, waktu: 5000 },
    Legendary: { zona: 10, speed: 4.6, waktu: 4000 },
  };
  let c = cfg[curFish.tier] || cfg.Common;
  tarikZonaW = c.zona;
  tarikKecepatan = c.speed;
  tarikSisaWaktu = c.waktu;
  tarikPos = 50; tarikDir = Math.random() > 0.5 ? 1 : -1;
  zoneL = 20 + Math.random() * (70 - c.zona);
  document.getElementById("tantanganIkan").textContent = curFish.emoji;
  let tierEl = document.getElementById("tantanganTier");
  tierEl.textContent = curFish.tier.toUpperCase();
  tierEl.className = "tarik-tier " + curFish.tier;
  document.getElementById("tantanganNama").textContent = curFish.nama + " Nyangkut!";
  let zoneEl = document.getElementById("barZone");
  zoneEl.style.left = zoneL + "%";
  zoneEl.style.width = tarikZonaW + "%";
  let perfectEl = document.getElementById("barZonePerfect");
  let perfectW = tarikZonaW * 0.35;
  perfectEl.style.left = (zoneL + tarikZonaW/2 - perfectW/2) + "%";
  perfectEl.style.width = perfectW + "%";
  document.getElementById("barGame").style.display = "block";
  document.getElementById("tarikTimerBar").style.width = "100%";
  tarikBarEl = document.querySelector(".tarik-bar");
  tarikIkanEl = document.getElementById("ikanGerak");
  tarikTimerEl = document.getElementById("tarikTimerBar");
  tarikIkanEl.textContent = curFish.emoji;
  tarikWaktuMulai = performance.now();
  tarikLastFrame = 0;
  if(tarikRaf) cancelAnimationFrame(tarikRaf);
  clearTimeout(tarikTimeout);
  tarikRaf = requestAnimationFrame(tarikLoop);
  tarikTimeout = setTimeout(()=>{ if(casting) gagalMancing("⏰ Kelamaan! Ikannya lepas..."); }, tarikSisaWaktu);
}
function cobaTarik(){
  if(!casting) return;
  if(tarikRaf) cancelAnimationFrame(tarikRaf);
  clearTimeout(tarikTimeout);
  let zonaAwal = zoneL;
  let zonaAkhir = zoneL + tarikZonaW;
  let perfectAwal = zoneL + tarikZonaW/2 - (tarikZonaW*0.35)/2;
  let perfectAkhir = perfectAwal + tarikZonaW*0.35;
  if(tarikPos >= perfectAwal && tarikPos <= perfectAkhir){ selesaiMancing(true); return; }
  if(tarikPos >= zonaAwal - 2 && tarikPos <= zonaAkhir){ selesaiMancing(false); return; }
  gagalMancing("❌ Meleset! Ikannya lepas... 🥲");
}
function batalMancing(pesan){
  if(!casting) return;
  if(tarikRaf) cancelAnimationFrame(tarikRaf);
  clearTimeout(tarikTimeout);
  casting=false; me.mancing=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; document.getElementById("btnFish").innerHTML="🎣<br>Joran";
  toast(pesan || "Mancing batal!");
  mulaiCooldown();
  renderHUD();
}
function gagalMancing(pesan){
  if(tarikRaf) cancelAnimationFrame(tarikRaf);
  clearTimeout(tarikTimeout);
  casting=false; me.mancing=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; document.getElementById("btnFish").innerHTML="🎣<br>Joran";
  toast(pesan || "Yah, ikannya lepas! 🥲");
  mulaiCooldown();
  renderHUD();
}
function selesaiMancing(isPerfect){
  if(tarikRaf) cancelAnimationFrame(tarikRaf);
  clearTimeout(tarikTimeout);
  casting=false; me.mancing=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; document.getElementById("btnFish").innerHTML="🎣<br>Joran";
  let berat=curFish.min+Math.random()*(curFish.max-curFish.min);
  let bonus=1+RODS[rodIdx].power/200;
  if(isPerfect) bonus *= 1.2;
  berat=berat*bonus;
  let ikan={...curFish,berat:berat,yen:Math.round(curFish.yen*bonus)};
  inv.unshift(ikan); if(inv.length>45) inv.pop();
  xp+=curFish.xp;
  if(isPerfect) xp += 20;
  let naik=false;
  while(xp>=xpMax){ xp-=xpMax; lv++; xpMax=Math.round(xpMax*1.4); naik=true; }
  me.lastFish = ikan.emoji;
  me.lastFishNama = ikan.nama;
  me.lastFishAt = Date.now();
  save(); renderHUD(); renderInv();
  mulaiCooldown();
  showModal(`<div class="fish-big">${ikan.emoji}</div>
    ${isPerfect ? `<div style="background:#facc15;color:#000;padding:6px 12px;border-radius:20px;font-weight:900;display:inline-block;margin:6px 0">⭐ PERFECT! +20% YEN ⭐</div><br>` : ``}
    <span class="tier ${ikan.tier}">${ikan.tier.toUpperCase()}</span>
    <h2>${ikan.nama}</h2>
    <p style="font-size:18px;font-weight:800">${berat.toFixed(2)} kg</p>
    <p style="color:#666;font-size:13px">+${curFish.xp + (isPerfect?20:0)} XP • 💴 ${ikan.yen.toLocaleString()} Yen • Joran: ${RODS[rodIdx].nama}</p>
    ${naik?`<p style="color:#16a34a;font-weight:800">🎉 NAIK LEVEL! Sekarang Lv ${lv}</p>`:""}
    <button onclick="closeModal()">Simpan ke Tas 🎒</button>`);
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
  if(casting && d > 4){
    stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;
    batalMancing("🚶 Kamu gerak! Mancing batal 🥲");
    return;
  }
  me.dx=dx/max*2.2; me.dy=dy/max*2.2; if(dx!==0) me.dir = dx>0?1:-1;
}
joy.addEventListener("touchstart",e=>{dragging=true; moveJoy(e)}); joy.addEventListener("touchmove",e=>{if(dragging) moveJoy(e)}); joy.addEventListener("touchend",()=>{dragging=false; stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;});
joy.addEventListener("mousedown",e=>{dragging=true; moveJoy(e)}); window.addEventListener("mousemove",e=>{if(dragging) moveJoy(e)}); window.addEventListener("mouseup",()=>{dragging=false; stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;});

const cv=document.getElementById("cv"), ctx=cv.getContext("2d");
let cvW = 0, cvH = 0;
function gambarKarakter(x, y, namaP, dir, jalan, mancing, isMe, fishEmoji, fishNama, fishAt, chatText, chatAt){
  let bob = Math.sin(animTime*4 + x)*1.5;
  if(jalan>0.1) bob = Math.abs(Math.sin(animTime*10))*3;
  let lompat = 0;
  let sisaIkan = fishAt ? (Date.now() - fishAt) : 99999;
  let lagiPamer = fishEmoji && sisaIkan < 4000;
  if(lagiPamer) lompat = -Math.abs(Math.sin(animTime*6))*6;
  // Bubble chat di atas kepala
  if(chatText && Date.now() - chatAt < 4000){
    ctx.font="bold 11px sans-serif"; ctx.textAlign="center";
    let w = ctx.measureText(chatText).width + 16;
    ctx.fillStyle="rgba(255,255,255,0.95)";
    ctx.beginPath(); ctx.roundRect(x - w/2, y-70, w, 22, 10); ctx.fill();
    ctx.fillStyle="#111"; ctx.fillText(chatText, x, y-55);
  }
  ctx.fillStyle="rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(x, y+14, 14, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.save(); ctx.translate(x, y+bob+lompat); ctx.scale(dir, 1);
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
  if(lagiPamer){ ctx.fillStyle="#ffdbac"; ctx.fillRect(-12, -22, 4, 10); ctx.fillRect(8, -22, 4, 10); }
  if(mancing){
    ctx.strokeStyle="#8b4513"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(26, -22+Math.sin(animTime*6)*2); ctx.stroke();
    ctx.strokeStyle="#fff"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(26, -22); ctx.lineTo(26, 18); ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.ellipse(26, 20, 8+Math.sin(animTime*4)*2, 2, 0, 0, Math.PI*2); ctx.stroke();
  } else if(!lagiPamer){
    ctx.strokeStyle="#8b4513"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(22, -18); ctx.stroke();
  }
  ctx.restore();
  if(lagiPamer){
    let goyang = Math.sin(animTime*8)*3;
    let scale = 1 + Math.sin(animTime*8)*0.08;
    ctx.save(); ctx.translate(x, y-52+lompat); ctx.scale(scale, scale);
    ctx.font="32px serif"; ctx.textAlign="center";
    ctx.fillStyle="rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillText(fishEmoji, goyang, 11);
    ctx.restore();
    ctx.font="bold 11px sans-serif"; ctx.textAlign="center";
    ctx.fillStyle="#fff"; ctx.strokeStyle="rgba(0,0,0,0.8)"; ctx.lineWidth=3;
    ctx.strokeText(fishNama, x, y-78+lompat);
    ctx.fillText(fishNama, x, y-78+lompat);
  }
  ctx.font="bold 11px sans-serif"; ctx.textAlign="center";
  ctx.fillStyle="#fff"; ctx.strokeStyle="rgba(0,0,0,0.7)"; ctx.lineWidth=3;
  ctx.strokeText(namaP, x, y-32);
  ctx.fillText(namaP, x, y-32);
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
  if(cv.width !== innerWidth || cv.height !== innerHeight){
    cv.width = innerWidth; cv.height = innerHeight;
    cvW = innerWidth; cvH = innerHeight;
  }
  animTime += 0.016;
  if(casting && !lagiDiAir()){
    batalMancing("🚫 Kamu keluar dari pinggir air! Mancing batal 🥲");
    return requestAnimationFrame(draw);
  }
  let targetCamX = me.x - (cvW/2)/ZOOM;
  let targetCamY = me.y - (cvH/2)/ZOOM;
  targetCamX = Math.max(0, Math.min(WORLD_W - cvW/ZOOM, targetCamX));
  targetCamY = Math.max(0, Math.min(WORLD_H - cvH/ZOOM, targetCamY));
  camX += (targetCamX - camX) * 0.18;
  camY += (targetCamY - camY) * 0.18;
  ctx.save();
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-camX, -camY);
  ctx.fillStyle="#f6d67a"; ctx.fillRect(0,0,WORLD_W,WORLD_H);
  let grad = ctx.createLinearGradient(0,0,0,WORLD_H);
  grad.addColorStop(0,"#8ed860"); grad.addColorStop(1,"#5cb84a");
  ctx.fillStyle=grad; ctx.fillRect(100,100,WORLD_W-200,WORLD_H-200);
  ctx.fillStyle="#e8c87a"; ctx.fillRect(150, WORLD_H/2-60, WORLD_W-300, 70);
  ctx.fillStyle="#d4b36a"; ctx.fillRect(150, WORLD_H/2-25, WORLD_W-300, 8);
  ctx.fillStyle="#2aa5e0";
  ctx.fillRect(0, WORLD_H-100, WORLD_W, 100);
  ctx.fillRect(0, 0, WORLD_W, 100);
  ctx.fillRect(0, 0, 100, WORLD_H);
  ctx.fillRect(WORLD_W-100, 0, 100, WORLD_H);
  ctx.fillStyle="rgba(255,255,255,0.9)";
  ctx.fillRect(100, WORLD_H-100, WORLD_W-200, 3);
  ctx.fillRect(100, 100, WORLD_W-200, 3);
  ctx.fillRect(100, 100, 3, WORLD_H-200);
  ctx.fillRect(WORLD_W-100, 100, 3, WORLD_H-200);
  // Zona mancing: airnya terang, rumputnya gelap - biar keliatan bedanya
  ctx.fillStyle="rgba(255,255,255,0.28)";
  ctx.fillRect(100, 88, WORLD_W-200, 24);
  ctx.fillRect(100, WORLD_H-112, WORLD_W-200, 24);
  ctx.fillStyle="rgba(255,255,255,0.5)";
  for(let i=0;i<WORLD_W;i+=60){
    let y = WORLD_H-78 + Math.sin(animTime*2 + i*0.1)*3;
    ctx.fillRect(i, y, 30, 3);
    let y2 = 4 + Math.sin(animTime*2 + i*0.1)*2;
    ctx.fillRect(i, y2, 30, 2);
  }
  ctx.font="14px serif";
  for(let i=0;i<14;i++){ ctx.fillText("🌸", 140+i*70, 200+Math.sin(i)*20); ctx.fillText("🌿", 180+i*60, WORLD_H-240); }
  gambarPohon(200, WORLD_H-250, 1);
  gambarPohon(WORLD_W-220, 270, 1.1);
  gambarPohon(220, 260, 0.9);
  gambarPohon(WORLD_W-220, WORLD_H-260, 1);
  let api = 1 + Math.sin(animTime*8)*0.2;
  ctx.font=`${Math.round(22*api)}px serif`; ctx.fillText("🔥", 220, WORLD_H-210);
  ctx.font="18px serif"; ctx.fillText("🪵", 240, WORLD_H-205);
  ctx.font="28px serif"; ctx.fillText("⛲", WORLD_W/2, WORLD_H/2-120);
  ripples = ripples.filter(r=>r.alpha>0);
  ripples.forEach(r=>{
    r.r+=1.2; r.alpha-=0.02;
    ctx.strokeStyle=`rgba(255,255,255,${r.alpha})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 0, Math.PI*2); ctx.stroke();
  });
  daun.forEach(d=>{
    d.y+=d.speed; d.x+=Math.sin(animTime+d.y)*0.5;
    if(d.y>WORLD_H) d.y=0;
    if(d.x>WORLD_W) d.x=0;
    ctx.font="12px serif"; ctx.fillText("🍃", d.x, d.y);
  });
  players.forEach(p=>{
    let tx = p.tx ?? p.x, ty = p.ty ?? p.y;
    let vx = (tx - (p.px ?? tx)) * 0.5;
    let vy = (ty - (p.py ?? ty)) * 0.5;
    p.px = tx; p.py = ty;
    let targetX = tx + vx, targetY = ty + vy;
    p.x += (targetX - p.x) * 0.18;
    p.y += (targetY - p.y) * 0.18;
    if(Math.abs(targetX - p.x) > 120){ p.x = targetX; }
    if(Math.abs(targetY - p.y) > 120){ p.y = targetY; }
    let dx = targetX - p.x;
    if(Math.abs(dx) > 1.5){ p.jalan = 1; p.dir = dx > 0 ? 1 : -1; } else { p.jalan = 0; }
    gambarKarakter(p.x, p.y, p.nama, p.dir || 1, p.jalan, p.mancing, false, p.lastFish, p.lastFishNama, p.lastFishAt, p.chatText, p.chatAt);
  });
  let jalan = Math.abs(me.dx)+Math.abs(me.dy);
  me.jalan = jalan;
  gambarKarakter(me.x, me.y, nama, me.dir, jalan, me.mancing, true, me.lastFish, me.lastFishNama, me.lastFishAt, me.chatText, me.chatAt);
  if(!casting){ me.x+=me.dx; me.y+=me.dy; }
  // Batas jalan: boleh sampe kaki nyemplung air (88), gak boleh tenggelam ke tengah air
  me.x=Math.max(88,Math.min(WORLD_W-88,me.x));
  me.y=Math.max(88,Math.min(WORLD_H-88,me.y));
  ctx.restore();
  if(!casting && sisaCooldown() <= 0){
    let btn = document.getElementById("btnFish");
    if(btn){
      if(lagiDiAir()){ btn.style.background = "linear-gradient(180deg,#38bdf8,#0284c7)"; btn.style.boxShadow = "0 6px 0 #0c4a6e,0 10px 20px rgba(56,189,248,.5)"; }
      else { btn.style.background = "linear-gradient(180deg,#94a3b8,#64748b)"; btn.style.boxShadow = "0 6px 0 #334155,0 10px 20px rgba(0,0,0,.3)"; }
    }
  }
  requestAnimationFrame(draw);
}
setInterval(()=>{ let d=new Date(); document.getElementById("jam").textContent=d.toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"})+" · "+d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+" WITA"; },1000);
let lastID = localStorage.getItem("mancing_lastID");
if(lastID){
  document.getElementById("inputID").value = lastID;
  let d = JSON.parse(localStorage.getItem(getKey(lastID)) || "null");
  if(d) document.getElementById("inputNama").value = d.nama;
}
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
try{ firebase.initializeApp(firebaseConfig); db = firebase.database(); }catch(e){}
setInterval(()=>{
  if(!db || !myID || myID==="FISH-DEMO") return;
  let nx = Math.round(me.x / WORLD_W * 10000);
  let ny = Math.round(me.y / WORLD_H * 10000);
  db.ref("online/" + myID).set({ nama, x: nx, y: ny, lv, mancing: me.mancing, dir: me.dir, lastFish: me.lastFish || "", lastFishNama: me.lastFishNama || "", lastFishAt: me.lastFishAt || 0, chatText: me.chatText || "", chatAt: me.chatAt || 0, lastSeen: Date.now() });
}, 80);
if(db){
  db.ref("online").on("value", (snap)=>{
    let data = snap.val() || {};
    let sekarang = Date.now();
    Object.keys(data).forEach(id=>{
      if(id === myID) return;
      let p = data[id];
      if(sekarang - p.lastSeen > 5000) return;
      let px = p.x / 10000 * WORLD_W;
      let py = p.y / 10000 * WORLD_H;
      let lama = players.find(q=>q.id===id);
      if(lama){
        lama.tx = px; lama.ty = py; lama.nama = p.nama;
        lama.mancing = p.mancing; lama.dir = p.dir || 1;
        lama.lastFish = p.lastFish; lama.lastFishNama = p.lastFishNama; lama.lastFishAt = p.lastFishAt;
        lama.chatText = p.chatText || ""; lama.chatAt = p.chatAt || 0;
        lama.lastSeen = sekarang;
      } else {
        players.push({id, nama:p.nama, x:px, y:py, tx:px, ty:py, px:px, py:py, dir:p.dir||1, jalan:0, mancing:p.mancing, lastFish:p.lastFish, lastFishNama:p.lastFishNama, lastFishAt:p.lastFishAt, chatText:p.chatText||"", chatAt:p.chatAt||0, lastSeen: sekarang});
      }
    });
    players = players.filter(p=> data[p.id] && sekarang - data[p.id].lastSeen < 5000);
  });
  // === DENGERIN CHAT GLOBAL ===
  db.ref("chat").limitToLast(30).on("child_added", (snap)=>{
    let c = snap.val();
    if(!c) return;
    if(Date.now() - c.waktu > 60000) return;
    tambahChatKeList(c.nama, c.teks, c.id === myID);
    // Bubble di atas kepala pengirim
    if(c.id === myID){ me.chatText = c.teks; me.chatAt = Date.now(); }
    else {
      let p = players.find(q=>q.id===c.id);
      if(p){ p.chatText = c.teks; p.chatAt = Date.now(); }
    }
  });
}
window.addEventListener("beforeunload", ()=>{
  if(db && myID) db.ref("online/" + myID).remove();
});
