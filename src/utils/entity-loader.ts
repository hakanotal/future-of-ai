import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

interface Entity {
  id: string;
  label: string;
  type: string;
  strands: string[];
  short: string;
  dates?: { start?: string; end?: string };
  tags?: string[];
  status?: string;
  [key: string]: unknown;
}

export function loadEntities(): Entity[] {
  const dataDir = path.join(process.cwd(), 'src', 'data', 'entities');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  const entities: Entity[] = [];
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.parse(content);
    
    if (Array.isArray(parsed)) {
      entities.push(...parsed);
    } else if (parsed && typeof parsed === 'object') {
      entities.push(parsed);
    }
  }
  
  return entities;
}

export function getEntityById(id: string): Entity | undefined {
  const entities = loadEntities();
  return entities.find(e => e.id === id);
}

export function getEntitiesByType(type: string): Entity[] {
  const entities = loadEntities();
  return entities.filter(e => e.type === type);
}

export function getEntitiesByStrand(strand: string): Entity[] {
  const entities = loadEntities();
  return entities.filter(e => e.strands?.includes(strand));
}

export function searchEntities(query: string): Entity[] {
  const entities = loadEntities();
  const lowerQuery = query.toLowerCase();
  
  return entities.filter(e => 
    e.label.toLowerCase().includes(lowerQuery) ||
    e.short?.toLowerCase().includes(lowerQuery) ||
    e.id.toLowerCase().includes(lowerQuery) ||
    e.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}
