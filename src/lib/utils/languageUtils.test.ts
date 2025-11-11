/**
 * Test Suite: languageUtils.ts
 * 
 * Tests for language code handling, normalization, and display utilities
 */

import { describe, it, expect } from 'vitest';
import { 
    normalizeLanguageCode, 
    getLanguageName, 
    extractLanguageFromUrl, 
    getLanguagePriority, 
    compareLanguagePriority 
} from './languageUtils';

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

// =============================================================================
// getLanguagePriority() Tests
// =============================================================================
describe('getLanguagePriority', () => {
    describe('priority levels', () => {
        it('should give highest priority (0) to "und"', () => {
            expect(getLanguagePriority('und')).toBe(0);
        });

        it('should give highest priority (0) to "original"', () => {
            expect(getLanguagePriority('original')).toBe(0);
        });

        it('should give second priority (1) to English', () => {
            expect(getLanguagePriority('en')).toBe(1);
        });

        it('should give lowest priority (2) to other languages', () => {
            expect(getLanguagePriority('es')).toBe(2);
            expect(getLanguagePriority('fr')).toBe(2);
            expect(getLanguagePriority('de')).toBe(2);
            expect(getLanguagePriority('ja')).toBe(2);
        });
    });

    describe('normalization', () => {
        it('should normalize before checking priority', () => {
            expect(getLanguagePriority('EN')).toBe(1);
            expect(getLanguagePriority('UND')).toBe(0);
        });

        it('should handle underscore format', () => {
            expect(getLanguagePriority('es_419')).toBe(2);
        });
    });

    describe('region variants', () => {
        it('should not give English variants special priority', () => {
            expect(getLanguagePriority('en-US')).toBe(2);
            expect(getLanguagePriority('en-GB')).toBe(2);
        });

        it('should treat all regional variants equally', () => {
            expect(getLanguagePriority('es-419')).toBe(2);
            expect(getLanguagePriority('pt-BR')).toBe(2);
            expect(getLanguagePriority('zh-CN')).toBe(2);
        });
    });
});

// =============================================================================
// compareLanguagePriority() Tests
// =============================================================================
describe('compareLanguagePriority', () => {
    describe('priority-based sorting', () => {
        it('should sort "und" before English', () => {
            expect(compareLanguagePriority('und', 'en')).toBeLessThan(0);
            expect(compareLanguagePriority('en', 'und')).toBeGreaterThan(0);
        });

        it('should sort "original" before English', () => {
            expect(compareLanguagePriority('original', 'en')).toBeLessThan(0);
            expect(compareLanguagePriority('en', 'original')).toBeGreaterThan(0);
        });

        it('should sort English before other languages', () => {
            expect(compareLanguagePriority('en', 'es')).toBeLessThan(0);
            expect(compareLanguagePriority('en', 'fr')).toBeLessThan(0);
            expect(compareLanguagePriority('en', 'ja')).toBeLessThan(0);
        });

        it('should sort other languages after English', () => {
            expect(compareLanguagePriority('es', 'en')).toBeGreaterThan(0);
            expect(compareLanguagePriority('fr', 'en')).toBeGreaterThan(0);
        });
    });

    describe('alphabetical sorting within same priority', () => {
        it('should sort non-priority languages alphabetically', () => {
            expect(compareLanguagePriority('es', 'fr')).toBeLessThan(0); // es < fr
            expect(compareLanguagePriority('fr', 'es')).toBeGreaterThan(0); // fr > es
        });

        it('should sort Chinese before Japanese', () => {
            expect(compareLanguagePriority('zh', 'ja')).toBeGreaterThan(0); // zh > ja alphabetically
        });

        it('should sort German before Spanish', () => {
            expect(compareLanguagePriority('de', 'es')).toBeLessThan(0); // de < es
        });
    });

    describe('equal comparison', () => {
        it('should return 0 for identical languages', () => {
            expect(compareLanguagePriority('en', 'en')).toBe(0);
            expect(compareLanguagePriority('es', 'es')).toBe(0);
            expect(compareLanguagePriority('und', 'und')).toBe(0);
        });

        it('should return 0 for equivalent normalized codes', () => {
            expect(compareLanguagePriority('es-419', 'es_419')).toBe(0);
        });
    });

    describe('use with Array.sort()', () => {
        it('should correctly sort array of languages', () => {
            const languages = ['fr', 'en', 'es', 'und', 'de'];
            const sorted = languages.sort(compareLanguagePriority);

            expect(sorted).toEqual(['und', 'en', 'de', 'es', 'fr']);
        });

        it('should sort with "original" first', () => {
            const languages = ['es', 'original', 'en', 'fr'];
            const sorted = languages.sort(compareLanguagePriority);

            expect(sorted[0]).toBe('original');
            expect(sorted[1]).toBe('en');
        });

        it('should handle mixed case in sorting', () => {
            const languages = ['ES', 'en', 'FR', 'UND'];
            const sorted = languages.sort(compareLanguagePriority);

            expect(sorted[0]).toBe('UND');
            expect(sorted[1]).toBe('en');
        });

        it('should sort regional variants alphabetically', () => {
            const languages = ['es-419', 'pt-BR', 'en', 'zh-CN'];
            const sorted = languages.sort(compareLanguagePriority);

            expect(sorted[0]).toBe('en');
            // The rest should be alphabetically ordered
            expect(sorted.slice(1).every((lang, i, arr) =>
                i === 0 || lang >= arr[i - 1]
            )).toBe(true);
        });
    });

    describe('normalization in comparison', () => {
        it('should normalize before comparing', () => {
            expect(compareLanguagePriority('EN', 'es')).toBeLessThan(0);
            expect(compareLanguagePriority('ES_419', 'FR')).toBeLessThan(0);
        });

        it('should handle underscore vs hyphen equivalence', () => {
            expect(compareLanguagePriority('es_419', 'es-419')).toBe(0);
            expect(compareLanguagePriority('pt_BR', 'pt-BR')).toBe(0);
        });
    });
});

// =============================================================================
// Integration Tests
// =============================================================================
describe('Language Utils Integration', () => {
    it('should extract, normalize, and get name for a language from URL', () => {
        const url = 'https://example.com/audio?lang=es_419';

        const extracted = extractLanguageFromUrl(url);
        expect(extracted).toBe('es_419');

        const normalized = normalizeLanguageCode(extracted!);
        expect(normalized).toBe('es-419');

        const name = getLanguageName(extracted!);
        expect(name).toBe('Spanish (Latin America)');
    });

    it('should correctly sort and label audio streams', () => {
        const audioStreams = [
            { language: 'es', label: '' },
            { language: 'en', label: '' },
            { language: 'fr', label: '' },
            { language: 'und', label: '' }
        ];

        // Sort by priority
        audioStreams.sort((a, b) => compareLanguagePriority(a.language, b.language));

        // Add labels
        audioStreams.forEach(stream => {
            stream.label = getLanguageName(stream.language);
        });

        expect(audioStreams[0].language).toBe('und');
        expect(audioStreams[0].label).toBe('Unknown');

        expect(audioStreams[1].language).toBe('en');
        expect(audioStreams[1].label).toBe('English');

        expect(audioStreams[2].label).toBe('Spanish');
        expect(audioStreams[3].label).toBe('French');
    });

    it('should handle complete workflow with URL extraction and sorting', () => {
        const urls = [
            'https://example.com?lang=fr',
            'https://example.com?lang=en',
            'https://example.com?lang=es_419',
            'https://example.com?lang=und'
        ];

        const languages = urls
            .map(url => extractLanguageFromUrl(url))
            .filter(lang => lang !== null) as string[];

        const sorted = languages.sort(compareLanguagePriority);
        const withNames = sorted.map(lang => ({
            code: normalizeLanguageCode(lang),
            name: getLanguageName(lang)
        }));

        expect(withNames).toEqual([
            { code: 'und', name: 'Unknown' },
            { code: 'en', name: 'English' },
            { code: 'es-419', name: 'Spanish (Latin America)' },
            { code: 'fr', name: 'French' }
        ]);
    });
});
