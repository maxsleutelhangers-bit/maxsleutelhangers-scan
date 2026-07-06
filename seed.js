const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const products = [
  { barcode: '8710398000011', name: 'AH Halfvolle Melk', price: 1.29 },
  { barcode: '8710398000028', name: 'AH Volkoren Brood', price: 1.89 },
  { barcode: '8710398000035', name: 'AH Eieren (6st)', price: 2.49 },
  { barcode: '8710398000042', name: 'AH Pasta Penne', price: 0.99 },
  { barcode: '8710398000059', name: 'AH Rijst', price: 1.59 },
  { barcode: '8710398000066', name: 'AH Olijfolie', price: 4.99 },
  { barcode: '8710398000073', name: 'AH Ketchup', price: 1.79 },
  { barcode: '8710398000080', name: 'AH Pindakaas', price: 2.29 },
  { barcode: '8710398000097', name: 'AH Hagelslag', price: 1.99 },
  { barcode: '8710398000103', name: 'AH Koffie (250g)', price: 3.49 },
  { barcode: '8710398000110', name: 'AH Thee (40zakjes)', price: 1.69 },
  { barcode: '8710398000127', name: 'AH Cornflakes', price: 2.19 },
  { barcode: '5901234123457', name: 'Coca Cola 33cl', price: 1.49 },
  { barcode: '5901234123464', name: 'Mars Repen (4st)', price: 2.99 },
  { barcode: '5901234123471', name: 'Lays Naturel', price: 2.49 },
  { barcode: '5901234123488', name: 'Heineken Bier (6x33cl)', price: 5.99 },
  { barcode: '5901234123495', name: 'Douwe Egberts Senseo', price: 4.49 },
  { barcode: '5901234123501', name: 'Unox Rookworst', price: 3.29 },
  { barcode: '5901234123518', name: 'Calvé Pindakaas', price: 3.19 },
  { barcode: '5901234123525', name: 'Becel Margarine', price: 2.79 },
];

const productsMap = {};
for (const p of products) {
  productsMap[p.barcode] = { ...p, created_at: new Date().toISOString() };
}

const data = { products: productsMap, scans: [] };
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
console.log(`✅ ${products.length} producten toegevoegd aan data.json`);
