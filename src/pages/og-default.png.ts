import { Resvg } from '@resvg/resvg-js';

// OG fallback dla stron bez customowego ogImage (Home, About, Wersje, 404).
// Rysowany ręcznie w SVG — system serif (Georgia), bez zewnętrznych fontów.
export async function GET(): Promise<Response> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FAF8F3"/>
  <text x="600" y="285" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="84" font-weight="500" fill="#1F1B18" style="letter-spacing: -1.5px;">
    Marcin Szmidtke
  </text>
  <text x="600" y="355" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-style="italic" fill="#6B6560">
    Piszę, żeby po drodze zauważać więcej.
  </text>
  <text x="600" y="570" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-style="italic" fill="#8A857E">
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
