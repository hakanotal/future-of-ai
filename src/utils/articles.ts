export interface ArticleMeta {
  title: string;
  description: string;
}

export const articleMeta: Record<string, ArticleMeta> = {
  tescreal: {
    title: 'The Hidden Faith of Silicon Valley',
    description: 'How a thought experiment about a drowning child became the ideology behind the AI race.',
  },
};

/** Slugs that redirect elsewhere instead of rendering (root narrative). */
export const articleRedirects: Record<string, string> = {
  tescreal: '/',
};

export function getArticleMeta(slug: string): ArticleMeta {
  return articleMeta[slug] ?? { title: slug, description: 'A narrative.' };
}
