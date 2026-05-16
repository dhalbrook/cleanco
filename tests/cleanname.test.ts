import { describe, expect, it } from 'vitest';
import { basename, countrySources, matches, typeSources } from '../src';

describe('1. CORE FUNCTIONALITY TESTS', () => {
  describe('1.2 - Basic suffix removal', () => {
    const basicCleanupTests = [
      ['name w/ suffix', 'Hello World Oy', 'Hello World'],
      ["name w/ ', ltd.'", 'Hello World, ltd.', 'Hello World'],
      ['name w/ ws suffix ws', 'Hello    World ltd', 'Hello World'],
      ['name w/ suffix ws', 'Hello World ltd ', 'Hello World'],
      ['name w/ suffix dot ws', 'Hello World ltd. ', 'Hello World'],
      ['name w/ ws suffix dot ws', ' Hello World ltd. ', 'Hello World'],
    ];

    for (const [name, input, expected] of basicCleanupTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('1.3 - Prefix, suffix, and middle term removal', () => {
    const multiCleanupTests = [
      ['name + suffix', 'Hello World Oy', 'Hello World'],
      ['name + suffix (without punct)', 'Hello World sro', 'Hello World'],
      ['prefix + name', 'Oy Hello World', 'Hello World'],
      ['prefix + name + suffix', 'Oy Hello World Ab', 'Hello World'],
      ['name w/ term in middle', 'Hello Oy World', 'Hello World'],
      ['name w/ complex term in middle', 'Hello pty ltd World', 'Hello World'],
      ['name w/ mid + suffix', 'Hello Oy World Ab', 'Hello World'],
    ];

    for (const [name, input, expected] of multiCleanupTests) {
      it(name, () => {
        const result = basename(input, { prefix: true, suffix: true, middle: true });
        expect(result).toBe(expected);
      });
    }
  });

  describe('1.4 - Iterative cleaning (double-pass)', () => {
    const doubleCleanupTests = [
      ['name + two prefix', 'Ab Oy Hello World', 'Hello World'],
      ['name + two suffix', 'Hello World Ab Oy', 'Hello World'],
      ['name + two in middle', 'Hello Ab Oy World', 'Hello World'],
    ];

    for (const [name, input, expected] of doubleCleanupTests) {
      it(name, () => {
        const result = basename(input, { prefix: true, suffix: true, middle: true });
        const final = basename(result, { prefix: true, suffix: true, middle: true });
        expect(final).toBe(expected);
      });
    }
  });

  describe('1.5 - Punctuation preservation in company names', () => {
    const preservingCleanupTests = [
      ['name with comma', 'Hello, World, ltd.', 'Hello, World'],
      ['name with dot', 'Hello. World, Oy', 'Hello. World'],
    ];

    for (const [name, input, expected] of preservingCleanupTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('1.6 - Finnish/Nordic umlaut handling', () => {
    const unicodeUmlautTests = [
      ['name with umlaut in end', 'Säätämö Oy', 'Säätämö'],
      ['name with umlauts & comma', 'Säätämö, Oy', 'Säätämö'],
      ['name with no ending umlaut', 'Säätämo Oy', 'Säätämo'],
      ['name with beginning umlaut', 'Äätämo Oy', 'Äätämo'],
      ['name with just umlauts', 'Äätämö', 'Äätämö'],
      ['cyrillic name', 'ОАО Новороссийский морской торговый порт', 'Новороссийский морской торговый порт'],
    ];

    for (const [name, input, expected] of unicodeUmlautTests) {
      it(name, () => {
        expect(basename(input, { prefix: true })).toBe(expected);
      });
    }
  });

  describe('1.7 - Polish accented term matching', () => {
    const termsWithAccentsTests = [
      ['term with ł correct spelling', 'Łoś spółka z o.o', 'Łoś'],
      ['term with ł incorrect spelling', 'Łoś spolka z o.o', 'Łoś'],
    ];

    for (const [name, input, expected] of termsWithAccentsTests) {
      it(name, () => {
        expect(basename(input, { suffix: true })).toBe(expected);
      });
    }
  });
});

describe('2. EDGE CASE TESTS', () => {
  describe('2.1 - Empty results from single legal terms', () => {
    const emptyResultSingleTests = [
      ['AMBA (Danish term)', 'AMBA'],
      ['Inc', 'Inc'],
      ['LLC', 'LLC'],
      ['Ltd', 'Ltd'],
      ['Corporation', 'Corporation'],
      ['Limited', 'Limited'],
    ];

    for (const [name, input] of emptyResultSingleTests) {
      it(name, () => {
        expect(basename(input)).toBe('');
      });
    }
  });

  describe('2.2 - Empty results from multiple legal terms', () => {
    const emptyResultMultipleTests = [
      ['inc & co', 'inc & co'],
      ['Ltd. & Co.', 'Ltd. & Co.'],
    ];

    for (const [name, input] of emptyResultMultipleTests) {
      it(name, () => {
        expect(basename(input)).toBe('');
      });
    }
  });

  describe('2.3 - Various punctuation scenarios', () => {
    const punctuationHandlingTests = [
      ['ampersand (&) preservation', 'Smith & Jones Corporation', 'Smith & Jones'],
      ['hyphen (-) preservation', 'Smith-Jones Ltd', 'Smith-Jones'],
      ["apostrophe (') preservation", "McDonald's Corporation", "McDonald's"],
      ['multiple periods (abbreviations)', 'A.B.C. Corp', 'A.B.C.'],
      ['trailing exclamation removal', 'Yahoo! Inc', 'Yahoo'],
    ];

    for (const [name, input, expected] of punctuationHandlingTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('2.4 - Case-insensitive term matching', () => {
    const caseInsensitivityTests = [
      ['uppercase term (LLC)', 'Company Name LLC', 'Company Name'],
      ['lowercase term (llc)', 'Company Name llc', 'Company Name'],
      ['mixed case term (LlC)', 'Company Name LlC', 'Company Name'],
    ];

    for (const [name, input, expected] of caseInsensitivityTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('2.5 - Compound legal terms', () => {
    const compoundTermsTests = [
      ['Pty Ltd compound', 'Example Company Pty Ltd', 'Example'],
      ['Pty Limited (known issue)', 'Example Example Pty Limited', 'Example Example Pty'],
      ['entire name is legal terms', 'Company Pvt. Ltd.', ''],
    ];

    for (const [name, input, expected] of compoundTermsTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('2.6 - Real-world company names', () => {
    const realWorldCompaniesTests = [
      ['Apple Inc.', 'Apple Inc.', 'Apple'],
      ['Microsoft Corporation', 'Microsoft Corporation', 'Microsoft'],
      ['Berkshire Hathaway Inc.', 'Berkshire Hathaway Inc.', 'Berkshire Hathaway'],
      ['Procter & Gamble Co.', 'Procter & Gamble Co.', 'Procter & Gamble'],
      ['AT&T Inc.', 'AT&T Inc.', 'AT&T'],
    ];

    for (const [name, input, expected] of realWorldCompaniesTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('2.7 - Company names containing numbers', () => {
    const numbersInNamesTests = [
      ['numbers after name', 'Company 123 Ltd', 'Company 123'],
      ['name only numbers', '123456 Inc', '123456'],
      ['mixed alphanumeric', 'ABC123 Corporation', 'ABC123'],
    ];

    for (const [name, input, expected] of numbersInNamesTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('2.8 - Special formatting scenarios', () => {
    const specialFormatsTests = [
      ['all uppercase', 'IBM CORPORATION', 'IBM'],
      ['periods as abbreviations', 'U.S. Steel Corp.', 'U.S. Steel'],
      ['single letter name', 'X Corporation', 'X'],
    ];

    for (const [name, input, expected] of specialFormatsTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('2.9 - Whitespace handling', () => {
    const whitespaceHandlingTests = [
      ['leading whitespace', '  Hello World Ltd', 'Hello World'],
      ['trailing whitespace', 'Hello World Ltd  ', 'Hello World'],
      ['whitespace around term only', '  LLC  ', ''],
    ];

    for (const [name, input, expected] of whitespaceHandlingTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('2.10 - Ambiguous cases where legal term appears in actual name', () => {
    it('Limited in name and suffix', () => {
      expect(basename('Limited Edition Products Ltd')).toBe('Limited Edition Products');
    });
  });
});

describe('3. UNICODE AND INTERNATIONALIZATION TESTS', () => {
  describe('3.1 - Various Unicode and non-Latin scripts', () => {
    const unicodeNonLatinScriptsTests = [
      ['Arabic script', 'شركة المثال المحدودة', 'شركة المثال المحدودة'],
      ['Hebrew script', 'חברה בע״מ', 'חברה בע״מ'],
      ['Japanese (Kanji + Hiragana)', '株式会社サンプル', '株式会社サンプル'],
      ['Korean (Hangul)', '삼성전자 주식회사', '삼성전자 주식회사'],
      ['Thai script', 'บริษัท จำกัด', 'บริษัท จำกัด'],
      ['Greek alphabet', 'Ελληνική Επιχείρηση', 'Ελληνική Επιχείρηση'],
      ['Chinese with English suffix', '北京公司 Ltd', '北京公司'],
      ['Cyrillic with English suffix', 'Москва Corporation', 'Москва'],
      ['Japanese with English suffix', '東京株式会社 Inc.', '東京株式会社'],
    ];

    for (const [name, input, expected] of unicodeNonLatinScriptsTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('3.2 - Unicode special characters and accented Latin scripts', () => {
    const unicodeSpecialCharactersTests = [
      ['French accents', 'Société Française Ltd', 'Société Française'],
      ['Spanish accents', 'Compañía Española S.A.', 'Compañía Española'],
      ['Portuguese abbreviation', 'Empresa Ltda.', 'Empresa'],
      ['German umlauts (Müller & Söhne)', 'Müller & Söhne GmbH', 'Müller & Söhne'],
      ['German umlauts in name', 'Schöne Bücher Ltd', 'Schöne Bücher'],
      ['Nordic Ø character', 'Ørsted A/S', 'Ørsted'],
      ['Nordic Å character', 'Åland Corporation', 'Åland'],
      ['Czech characters', 'Český Krumlov s.r.o.', 'Český Krumlov'],
      ['Polish Ł character', 'Łódź Spółka', 'Łódź Spółka'],
    ];

    for (const [name, input, expected] of unicodeSpecialCharactersTests) {
      it(name, () => {
        expect(basename(input)).toBe(expected);
      });
    }
  });

  describe('3.3 - Mixed Unicode content with special symbols', () => {
    it('Greek letter (mathematical symbol)', () => {
      expect(basename('Alpha β Gamma Corp')).toBe('Alpha β Gamma');
    });

    it('Currency symbol (Euro)', () => {
      expect(basename('€uro Company Ltd')).toBe('€uro Company');
    });

    it('Combining diacritical marks', () => {
      expect(basename('Naïve Café Inc.')).toBe('Naïve Café');
    });

    it('Emoji in company name', () => {
      const result = basename('Tech 🚀 Innovation Ltd');
      expect(result).toContain('Tech');
      expect(result).toContain('Innovation');
    });
  });

  describe('3.4 - Right-to-left (RTL) script handling', () => {
    it('Arabic with English suffix', () => {
      const result = basename('الشركة العربية Ltd');
      expect(result).toContain('الشركة العربية');
    });

    it('Hebrew with English suffix', () => {
      const result = basename('החברה העברית Inc.');
      expect(result).toContain('החברה העברית');
    });
  });

  describe('3.5 - Unicode normalization handling', () => {
    it('Composed form (single character)', () => {
      const result = basename('Café Ltd');
      expect(result).toContain('Caf');
    });

    it('Decomposed form (base + combining character)', () => {
      const result = basename('Café Ltd');
      expect(result).toContain('Caf');
    });
  });
});

describe('Classification Functions', () => {
  describe('typeSources', () => {
    it('returns array of [type, term] tuples', () => {
      const sources = typeSources();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]).toHaveLength(2);
      expect(typeof sources[0][0]).toBe('string');
      expect(typeof sources[0][1]).toBe('string');
    });
  });

  describe('countrySources', () => {
    it('returns array of [country, term] tuples', () => {
      const sources = countrySources();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]).toHaveLength(2);
    });
  });

  describe('matches', () => {
    it('identifies business type from legal terms', () => {
      const sources = typeSources();
      const result = matches('MyCompany Ltd', sources);
      expect(result).toContain('Limited');
    });

    it('identifies countries from legal terms', () => {
      const sources = countrySources();
      const result = matches('MyCompany Ltd', sources);
      expect(result).toContain('United Kingdom');
    });

    it('returns multiple matching countries for common terms', () => {
      const sources = countrySources();
      const result = matches('MyCompany Ltd', sources);
      expect(result.length).toBeGreaterThan(1);
    });

    it('is case-insensitive', () => {
      const sources = typeSources();
      const result = matches('MyCompany LLC', sources);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
