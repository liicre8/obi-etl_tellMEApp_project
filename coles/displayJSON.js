const express = require('express');
const app = express();
const fs = require('fs');
const PORT = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./products.json', 'utf8'));
  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Product Display</title>
    <style>
      body { font-family: Arial; background: #f4f4f4; padding: 20px; }
      .container { display: flex; flex-wrap: wrap; gap: 20px; }
      .card { background: #fff; border-radius: 10px; width: 200px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
      .card img { width: 100%; border-radius: 10px; }
      .title { font-weight: bold; margin: 10px 0; }
      .price { display: flex; justify-content: space-between; margin: 5px 0; }
      .add-btn { background-color: #1976D2; color: #fff; border: none; padding: 10px; width: 100%; border-radius: 5px; cursor: pointer; }
      .not-available { color: #999; }
    </style>
  </head>
  <body>
    <div class="container">`;

  data.forEach(product => {
    html += `
      <div class="card">
        <img src="${product.image}" alt="${product.name}">
        <div class="title">${product.name}</div>
        <div>${product.weight}</div>
        <div class="price">
          <div>Coles: ${product.colesPrice ? `$${product.colesPrice}` : '<span class="not-available">Not available</span>'}</div>
          <div>Woolies: ${product.wooliesPrice ? `$${product.wooliesPrice}` : '<span class="not-available">Not available</span>'}</div>
        </div>
        <button class="add-btn">Add</button>
      </div>`;
  });

  html += `</div></body></html>`;
  res.send(html);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
