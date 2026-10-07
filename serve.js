const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.gltf': 'model/gltf+json',
  '.glb': 'model/gltf-binary',
  '.bin': 'application/octet-stream',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqUrl = decodeURIComponent(req.url.split('?')[0]);
  if (reqUrl === '/') reqUrl = '/index.html';
  else if (reqUrl === '/location') reqUrl = '/location.html';
  else if (reqUrl === '/privacy-policy') reqUrl = '/privacy-policy.html';

  const uploadsMap = {
    '/uploads/ribbons.mp4': '/assets/videos/hero-desktop.mp4',
    '/uploads/rubbons-xs.mp4': '/assets/videos/hero-mobile.mp4',
    '/uploads/3d-map.mp4': '/assets/videos/button-3d.mp4',
    '/uploads/teaser.mp4': '/assets/videos/merit.mp4',
    '/uploads/expensive_spaces.mp4': '/assets/videos/tenet-1.mp4',
    '/uploads/space-greens.mp4': '/assets/videos/tenet-3.mp4',
    '/uploads/space-candle.mp4': '/assets/videos/tenet-4.mp4',
    '/uploads/space-table.mp4': '/assets/videos/tenet-5.mp4',
    '/uploads/privacy.mp4': '/assets/videos/tenet-6.mp4',
    '/uploads/a_place_above.mp4': '/assets/videos/tenet-7.mp4',
    '/uploads/menu.mp4': '/assets/videos/tenet-7.mp4'
  };
  if (uploadsMap[reqUrl]) {
    reqUrl = uploadsMap[reqUrl];
  }

  let filePath = path.join(ROOT, reqUrl);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Handle range requests for video streaming
    if (ext === '.mp4' && req.headers.range) {
      const range = req.headers.range;
      const total = stats.size;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

function tryListen(port) {
  server.listen(port, () => {
    console.log(`====================================================`);
    console.log(`  SOBHA PRIVY COLLECTION - LOCAL SERVER RUNNING     `);
    console.log(`  URL: http://localhost:${port}                      `);
    console.log(`  3D Map: http://localhost:${port}/location          `);
    console.log(`  Privacy: http://localhost:${port}/privacy-policy   `);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      server.close();
      tryListen(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

tryListen(DEFAULT_PORT);
