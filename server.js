const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, 'data.json');
const VERCEL_URL = process.env.VERCEL_URL || (process.argv[2] === '--vercel' && process.argv[3]) || '';
const PORT = process.env.PORT || 3000;

let data = { products: {}, scans: [] };
const SESSION_CODE = Math.random().toString(36).slice(2, 8).toUpperCase();
let lastPollId = 0;

function load() {
  try {
    if (fs.existsSync(DATA_FILE))
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) { console.error('Fout bij laden data:', e.message); }
}
function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
load();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/scan', (req, res) => res.sendFile(path.join(__dirname, 'public', 'scan.html')));

app.get('/api/config', (req, res) => {
  res.json({
    vercelUrl: VERCEL_URL,
    sessionCode: SESSION_CODE,
    mode: VERCEL_URL ? 'vercel' : 'local'
  });
});

app.get('/api/products', (req, res) => {
  res.json(Object.values(data.products).sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  ));
});

app.get('/api/products/:barcode', (req, res) => {
  const product = data.products[req.params.barcode];
  if (!product) return res.status(404).json({ error: 'Product niet gevonden' });
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { barcode, name, price, image } = req.body;
  if (!barcode || !name) return res.status(400).json({ error: 'barcode en name zijn verplicht' });
  data.products[barcode] = { barcode, name, price: price || null, image: image || null, created_at: new Date().toISOString() };
  save();
  res.json({ success: true });
});

app.get('/api/scans', (req, res) => {
  res.json(data.scans.slice(-100).reverse());
});

app.delete('/api/scans', (req, res) => {
  data.scans = [];
  save();
  res.json({ success: true });
});

function handleScan(barcode) {
  const product = data.products[barcode] || null;
  const scan = { barcode, product, device_id: 'vercel', scanned_at: new Date().toISOString() };
  data.scans.push(scan);
  save();
  io.emit('product-scanned', scan);
}

io.on('connection', () => {});

if (VERCEL_URL) {
  async function pollVercel() {
    try {
      const res = await fetch(`${VERCEL_URL}/api/poll?session=${SESSION_CODE}`);
      if (res.ok) {
        const scans = await res.json();
        for (const s of scans) {
          if (s.id && s.id > lastPollId) {
            handleScan(s.barcode);
          }
        }
        const maxId = scans.reduce((m, x) => Math.max(m, x.id || 0), 0);
        if (maxId > lastPollId) lastPollId = maxId;
      }
    } catch (_) {}
    setTimeout(pollVercel, 2000);
  }
  console.log(`Vercel modus, sessie: ${SESSION_CODE}`);
  pollVercel();
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Scan Software draait op http://localhost:${PORT}`);
  console.log(`Modus: ${VERCEL_URL ? 'vercel (' + VERCEL_URL + ')' : 'lokaal'}`);
  console.log(`Sessiecode: ${SESSION_CODE}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});
