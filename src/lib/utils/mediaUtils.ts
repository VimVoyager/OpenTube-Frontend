import type { RelatedItem, Details } from '$lib/types';


/**
 * Selects the best quality thumbnail from available options
 * Prefers medium quality (index 1), falls back to last available, then first
 */
export function selectBestThumbnail(thumbnails: RelatedItem['thumbnails'], fallback: string): string {
	if (!thumbnails || thumbnails.length === 0) return fallback;

	return thumbnails[1]?.url || thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url || fallback;
}
/**
 * Selects the best quality uploader avatar from available options
 * Uses the same pattern as selectBestAvatar but for uploader avatars
 */
export function selectBestUploaderAvatar(avatars: RelatedItem['uploaderAvatars'], fallback: string): string {
	if (!avatars || avatars.length === 0) return fallback;

	return avatars[avatars.length - 1]?.url || avatars[0]?.url || fallback;
}
/**
 * Selects the best quality avatar from available options
 * Prefers medium quality (index 2), falls back to first available
 */
export function selectBestAvatar(avatars: Details['uploaderAvatars'], fallback: string): string {
	if (!avatars || avatars.length === 0) return fallback;

	return avatars[2]?.url || avatars[0]?.url || fallback;
}
