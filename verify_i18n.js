const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const id = JSON.parse(fs.readFileSync('public/assets/i18n/id.json', 'utf8'));
const ms = JSON.parse(fs.readFileSync('public/assets/i18n/ms.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('public/assets/i18n/en.json', 'utf8'));

// Extract all data-i18n keys
const regex = /data-i18n="([^"]+)"/g;
let match;
const keys = new Set();
while ((match = regex.exec(html)) !== null) {
  keys.add(match[1]);
}

// Flatten nested objects
function flatten(obj, prefix = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flatten(v, key));
    } else {
      result[key] = v;
    }
  }
  return result;
}

const idFlat = flatten(id);
const msFlat = flatten(ms);
const enFlat = flatten(en);

console.log('Checking', keys.size, 'data-i18n keys...');
let missing = [];
for (const key of keys) {
  if (!(key in idFlat)) missing.push('id missing: ' + key);
  if (!(key in msFlat)) missing.push('ms missing: ' + key);
  if (!(key in enFlat)) missing.push('en missing: ' + key);
}

if (missing.length === 0) {
  console.log('All translation keys are present in all 3 languages!');
} else {
  console.log('Missing translations:');
  missing.forEach(m => console.log('  ' + m));
}
