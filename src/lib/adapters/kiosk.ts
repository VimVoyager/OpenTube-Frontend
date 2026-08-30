import type { KioskResponseItem } from '$lib/api/types';
import { extractIdFromUrl } from '$lib/utils/streamSelection';
import { selectBestImage } from '$lib/utils/mediaUtils';
import type { KioskVideoConfig } from '$lib/adapters/types';

/**
 * Adapts a single kiosk item ot kiosk video config
 */
function adaptKioskVideo(item: KioskResponseItem, defaultThumbnail: string): KioskVideoConfig {
	return {
		id: extractIdFromUrl(item.url),
		url: item.url || '',
		title: item.name || 'Untitled Video',
		thumbnail: selectBestImage(item.thumbnails, defaultThumbnail),
		channelName: item.uploaderName || 'Unknown Channel',
		viewCount: handleNegativeCount(item.viewCount) || 0,
		duration: handleNegativeCount(item.duration) || 0,
		uploadDate: item.textualUploadDate || ''
	};
}

/**
 * Adapts an array of kiosk items into related video configurations
 */
export function adaptKioskVideos(
	items: KioskResponseItem[] | undefined,
	defaultThumbnail: string
): KioskVideoConfig[] {
	if (!items || items.length === 0) {
		return [];
	}

	return items
		.filter((item: KioskResponseItem): string => item && item.url && item.name)
		.map((item: KioskResponseItem): KioskVideoConfig => adaptKioskVideo(item, defaultThumbnail));
}

function handleNegativeCount(count: number): number {
	return count < 0 ? 0 : count;
}
