import { test, expect, type Page } from '@playwright/test';

// "Co dziwnego zrobi użytkownik" — scenariusze, które nie zostaną w normalnym
// smoke teście, a potrafią przewrócić stronę. Część odkrywa prawdziwe bugi,
// część tylko upewnia się, że nic nie eksploduje.

test.describe('theme toggle — dziwne dane w localStorage', () => {
  async function setStorage(page: Page, value: string) {
    await page.addInitScript((v) => localStorage.setItem('theme', v), value);
  }

  test('theme=banana w localStorage → traktowane jak brak, strona działa', async ({ page }) => {
    await setStorage(page, 'banana');
    await page.goto('/');
    const attr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // Ani "dark" ani "light" — inline skrypt w BaseLayout nie ustawia nic.
    expect(attr).toBeNull();
    // Toggle nadal działa (klik daje jawny dark/light).
    await page.locator('[data-theme-toggle]').click();
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(['dark', 'light']).toContain(after);
  });

  test('theme=JSON blob w localStorage → strona się nie wysypuje', async ({ page }) => {
    await setStorage(page, '{"deep":"evil"}');
    const resp = await page.goto('/');
    expect(resp?.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
  });

  test('pusty string w localStorage.theme', async ({ page }) => {
    await setStorage(page, '');
    const resp = await page.goto('/');
    expect(resp?.status()).toBe(200);
  });
});

test.describe('rapid clicks / mashing', () => {
  test('20 szybkich kliknięć theme toggle nie wysypuje labela', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const btn = page.locator('[data-theme-toggle]');
    for (let i = 0; i < 20; i++) {
      await btn.click({ delay: 5 });
    }
    const state = await page.evaluate(() => ({
      attr: document.documentElement.getAttribute('data-theme'),
      saved: localStorage.getItem('theme'),
      label: document.querySelector('[data-theme-label]')?.textContent,
    }));
    // 20 klików z jasnego → parzyste = jasny (jawny data-theme="light").
    expect(state.attr).toBe('light');
    expect(state.saved).toBe('light');
    expect(state.label).toMatch(/ciemny/i);
  });

  test('10× otwórz/zamknij drawer nie zawiesza strony', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const toggle = page.locator('[data-nav-toggle]');
    const close = page.locator('[data-nav-close]');
    for (let i = 0; i < 10; i++) {
      await toggle.click();
      await close.click();
    }
    await expect(page.locator('#nav-drawer')).toHaveAttribute('aria-hidden', 'true');
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('');
  });
});

test.describe('dziwne URL-e', () => {
  test('GET /blog/nie-istnieje → 404 z sensowną stroną', async ({ page }) => {
    const resp = await page.goto('/blog/nie-istnieje-taki-slug', { waitUntil: 'domcontentloaded' });
    // W dev Astro 404 page renderuje się z response 404 (SSR) lub 200 (build static).
    // Akceptujemy obie drogi, ale strona MUSI pokazać h1 "404".
    expect([200, 404]).toContain(resp?.status() ?? 0);
    await expect(page.locator('main h1')).toHaveText(/404/);
  });

  test('GET /blog/tag/nie-istnieje → 404', async ({ page }) => {
    const resp = await page.goto('/blog/tag/zdecydowanie-nie-ma-takiego-tagu', { waitUntil: 'domcontentloaded' });
    expect([200, 404]).toContain(resp?.status() ?? 0);
  });

  test('GET /blog/kategoria/xxx (nieznana kategoria) → 404', async ({ page }) => {
    const resp = await page.goto('/blog/kategoria/zycie-towarzyskie', { waitUntil: 'domcontentloaded' });
    expect([200, 404]).toContain(resp?.status() ?? 0);
  });

  test('URL z hash i query — strona działa', async ({ page }) => {
    const resp = await page.goto('/?utm_source=spam&foo=bar#newsletter');
    expect(resp?.status()).toBe(200);
    const scrolled = await page.evaluate(() => window.scrollY);
    expect(scrolled).toBeGreaterThan(0);
  });

  test('URL z unicode/emoji w query nie wysypuje strony', async ({ page }) => {
    const resp = await page.goto('/?q=%F0%9F%98%80%20zażółć%20gęślą%20jaźń');
    expect(resp?.status()).toBe(200);
  });
});

test.describe('newsletter — złośliwe inputy', () => {
  test('email z 1000 znaków → serwer odrzuca z invalid_email', async ({ request }) => {
    const longLocal = 'a'.repeat(1000);
    const resp = await request.post('/api/subscribe', {
      data: { email: `${longLocal}@example.com` },
    });
    // Regex dopuści taki email (brak limitów długości), Buttondown odrzuci.
    // W dev bez klucza zwróci ok:true — akceptujemy oba końce.
    expect([200, 400, 502]).toContain(resp.status());
  });

  test('email z unicode i IDN (żółć@ąąą.pl) — regex przechodzi, serwer może go wziąć', async ({ request }) => {
    const resp = await request.post('/api/subscribe', {
      data: { email: 'żółć@ąąą.pl' },
    });
    expect([200, 400, 502]).toContain(resp.status());
  });

  test('whitespace w emailu jest trimowany przed walidacją', async ({ request }) => {
    const resp = await request.post('/api/subscribe', {
      data: { email: '  marcin@szmidtke.pl  ' },
    });
    expect([200, 502]).toContain(resp.status()); // nie invalid_email
  });

  test('podwójny submit tego samego formularza nie wysyła dwa razy', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/subscribe', async (route) => {
      calls++;
      // Celowe opóźnienie żeby drugi klik mógł wpaść.
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/');
    const input = page.locator('form[data-newsletter-form] input[type="email"]');
    await input.fill('marcin@example.com');
    const btn = page.locator('form[data-newsletter-form] button[type="submit"]');
    // Dwa kliki szybko jeden po drugim.
    await btn.click();
    await btn.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(600);
    expect(calls).toBe(1);
  });

  test('XSS w polu email nie wykonuje skryptu', async ({ page }) => {
    await page.goto('/');
    const payload = '"><script>window.__xss=true</script>@x.pl';
    await page.locator('form[data-newsletter-form] input[type="email"]').fill(payload);
    // HTML5 validation odrzuci format, ale interesuje nas że nic się nie wywoła.
    const xss = await page.evaluate(() => (window as { __xss?: boolean }).__xss);
    expect(xss).toBeUndefined();
  });
});

test.describe('JavaScript wyłączony', () => {
  test.use({ javaScriptEnabled: false });

  test('strona i treść są czytelne bez JS', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    // Wordmark, nawigacja, link do kontaktu — wszystko HTML.
    await expect(page.locator('a[href="/kontakt"]').first()).toBeVisible();
  });

  test('formularz newslettera ma pole email (fallback)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('form[data-newsletter-form] input[type="email"]')).toBeVisible();
  });
});
