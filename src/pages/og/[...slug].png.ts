import type { APIContext } from 'astro';
import { Resvg } from '@resvg/resvg-js';
import { getPublishedPosts } from '../../utils/posts';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.slug } }));
}

// Escape XML entities — zapobiega łamaniu SVG przez cudzysłowy, &, < w tytule.
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Wrap tytułu — ręczny word-wrap, satori nas zawiódł (variable TTF nie działa
// z @shuding/opentype), więc budujemy SVG samodzielnie, rozbijając na linie.
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxCharsPerLine) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function GET(context: APIContext): Promise<Response> {
  const { slug } = context.params;
  const posts = await getPublishedPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return new Response('Not found', { status: 404 });

  const title = escapeXml(post.data.title);
  const categoryLabel = post.data.category;
  const date = post.data.date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Line-wrap tytułu — max ~22 znaki na linię przy 64px font-size i szerokości 1040px.
  const lines = wrapText(title, 26);
  const LINE_HEIGHT = 78;
  const startY = 315 - ((lines.length - 1) * LINE_HEIGHT) / 2;
  const titleTspans = lines
    .map((line, i) => `<tspan x="96" y="${startY + i * LINE_HEIGHT}">${line}</tspan>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FAF8F3"/>
  <text x="96" y="100" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-style="italic" fill="#8A857E">
    ${escapeXml(date)} — ${escapeXml(categoryLabel)}
  </text>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="500" fill="#1F1B18" style="letter-spacing: -1px;">
    ${titleTspans}
  </text>
  <text x="96" y="570" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-style="italic" fill="#6B2E2E">
    Marcin Szmidtke
  </text>
  <text x="1104" y="570" text-anchor="end" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-style="italic" fill="#8A857E">
    szmidtke.pl
  </text>
</svg>`;

  const resvg = new Resvg(svg, {
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Georgia',
      serifFamily: 'Georgia',
    },
    fitTo: { mode: 'width', value: 1200 },
  });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
