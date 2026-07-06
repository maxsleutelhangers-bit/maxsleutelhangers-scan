module.exports = async function handler(req, res) {
  const session = req.query.session;
  if (!session) {
    return res.status(400).json({ error: 'session verplicht' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { kv } = await import('@vercel/kv');
    const key = `scans:${session}`;
    const scans = await kv.lrange(key, 0, 49);
    return res.json(scans.reverse());
  } catch (e) {
    console.error('KV error:', e.message);
    return res.json([]);
  }
};
