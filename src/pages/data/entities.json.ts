import type { APIRoute } from 'astro';
import { loadEntities } from '../../utils/entity-loader';
import { loadRelations } from '../../utils/relation-loader';

export const prerender = true;

export const GET: APIRoute = async () => {
  const body = JSON.stringify({ entities: loadEntities(), relations: loadRelations() });
  return new Response(body, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
