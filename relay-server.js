// Relay server — deploy op Render / Railway / Fly.io / eigen server
// Verbindt PC en mobiel via een sessie-code, en serveert de scan pagina

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const sessions = new Map();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/scan', (req, res) => res.sendFile(path.join(__dirname, 'public', 'scan.html')));

app.get('/api/products/:barcode', (req, res) => {
  res.status(404).json({ error: 'Onbekend product — scan via de PC server' });
});

io.on('connection', (socket) => {
  console.log('Verbonden:', socket.id);

  socket.on('join-session', (sessionCode) => {
    socket.join(sessionCode);
    socket.sessionCode = sessionCode;
    console.log(`${socket.id} joined session ${sessionCode}`);
    if (!sessions.has(sessionCode)) {
      sessions.set(sessionCode, { created: Date.now() });
    }
  });

  socket.on('scan', (data) => {
    const code = socket.sessionCode;
    if (!code) return;
    console.log(`Scan in ${code}:`, data.barcode);
    socket.to(code).emit('scan', data);
  });

  socket.on('product-scanned', (data) => {
    const code = socket.sessionCode;
    if (!code) return;
    io.to(code).emit('product-scanned', data);
  });

  socket.on('disconnect', () => {
    if (socket.sessionCode) {
      console.log(`${socket.id} left session ${socket.sessionCode}`);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Relay server draait op poort ${PORT}`);
  console.log(`Scan pagina: http://localhost:${PORT}/scan`);
  console.log(`Dashboard:   http://localhost:${PORT}/dashboard`);
});
