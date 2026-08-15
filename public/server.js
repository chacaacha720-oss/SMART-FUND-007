const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';
  const ext = path.extname(filePath);
  const type = mimeTypes[ext] || 'text/html';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': type });
      res.end(content);
    }
  });
});

server.listen(3999, () => console.log('Server on 3999'));
