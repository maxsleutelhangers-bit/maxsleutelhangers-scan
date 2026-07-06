module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST verwacht' });
  }

  const { barcode, session } = req.body;
  if (!barcode || !session) {
    return res.status(400).json({ error: 'barcode en session zijn verplicht' });
  }

  try {
    const { kv } = await import('@vercel/kv');
    const key = `scans:${session}`;
    const id = Date.now();
    await kv.lpush(key, { id, barcode, scanned_at: new Date().toISOString() });
    await kv.ltrim(key, 0, 199);
    await kv.expire(key, 86400);
    return res.json({ success: true, id });
  } catch (e) {
    console.error('KV error:', e.message);
    return res.json({ success: true });
  }
};
