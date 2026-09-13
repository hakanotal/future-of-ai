import type { APIRoute } from 'astro';
import { buildGraph } from '../../utils/graph';

export const prerender = true;

export const GET: APIRoute = async () => {
  const { nodes, edges, counts } = buildGraph();
  const body = JSON.stringify({ elements: { nodes, edges }, ...counts });
  return new Response(body, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
