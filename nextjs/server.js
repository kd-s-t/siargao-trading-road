/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3021;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const storybookProxy = createProxyMiddleware({
  target: 'http://localhost:6006',
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    '^/storybook': '',
  },
  onError: (err, req, res) => {
    console.error('Storybook proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(500, {
        'Content-Type': 'text/html',
      });
      res.end(`
        <html>
          <body>
            <h1>Storybook Proxy Error</h1>
            <p>Cannot connect to Storybook on port 6006.</p>
            <p>Make sure Storybook is running: <code>npm run storybook</code></p>
            <p>Error: ${err.message}</p>
          </body>
        </html>
      `);
    }
  },
  logLevel: 'silent',
});

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      if (dev && pathname.startsWith('/storybook')) {
        storybookProxy(req, res);
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('internal server error');
      }
    }
  });

  server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/storybook')) {
      storybookProxy.upgrade(req, socket, head);
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Storybook will be available at http://${hostname}:${port}/storybook`);
    console.log(`> Make sure Storybook is running on port 6006`);
  });
});

