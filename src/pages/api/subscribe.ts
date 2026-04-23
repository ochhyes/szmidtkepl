import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubscribeBody {
  email?: string;
  website?: string; // honeypot
}

type Outcome =
  | { ok: true; already?: boolean }
  | { ok: false; error: 'invalid_body' | 'invalid_email' | 'server_misconfigured' | 'rate_limited' | 'upstream_failure' | 'network' };

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';
  const isForm = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

  let body: SubscribeBody;
  try {
    if (isForm) {
      const form = await request.formData();
      body = {
        email: form.get('email')?.toString(),
        website: form.get('website')?.toString(),
      };
    } else {
      body = await request.json();
    }
  } catch {
    return respond(isForm, { ok: false, error: 'invalid_body' }, 400);
  }

  if (body.website && body.website.length > 0) {
    return respond(isForm, { ok: true }, 200);
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return respond(isForm, { ok: false, error: 'invalid_email' }, 400);
  }

  // UWAGA: process.env (nie import.meta.env) — sekrety serwerowe w Astro output:hybrid
  // są inline'owane przez Vite w build time; .env jest w .dockerignore, więc w build stage
  // wartość byłaby undefined i zapiekłaby się w kod. process.env czyta runtime z kontenera.
  const apiKey = process.env.BUTTONDOWN_API_KEY ?? import.meta.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn('[subscribe] BUTTONDOWN_API_KEY missing — skipping real call.', { email });
      return respond(isForm, { ok: true }, 200);
    }
    return respond(isForm, { ok: false, error: 'server_misconfigured' }, 500);
  }

  // Buttondown przeniosło API z .email na .com. Próbujemy najpierw .com (aktualne),
  // potem fallback na .email (niektóre konta jeszcze tam siedzą).
  const API_URLS = [
    'https://api.buttondown.com/v1/subscribers',
    'https://api.buttondown.email/v1/subscribers',
  ];

  let lastStatus = 0;
  let lastBody = '';

  for (const url of API_URLS) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email_address: email }),
      });

      lastStatus = resp.status;
      lastBody = await resp.text().catch(() => '');

      if (resp.status === 400) {
        const errBody = safeJson(lastBody);
        const code = String(errBody?.code ?? errBody?.detail ?? lastBody);
        if (/already/i.test(code)) {
          return respond(isForm, { ok: true, already: true }, 200);
        }
        return respond(isForm, { ok: false, error: 'invalid_email' }, 400);
      }

      if (resp.status === 429) {
        return respond(isForm, { ok: false, error: 'rate_limited' }, 429);
      }

      if (resp.ok) {
        return respond(isForm, { ok: true }, 200);
      }

      // Non-2xx — log i próbuj następnego URL-a (jeśli jest).
      console.error(`[subscribe] Buttondown ${url} → ${resp.status}: ${lastBody.slice(0, 300)}`);
    } catch (err) {
      console.error(`[subscribe] network error on ${url}:`, err);
    }
  }

  console.error(`[subscribe] all Buttondown URLs failed. Last status: ${lastStatus}, body: ${lastBody.slice(0, 300)}`);
  return respond(isForm, { ok: false, error: 'upstream_failure' }, 502);
};

function safeJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function respond(isForm: boolean, outcome: Outcome, status: number): Response {
  if (!isForm) {
    return new Response(JSON.stringify(outcome), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (outcome.ok) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/zapisany' },
    });
  }
  return htmlFallback(outcome, status);
}

function htmlFallback(outcome: Outcome, status: number): Response {
  const title = outcome.ok ? 'Zapisany' : 'Coś się zacięło';
  const message = outcome.ok
    ? 'Dziękuję. Pierwszy mail z linkiem do potwierdzenia powinien przyjść w ciągu kilku minut. Kliknij, żeby list zaczął chodzić.'
    : outcome.error === 'invalid_email'
      ? 'To chyba nie jest poprawny adres. Wróć i spróbuj jeszcze raz.'
      : outcome.error === 'rate_limited'
        ? 'Za dużo prób w krótkim czasie. Spróbuj za chwilę.'
        : 'Coś się zacięło po mojej stronie. Napisz bezpośrednio na kontakt@szmidtke.pl.';

  const html = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — szmidtke.pl</title>
  <meta name="robots" content="noindex">
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 80px auto; padding: 0 24px; line-height: 1.7; color: #1F1B18; background: #FAF8F3; }
    h1 { font-size: 36px; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 20px; line-height: 1.1; }
    p { font-size: 19px; margin: 0 0 16px; }
    a { color: #6B2E2E; text-underline-offset: 4px; }
    .back { margin-top: 40px; font-style: italic; font-size: 17px; }
    @media (prefers-color-scheme: dark) {
      body { background: #1A1714; color: #EAE4DA; }
      a { color: #C88A7A; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
  <p class="back"><a href="/">← wróć do strony</a></p>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
