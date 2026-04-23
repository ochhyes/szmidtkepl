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

// Sąsiadujące wpisy w porządku chronologicznym (`allPosts` posortowane desc → index-1 = nowsze, index+1 = starsze).
export function getAdjacentPosts(
  currentSlug: string,
  allPosts: BlogPost[],
): { prev: BlogPost | null; next: BlogPost | null } {
  const idx = allPosts.findIndex((p) => p.slug === currentSlug);
  if (idx === -1) return { prev: null, next: null };
  return {
    next: idx > 0 ? allPosts[idx - 1] : null,
    prev: idx < allPosts.length - 1 ? allPosts[idx + 1] : null,
  };
}

export function formatPolishDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
