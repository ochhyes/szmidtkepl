import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, formatPolishDate } from '../utils/posts';
import { CATEGORY_LABEL } from '../content/config';

export async function GET(context: APIContext) {
  const posts = (await getPublishedPosts()).slice(0, 20);
  const siteUrl = context.site?.toString() ?? import.meta.env.PUBLIC_SITE_URL ?? 'https://szmidtke.pl/';

  return rss({
    title: 'Marcin Szmidtke — piszę',
    description:
      'Eseje, obserwacje, fragmenty. O pasywności, schematach, drodze bez mety. Raz w tygodniu, czasem rzadziej.',
    site: siteUrl,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.lead,
      link: `/blog/${post.slug}/`,
      pubDate: post.data.date,
      categories: [CATEGORY_LABEL[post.data.category] ?? post.data.category],
      customData: `<meta>${formatPolishDate(post.data.date)} — ${post.data.readingTime}</meta>`,
    })),
    customData: '<language>pl-pl</language>',
    stylesheet: '/rss-style.xsl',
  });
}
