import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

interface Relation {
  from: string;
  to: string;
  type: string;
  start?: string;
  end?: string;
  note?: string;
  sources?: string[];
  [key: string]: unknown;
}

export function loadRelations(): Relation[] {
  const filePath = path.join(process.cwd(), 'src', 'data', 'relations.yaml');
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.parse(content);
  
  return Array.isArray(parsed) ? parsed : [];
}

export function getRelationsByEntity(entityId: string): Relation[] {
  const relations = loadRelations();
  return relations.filter(r => r.from === entityId || r.to === entityId);
}

export function getRelationsByType(type: string): Relation[] {
  const relations = loadRelations();
  return relations.filter(r => r.type === type);
}

export function getRelationsFromEntity(entityId: string): Relation[] {
  const relations = loadRelations();
  return relations.filter(r => r.from === entityId);
}

export function getRelationsToEntity(entityId: string): Relation[] {
  const relations = loadRelations();
  return relations.filter(r => r.to === entityId);
}
