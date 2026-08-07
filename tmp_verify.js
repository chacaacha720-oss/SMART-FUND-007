const https = require('https');
const req = https.request({hostname: 'smart-fund-id.up.railway.app', path: '/assets/js/dashboard.js', method: 'GET'}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const idx = body.indexOf('verifyWithdrawDesc');
    console.log('TEXT:', body.substring(idx, idx + 200));
    console.log('TELEGRAM cs_smartfund:', body.indexOf('cs_smartfund') >= 0 ? 'OK' : 'MISSING');
    console.log('WHATSAPP 6289679875858:', body.indexOf('6289679875858') >= 0 ? 'OK' : 'MISSING');
    console.log('WA Button text:', body.indexOf('Chat Admin via WhatsApp') >= 0 ? 'OK' : 'MISSING');
  });
});
req.end();
