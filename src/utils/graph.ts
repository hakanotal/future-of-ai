import { loadEntities } from './entity-loader.js';
import { loadRelations } from './relation-loader.js';

export interface GraphNode {
  data: { id: string; label: string; type: string; strands: string[]; degree: number };
}

export interface GraphEdge {
  data: { id: string; source: string; target: string; type: string; sourced: boolean };
}

export function buildGraph() {
  const entities = loadEntities();
  const relations = loadRelations();

  const degree = new Map<string, number>();
  for (const e of entities) degree.set(e.id, 0);
  for (const r of relations) {
    degree.set(r.from, (degree.get(r.from) ?? 0) + 1);
    degree.set(r.to, (degree.get(r.to) ?? 0) + 1);
  }

  const entityIds = new Set(entities.map((e) => e.id));
  const nodes: GraphNode[] = entities.map((e) => ({
    data: {
      id: e.id,
      label: e.label,
      type: e.type,
      strands: e.strands ?? [],
      degree: degree.get(e.id) ?? 0,
    },
  }));

  const edges: GraphEdge[] = relations
    .filter((r) => entityIds.has(r.from) && entityIds.has(r.to))
    .map((r, i) => ({
      data: {
        id: `${r.from}--${r.type}--${r.to}--${i}`,
        source: r.from,
        target: r.to,
        type: r.type,
        sourced: (r.sources?.length ?? 0) > 0,
      },
    }));

  return { nodes, edges, counts: { entities: nodes.length, relations: edges.length } };
}

export function buildEntitiesIndex() {
  const entities = loadEntities();
  return entities.map((e) => ({
    id: e.id,
    label: e.label,
    type: e.type,
    strands: e.strands ?? [],
    short: e.short,
    tags: e.tags ?? [],
  }));
}
