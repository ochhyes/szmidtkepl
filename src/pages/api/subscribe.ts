import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubscribeBody {
  email?: string;
  website?: string; // honeypot
}

export const POST: APIRoute = async ({ request }) => {
  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400);
  }

  // Honeypot — bot wypełnił pole website → fake success (nie palimy klucza API).
  if (body.website && body.website.length > 0) {
    return json({ ok: true });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  const apiKey = import.meta.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    // Dev bez klucza — pokaż sukces, żeby UI działał, ale zaloguj.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[subscribe] BUTTONDOWN_API_KEY missing — skipping real call.', { email });
      return json({ ok: true, dev: true });
    }
    return json({ ok: false, error: 'server_misconfigured' }, 500);
  }

  try {
    const resp = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address: email }),
    });

    // Already subscribed → Buttondown zwraca 400 z 'already_subscribed'. Z perspektywy
    // użytkownika chcemy sukces — 'list co dwa tygodnie' już tak dostaje.
    if (resp.status === 400) {
      const errBody = await resp.json().catch(() => ({}));
      const code = errBody?.code ?? errBody?.detail ?? '';
      if (/already/i.test(JSON.stringify(code))) {
        return json({ ok: true, already: true });
      }
      return json({ ok: false, error: 'invalid_email' }, 400);
    }

    if (resp.status === 429) {
      return json({ ok: false, error: 'rate_limited' }, 429);
    }

    if (!resp.ok) {
      return json({ ok: false, error: 'upstream_failure' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[subscribe] fetch failed', err);
    return json({ ok: false, error: 'network' }, 502);
  }
};

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
