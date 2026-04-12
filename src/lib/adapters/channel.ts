import type { ChannelInfoResponse, ChannelVideoItem, ChannelVideosResponse } from '$lib/types';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/types';
import { extractIdFromUrl } from '$lib/utils/streamSelection';

// ─── Subscriber count formatting ─────────────────────────────────────────────

/**
 * Format a raw subscriber count into a compact display string.
 * e.g. 16_800_000 → "16.8M", 430_000 → "430K", 980 → "980"
 */
export function formatSubscriberCount(count: number): string {
	if (count < 0) return '0';
	if (count >= 1_000_000) {
		const val = count / 1_000_000;
		return `${parseFloat(val.toFixed(1))}M`;
	}
	if (count >= 1_000) {
		const val = count / 1_000;
		return `${parseFloat(val.toFixed(1))}K`;
	}
	return count.toString();
}

// ─── Image selection helpers ──────────────────────────────────────────────────

/**
 * Pick the best banner from the banners array — prefer the widest one,
 * falling back to the raw bannerUrl string on the response.
 */
function selectBestBanner(
	banners: { url: string; width: number }[] | undefined,
	fallback: string | null
): string | null {
	if (!banners || banners.length === 0) return fallback;
	return [...banners].sort((a, b) => b.width - a.width)[0].url;
}

/**
 * Pick the best avatar from the avatars array — prefer the largest one,
 * falling back to the raw avatarUrl string on the response.
 */
function selectBestAvatar(
	avatars: { url: string; height: number }[] | undefined,
	fallback: string | null
): string | null {
	if (!avatars || avatars.length === 0) return fallback;
	return [...avatars].sort((a: {url: string, height: number}, b: {url: string, height: number}) => b.height - a.height)[0].url;
}

// ─── Channel info adapter ─────────────────────────────────────────────────────

/**
 * Adapt raw channel info from the API into a display-ready ChannelConfig.
 */
export function adaptChannelInfo(info: ChannelInfoResponse, videoCount: number = 0): ChannelConfig {
	return {
		id: info.id,
		name: info.name || 'Unknown Channel',
		handle: info.handle ? `@${info.handle.replace(/^@/, '')}` : `@${info.id}`,
		avatarUrl: selectBestAvatar(info.avatars, info.avatarUrl),
		bannerUrl: selectBestBanner(info.banners, info.bannerUrl),
		description: info.description || null,
		subscriberCount: formatSubscriberCount(info.subscriberCount ?? 0),
		videoCount,
		verified: info.verified ?? false
	};
}

// ─── Channel videos adapter ───────────────────────────────────────────────────

/**
 * Adapt a single raw ChannelVideoItem into a ChannelVideoConfig.
 */
function adaptChannelVideo(
	video: ChannelVideoItem,
	thumbnailFallback: string,
	avatarFallback: string
): ChannelVideoConfig {
	return {
		id: extractIdFromUrl(video.url),
		title: video.name || 'Untitled',
		thumbnail: video.thumbnails?.[video.thumbnails.length - 1]?.url ?? thumbnailFallback,
		uploaderName: video.uploaderName || 'Unknown',
		uploaderUrl: video.uploaderUrl || avatarFallback,
		uploadedDate: video.textualUploadDate || '',
		duration: Math.max(0, video.duration ?? 0),
		viewCount: Math.max(0, video.viewCount ?? 0),
		isShort: video.isShortFormContent
	};
}

/**
 * Adapt a full ChannelVideosResponse into an array of ChannelVideoConfig.
 */
export function adaptChannelVideos(
	response: ChannelVideosResponse | null,
	thumbnailFallback: string,
	avatarFallback: string
): ChannelVideoConfig[] {
	if (!response?.items) return [];
	return response.items.map((v: ChannelVideoItem) =>
		adaptChannelVideo(v, thumbnailFallback, avatarFallback)
	);
}
