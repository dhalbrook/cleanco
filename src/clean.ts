import { termsByType, termsByCountry } from './termdata.js';
import { NON_NFKD_MAP } from './nonNfkdMap.js';

function getUniqueTerms(): Set<string> {
  const ts = Object.values(termsByType).flat();
  const cs = Object.values(termsByCountry).flat();
  return new Set([...ts, ...cs]);
}

function isCombiningMark(char: string): boolean {
  const charCode = char.charCodeAt(0);
  return (charCode >= 0x0300 && charCode <= 0x036f) ||
    (charCode >= 0x1ab0 && charCode <= 0x1aff) ||
    (charCode >= 0x1dc0 && charCode <= 0x1dff) ||
    (charCode >= 0x20d0 && charCode <= 0x20ff) ||
    (charCode >= 0xfe20 && charCode <= 0xfe2f);
}

export function removeAccents(t: string): string {
  const nfkdForm = t.toLowerCase().normalize('NFKD');
  let result = '';

  for (const char of nfkdForm) {
    if (isCombiningMark(char)) {
      continue;
    }
    if (NON_NFKD_MAP[char]) {
      result += NON_NFKD_MAP[char];
    } else {
      result += char;
    }
  }
  return result;
}

export function stripPunct(t: string): string {
  return t.replace(/\./g, '').replace(/,/g, '').replace(/-/g, '');
}

export function normalizeTerms(terms: string[]): string[][] {
  return terms.map(term => stripPunct(removeAccents(term)).split(/\s+/).filter(Boolean));
}

export function stripTail(name: string): string {
  let end = name.length;
  while (end > 0) {
    const char = name[end - 1];
    // Keep dots and word characters (letters, digits, underscore using Unicode property)
    if (char === '.' || /[\p{L}\p{N}_]/u.test(char)) {
      break;
    }
    end--;
  }
  return name.substring(0, end);
}

function normalized(text: string): string {
  return removeAccents(text);
}

type TermTuple = [number, string[]];

export function prepareDefaultTerms(): TermTuple[] {
  const terms = Array.from(getUniqueTerms());
  const nterms = normalizeTerms(terms);
  const sorted = [...nterms].sort((a, b) => {
    if (a.length !== b.length) {
      return b.length - a.length;
    }
    return a.join(' ').localeCompare(b.join(' '));
  });
  return sorted.map(tp => [tp.length, tp]);
}

interface BasenameOptions {
  suffix?: boolean;
  prefix?: boolean;
  middle?: boolean;
}

export function customBasename(
  name: string,
  terms: TermTuple[],
  options: BasenameOptions = {}
): string {
  const { suffix = true, prefix = false, middle = false } = options;

  name = stripTail(name);
  let nparts = name.split(/\s+/).filter(Boolean);
  const nname = normalized(name);
  let nnparts = nname.split(/\s+/).filter(Boolean).map(stripPunct);
  const nnsize = nnparts.length;

  if (suffix) {
    for (const [termsize, termparts] of terms) {
      if (termsize <= nnparts.length && arraysEqual(nnparts.slice(-termsize), termparts)) {
        nnparts = nnparts.slice(0, -termsize);
        nparts = nparts.slice(0, -termsize);
      }
    }
  }

  if (prefix) {
    for (const [termsize, termparts] of terms) {
      if (termsize <= nnparts.length && arraysEqual(nnparts.slice(0, termsize), termparts)) {
        nnparts = nnparts.slice(termsize);
        nparts = nparts.slice(termsize);
      }
    }
  }

  if (middle) {
    for (const [termsize, termparts] of terms) {
      if (termsize > 1) {
        const sizediff = nnsize - termsize;
        if (sizediff > 1) {
          for (let i = 0; i <= nnparts.length - termsize; i++) {
            if (arraysEqual(nnparts.slice(i, i + termsize), termparts)) {
              nnparts = [...nnparts.slice(0, i), ...nnparts.slice(i + termsize)];
              nparts = [...nparts.slice(0, i), ...nparts.slice(i + termsize)];
              break;
            }
          }
        }
      } else {
        const middleTerms = nnparts.slice(1, -1);
        const idx = middleTerms.indexOf(termparts[0]);
        if (idx !== -1) {
          nnparts.splice(idx + 1, 1);
          nparts.splice(idx + 1, 1);
        }
      }
    }
  }

  return stripTail(nparts.join(' '));
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

const defaultTerms = prepareDefaultTerms();

export function basename(
  name: string,
  options: BasenameOptions = {}
): string {
  return customBasename(name, defaultTerms, options);
}
