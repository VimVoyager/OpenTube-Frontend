import type { PlaylistResponse, RelatedItemResponse } from '$lib/api/types';
import { extractIdFromUrl } from '$lib/utils/streamSelection';
import { selectBestThumbnail, selectBestUploaderAvatar } from '$lib/utils/mediaUtils';
import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import type { PlaylistInfoConfig, RelatedVideoConfig } from '$lib/adapters/types';
import type { RelatedItem } from '$lib/types';

function selectBestBanner(
	banners: { url: string; width: number }[] | undefined,
	fallback: string | null
): string | null {
	if (!banners || banners.length === 0) return fallback;
	return [...banners].sort((a: { url: string; width: number }, b: { url: string; width: number }): number => b.width - a.width)[0]
		.url;
}

export function adaptPlaylistInfo(info: PlaylistResponse): PlaylistInfoConfig {
	return {
		id: info.id,
		name: info.name,
		url: info.url,
		uploaderName: info.uploaderName,
		uploaderId: extractIdFromUrl(info.uploaderUrl),
		uploaderAvatarUrl: selectBestUploaderAvatar(info.uploaderAvatars, logoPlaceholder),
		bannerUrl: selectBestBanner(info.banners, null),
		thumbnailUrl: selectBestThumbnail(info.thumbnails, thumbnailPlaceholder),
		uploaderUrl: info.uploaderUrl,
		description: info.description || null
	};
}

function adaptPlaylistVideo(video: RelatedItemResponse): RelatedVideoConfig {
	return {
		id: extractIdFromUrl(video.url),
		url: video.url,
		title: video.name || 'Untitled',
		thumbnail: selectBestThumbnail(video.thumbnails, thumbnailPlaceholder),
		channelName: video.uploaderName || 'Unknown',
		channelId: extractIdFromUrl(video.uploaderUrl),
		channelAvatar: selectBestUploaderAvatar(video.uploaderAvatars, logoPlaceholder),
		duration: Math.max(0, video.duration ?? 0),
		viewCount: Math.max(0, video.viewCount ?? 0),
		uploadDate: video.textualUploadDate
	};
}

export function adaptPlaylistVideos(response: PlaylistResponse): RelatedVideoConfig[] {
	if (!response?.relatedItems) return [];
	return response.relatedItems.map((item: RelatedItem): RelatedVideoConfig =>
		adaptPlaylistVideo(item as RelatedItemResponse)
	);
}
