import { termsByCountry, termsByType } from './termdata.js';
import { stripTail, removeAccents } from './clean.js';

export type Source = [string, string];

export function typeSources(): Source[] {
  const types: Source[] = [];
  for (const [businessType, items] of Object.entries(termsByType)) {
    for (const item of items) {
      types.push([businessType, item]);
    }
  }
  return types.sort((a, b) => b[1].length - a[1].length);
}

export function countrySources(): Source[] {
  const countries: Source[] = [];
  for (const [country, items] of Object.entries(termsByCountry)) {
    for (const item of items) {
      countries.push([country, item]);
    }
  }
  return countries.sort((a, b) => b[1].length - a[1].length);
}

export function matches(name: string, sources: Source[]): string[] {
  name = stripTail(name);
  const parts = name.split(/\s+/).filter(Boolean);
  const nparts = parts.map(p => removeAccents(p));
  const matched: string[] = [];

  for (const [classifier, term] of sources) {
    const nterm = removeAccents(term);
    if (nparts.includes(nterm)) {
      matched.push(classifier);
    }
  }

  return [...new Set(matched)].sort();
}
