const sessions = new Map();

setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [code, data] of sessions) {
    const recent = data.events.filter(e => new Date(e.scanned_at).getTime() > cutoff);
    if (recent.length === 0 && data.created < cutoff) {
      sessions.delete(code);
    } else if (recent.length !== data.events.length) {
      data.events = recent;
    }
  }
}, 60 * 60 * 1000);

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { barcode, session: sessionCode, device_id } = req.body || {};
    if (!barcode || !sessionCode) {
      return res.status(400).json({ error: 'barcode en session zijn verplicht' });
    }
    if (!sessions.has(sessionCode)) {
      sessions.set(sessionCode, { events: [], created: Date.now() });
    }
    sessions.get(sessionCode).events.push({
      barcode,
      device_id: device_id || null,
      scanned_at: new Date().toISOString()
    });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const sessionCode = req.query?.session;
    const since = req.query?.since ? new Date(req.query.since).getTime() : 0;
    if (!sessionCode) return res.status(400).json({ error: 'session verplicht' });

    const session = sessions.get(sessionCode);
    const events = session ? session.events.filter(e => new Date(e.scanned_at).getTime() > since) : [];
    return res.status(200).json({ events });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
