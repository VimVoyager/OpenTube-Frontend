import { extractVideoIdFromUrl } from '$lib/utils/streamSelection';
import type { SearchResult, SearchItem } from '$lib/types';
import type { SearchResultConfig } from './types';

/**
 * Adapts a single search item to search result configuration
 */
function adaptSearchItem(
	item: SearchItem,
	defaultThumbnail: string,
	defaultAvatar: string
): SearchResultConfig {
	return {
		id: extractVideoIdFromUrl(item.url) || '',
		url: item.url || '',
		title: item.name || 'Untitled Video',
		thumbnail: item.thumbnailUrl || defaultThumbnail,
		channelName: item.uploaderName || 'Unknown Channel',
		channelUrl: item.uploaderUrl || '',
		channelAvatar: item.uploaderAvatarUrl || defaultAvatar,
		verified: item.uploaderVerified ?? false,
		viewCount: handleNegativeCount(item.viewCount) || 0,
		duration: handleNegativeCount(item.duration) || 0,
		uploadDate: item.uploadDate || '',
		type: item.type || 'stream',
	};
}

/**
 * Adapts an array of search items into search result configurations
 * Filters out invalid items (missing required fields) and transforms remaining items
 */
export function adaptSearchResults(
	searchResult: SearchResult | undefined,
	defaultThumbnail: string,
	defaultAvatar: string
): SearchResultConfig[] {
	if (!searchResult?.items || searchResult.items.length === 0) {
		return [];
	}

	return searchResult.items
		.filter((item) => item && item.url && item.name) // Filter out invalid items
		.map((item) => adaptSearchItem(item, defaultThumbnail, defaultAvatar));
}

/**
 * Handles negative counts from the API (e.g., -1 for unknown values)
 * Returns 0 for negative values, otherwise returns the original count
 */
function handleNegativeCount(count: number | undefined): number {
	if (count === undefined || count < 0) {
		return 0;
	}
	return count;
}