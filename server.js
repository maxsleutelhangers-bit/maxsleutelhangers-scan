const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, 'data.json');
const RELAY_URL = process.env.RELAY_URL || (process.argv[2] === '--relay' && process.argv[3]) || '';
const PORT = process.env.PORT || 3000;

let data = { products: {}, scans: [] };
const SESSION_CODE = Math.random().toString(36).slice(2, 8).toUpperCase();

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
    relayUrl: RELAY_URL,
    sessionCode: SESSION_CODE,
    mode: RELAY_URL ? 'relay' : 'local'
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

app.post('/api/scan', (req, res) => {
  const { barcode, device_id } = req.body;
  if (!barcode) return res.status(400).json({ error: 'barcode verplicht' });
  handleScan({ barcode, device_id });
  res.json({ success: true });
});

app.delete('/api/scans', (req, res) => {
  data.scans = [];
  save();
  res.json({ success: true });
});

function handleScan(msg) {
  const { barcode, device_id } = msg;
  const product = data.products[barcode] || null;
  const scan = { barcode, product, device_id: device_id || null, scanned_at: new Date().toISOString() };
  data.scans.push(scan);
  save();
  io.emit('product-scanned', scan);
}

io.on('connection', (socket) => {
  socket.on('scan', handleScan);
});

if (RELAY_URL) {
  let lastPoll = 0;
  setInterval(async () => {
    try {
      const url = `${RELAY_URL}/api/relay?session=${SESSION_CODE}&since=${lastPoll ? new Date(lastPoll).toISOString() : ''}`;
      const res = await fetch(url);
      const body = await res.json();
      if (body.events && body.events.length > 0) {
        for (const ev of body.events) {
          handleScan(ev);
          lastPoll = Math.max(lastPoll, new Date(ev.scanned_at).getTime());
        }
      }
      if (body.events && body.events.length === 0 && !lastPoll) {
        lastPoll = Date.now();
      }
    } catch (e) { /* relay niet bereikbaar */ }
  }, 2000);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Scan Software draait op http://localhost:${PORT}`);
  console.log(`Modus: ${RELAY_URL ? 'relay' : 'lokaal'}`);
  if (RELAY_URL) console.log(`Sessiecode: ${SESSION_CODE} — relay: ${RELAY_URL}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});
