import { test, expect } from '@playwright/test';

// Newsletter form — POST /api/subscribe. W dev bez BUTTONDOWN_API_KEY
// endpoint i tak zwraca {ok:true} (warunek w subscribe.ts).
// Dlatego tu nie polegamy na prawdziwym Buttondown — mockujemy odpowiedzi.

const FORM = 'form[data-newsletter-form]';

test('submit poprawnego maila → {ok:true} → komunikat + redirect na /zapisany', async ({ page }) => {
  await page.route('**/api/subscribe', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
  );
  await page.goto('/');
  await page.locator(`${FORM} input[type="email"]`).fill('marcin@example.com');
  await page.locator(`${FORM} button[type="submit"]`).click();

  await expect(page.locator(`${FORM} button`)).toHaveText(/jest, do czwartku/i);
  // Redirect dzieje się w setTimeout(1500ms).
  await page.waitForURL(/\/zapisany/, { timeout: 5_000 });
});

test('invalid_email z serwera → komunikat błędu, input odblokowany', async ({ page }) => {
  await page.route('**/api/subscribe', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'invalid_email' }),
    }),
  );
  await page.goto('/');
  await page.locator(`${FORM} input[type="email"]`).fill('ktos@cośdziwnego.xx');
  await page.locator(`${FORM} button[type="submit"]`).click();

  await expect(page.locator('[data-newsletter-note]')).toHaveText(/poprawny adres/i);
  await expect(page.locator(`${FORM} button`)).toBeEnabled();
});

test('serwer 500 → komunikat "coś się zacięło"', async ({ page }) => {
  await page.route('**/api/subscribe', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'server_misconfigured' }),
    }),
  );
  await page.goto('/');
  await page.locator(`${FORM} input[type="email"]`).fill('x@y.pl');
  await page.locator(`${FORM} button[type="submit"]`).click();

  await expect(page.locator('[data-newsletter-note]')).toHaveText(/zacięło|kontakt@szmidtke/i);
});

test('brak sieci → komunikat "brak połączenia"', async ({ page }) => {
  await page.route('**/api/subscribe', (route) => route.abort('failed'));
  await page.goto('/');
  await page.locator(`${FORM} input[type="email"]`).fill('x@y.pl');
  await page.locator(`${FORM} button[type="submit"]`).click();

  await expect(page.locator('[data-newsletter-note]')).toHaveText(/brak połączenia/i);
});

test('pusty email → HTML5 validation blokuje submit (nic nie jest wysyłane)', async ({ page }) => {
  let called = false;
  await page.route('**/api/subscribe', (route) => {
    called = true;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/');
  await page.locator(`${FORM} button[type="submit"]`).click();

  // Po ~500ms żadnego żądania nie powinno być.
  await page.waitForTimeout(500);
  expect(called).toBe(false);

  const validity = await page.locator(`${FORM} input[type="email"]`).evaluate(
    (el) => (el as HTMLInputElement).validity.valueMissing,
  );
  expect(validity).toBe(true);
});

test('honeypot wypełniony → serwer zwraca ok:true (cisza dla bota)', async ({ request }) => {
  // Test bezpośredni na endpoint — nie przez DOM bo honeypot jest ukryty.
  const resp = await request.post('/api/subscribe', {
    data: { email: 'bot@bots.io', website: 'https://spam.io' },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.ok).toBe(true);
});

test('malformed JSON → 400 invalid_body', async ({ page }) => {
  // Używamy fetch z przeglądarki, żeby mieć pewność że raw body trafia
  // do serwera bez dodatkowych transformacji po stronie Playwrighta.
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const resp = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    });
    return { status: resp.status, body: await resp.json().catch(() => ({})) };
  });
  expect(result.status).toBe(400);
  expect(result.body.error).toBe('invalid_body');
});

test('email bez @ → 400 invalid_email', async ({ request }) => {
  const resp = await request.post('/api/subscribe', {
    data: { email: 'nie-jest-mailem' },
  });
  expect(resp.status()).toBe(400);
  const body = await resp.json();
  expect(body.error).toBe('invalid_email');
});

test('GET /api/subscribe → 405 / brak obsługi', async ({ request }) => {
  const resp = await request.get('/api/subscribe');
  // Astro zwraca 404 dla brakującej metody w module z samym POST.
  expect([404, 405]).toContain(resp.status());
});
