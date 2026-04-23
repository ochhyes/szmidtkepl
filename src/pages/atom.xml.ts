import type { APIContext } from 'astro';
import { getPublishedPosts } from '../utils/posts';

export const prerender = true;

export async function GET(context: APIContext) {
  const posts = (await getPublishedPosts()).slice(0, 20);
  const siteUrl = (context.site?.toString() ?? import.meta.env.PUBLIC_SITE_URL ?? 'https://szmidtke.pl/').replace(/\/$/, '');
  const updated = posts[0]?.data.date.toISOString() ?? new Date().toISOString();

  const entries = posts.map((p) => {
    const url = `${siteUrl}/blog/${p.slug}/`;
    const iso = p.data.date.toISOString();
    return `    <entry>
      <title>${escapeXml(p.data.title)}</title>
      <link href="${url}" rel="alternate" type="text/html"/>
      <id>${url}</id>
      <updated>${iso}</updated>
      <published>${iso}</published>
      <summary type="text">${escapeXml(p.data.lead)}</summary>
    </entry>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="pl">
  <title>Marcin Szmidtke — piszę</title>
  <subtitle>Eseje, obserwacje, fragmenty. O pasywności, schematach, drodze bez mety.</subtitle>
  <link href="${siteUrl}/atom.xml" rel="self" type="application/atom+xml"/>
  <link href="${siteUrl}/" rel="alternate" type="text/html"/>
  <id>${siteUrl}/</id>
  <updated>${updated}</updated>
  <author><name>Marcin Szmidtke</name><email>kontakt@szmidtke.pl</email></author>
${entries}
</feed>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
