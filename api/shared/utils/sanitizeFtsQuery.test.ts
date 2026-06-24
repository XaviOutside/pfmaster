import { describe, it, expect } from 'vitest';
import { sanitizeFtsQuery } from './sanitizeFtsQuery';

describe('sanitizeFtsQuery', () => {
  describe('FTS operator stripping', () => {
    it('strips the + operator', () => {
      expect(sanitizeFtsQuery('+cat')).toBe('cat');
    });

    it('strips the - operator', () => {
      expect(sanitizeFtsQuery('-dog')).toBe('dog');
    });

    it('strips the * operator', () => {
      expect(sanitizeFtsQuery('poodle*')).toBe('poodle');
    });

    it('strips the " operator', () => {
      expect(sanitizeFtsQuery('"exact phrase"')).toBe('exact phrase');
    });

    it('strips the ( operator', () => {
      expect(sanitizeFtsQuery('(cat')).toBe('cat');
    });

    it('strips the ) operator', () => {
      expect(sanitizeFtsQuery('dog)')).toBe('dog');
    });

    it('strips all operators combined', () => {
      expect(sanitizeFtsQuery('+(cat) -dog* "poodle"')).toBe('cat dog poodle');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeFtsQuery('')).toBe('');
    });

    it('returns empty string for operators-only input', () => {
      expect(sanitizeFtsQuery('+-*"()')).toBe('');
    });

    it('handles a normal term without modification', () => {
      expect(sanitizeFtsQuery('labrador')).toBe('labrador');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeFtsQuery('  golden retriever  ')).toBe('golden retriever');
    });

    it('collapses multiple internal spaces into one', () => {
      expect(sanitizeFtsQuery('golden   retriever')).toBe('golden retriever');
    });

    it('handles whitespace-only input', () => {
      expect(sanitizeFtsQuery('   ')).toBe('');
    });
  });
});
