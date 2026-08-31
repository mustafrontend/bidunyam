const Iyzipay = require('iyzipay');
const API = process.env.IYZICO_API_KEY, SEC = process.env.IYZICO_SECRET_KEY;
const urls = { sandbox: 'https://sandbox-api.iyzipay.com', production: 'https://api.iyzipay.com' };
console.log('apiKeyLen=' + (API||'').length, 'secretLen=' + (SEC||'').length, 'apiPrefix=' + (API||'').slice(0,8));
(async () => {
  for (const [env, uri] of Object.entries(urls)) {
    const iy = new Iyzipay({ apiKey: API, secretKey: SEC, uri });
    await new Promise((resolve) => {
      iy.installmentInfo.retrieve({ locale: 'tr', conversationId: 'diag', binNumber: '552879', price: '1.0' }, (err, r) => {
        if (err) console.log(`[${env}] ERR ${err.message}`);
        else console.log(`[${env}] status=${r.status} ${r.status === 'success' ? 'OK ✅' : 'err=' + r.errorMessage}`);
        resolve();
      });
    });
  }
})();
