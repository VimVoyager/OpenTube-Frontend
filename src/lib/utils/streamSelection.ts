/**
 * Stream Selection Utilities
 * 
 * Logic for selecting optimal video and audio streams from available options.
 * Handles quality selection, language grouping, and priority-based selection.
 */

import type { ItagItem, Stream } from '$lib/types';
import { compareLanguagePriority } from '$lib/utils/languageUtils';

/**
 * Preferred audio itag priority list
 * Ordered by quality: higher bitrate formats preferred
 */
const PREFERRED_AUDIO_ITAGS = [
	'141', // m4a 256kbps
	'140', // m4a 128kbps
	'251', // webm 160kbps
	'250', // webm 70kbps
	'249', // webm 50kbps
	'139'  // m4a 48kbps
] as const;

/**
 * Standard quality levels in priority order
 */
const QUALITY_LEVELS = [
	'2160p', // 4K
	'1440p', // 2K
	'1080p', // Full HD
	'720p',  // HD
	'480p',  // SD
	'360p',
	'240p',
	'144p'
] as const;

/**
 * Minimum number of video quality levels to include
 */
const MIN_VIDEO_QUALITIES = 3;

/**
 * Extract base itag from format ID (handles variants like "137-1")
 */
function getBaseItag(formatId: string): string {
	const dashIndex = formatId.indexOf('-');
	return dashIndex === -1 ? formatId : formatId.slice(0, dashIndex);
}

/**
 * Pick a stream by itag priority list
 */
function pickStreamByItag<T extends Stream>(
	streams: T[],
	priorityList: readonly string[]
): T | undefined {
	for (const itag of priorityList) {
		const match = streams.find(s => getBaseItag(s.id) === itag);
		if (match) return match;
	}
	return undefined;
}

/**
 * Select video streams across multiple quality levels
 * Aims to provide adaptive streaming with quality options
 */
export function selectVideoStreams(streams: Stream[]): Stream[] {
	const selectedStreams: Stream[] = [];

	// First pass: Try to get one stream per quality level
	for (const quality of QUALITY_LEVELS) {
		const match = streams.find(s =>
			s.videoOnly &&
			s.resolution === quality &&
			!selectedStreams.some(existing => existing.resolution === quality)
		);
		if (match) {
			selectedStreams.push(match);
		}
	}

	// Second pass: If we don't have enough qualities, add more by itag preference
	if (selectedStreams.length < MIN_VIDEO_QUALITIES) {
		for (const itag of PREFERRED_AUDIO_ITAGS) {
			if (selectedStreams.length >= MIN_VIDEO_QUALITIES) break;

			const match = streams.find(s =>
				getBaseItag(s.id) === itag &&
				s.videoOnly &&
				!selectedStreams.some(existing => existing.id === s.id)
			);
			if (match) {
				selectedStreams.push(match);
			}
		}
	}

	return selectedStreams.filter(s => s.videoOnly);
}

/**
 * Groups audio streams by language
 */
function groupAudioStreamsByLanguage(streams: Stream[]): Map<string, Stream[]> {
	const languageMap = new Map<string, Stream[]>();

	for (const stream of streams) {
		// Skip video-only streams
		if (stream.videoOnly) continue;

		// Determine language (prefer audioLocale, fallback to trackId, then 'und')
		const language = stream.itagItem?.audioLocale ||
			stream.itagItem?.audioTrackId ||
			'und';

		if (!languageMap.has(language)) {
			languageMap.set(language, []);
		}
		languageMap.get(language)!.push(stream);
	}

	return languageMap;
}

/**
 * Select the best stream from a group of same-language streams
 */
function selectBestStreamForLanguage(streams: Stream[]): Stream | undefined {
	// First, try preferred itag
	const preferredStream = pickStreamByItag(streams, PREFERRED_AUDIO_ITAGS);
	if (preferredStream) return preferredStream;

	// Fallback: Best M4A/AAC stream by bitrate
	const m4aStreams = streams.filter(s =>
		(s.format === 'M4A' || s.format === 'MP4A') &&
		(s.codec?.toLowerCase().includes('mp4a') || s.codec?.toLowerCase().includes('aac'))
	);

	if (m4aStreams.length > 0) {
		return m4aStreams.reduce((best, current) =>
			(current.bitrate ?? 0) > (best.bitrate ?? 0) ? current : best
		);
	}

	// Final fallback: Highest bitrate stream
	return streams.reduce((best, current) =>
		(current.bitrate ?? 0) > (best.bitrate ?? 0) ? current : best
	);
}

/**
 * Select best audio streams - one per available language
 * Returns array of audio streams with different languages, sorted by preference
 */
export function selectBestAudioStreams(streams: Stream[]): Stream[] {
	const languageMap = groupAudioStreamsByLanguage(streams);
	const selectedStreams: Stream[] = [];

	// For each language, select the best stream
	for (const [, langStreams] of languageMap.entries()) {
		const bestStream = selectBestStreamForLanguage(langStreams);
		if (bestStream) {
			selectedStreams.push(bestStream);
		}
	}

	// Sort by language preference (original/primary first, then alphabetically)
	selectedStreams.sort((a, b) => {
		const langA = a.itagItem?.audioLocale || a.itagItem?.audioTrackId || 'und';
		const langB = b.itagItem?.audioLocale || b.itagItem?.audioTrackId || 'und';
		return compareLanguagePriority(langA, langB);
	});

	return selectedStreams;
}

/**
 * Log selected streams for debugging purposes
 */
export function logSelectedStreams(
	videoStreams: Stream[],
	audioStreams: Stream[]
): void {
	if (videoStreams.length === 0) {
		console.warn('No suitable video streams found');
	} else {
		console.log(`Selected ${videoStreams.length} video streams:`);
		videoStreams.forEach((stream, index) => {
			console.log(
				`  ${index + 1}. ${stream.resolution} - ${stream.codec} - ${stream.bitrate} bps`
			);
		});
	}

	if (audioStreams.length === 0) {
		console.warn('No suitable audio streams found');
	} else {
		console.log(`Selected ${audioStreams.length} audio streams:`);
		audioStreams.forEach((stream, index) => {
			const language = stream.itagItem?.audioLocale ||
				stream.itagItem?.audioTrackId ||
				'und';
			const languageName = stream.itagItem?.audioTrackName || 'Unknown';
			console.log(
				`  ${index + 1}. ${languageName} (${language}) - ${stream.codec} - ${stream.bitrate} bps`
			);
		});
	}
}
/**
 * Calculate video duration from stream metadata
 */

export function calculateDuration(
	videoStreams: Stream[] | undefined,
	audioStreams: Stream[] | undefined
): number {
	const durationMs = videoStreams?.[0]?.itagItem?.approxDurationMs ||
		audioStreams?.[0]?.itagItem?.approxDurationMs ||
		0;

	return durationMs / 1000;
}/**
 * Extracts byte range information from itagItem
 */
export function extractByteRanges(itagItem: ItagItem | undefined): {
	initStart?: number;
	initEnd?: number;
	indexStart?: number;
	indexEnd?: number;
} {
	if (!itagItem) return {};

	return {
		initStart: itagItem.initStart,
		initEnd: itagItem.initEnd,
		indexStart: itagItem.indexStart,
		indexEnd: itagItem.indexEnd
	};
}

/**
 * Extracts video ID from YouTube URL
 * Handles variou YouTube URL formats
 */
export function extractVideoIdFromUrl(url: string): string {
	try {
		const urlObj = new URL(url);

		if (urlObj.hostname.includes('v')) {
			return urlObj.searchParams.get('v') || '';
		}

		const pathParts = urlObj.pathname.split('/').filter(Boolean);
		return pathParts[pathParts.length - 1] || '';
	} catch {
		return '';
	}
}

