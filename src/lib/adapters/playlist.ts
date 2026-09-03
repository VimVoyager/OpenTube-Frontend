import { extractIdFromUrl } from '$lib/utils/streamSelection';
import { selectBestImage } from '$lib/utils/mediaUtils';
import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
import bannerPlaceholder from '$lib/assets/banner-fallback.jpg';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import type { PlaylistInfoConfig, RelatedVideoConfig } from '$lib/adapters/types';
import type { RelatedItemApiResponse } from '$lib/api/related';
import type { PlaylistApiResponse } from '$lib/api/playlist';

export function adaptPlaylistInfo(info: PlaylistApiResponse): PlaylistInfoConfig {
	return {
		id: info.id,
		name: info.name,
		url: info.url,
		uploaderName: info.uploaderName,
		uploaderId: extractIdFromUrl(info.uploaderUrl),
		uploaderAvatarUrl: selectBestImage(info.uploaderAvatars, logoPlaceholder),
		bannerUrl: selectBestImage(info.banners, bannerPlaceholder),
		thumbnailUrl: selectBestImage(info.thumbnails, thumbnailPlaceholder),
		uploaderUrl: info.uploaderUrl,
		description: info.description?.content || null
	};
}

function adaptPlaylistVideo(video: RelatedItemApiResponse): RelatedVideoConfig {
	return {
		id: extractIdFromUrl(video.url),
		url: video.url,
		title: video.name || 'Untitled',
		thumbnail: selectBestImage(video.thumbnails, thumbnailPlaceholder),
		channelName: video.uploaderName || 'Unknown',
		channelId: extractIdFromUrl(video.uploaderUrl),
		channelAvatar: selectBestImage(video.uploaderAvatars, logoPlaceholder),
		duration: Math.max(0, video.duration ?? 0),
		viewCount: Math.max(0, video.viewCount ?? 0),
		uploadDate: video.textualUploadDate
	};
}

export function adaptPlaylistVideos(response: PlaylistApiResponse): RelatedVideoConfig[] {
	if (!response?.relatedItems) return [];
	return response.relatedItems.map(adaptPlaylistVideo);
}
