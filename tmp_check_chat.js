const https = require('https');
const token = '8654004646:AAGkmAzCFjUiSp8ff9tCj6xDun6iHoogTUM';

const req = https.request({hostname: 'api.telegram.org', path: '/bot' + token + '/getUpdates?limit=5'}, (res) => {
  let body = ''; res.on('data', c => body += c); res.on('end', () => {
    const data = JSON.parse(body);
    console.log('Total updates:', data.result.length);
    data.result.forEach((u, i) => {
      const msg = u.message;
      console.log('Update ' + i + ':', msg?.from?.first_name, '| chat:', msg?.chat?.id, '| started:', msg?.text?.substring(0, 60));
    });
    // Check if chat_id 8176355378 sudah pernah kirim /start
    const adminUpdates = data.result.filter(u => u.message?.from?.id === 8176355378);
    console.log('Admin mulai chat bot?', adminUpdates.length > 0 ? 'YA' : 'TIDAK');
  });
});
req.end();
