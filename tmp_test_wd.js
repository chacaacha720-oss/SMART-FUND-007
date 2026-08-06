const https = require('https');

const loginData = JSON.stringify({username: 'admin', password: 'Admin@12345'});

const req = https.request({hostname: 'smart-fund-id.up.railway.app', path: '/api/admin/auth/login', method: 'POST', headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData)}}, (res) => {
  let body = ''; res.on('data', c => body += c); res.on('end', () => {
    const j = JSON.parse(body);
    console.log('LOGIN:', j.success ? 'OK' : 'FAIL');
    if (j.token) {
      // Submit a test withdrawal using the token
      const wdData = JSON.stringify({
        nama: 'Test Member',
        email: 'test@example.com',
        no_hp: '081234567890',
        bank: 'BRI',
        no_rekening: '123456789',
        nama_rekening: 'Test Member',
        jumlah: 150000,
        catatan: 'Test withdrawal submission for debug'
      });
      const req2 = https.request({
        hostname: 'smart-fund-id.up.railway.app',
        path: '/api/withdrawals',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + j.token,
          'Content-Length': Buffer.byteLength(wdData)
        }
      }, (res2) => {
        let b2 = ''; res2.on('data', c => b2 += c); res2.on('end', () => {
          console.log('WITHDRAW RESULT:', res2.statusCode);
          console.log('BODY:', b2);
        });
      });
      req2.write(wdData); req2.end();
    }
  });
});
req.write(loginData); req.end();
