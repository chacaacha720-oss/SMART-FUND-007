const fs = require('fs');
const file = 'C:/Users/User-250819/Desktop/SMART-FUND/public/withdraw.html';
let content = fs.readFileSync(file, 'utf8');

const banks = ['BRI', 'BNI', 'Mandiri', 'BCA', 'BTPN', 'BSI', 'Danamon', 'BRI', 'BNI', 'Mandiri', 'BCA', 'BRI', 'BNI', 'Mandiri', 'BCA', 'BRI'];
const newOptions = '<option value="">Pilih Bank</option>\n              ' + banks.map(b => `<option value="${b}">${b}</option>`).join('\n              ');

content = content.replace(
  /<option value="">Pilih Bank<\/option>[\s\S]*?<\/select>/, 
  newOptions + '\n            </select>'
);

fs.writeFileSync(file, content);
console.log('Fixed dropdown - options count:', banks.length);
