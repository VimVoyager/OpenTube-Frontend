import { extractIdFromUrl } from '$lib/utils/streamSelection';
import type {
	VideoSearchResultConfig,
	ChannelSearchResultConfig,
	PlaylistSearchResultConfig
} from './types';
import type { NextPage } from '$lib/api/types';
import type { SearchApiResponse, SearchApiResponseData } from '$lib/api/search';

type SearchResultConfig =
	VideoSearchResultConfig | ChannelSearchResultConfig | PlaylistSearchResultConfig;

export interface SearchResultsPage {
	items: SearchResultConfig[];
	nextPage: NextPage | null;
	hasNextPage: boolean | undefined;
}

/**
 * Handles negative counts from the API (e.g., -1 for unknown values)
 */
function handleNegativeCount(count: number | undefined): number {
	if (count === undefined || count < 0) return 0;
	return count;
}

function adaptVideoItem(
	item: SearchApiResponseData,
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

function adaptChannelItem(
	item: SearchApiResponseData,
	defaultAvatar: string
): ChannelSearchResultConfig {
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

function adaptPlaylistItem(
	item: SearchApiResponseData,
	defaultThumbnail: string
): PlaylistSearchResultConfig {
	return {
		type: 'playlist',
		id: extractIdFromUrl(item.url),
		url: item.url || '',
		title: item.name || 'Untitled Playlist',
		thumbnail: item.thumbnailUrl || defaultThumbnail,
		uploaderName: item.uploaderName || 'Unknown',
		uploaderUrl: item.uploaderUrl || '',
		videoCount: handleNegativeCount(item.videoCount)
	};
}

type SearchResultsSource = Pick<SearchApiResponse, 'items' | 'hasNextPage' | 'nextPage'>;

function adaptNextPage(searchResult: SearchResultsSource | undefined): NextPage | null {
	if (!searchResult?.hasNextPage || !searchResult.nextPage) return null;
	return {
		url: searchResult.nextPage.url,
		id: searchResult.nextPage.id
	};
}

export function adaptSearchResults(
	searchResult: SearchResultsSource | undefined,
	defaultThumbnail: string,
	defaultAvatar: string
): {
	items: SearchResultConfig[];
	nextPage: NextPage | null;
	hasNextPage: boolean | undefined;
} {
	const items: SearchResultConfig[] =
		!searchResult?.items || searchResult.items.length === 0
			? []
			: searchResult.items
					.filter((item: SearchApiResponseData): string => item && item.url && item.name)
					.map((item: SearchApiResponseData): SearchResultConfig => {
						if (item.type === 'channel') return adaptChannelItem(item, defaultAvatar);
						if (item.type === 'playlist') return adaptPlaylistItem(item, defaultThumbnail);
						return adaptVideoItem(item, defaultThumbnail, defaultAvatar);
					});

	return {
		items,
		nextPage: adaptNextPage(searchResult),
		hasNextPage: searchResult?.hasNextPage
	};
}
