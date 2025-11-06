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
    videoStream: Array<{
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
	}> | null;
	audioStream: Array<{
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
	}> | null;
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

function extractLanguageFromUrl(url: string): string | null {
    try {
        // Look for lang= or lang%3D in the URL
        const match = url.match(/lang(?:%3D|=)([^&]+)/i);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Get friendly language name from code
 */
function getLanguageName(code: string): string {
	const languageNames: Record<string, string> = {
		'de': 'German',
		'en': 'English',
		'es': 'Spanish',
		'es-419': 'Spanish (Latin America)',
		'es_419': 'Spanish (Latin America)',
		'id': 'Indonesian',
		'pt': 'Portuguese',
		'pt-BR': 'Portuguese (Brazil)',
		'ru': 'Russian',
		'fr': 'French',
		'it': 'Italian',
		'ja': 'Japanese',
		'ko': 'Korean',
		'zh': 'Chinese',
		'zh-CN': 'Chinese (Simplified)',
		'zh-TW': 'Chinese (Traditional)',
		'ar': 'Arabic',
		'hi': 'Hindi',
		'und': 'Unknown'
	};
	
	return languageNames[code] || code.toUpperCase();
}


/**
 * Adapt video and audio streams into player configuration
 */
export function adaptPlayerConfig(
	videoStreams: Stream[] | undefined,
	audioStreams: Stream[] | undefined,
	duration: number,
	posterUrl: string
): VideoPlayerConfig {
	return {
		videoStream: videoStreams && videoStreams.length > 0 
		? videoStreams.map(stream => ({
			url: stream.url,
			codec: stream.codec || 'avc1.42E01E',
			mimeType: 'video/mp4',
			width: stream.width || 1920,
			height: stream.height || 1080,
			bandwidth: stream.bitrate || 1000000,
			frameRate: stream.fps || 30,
			format: stream.format || 'MPEG_4',
			initStart: stream.itagItem?.initStart,
			initEnd: stream.itagItem?.initEnd,
			indexStart: stream.itagItem?.indexStart,
			indexEnd: stream.itagItem?.indexEnd,
		})) : null,
		audioStream: audioStreams && audioStreams.length > 0 
		? audioStreams.map(stream => {
			const language = stream.itagItem?.audioLocale || 
			                 stream.itagItem?.audioTrackId || 
			                 extractLanguageFromUrl(stream.url) || 
			                 'und';
			
			// Try to get friendly name, or map from code
			const languageName = stream.itagItem?.audioTrackName || 
			                     getLanguageName(language);
			
			// Log what we extracted for debugging
			console.log(`Adapter: Stream ${stream.id} -> lang: "${language}", name: "${languageName}"`);
			
			return {
				url: stream.url,
				codec: stream.codec || 'mp4a.40.2',
				mimeType: 'audio/mp4',
				bandwidth: stream.bitrate || 128000,
				sampleRate: stream.itagItem?.sampleRate || 44100,
				channels: stream.itagItem?.audioChannels || 2,
				format: stream.format || 'M4A',
				language: language,
				languageName: languageName,
				initStart: stream.itagItem?.initStart,
				initEnd: stream.itagItem?.initEnd,
				indexStart: stream.itagItem?.indexStart,
				indexEnd: stream.itagItem?.indexEnd,
			};
		}) : null,
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
	const channelAvatar = avatars[2]?.url || avatars[0]?.url || defaultAvatar;

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
	videoStreams: Stream[] | undefined,
	audioStreams: Stream[] | undefined
): number {
	const durationMs = 
		videoStreams?.[0]?.itagItem?.approxDurationMs ||
		audioStreams?.[0]?.itagItem?.approxDurationMs ||
		0;
	
	return durationMs / 1000;
}

