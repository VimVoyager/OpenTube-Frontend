import { extractIdFromUrl } from '$lib/utils/streamSelection';
import { selectBestImage } from '$lib/utils/mediaUtils';

import type { RelatedItemApiResponse } from '$lib/api/related';

/**
 * Related video configuration for listings display
 */
export interface RelatedVideoConfig {
	id: string;
	url: string;
	title: string;
	thumbnail: string;
	channelName: string;
	channelId: string;
	channelAvatar: string | null;
	viewCount: number;
	uploadDate: string;
	duration: number;
}

/**
 * Adapts a single related item to related video configuration
 */
function adaptRelatedVideo(
	item: RelatedItemApiResponse,
	defaultThumbnail: string,
	defaultAvatar: string
): RelatedVideoConfig {
	return {
		id: extractIdFromUrl(item.url),
		url: item.url || '',
		title: item.name || 'Untitled Video',
		thumbnail: selectBestImage(item.thumbnails, defaultThumbnail),
		channelName: item.uploaderName || 'Unknown Channel',
		channelAvatar: selectBestImage(item.uploaderAvatars, defaultAvatar),
		viewCount: handleNegativeCount(item.viewCount) || 0,
		duration: handleNegativeCount(item.duration) || 0,
		uploadDate: item.textualUploadDate || '',
		channelId: extractIdFromUrl(item.uploaderUrl)
	};
}

/**
 * Adapts an array of related items into related video configurations
 * Filters out invalid items (missing required fields) and transforms remaining items
 */
export function adaptRelatedVideos(
	items: RelatedItemApiResponse[] | undefined,
	defaultThumbnail: string,
	defaultAvatar: string
): RelatedVideoConfig[] {
	if (!items || items.length === 0) {
		return [];
	}

	return items
		.filter((item: RelatedItemApiResponse): string => item && item.url && item.name) // Filter out invalid items
		.map((item: RelatedItemApiResponse): RelatedVideoConfig =>
			adaptRelatedVideo(item, defaultThumbnail, defaultAvatar)
		);
}

function handleNegativeCount(count: number): number {
	return count < 0 ? 0 : count;
}
