import { test, expect } from '@playwright/test';

test('skip link jest pierwszym fokusowalnym elementem', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? { tag: el.tagName, href: el.getAttribute('href'), text: el.textContent?.trim() } : null;
  });
  expect(focused?.tag).toBe('A');
  expect(focused?.href).toBe('#main');
  expect(focused?.text).toMatch(/przejdź do treści/i);
});

test('<main id="main"> istnieje na każdej kluczowej stronie', async ({ page }) => {
  for (const path of ['/', '/blog', '/o-mnie', '/kontakt']) {
    await page.goto(path);
    await expect(page.locator('main#main')).toHaveCount(1);
  }
});

test('obrazy mają atrybut alt (niepusty dla treściowych)', async ({ page }) => {
  await page.goto('/');
  const alts = await page.locator('img').evaluateAll((imgs) =>
    imgs.map((img) => ({
      src: (img as HTMLImageElement).src,
      alt: (img as HTMLImageElement).alt,
      role: img.getAttribute('role'),
      ariaHidden: img.getAttribute('aria-hidden'),
    })),
  );
  for (const img of alts) {
    // Pomiń dekoracyjne (role=presentation lub aria-hidden).
    if (img.role === 'presentation' || img.ariaHidden === 'true') continue;
    expect(img.alt, `img ${img.src} nie ma alt`).not.toBeNull();
    expect(img.alt.length, `img ${img.src} ma pusty alt`).toBeGreaterThan(0);
  }
});

test('theme toggle ma widoczny focus ring', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('[data-theme-toggle]');
  await toggle.focus();
  const outline = await toggle.evaluate((el) => getComputedStyle(el).outlineStyle);
  // Oczekujemy że w :focus-visible outline jest inne niż 'none'.
  // W niektórych przeglądarkach ten test może wymagać focus-visible,
  // ale ogólnie chcemy mieć jakiś wizualny sygnał.
  expect(['solid', 'dotted', 'dashed', 'auto']).toContain(outline);
});

test('hamburger ma aria-label i aria-expanded', async ({ page }) => {
  await page.goto('/');
  const hamb = page.locator('[data-nav-toggle]');
  await expect(hamb).toHaveAttribute('aria-label', /menu/i);
  await expect(hamb).toHaveAttribute('aria-expanded', 'false');
});

test('drawer ma aria-label i aria-hidden', async ({ page }) => {
  await page.goto('/');
  const drawer = page.locator('#nav-drawer');
  await expect(drawer).toHaveAttribute('aria-label', /menu/i);
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
});

test('każda podstrona ma dokładnie jedno h1 w <main>', async ({ page }) => {
  // Scope do <main> — Astro dev toolbar w dev wstrzykuje własne <h1> poza main.
  for (const path of ['/', '/blog', '/o-mnie', '/nie-ja', '/pomocja', '/kontakt', '/prywatnosc']) {
    await page.goto(path);
    const count = await page.locator('main h1').count();
    expect(count, `${path} ma ${count} h1 w <main>`).toBe(1);
  }
});

test('/nie-ja — h1 jest obecny i dostępny dla SR, nawet jeśli wizualnie ukryty', async ({ page }) => {
  await page.goto('/nie-ja');
  const h1 = page.locator('main h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText(/nie ja/i);
});

test('html ma lang="pl"', async ({ page }) => {
  await page.goto('/');
  const lang = await page.locator('html').getAttribute('lang');
  expect(lang).toBe('pl');
});
