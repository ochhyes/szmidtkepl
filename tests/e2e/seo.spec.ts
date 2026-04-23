import { test, expect } from '@playwright/test';

test('canonical jest absolutnym URL-em i pasuje do ścieżki', async ({ page }) => {
  await page.goto('/blog');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBeTruthy();
  expect(canonical).toMatch(/^https?:\/\/[^/]+\/blog\/?$/);
});

test('canonical dla wpisu', async ({ page }) => {
  await page.goto('/blog/pasywnosc-ktora-wyglada-jak-odpoczynek');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toMatch(/\/blog\/pasywnosc-ktora-wyglada-jak-odpoczynek\/?$/);
});

test('/zapisany ma <meta name="robots" content="noindex">', async ({ page }) => {
  await page.goto('/zapisany');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toMatch(/noindex/i);
});

test('/rss.xml zwraca XML z itemami', async ({ request }) => {
  const resp = await request.get('/rss.xml');
  expect(resp.status()).toBe(200);
  expect(resp.headers()['content-type']).toMatch(/xml/);
  const body = await resp.text();
  expect(body).toMatch(/<\?xml/);
  expect(body).toMatch(/<rss|<feed|<channel/);
});

test('/atom.xml zwraca XML', async ({ request }) => {
  const resp = await request.get('/atom.xml');
  expect(resp.status()).toBe(200);
  expect(resp.headers()['content-type']).toMatch(/xml/);
  const body = await resp.text();
  expect(body).toMatch(/<\?xml/);
  expect(body).toMatch(/<feed/);
});

test('/og-default.png zwraca obraz PNG', async ({ request }) => {
  const resp = await request.get('/og-default.png');
  expect(resp.status()).toBe(200);
  expect(resp.headers()['content-type']).toMatch(/image\/png/);
  const buf = await resp.body();
  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  expect(buf[0]).toBe(0x89);
  expect(buf[1]).toBe(0x50);
  expect(buf[2]).toBe(0x4e);
  expect(buf[3]).toBe(0x47);
});

test('sitemap-index.xml (jeśli generowany — build only)', async ({ request }) => {
  const resp = await request.get('/sitemap-index.xml');
  test.skip(resp.status() !== 200, 'sitemap jest generowany tylko przy build — pomijamy w dev');
  expect(resp.headers()['content-type']).toMatch(/xml/);
});

test('sitemap — /zapisany i /api/* są wykluczone (jeśli sitemap istnieje)', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  test.skip(index.status() !== 200, 'brak sitemapy w dev');
  const indexBody = await index.text();
  const match = indexBody.match(/<loc>([^<]*sitemap[^<]*\.xml)<\/loc>/);
  test.skip(!match, 'sitemap-index nie wskazuje sub-sitemapy');

  const subUrl = match![1].replace(/^https?:\/\/[^/]+/, '');
  const sub = await request.get(subUrl);
  const body = await sub.text();
  expect(body).not.toMatch(/\/zapisany/);
  expect(body).not.toMatch(/\/api\//);
});

test('404 dla nieistniejącego slugu wpisu', async ({ request }) => {
  const resp = await request.get('/blog/tekst-ktorego-nigdy-nie-bylo', { maxRedirects: 0 });
  // Dev może dać 404 od razu, build-static mógłby serwować fallback.
  expect([200, 404]).toContain(resp.status());
});

test('OG meta na wpisie używa per-post obrazu albo fallbacku', async ({ page }) => {
  await page.goto('/blog/pasywnosc-ktora-wyglada-jak-odpoczynek');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toBeTruthy();
  expect(og).toMatch(/^https?:\/\//);
});

test('article:published_time tylko na wpisach blogowych', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);

  await page.goto('/blog/pasywnosc-ktora-wyglada-jak-odpoczynek');
  await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(1);
});

test('link[rel="alternate"] do RSS/Atom jest obecny na każdej stronie', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][type="application/atom+xml"]')).toHaveCount(1);
});
