import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

// Wszystkie opublikowane wpisy (drafty wycięte w produkcji), posortowane od najnowszego.
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const all = await getPublishedPosts();
  return all.filter((p) => p.data.category === category);
}

// Wpisy powiązane — 2 najnowsze z tej samej kategorii, bez bieżącego.
export async function getRelatedPosts(current: BlogPost, limit = 2): Promise<BlogPost[]> {
  const category = current.data.category;
  const sameCat = await getPostsByCategory(category);
  return sameCat.filter((p) => p.id !== current.id).slice(0, limit);
}

export function formatPolishDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
