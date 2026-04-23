import { test, expect, type Page } from '@playwright/test';

// Przełącznik motywu w stopce. Reguła:
//   - data-theme="dark"        → ciemny
//   - brak atrybutu + OS=jasny → jasny (z :root)
//   - brak atrybutu + OS=ciemny → ciemny (z @media prefers-color-scheme: dark)
// Preferencja zapisywana w localStorage jako 'theme' = 'dark' | 'light'.
// Inline skrypt w BaseLayout.astro czyta tę wartość przed paintem.

async function getTheme(page: Page) {
  return page.evaluate(() => ({
    attr: document.documentElement.getAttribute('data-theme'),
    saved: localStorage.getItem('theme'),
    label: document.querySelector('[data-theme-label]')?.textContent?.trim() ?? null,
    bgColor: getComputedStyle(document.body).backgroundColor,
  }));
}

const toggle = '[data-theme-toggle]';

test.describe('theme toggle — happy path', () => {
  test('klik z jasnego → ciemny; atrybut, label i localStorage się zgadzają', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    let state = await getTheme(page);
    expect(state.attr).toBeNull();
    expect(state.label).toMatch(/ciemny/i);

    await page.locator(toggle).click();

    state = await getTheme(page);
    expect(state.attr).toBe('dark');
    expect(state.saved).toBe('dark');
    expect(state.label).toMatch(/jasny/i);
  });

  test('klik ciemny → jasny wraca do jasnego (jawny data-theme="light")', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto('/');

    let state = await getTheme(page);
    expect(state.attr).toBe('dark');

    await page.locator(toggle).click();

    state = await getTheme(page);
    // Po naprawie bugu z prefers-color-scheme: light ustawia jawny atrybut,
    // żeby @media (prefers-color-scheme: dark) nie nadpisywał wyboru.
    expect(state.attr).toBe('light');
    expect(state.saved).toBe('light');
    expect(state.label).toMatch(/ciemny/i);
  });

  test('wybór persystuje między stronami', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.locator(toggle).click();

    await page.goto('/blog');
    const state = await getTheme(page);
    expect(state.attr).toBe('dark');
    expect(state.label).toMatch(/jasny/i);
  });
});

test.describe('theme toggle — regresja buga z prefers-color-scheme: dark', () => {
  // Historia: gdy OS=dark i brak zapisu w localStorage, CSS dawał ciemne przez
  // @media, ale JS czytał tylko data-theme (pusty) i uznawał że "jesteśmy w
  // light". Label kłamał, a pierwszy klik nie zmieniał wyglądu.
  // Fix: (1) toggle używa matchMedia do "efektywnego" stanu, (2) setAttribute
  // zawsze ('light'|'dark'), (3) CSS @media wyłącza się gdy data-theme="light".

  test('pierwszy klik w trybie OS=dark przełącza na jasny', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const before = await getTheme(page);
    // OS=dark + brak data-theme → tło ciemne z @media.
    expect(before.attr).toBeNull();
    expect(before.saved).toBeNull();
    const bgBefore = before.bgColor;

    await page.locator(toggle).click();

    const after = await getTheme(page);
    expect(after.attr).toBe('light');
    expect(after.saved).toBe('light');
    expect(after.bgColor).not.toBe(bgBefore);
    expect(after.label).toMatch(/ciemny/i);
  });

  test('label po załadowaniu strony z OS=dark bez zapisu powinien mówić "tryb jasny"', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const state = await getTheme(page);
    // Skoro wizualnie jesteśmy w ciemnym, przycisk powinien oferować przejście do jasnego.
    expect(state.label).toMatch(/jasny/i);
  });
});
