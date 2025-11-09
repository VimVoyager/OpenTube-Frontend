/**
 * Test Suite: languageUtils.ts
 * 
 * Tests for language code handling, normalization, and display utilities
 */

import { describe, it, expect } from 'vitest';
import { normalizeLanguageCode, getLanguageName, extractLanguageFromUrl } from './languageUtils';

// =============================================================================
// normalizeLanguageCode() Tests
// =============================================================================
describe('normalizeLanguageCode', () => {
    describe('valid language codes', () => {
        it('should parse simple two-letter codes unchanged', () => {
            expect(normalizeLanguageCode('en')).toBe('en');
            expect(normalizeLanguageCode('es')).toBe('es');
            expect(normalizeLanguageCode('fr')).toBe('fr');
        });

        it('should lowercase primary language tag', () => {
            expect(normalizeLanguageCode('EN')).toBe('en');
            expect(normalizeLanguageCode('ES')).toBe('es');
            expect(normalizeLanguageCode('FR')).toBe('fr');
        });

        it('should covert underscores to hyphens', () => {
            expect(normalizeLanguageCode('es_419')).toBe('es-419');
            expect(normalizeLanguageCode('pt_BR')).toBe('pt-BR');
            expect(normalizeLanguageCode('zh_CN')).toBe('zh-CN');
        });

        it('should preserve region/script to capitalization', () => {
            expect(normalizeLanguageCode('en-US')).toBe('en-US');
            expect(normalizeLanguageCode('zh-Hans')).toBe('zh-Hans');
            expect(normalizeLanguageCode('pt-BR')).toBe('pt-BR');
        });

        it('should handle mixed case and underscores', () => {
            expect(normalizeLanguageCode('EN_US')).toBe('en-US');
            expect(normalizeLanguageCode('ES_419')).toBe('es-419');
            expect(normalizeLanguageCode('PT_br')).toBe('pt-br');
        });

        it('should handle already normalized codes', () => {
            expect(normalizeLanguageCode('es-419')).toBe('es-419');
            expect(normalizeLanguageCode('en-US')).toBe('en-US');
        });
    });

    describe('edge cases', () => {
        it('should return "und" for empty string', () => {
            expect(normalizeLanguageCode('')).toBe('und');
        });

        it('should return "und" for undefined', () => {
            expect(normalizeLanguageCode(undefined)).toBe('und');
        });

        it('should handle whitespace', () => {
            expect(normalizeLanguageCode('  en  ')).toBe('  en  ');
        });

        it('should handle single character codes', () => {
            expect(normalizeLanguageCode('e')).toBe('e');
        });

        it('should handle multiple underscores', () => {
            expect(normalizeLanguageCode('en_US_variant')).toBe('en-US-variant');
        });

        it('should handle multiple hyphens', () => {
            expect(normalizeLanguageCode('zh-Hans-CN')).toBe('zh-Hans-CN');
        });
    });

    describe('special values', () => {
        it('should handle "und" (undefined language)', () => {
            expect(normalizeLanguageCode('und')).toBe('und');
        });

        it('should handle "original"', () => {
            expect(normalizeLanguageCode('original')).toBe('original');
        }); 
    });
});

// =============================================================================
// getLanguageName() Tests
// =============================================================================
describe('getLanguageName', () => {
    describe('known language codes', () => {
        it('should return friendly names for common languages', () => {
            expect(getLanguageName('en')).toBe('English');
            expect(getLanguageName('es')).toBe('Spanish');
            expect(getLanguageName('fr')).toBe('French');
            expect(getLanguageName('de')).toBe('German');
            expect(getLanguageName('ja')).toBe('Japanese');
            expect(getLanguageName('zh')).toBe('Chinese');
        });

        it('should handle region-specific variants', () => {
            expect(getLanguageName('es-419')).toBe('Spanish (Latin America)');
            expect(getLanguageName('pt-BR')).toBe('Portuguese (Brazil)');
            expect(getLanguageName('zh-CN')).toBe('Chinese (Simplified)');
            expect(getLanguageName('zh-TW')).toBe('Chinese (Traditional)');
        });

        it('should handle underscore format', () => {
            expect(getLanguageName('es_419')).toBe('Spanish (Latin America)');
            expect(getLanguageName('pt_BR')).toBe('Portuguese (Brazil)');
        });

        it('should handle special language codes', () => {
            expect(getLanguageName('und')).toBe('Unknown');
            expect(getLanguageName('original')).toBe('Original');
        });
    });

    describe('unknown language codes', () => {
		it('should return uppercase code for unknown languages', () => {
			expect(getLanguageName('xyz')).toBe('XYZ');
			expect(getLanguageName('abc-123')).toBe('ABC-123');
		});

		it('should handle unknown region variants', () => {
			expect(getLanguageName('en-GB')).toBe('EN-GB');
			expect(getLanguageName('es-ES')).toBe('ES-ES');
		});
	});

    describe('case handling', () => {
		it('should normalize case before lookup', () => {
			expect(getLanguageName('EN')).toBe('English');
			expect(getLanguageName('ES')).toBe('Spanish');
			expect(getLanguageName('FR')).toBe('French');
		});

		it('should handle mixed case input', () => {
			expect(getLanguageName('En')).toBe('English');
			expect(getLanguageName('ES_419')).toBe('Spanish (Latin America)');
		});
	});

    describe('edge cases', () => {
		it('should handle empty string', () => {
			expect(getLanguageName('')).toBe('Unknown');
		});

        it('should handle undefined by normalizing to "und"', () => {
            expect(getLanguageName(undefined as unknown as string)).toBe('Unknown');
        });
    });
});

// =============================================================================
// extractLanguageFromUrl() Tests
// =============================================================================
describe('extractLanguageFromUrl', () => {
    describe('successful extraction', () => {
		it('should extract language from simple query parameter', () => {
			const url = 'https://example.com/audio?lang=en';
			expect(extractLanguageFromUrl(url)).toBe('en');
		});

		it('should extract language from URL-encoded parameter', () => {
			const url = 'https://example.com/audio?lang%3Den';
			expect(extractLanguageFromUrl(url)).toBe('en');
		});

		it('should extract language with region code', () => {
			const url = 'https://example.com/audio?lang=es-419';
			expect(extractLanguageFromUrl(url)).toBe('es-419');
		});

		it('should extract language from URL with multiple parameters', () => {
			const url = 'https://example.com/audio?quality=high&lang=fr&format=mp4';
			expect(extractLanguageFromUrl(url)).toBe('fr');
		});

		it('should decode URL-encoded language codes', () => {
			const url = 'https://example.com/audio?lang=es%2D419';
			expect(extractLanguageFromUrl(url)).toBe('es-419');
		});

		it('should handle case-insensitive parameter name', () => {
			expect(extractLanguageFromUrl('https://example.com?LANG=en')).toBe('en');
			expect(extractLanguageFromUrl('https://example.com?Lang=en')).toBe('en');
		});
	});

    describe('missing or invalid parameters', () => {
		it('should return null when lang parameter is missing', () => {
			const url = 'https://example.com/audio?quality=high';
			expect(extractLanguageFromUrl(url)).toBeNull();
		});

		it('should return null for empty URL', () => {
			expect(extractLanguageFromUrl('')).toBeNull();
		});

		it('should return null for URL without query parameters', () => {
			const url = 'https://example.com/audio';
			expect(extractLanguageFromUrl(url)).toBeNull();
		});

		it('should handle malformed URLs gracefully', () => {
			expect(extractLanguageFromUrl('not-a-url')).toBeNull();
			expect(extractLanguageFromUrl('%%invalid%%')).toBeNull();
		});
    });

    describe('edge cases', () => {
		it('should extract from URLs with anchor fragments', () => {
			const url = 'https://example.com/audio?lang=en#section';
			expect(extractLanguageFromUrl(url)).toBe('en');
		});

		it('should handle empty lang value', () => {
			const url = 'https://example.com/audio?lang=&other=value';
			expect(extractLanguageFromUrl(url)).toBe(null);
		});

		it('should handle lang parameter at end of URL', () => {
			const url = 'https://example.com/audio?format=mp4&lang=ja';
			expect(extractLanguageFromUrl(url)).toBe('ja');
		});

		it('should handle lang parameter at start of URL', () => {
			const url = 'https://example.com/audio?lang=ko&format=mp4';
			expect(extractLanguageFromUrl(url)).toBe('ko');
		});
	});
});
