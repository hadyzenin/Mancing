const RODS=[
 {lv:1,nama:"Joran Bambu",icon:"🎋",power:0,bonus:""},
 {lv:3,nama:"Joran Kayu",icon:"🪵",power:8,bonus:"+8% Rare"},
 {lv:5,nama:"Joran Karbon",icon:"🎣",power:18,bonus:"+18% Rare"},
 {lv:8,nama:"Joran Titanium",icon:"⚙️",power:30,bonus:"+30% Epic"},
 {lv:12,nama:"Joran Kristal",icon:"💎",power:45,bonus:"+45% Epic"},
 {lv:18,nama:"Joran Dewa Laut",icon:"👑",power:70,bonus:"+70% Legendary"},
];
const FISH=[
 {nama:"Gobi",tier:"Common",emoji:"🐟",min:0.02,max:0.08,koin:5,xp:10,w:60},
 {nama:"Mutiara",tier:"Common",emoji:"🐠",min:0.02,max:0.36,koin:8,xp:12,w:55},
 {nama:"Kakap",tier:"Uncommon",emoji:"🐡",min:0.5,max:2.5,koin:25,xp:30,w:28},
 {nama:"Tuna",tier:"Uncommon",emoji:"🐟",min:1,max:8,koin:40,xp:45,w:22},
 {nama:"Arwana",tier:"Rare",emoji:"🐋",min:2,max:12,koin:90,xp:90,w:12},
 {nama:"Pari Manta",tier:"Rare",emoji:"🪼",min:3,max:15,koin:130,xp:120,w:8},
 {nama:"Naga Laut",tier:"Epic",emoji:"🐉",min:5,max:25,koin:300,xp:280,w:4},
 {nama:"Hiu Paus",tier:"Legendary",emoji:"🦈",min:10,max:45,koin:900,xp:800,w:1.5},
 {nama:"Leviathan",tier:"Legendary",emoji:"🐙",min:20,max:80,koin:2000,xp:1500,w:0.8},
];

let players=[{nama:"Azzam Zikri",x:340,y:180,emoji:"🧑‍🌾",lv:28},{nama:"Mutiara",x:420,y:420,emoji:"👩",lv:12},{nama:"Pak Bayu",x:560,y:260,emoji:"👨‍🦰",lv:99}];
let me={x:320,y:300,dx:0,dy:0};
let inv=[], star=290, gem=310, xp=0, xpMax=100, lv=1, nama="Dysen", myID="FISH-DEMO", rodIdx=0;
let casting=false, barVal=50, barTimer=null, curFish=null, zoneL=35, zoneW=30;

async function apiPost(url, body){
  let r = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
  return r.json();
}
async function save(){
  localStorage.setItem("mancing_" + myID, JSON.stringify({nama,myID,inv,star,gem,xp,xpMax,lv,rodIdx}));
  localStorage.setItem("mancing_lastID", myID);
  try{ await apiPost("/api/save", { id: myID, data: {nama, inv, star, gem, xp, xpMax, lv, rodIdx} }); }catch(e){}
}
function getKey(id){ return "mancing_" + id; }

async function buatIDBaru(){
  let nm = document.getElementById("inputNama").value.trim() || "Pemancing";
  try{
    let res = await apiPost("/api/buat-id", { nama: nm });
    document.getElementById("inputID").value = res.id;
    document.getElementById("idBaruText").textContent = res.id;
  }catch(e){
    let id = "FISH-" + Math.random().toString(36).slice(2,8).toUpperCase();
    document.getElementById("inputID").value = id;
    document.getElementById("idBaruText").textContent = id;
  }
  document.getElementById("idBaruBox").style.display = "block";
}
function salinID(){
  let id = document.getElementById("idBaruText").textContent;
  navigator.clipboard.writeText(id);
  toast("ID disalin: " + id);
}
async function login(){
  let id = document.getElementById("inputID").value.trim().toUpperCase();
  let nm = document.getElementById("inputNama").value.trim() || "Pemancing";
  if(id.length < 6){ alert("Isi ID dulu, atau klik Buat ID Baru"); return; }
  if(!id.startsWith("FISH-")) id = "FISH-" + id;
  try{
    let res = await apiPost("/api/login", { id, nama: nm });
    let d = res.data;
    myID=d.id; nama=d.nama; inv=d.inv; star=d.star; gem=d.gem; xp=d.xp; xpMax=d.xpMax; lv=d.lv; rodIdx=d.rodIdx;
  }catch(e){
    myID=id; nama=nm;
    let lama = JSON.parse(localStorage.getItem(getKey(id))||"null");
    if(lama){ inv=lama.inv; star=lama.star; gem=lama.gem; xp=lama.xp; xpMax=lama.xpMax; lv=lama.lv; rodIdx=lama.rodIdx; }
  }
  startGame();
}
function startGame(){
  document.getElementById("login").style.display="none";
  document.getElementById("game").style.display="block";
  save(); renderHUD(); renderInv(); draw();
  toast("Selamat datang di Pulau, "+nama+"! ID: "+myID);
  setInterval(()=>{ players.forEach(p=>{ if(p.id===myID) return; p.x+=(Math.random()-0.5)*6; p.y+=(Math.random()-0.5)*6; }); },800);
}
function renderHUD(){
  document.getElementById("pNama").textContent=nama;
  document.getElementById("pLv").textContent=lv;
  document.getElementById("pXP").textContent=xp;
  document.getElementById("pXPMax").textContent=xpMax;
  document.getElementById("xpBar").style.width=(xp/xpMax*100)+"%";
  document.getElementById("pStar").textContent=star;
  document.getElementById("pGem").textContent=gem;
  document.getElementById("pTitle").textContent=RODS[rodIdx].nama;
  document.getElementById("buffs").innerHTML=`<i>🎣 ${RODS[rodIdx].nama}</i><i>⭐ +${RODS[rodIdx].power}%</i><i>🐟 ${inv.length}/45</i>`;
}
function renderInv(){
  let el=document.getElementById("inv");
  el.innerHTML="";
  for(let i=0;i<5;i++){ let f=inv[i]; el.innerHTML+=`<div class="slot ${i===0?'active':''}">${f?f.emoji:""}<span>${f?(f.berat).toFixed(2):""}</span></div>`; }
  el.innerHTML+=`<div class="slot" onclick="openMenu()" style="font-size:20px">🎒<span>${inv.length}/45</span></div>`;
}
function toast(t){ let e=document.getElementById("toast"); e.textContent=t; e.style.display="block"; setTimeout(()=>e.style.display="none",3000); }
function openMenu(){
  let rodsHtml=RODS.map((r,i)=>`<div class="row ${lv>=r.lv?'':'lock'}"><span><b>${r.icon} ${r.nama}</b><br><small>${r.bonus} • Butuh Lv ${r.lv}</small></span><button onclick="pilihJoran(${i})" style="padding:7px 10px;border-radius:8px;border:none;background:${i===rodIdx?'#22c55e':'#111'};color:#fff;font-weight:700">${i===rodIdx?'Dipakai':lv>=r.lv?'Pakai':'🔒 Lv '+r.lv}</button></div>`).join("");
  let fishHtml=inv.length?inv.map(f=>`<div class="row"><span><b>${f.emoji} ${f.nama}</b><br><small class="${f.tier}">${f.tier} • ${f.berat} kg</small></span><b>+${f.koin} 🪙</b></div>`).join(""):"<p style='text-align:center;color:#666;padding:12px'>Tas masih kosong, mancing dulu!</p>";
  showModal(`<h2>🎒 Tas & Joran</h2><div class="tabs"><button class="on" onclick="openMenu()">Joran</button><button onclick="openTas()">Ikan (${inv.length})</button><button onclick="openJual()">Jual Semua</button></div><div class="list">${rodsHtml}</div><button onclick="closeModal()">Tutup</button>`);
  window._fishHtml=fishHtml;
}
function openTas(){ showModal(`<h2>🐟 Koleksi Ikan</h2><div class="list">${window._fishHtml||"Kosong"}</div><button onclick="closeModal()">Tutup</button><button onclick="openJual()" style="background:#22c55e">Jual Semua Ikan</button>`); }
function openJual(){ let total=inv.reduce((a,f)=>a+f.koin,0); if(!total){ toast("Gak ada ikan buat dijual"); return; } star+=total; inv=[]; save(); renderHUD(); renderInv(); showModal(`<div style="font-size:48px">💰</div><h2>Terjual!</h2><p>Kamu dapet <b>+${total} ⭐</b></p><button onclick="closeModal()">Mantap!</button>`); }
function pilihJoran(i){ if(lv<RODS[i].lv){ toast("Joran ini kebuka di Lv "+RODS[i].lv); return; } rodIdx=i; save(); renderHUD(); toast("Joran diganti jadi "+RODS[i].nama); closeModal(); }
function showModal(html){ document.getElementById("modalBox").innerHTML=html; document.getElementById("modal").style.display="flex"; }
function closeModal(){ document.getElementById("modal").style.display="none"; }

function mulaiMancing(){
  if(casting) return; casting=true;
  document.getElementById("btnFish").disabled=true;
  document.getElementById("btnFish").innerHTML="⏳<br>Lempar...";
  toast("Joran dilempar... tunggu ikan nyangkut!");
  setTimeout(()=>{
    let power=RODS[rodIdx].power;
    let pool=[]; FISH.forEach(f=>{ let w=f.w; if(f.tier==="Rare") w*=1+power/100; if(f.tier==="Epic") w*=1+power/150; if(f.tier==="Legendary") w*=1+power/200; pool.push({f,w}); });
    let total=pool.reduce((a,b)=>a+b.w,0); let r=Math.random()*total; curFish=pool[0].f;
    for(let p of pool){ if(r<p.w){curFish=p.f;break;} r-=p.w; }
    document.getElementById("barGame").style.display="flex";
    document.getElementById("barText").textContent="Ada yang nyangkut! Jaga bar di zona kuning!";
    barVal=50; zoneL=30+Math.random()*20;
    document.getElementById("barZone").style.left=zoneL+"%";
    clearInterval(barTimer);
    barTimer=setInterval(()=>{
      barVal-=1.2;
      if(barVal<0) barVal=0;
      document.getElementById("barFill").style.width=barVal+"%";
      if(barVal<=0){ gagalMancing(); }
    },80);
    setTimeout(()=>{ if(casting){ selesaiMancing(); } },6000);
  },1200+Math.random()*1000);
}
function tapBar(){ barVal=Math.min(100,barVal+9); document.getElementById("barFill").style.width=barVal+"%"; }
function gagalMancing(){
  clearInterval(barTimer); casting=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; document.getElementById("btnFish").innerHTML="🎣<br>Joran";
  toast("Yah, ikannya lepas! 🥲");
}
function selesaiMancing(){
  clearInterval(barTimer); casting=false;
  document.getElementById("barGame").style.display="none";
  document.getElementById("btnFish").disabled=false; document.getElementById("btnFish").innerHTML="🎣<br>Joran";
  let berat=curFish.min+Math.random()*(curFish.max-curFish.min);
  let bonus=1+RODS[rodIdx].power/200;
  berat=berat*bonus;
  let ikan={...curFish,berat:berat,koin:Math.round(curFish.koin*bonus)};
  inv.unshift(ikan); if(inv.length>45) inv.pop();
  xp+=curFish.xp; star+=5;
  let naik=false;
  while(xp>=xpMax){ xp-=xpMax; lv++; xpMax=Math.round(xpMax*1.4); naik=true; let unlocked=RODS.find(r=>r.lv===lv); if(unlocked){ setTimeout(()=>toast("🎉 Joran baru kebuka: "+unlocked.nama),600); } }
  save(); renderHUD(); renderInv();
  showModal(`<div class="fish-big">${ikan.emoji}</div><span class="tier ${ikan.tier}">${ikan.tier.toUpperCase()}</span><h2>${ikan.nama}</h2><p style="font-size:18px;font-weight:800">${berat.toFixed(2)} kg</p><p style="color:#666;font-size:13px">+${curFish.xp} XP • +${ikan.koin} ⭐ • Joran: ${RODS[rodIdx].nama}</p>${naik?`<p style="color:#16a34a;font-weight:800">🎉 NAIK LEVEL! Sekarang Lv ${lv}</p>`:""}<button onclick="closeModal()">Simpan ke Tas 🎒</button>`);
}

let joy=document.getElementById("joy"), stick=document.getElementById("stick"), dragging=false;
function moveJoy(e){ let r=joy.getBoundingClientRect(); let cx=e.touches?e.touches[0].clientX:e.clientX; let cy=e.touches?e.touches[0].clientY:e.clientY; let dx=cx-(r.left+r.width/2), dy=cy-(r.top+r.height/2); let d=Math.sqrt(dx*dx+dy*dy); let max=26; if(d>max){dx=dx/d*max; dy=dy/d*max;} stick.style.left=(26+dx)+"px"; stick.style.top=(26+dy)+"px"; me.dx=dx/max*2.2; me.dy=dy/max*2.2; }
joy.addEventListener("touchstart",e=>{dragging=true; moveJoy(e)}); joy.addEventListener("touchmove",e=>{if(dragging) moveJoy(e)}); joy.addEventListener("touchend",()=>{dragging=false; stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;});
joy.addEventListener("mousedown",e=>{dragging=true; moveJoy(e)}); window.addEventListener("mousemove",e=>{if(dragging) moveJoy(e)}); window.addEventListener("mouseup",()=>{dragging=false; stick.style.left="26px"; stick.style.top="26px"; me.dx=0; me.dy=0;});

const cv=document.getElementById("cv"), ctx=cv.getContext("2d");
function draw(){
  cv.width=innerWidth; cv.height=innerHeight;
  ctx.fillStyle="#f6d67a"; ctx.fillRect(0,0,cv.width,cv.height);
  ctx.fillStyle="#7ec850"; ctx.fillRect(40,60,cv.width-80,cv.height-140);
  ctx.fillStyle="#c9a86a"; ctx.fillRect(60,120,cv.width-120,90);
  ctx.fillStyle="#38bdf8"; ctx.fillRect(0,cv.height-90,cv.width,90); ctx.fillRect(0,0,cv.width,28);
  ctx.font="28px serif"; ctx.fillText("🌴",80,cv.height-140); ctx.fillText("🌴",cv.width-110,180); ctx.fillText("🔥",90,cv.height-110); ctx.fillText("⛲",cv.width/2,cv.height/2-20); ctx.fillText("🪑",180,220);
  players.forEach(p=>{ ctx.font="28px serif"; ctx.fillText(p.emoji||"🧑",p.x,p.y); ctx.font="11px sans-serif"; ctx.fillStyle="#000"; ctx.fillText(p.nama,p.x-10,p.y+18); });
  ctx.font="32px serif"; ctx.fillText("🧑",me.x,me.y); ctx.font="11px sans-serif"; ctx.fillStyle="#fff"; ctx.fillText(nama+" Lv"+lv,me.x-10,me.y-8);
  me.x+=me.dx; me.y+=me.dy; me.x=Math.max(30,Math.min(cv.width-40,me.x)); me.y=Math.max(60,Math.min(cv.height-120,me.y));
  requestAnimationFrame(draw);
}
setInterval(()=>{ let d=new Date(); document.getElementById("jam").textContent=d.toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"})+" · "+d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+" WITA"; },1000);

let lastID = localStorage.getItem("mancing_lastID");
if(lastID){
  document.getElementById("inputID").value = lastID;
  let d = JSON.parse(localStorage.getItem(getKey(lastID)) || "null");
  if(d) document.getElementById("inputNama").value = d.nama;
}

setInterval(async ()=>{
  if(!myID || myID==="FISH-DEMO") return;
  try{ await apiPost("/api/posisi", {id: myID, nama, x: Math.round(me.x), y: Math.round(me.y), lv}); }catch(e){}
}, 1000);
setInterval(async ()=>{
  try{
    let r = await fetch("/api/online").then(r=>r.json());
    let real = r.players.filter(p=>p.id!==myID).map(p=>({nama:p.nama, x:p.x, y:p.y, emoji:"🧑", lv:p.lv, id:p.id}));
    if(real.length) players = real;
  }catch(e){}
}, 2000);
