const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Biar hady.css sama hady.js ke-load
app.use(express.static(__dirname));

// Buka domain utama -> kasih hady.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "hady.html"));
});

const players = new Map();
const online = new Map();

app.post("/api/buat-id", (req, res) => {
  const id = "FISH-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const nama = (req.body.nama || "Pemancing").slice(0, 14);
  const dataBaru = { id, nama, inv: [], star: 290, gem: 310, xp: 0, xpMax: 100, lv: 1, rodIdx: 0, createdAt: Date.now() };
  players.set(id, dataBaru);
  res.json({ success: true, id, data: dataBaru });
});

app.post("/api/login", (req, res) => {
  let { id, nama } = req.body;
  if (!id) return res.json({ success: false });
  id = id.trim().toUpperCase();
  if (!id.startsWith("FISH-")) id = "FISH-" + id;
  let data = players.get(id);
  if (!data) {
    data = { id, nama: (nama || "Pemancing").slice(0, 14), inv: [], star: 290, gem: 310, xp: 0, xpMax: 100, lv: 1, rodIdx: 0, createdAt: Date.now() };
    players.set(id, data);
    return res.json({ success: true, baru: true, data });
  }
  if (nama) data.nama = nama;
  res.json({ success: true, baru: false, data });
});

app.post("/api/save", (req, res) => {
  const { id, data } = req.body;
  if (!id || !data) return res.json({ success: false });
  const lama = players.get(id.toUpperCase()) || {};
  players.set(id.toUpperCase(), { ...lama, ...data, id: id.toUpperCase(), updatedAt: Date.now() });
  res.json({ success: true });
});

app.post("/api/posisi", (req, res) => {
  const { id, nama, x, y, lv } = req.body;
  if (!id) return res.json({ success: false });
  online.set(id, { nama, x, y, lv, lastSeen: Date.now() });
  for (const [k, v] of online) { if (Date.now() - v.lastSeen > 15000) online.delete(k); }
  res.json({ success: true });
});

app.get("/api/online", (req, res) => {
  const list = [...online.entries()].map(([id, v]) => ({ id, ...v }));
  res.json({ success: true, total: list.length, players: list });
});

app.get("/api/leaderboard", (req, res) => {
  const list = [...players.values()].sort((a, b) => b.lv - a.lv || b.xp - a.xp).slice(0, 20).map(p => ({ id: p.id, nama: p.nama, lv: p.lv, xp: p.xp, star: p.star, ikan: p.inv?.length || 0 }));
  res.json({ success: true, leaderboard: list });
});

module.exports = app;
