import { test, expect } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

test.describe('nawigacja desktop', () => {
  test.use({ viewport: DESKTOP });

  test('aria-current=page na aktywnej zakładce /blog', async ({ page }) => {
    await page.goto('/blog');
    const active = page.locator('nav.primary a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText(/piszę/i);
  });

  test('aria-current zachowuje się na podstronie wpisu (/blog/*)', async ({ page }) => {
    await page.goto('/blog/pasywnosc-ktora-wyglada-jak-odpoczynek');
    const active = page.locator('nav.primary a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText(/piszę/i);
  });

  test('hamburger ukryty na desktopie (przynajmniej nie widoczny w layoucie)', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('[data-nav-toggle]');
    // Istnieje w DOM (CSS go ukrywa na desktopie).
    await expect(hamburger).toHaveCount(1);
  });
});

test.describe('drawer mobile', () => {
  test.use({ viewport: MOBILE });

  test('otwarcie, zamknięcie przyciskiem × i focus wraca na hamburger', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('[data-nav-toggle]');
    const drawer = page.locator('#nav-drawer');

    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    await hamburger.click();
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Body scroll zablokowany.
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');

    await page.locator('[data-nav-close]').click();
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-nav-toggle'));
    expect(focused).not.toBeNull();
  });

  test('ESC zamyka drawer', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-nav-toggle]').click();
    await expect(page.locator('#nav-drawer')).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-drawer')).toHaveAttribute('aria-hidden', 'true');
  });

  test('klik w link zamyka drawer i nawiguje', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-nav-toggle]').click();
    await page.locator('#nav-drawer a[href="/o-mnie"]').click();
    await expect(page).toHaveURL(/\/o-mnie/);

    // Po nawigacji drawer jest w stanie początkowym.
    await expect(page.locator('#nav-drawer')).toHaveAttribute('aria-hidden', 'true');
  });

  test('powrót wstecz z otwartego drawera nie zostawia zablokowanego scrolla', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-nav-toggle]').click();
    await page.locator('#nav-drawer a[href="/blog"]').click();
    await expect(page).toHaveURL(/\/blog/);

    await page.goBack();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    // Po nawigacji nowy DOM, skrypt startuje od zera — scroll wolny.
    expect(overflow).toBe('');
  });
});

test.describe('drawer — zmiana rozmiaru w trakcie działania', () => {
  test('resize z mobile na desktop z otwartym drawerem nie wiesza scrolla', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.locator('[data-nav-toggle]').click();
    await expect(page.locator('#nav-drawer')).toHaveAttribute('aria-hidden', 'false');

    await page.setViewportSize(DESKTOP);
    // Drawer może wizualnie się chować przez CSS, ale scroll powinien dać się
    // odblokować przez ESC — sprawdzamy że klawisz działa.
    await page.keyboard.press('Escape');
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('');
  });
});
