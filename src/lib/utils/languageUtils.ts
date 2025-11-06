/**
 * Language Utilities
 * 
 * Centralized utilities for handling language codes, names, and normalization
 * across the application.
 */

/**
 * Mapping of language codes to friendly display names
 */
const LANGUAGE_NAMES: Record<string, string> = {
	'de': 'German',
	'en': 'English',
	'es': 'Spanish',
	'es-419': 'Spanish (Latin America)',
	'es_419': 'Spanish (Latin America)',
	'id': 'Indonesian',
	'pt': 'Portuguese',
	'pt-BR': 'Portuguese (Brazil)',
	'ru': 'Russian',
	'fr': 'French',
	'it': 'Italian',
	'ja': 'Japanese',
	'ko': 'Korean',
	'zh': 'Chinese',
	'zh-CN': 'Chinese (Simplified)',
	'zh-TW': 'Chinese (Traditional)',
	'ar': 'Arabic',
	'hi': 'Hindi',
	'und': 'Unknown',
	'original': 'Original'
} as const;

/**
 * Normalizes a language code to standard format (BCP 47)
 * Converts underscores to hyphens and ensures lowercase primary tag
 * 
 * @example
 * normalizeLanguageCode('es_419') // returns 'es-419'
 * normalizeLanguageCode('EN-US') // returns 'en-US'
 */
export function normalizeLanguageCode(languageCode: string | undefined): string {
	if (!languageCode) return 'und';

	// Replace underscores with hyphens
	const normalized = languageCode.replace(/_/g, '-');

	// Split into parts and lowercase the primary tag
	const parts = normalized.split('-');
	if (parts.length > 0) {
		parts[0] = parts[0].toLowerCase();
	}

	return parts.join('-');
}

/**
 * Gets a friendly display name for a language code
 * 
 * @param languageCode - BCP 47 language code (e.g., 'en', 'es-419')
 * @returns Human-readable language name
 */
export function getLanguageName(languageCode: string): string {
	const normalized = normalizeLanguageCode(languageCode);
	return LANGUAGE_NAMES[normalized] || normalized.toUpperCase();
}

/**
 * Extracts language code from a URL query parameter
 * Looks for 'lang' parameter in URL (supports both encoded and plain formats)
 * 
 * @param url - URL string to extract language from
 * @returns Language code if found, null otherwise
 */
export function extractLanguageFromUrl(url: string): string | null {
	try {
		// Match lang= or lang%3D (URL encoded =)
		const match = url.match(/lang(?:%3D|=)([^&]+)/i);
		return match ? decodeURIComponent(match[1]) : null;
	} catch {
		return null;
	}
}

/**
 * Determines the priority order for sorting languages
 * Original/undefined audio comes first, followed by English, then alphabetically
 * 
 * @param languageCode - Language code to get priority for
 * @returns Numeric priority (lower = higher priority)
 */
export function getLanguagePriority(languageCode: string): number {
	const normalized = normalizeLanguageCode(languageCode);
	
	// Highest priority: original/undefined audio
	if (normalized === 'und' || normalized === 'original') return 0;
	
	// Second priority: English
	if (normalized === 'en') return 1;
	
	// All others sorted alphabetically
	return 2;
}

/**
 * Comparator function for sorting by language preference
 * Use with Array.sort() to order languages by priority
 * 
 * @example
 * audioStreams.sort((a, b) => compareLanguagePriority(a.language, b.language))
 */
export function compareLanguagePriority(langA: string, langB: string): number {
	const priorityA = getLanguagePriority(langA);
	const priorityB = getLanguagePriority(langB);
	
	// If priorities differ, use priority
	if (priorityA !== priorityB) {
		return priorityA - priorityB;
	}
	
	// Same priority level - sort alphabetically
	return normalizeLanguageCode(langA).localeCompare(normalizeLanguageCode(langB));
}