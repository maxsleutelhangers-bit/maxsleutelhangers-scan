module.exports = async function handler(req, res) {
  const barcode = req.query.barcode;
  if (!barcode) {
    return res.status(400).json({ error: 'barcode verplicht' });
  }
  res.status(404).json({ error: 'Product lookup alleen via PC' });
};
