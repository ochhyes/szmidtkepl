import { test, expect } from '@playwright/test';

// Każda trasa: 200, jedno <h1>, poprawne <title>, canonical, og:image.
// Dowolny wpis blogowy reprezentuje całą kolekcję (testy kolejnych slugów
// dałyby tylko szum — szablon jest jeden).

type Route = {
  path: string;
  // null = strona świadomie nie ma h1 (np. /nie-ja z h3 teasera).
  h1: RegExp | string | null;
  titleContains: string;
};

const ROUTES: Route[] = [
  { path: '/', h1: /Piszę, żeby zauważyć/i, titleContains: 'Marcin Szmidtke' },
  { path: '/blog', h1: 'Piszę', titleContains: 'Piszę' },
  { path: '/blog/spis', h1: 'Spis', titleContains: 'Spis' },
  { path: '/o-mnie', h1: /o mnie/i, titleContains: 'O mnie' },
  // /nie-ja: sr-only h1 nad teaserem (a11y/SEO — teaser wizualnie zaczyna się h3).
  { path: '/nie-ja', h1: /nie ja/i, titleContains: 'Nie ja' },
  { path: '/pomocja', h1: 'Pomocja', titleContains: 'Pomocja' },
  { path: '/kontakt', h1: 'Napisz', titleContains: 'Kontakt' },
  { path: '/prywatnosc', h1: 'Prywatność', titleContains: 'Prywatność' },
  { path: '/zapisany', h1: 'Zapisany.', titleContains: 'Zapisany' },
  { path: '/blog/pasywnosc-ktora-wyglada-jak-odpoczynek', h1: /pasywność/i, titleContains: 'Pasywność' },
];

for (const route of ROUTES) {
  test(`smoke: ${route.path} renderuje się i ma h1`, async ({ page }) => {
    const resp = await page.goto(route.path);
    expect(resp?.status()).toBe(200);

    await expect(page).toHaveTitle(new RegExp(route.titleContains, 'i'));

    const h1s = page.locator('main h1');
    if (route.h1 === null) {
      expect(await h1s.count()).toBe(0);
    } else {
      await expect(h1s).toHaveCount(1);
      const h1text = await h1s.first().innerText();
      if (route.h1 instanceof RegExp) {
        expect(h1text).toMatch(route.h1);
      } else {
        expect(h1text.trim()).toContain(route.h1);
      }
    }

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\//);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\.png/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc?.length ?? 0).toBeGreaterThanOrEqual(20);
  });
}

test('smoke: /blog/tag/[tag] dla istniejącego tagu', async ({ page }) => {
  // Najpierw pobieramy listę z /blog żeby znaleźć dowolny tag.
  await page.goto('/blog');
  const tagLink = page.locator('a[href^="/blog/tag/"]').first();
  const count = await tagLink.count();
  test.skip(count === 0, 'brak tagów na /blog — nic do sprawdzenia');
  const href = await tagLink.getAttribute('href');
  const resp = await page.goto(href!);
  expect(resp?.status()).toBe(200);
  await expect(page.locator('main h1')).toBeVisible();
});

test('smoke: /blog/kategoria/esej', async ({ page }) => {
  const resp = await page.goto('/blog/kategoria/esej');
  expect(resp?.status()).toBe(200);
  await expect(page.locator('main h1')).toBeVisible();
});

test('smoke: Plausible skrypt tylko gdy PUBLIC_PLAUSIBLE_DOMAIN ustawiony', async ({ page }) => {
  await page.goto('/');
  const domain = await page.evaluate(
    () => document.querySelector('script[data-domain]')?.getAttribute('data-domain') ?? null,
  );
  // W dev zwykle nie ma — ale jeśli jest, to musi być prawdziwa domena, nie pusty string.
  if (domain !== null) expect(domain.length).toBeGreaterThan(0);
});

test('smoke: JSON-LD Person jest poprawny JSON i ma @type', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(raw).toBeTruthy();
  const data = JSON.parse(raw!);
  expect(data['@context']).toMatch(/schema\.org/);
  expect(data['@type']).toBeTruthy();
});
