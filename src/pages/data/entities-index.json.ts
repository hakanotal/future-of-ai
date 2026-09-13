import type { APIRoute } from 'astro';
import { buildEntitiesIndex } from '../../utils/graph';

export const prerender = true;

export const GET: APIRoute = async () => {
  const body = JSON.stringify(buildEntitiesIndex());
  return new Response(body, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
