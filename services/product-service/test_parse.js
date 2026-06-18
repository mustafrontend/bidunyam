const fs = require('fs');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');

const url = "https://www.meyithalat.com/export/addb968b-58cc-450c-9d87-85458f0c1f5f";

https.get(url, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log("Downloaded XML size:", data.length);
    console.log("Parsing...");
    const start = Date.now();
    const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true, parseTagValue: true });
    try {
      const parsed = parser.parse(data);
      console.log("Parse took:", Date.now() - start, "ms");
      // Find the root array
      let products = parsed.urunler?.urun || parsed.PRODUCTS?.PRODUCT || parsed.Export?.Product || parsed.Urunler?.Urun;
      console.log("Found products array?", products ? products.length : "NO");
      if(products && products.length > 0) {
        console.log("Sample product:", JSON.stringify(products[0], null, 2));
      }
    } catch(e) {
      console.error("Parse failed", e);
    }
  });
});
