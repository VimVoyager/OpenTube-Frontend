import { extractVideoIdFromUrl } from "$lib/utils/streamSelection";
import type { RelatedItem } from '$lib/types';
import { selectBestThumbnail, selectBestUploaderAvatar } from '$lib/utils/mediaUtils';
import type { RelatedVideoConfig } from './types';


/**
 * Adapts a single related item to related video configuration
 */
function adaptRelatedVideo(item: RelatedItem, defaultThumbnail: string, defaultAvatar: string): RelatedVideoConfig {
	return {
		id: extractVideoIdFromUrl(item.url) || item.id,
		url: item.url || '',
		title: item.name || 'Untitled Video',
		thumbnail: selectBestThumbnail(item.thumbnails, defaultThumbnail),
		channelName: item.uploaderName || 'Unknown Channel',
		channelAvatar: selectBestUploaderAvatar(item.uploaderAvatars, defaultAvatar),
		viewCount: handleNegativeCount(item.viewCount) || 0,
		duration: handleNegativeCount(item.duration) || 0,
		uploadDate: item.textualUploadDate || '',
	};
}
/**
 * Adapts an array of related items into related video configurations
 * Filters out invalid items (missing required fields) and transforms remaining items
 */

export function adaptRelatedVideos(
	items: RelatedItem[] | undefined,
	defaultThumbnail: string,
	defaultAvatar: string
): RelatedVideoConfig[] {
	if (!items || items.length === 0) {
		return [];
	}

	return items
		.filter(item => item && item.url && item.name) // Filter out invalid items
		.map(item => adaptRelatedVideo(item, defaultThumbnail, defaultAvatar));
}

function handleNegativeCount(count: number) {
    return count < 0 ? 0 : count;
}
