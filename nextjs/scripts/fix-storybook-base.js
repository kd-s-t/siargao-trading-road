/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const storybookDir = path.join(__dirname, '../storybook-static');

if (!fs.existsSync(storybookDir)) {
  console.error('Storybook static directory not found. Run build-storybook first.');
  process.exit(1);
}

const indexHtmlPath = path.join(storybookDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  indexHtml = indexHtml.replace(
    /<base\s+href="[^"]*">/i,
    '<base href="/storybook/">'
  );
  
  if (!indexHtml.includes('<base')) {
    indexHtml = indexHtml.replace(
      '<head>',
      '<head>\n  <base href="/storybook/">'
    );
  }
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('Fixed base path in index.html');
}

const iframeHtmlPath = path.join(storybookDir, 'iframe.html');
if (fs.existsSync(iframeHtmlPath)) {
  let iframeHtml = fs.readFileSync(iframeHtmlPath, 'utf8');
  
  iframeHtml = iframeHtml.replace(
    /\/static\//g,
    '/storybook/static/'
  );
  
  fs.writeFileSync(iframeHtmlPath, iframeHtml);
  console.log('Fixed paths in iframe.html');
}

console.log('Storybook base path fixed for /storybook deployment');

