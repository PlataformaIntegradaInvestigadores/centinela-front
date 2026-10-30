import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(process.env.ANALYTICS_BROWSER_PACKAGE || import.meta.url);
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const [dist, output] = process.argv.slice(2).map((p) => path.resolve(p));
let unavailable = false;
const server = http.createServer((request, response) => {
  if (request.url.startsWith('/api/analytics/')) {
    if (unavailable) {
      response.writeHead(503);
      response.end('{}');
      return;
    }
    const upstream = http.request(
      {
        hostname: '127.0.0.1',
        port: 8016,
        path: request.url.replace('/api/analytics/', '/api/v1/'),
        method: request.method,
        headers: { 'content-type': 'application/json' },
      },
      (incoming) => {
        response.writeHead(incoming.statusCode, incoming.headers);
        incoming.pipe(response);
      },
    );
    upstream.on('error', () => {
      response.writeHead(503);
      response.end('{}');
    });
    request.pipe(upstream);
    return;
  }
  const relative = decodeURIComponent(request.url.split('?')[0]);
  let file = path.resolve(dist, '.' + relative);
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory())
    file = path.join(dist, 'index.html');
  const mime = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
  };
  response.setHeader('content-type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(4216, '127.0.0.1', resolve));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const checks = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4216/research-analytics');
  await page.getByRole('heading', { name: 'Artículos encontrados: 2' }).waitFor();
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const result = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    assert.equal(
      result.violations.length,
      0,
      JSON.stringify(
        result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ),
    );
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    checks.push({ page: 'explorer', width, axeViolations: 0, horizontalPageOverflow: false });
  }
  await page.getByRole('region', { name: 'Tabla de artículos desplazable' }).focus();
  await page.keyboard.press('Tab');
  assert(
    await page
      .getByRole('button', { name: 'Consultar Controlled science title' })
      .evaluate((el) => el === document.activeElement),
  );
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'Controlled science title', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  await page.getByLabel('Identificador de autor').fill('not-present');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await page.getByText('No hay artículos para estos filtros.').waitFor();
  await page.getByLabel('Identificador de autor').fill('');
  unavailable = true;
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await page.getByRole('alert').waitFor();
  unavailable = false;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await page.getByRole('heading', { name: 'Artículos encontrados: 2' }).waitFor();
  await page.getByRole('link', { name: 'Calidad y preparación del corpus' }).click();
  await page.getByText('Grupos con texto repetido', { exact: true }).waitFor();
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const result = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    assert.equal(
      result.violations.length,
      0,
      JSON.stringify(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      ),
    );
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    checks.push({ page: 'preparation', width, axeViolations: 0, horizontalPageOverflow: false });
  }
  await page.getByRole('button', { name: /Vista previa|Previsualizar/ }).click();
  await page.getByRole('button', { name: 'Crear conjunto versionado' }).waitFor();
  await page.getByRole('button', { name: 'Crear conjunto versionado' }).click();
  await page
    .getByText('Se creó una versión nueva sin modificar la instantánea original.')
    .waitFor();
  fs.writeFileSync(
    output,
    JSON.stringify(
      {
        status: 'passed',
        scope: 'isolated production components and actual local HTTP backend',
        corpus: 'controlled synthetic fixture',
        operationalIdentity: false,
        operationalGateway: false,
        checks,
        keyboard: true,
        documentDetail: true,
        emptyState: true,
        failureRecovery: true,
        worksetCreation: true,
        limits: 'Automated checks do not constitute a complete WCAG conformance audit.',
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
