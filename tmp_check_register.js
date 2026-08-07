const https = require('https');
const data = JSON.stringify({
  fullName: 'Test User',
  email: 'test' + Date.now() + '@test.com',
  phone: '08123456789',
  password: 'password123'
});

const req = https.request({
  hostname: 'smart-fund-id.up.railway.app',
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body.slice(0, 800));
  });
});

req.on('error', e => console.log('ERR', e.message));
req.write(data);
req.end();