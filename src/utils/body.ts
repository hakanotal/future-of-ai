import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

const BASE = '/future-of-ai';

function addBaseToLinks(html: string): string {
  return html.replace(/href="(\/e\/[^"]+)"/g, `href="${BASE}$1"`);
}

export function getEntityBody(id: string): string | null {
  const filePath = path.join(process.cwd(), 'src', 'content', 'entities', `${id}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const html = marked.parse(raw) as string;
  return addBaseToLinks(html);
}

export function getArticleBody(slug: string): string | null {
  const filePath = path.join(process.cwd(), 'src', 'content', 'articles', `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const html = marked.parse(raw) as string;
  return addBaseToLinks(html);
}

export function listArticles(): string[] {
  const dir = path.join(process.cwd(), 'src', 'content', 'articles');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
}
