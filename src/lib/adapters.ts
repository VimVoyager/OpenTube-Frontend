/**
 * Data adapters
 * 
 * Transform raw API responses into clean, component-ready data structures.
 * This layer decouples components from API response formats and provides
 * sensible defaults for missing or malformed data.
 */

import type { Details, Stream } from '$lib/types';

/**
 * Video player configuration derived from selected streams
 */
export interface VideoPlayerConfig {
    videoStream: {
		url: string;
		codec: string;
		mimeType: string;
		width: number;
		height: number;
		bandwidth: number;
		frameRate: number;
		format: string;
		initStart?: number;
		initEnd?: number;
		indexStart?: number;
		indexEnd?: number;
	} | null;
	audioStream: {
		url: string;
		codec: string;
		mimeType: string;
		bandwidth: number;
		sampleRate: number;
		channels: number;
		format: string;
		initStart?: number;
		initEnd?: number;
		indexStart?: number;
		indexEnd?: number;
	} | null;
	duration: number;
	poster: string;
}

/**
 * Video metadata adapted for display components
 */
export interface VideoMetadata {
	title: string;
	description: string;
	channelName: string;
	channelAvatar: string | null;
	viewCount: number;
	uploadDate: string;
	likeCount: number;
	dislikeCount: number;
	subscriberCount: number;
}

/**
 * Adapt video and audio streams into player configuration
 */
export function adaptPlayerConfig(
	videoStream: Stream | undefined,
	audioStream: Stream | undefined,
	duration: number,
	posterUrl: string
): VideoPlayerConfig {
	return {
		videoStream: videoStream ? {
			url: videoStream.url,
			codec: videoStream.codec || 'avc1.42E01E',
			mimeType: 'video/mp4',
			width: videoStream.width || 1920,
			height: videoStream.height || 1080,
			bandwidth: videoStream.bitrate || 1000000,
			frameRate: videoStream.fps || 30,
			format: videoStream.format || 'MPEG_4',
			initStart: videoStream.itagItem?.initStart,
			initEnd: videoStream.itagItem?.initEnd,
			indexStart: videoStream.itagItem?.indexStart,
			indexEnd: videoStream.itagItem?.indexEnd,
		} : null,
		audioStream: audioStream ? {
			url: audioStream.url,
			codec: audioStream.codec || 'mp4a.40.2',
			mimeType: 'audio/mp4',
			bandwidth: audioStream.bitrate || 128000,
			sampleRate: audioStream.itagItem?.sampleRate || 44100,
			channels: audioStream.itagItem?.audioChannels || 2,
			format: audioStream.format || 'M4A',
			initStart: audioStream.itagItem?.initStart,
			initEnd: audioStream.itagItem?.initEnd,
			indexStart: audioStream.itagItem?.indexStart,
			indexEnd: audioStream.itagItem?.indexEnd,
		} : null,
		duration,
		poster: posterUrl
	};
}

/**
 * Adapt video details into metadata for display
 */
export function adaptVideoMetadata(
	details: Details,
	defaultAvatar: string
): VideoMetadata {
	// Select best quality avatar (usually index 2 for medium quality)
	const avatars = details.uploaderAvatars || [];
	const channelAvatar = avatars[2]?.url || avatars[0]?.url || null;

	return {
		title: details.videoTitle || 'Untitled Video',
		description: details.description?.content || 'No description available',
		channelName: details.channelName || 'Unknown Channel',
		channelAvatar,
		viewCount: details.viewCount || 0,
		uploadDate: details.uploadDate || '',
		likeCount: details.likeCount || 0,
		dislikeCount: details.dislikeCount || 0,
		subscriberCount: details.channelSubscriberCount || 0,
	};
}

/**
 * Calculate video duration from stream metadata
 */
export function calculateDuration(
	videoStream: Stream | undefined,
	audioStream: Stream | undefined
): number {
	const durationMs = 
		videoStream?.itagItem?.approxDurationMs ||
		audioStream?.itagItem?.approxDurationMs ||
		0;
	
	return durationMs / 1000;
}