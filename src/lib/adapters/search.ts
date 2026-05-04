import { extractIdFromUrl } from '$lib/utils/streamSelection';
import type { SearchResult, SearchItem } from '$lib/types';
import type { VideoSearchResultConfig, ChannelSearchResultConfig } from './types';

type SearchResultConfig = VideoSearchResultConfig | ChannelSearchResultConfig;

/**
 * Handles negative counts from the API (e.g., -1 for unknown values)
 */
function handleNegativeCount(count: number | undefined): number {
	if (count === undefined || count < 0) return 0;
	return count;
}

function adaptVideoItem(
	item: SearchItem,
	defaultThumbnail: string,
	defaultAvatar: string
): VideoSearchResultConfig {
	return {
		type: (item.type as VideoSearchResultConfig['type']) || 'stream',
		description: item.description || '',
		id: extractIdFromUrl(item.url) || '',
		url: item.url || '',
		title: item.name || 'Untitled Video',
		thumbnail: item.thumbnailUrl || defaultThumbnail,
		channelName: item.uploaderName || 'Unknown Channel',
		channelUrl: item.uploaderUrl || '',
		channelAvatar: item.uploaderAvatarUrl || defaultAvatar,
		verified: item.uploaderVerified ?? false,
		viewCount: handleNegativeCount(item.viewCount),
		duration: handleNegativeCount(item.duration),
		uploadDate: item.uploadDate || ''
	};
}

function adaptChannelItem(item: SearchItem, defaultAvatar: string): ChannelSearchResultConfig {
	return {
		type: 'channel',
		id: extractIdFromUrl(item.url),
		name: item.name || 'Unknown Channel',
		avatar: item.thumbnailUrl || defaultAvatar,
		description: item.description || null,
		subscriberCount: handleNegativeCount(item.subscriberCount),
		verified: item.uploaderVerified ?? false
	};
}

export function adaptSearchResults(
	searchResult: SearchResult | undefined,
	defaultThumbnail: string,
	defaultAvatar: string
): SearchResultConfig[] {
	if (!searchResult?.items || searchResult.items.length === 0) return [];

	return searchResult.items
		.filter((item: SearchItem): string => item && item.url && item.name)
		.map((item: SearchItem):VideoSearchResultConfig | ChannelSearchResultConfig => {
			if (item.type === 'channel') {
				return adaptChannelItem(item, defaultAvatar);
			}
			return adaptVideoItem(item, defaultThumbnail, defaultAvatar);
		});
}
