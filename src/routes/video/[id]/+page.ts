import type { PageLoad } from './$types';
import type { Stream } from '$lib/types';
import { getVideoDetails } from '$lib/api/details';
import { getAllStreams } from '$lib/api/streams';
import {
	adaptPlayerConfig,
	adaptVideoMetadata,
	calculateDuration,
	type VideoPlayerConfig,
	type VideoMetadata
} from '$lib/adapters';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';

/**
 * Page data structure
 */
export interface PageData {
	playerConfig: VideoPlayerConfig;
	metadata: VideoMetadata;
	error?: string;
}

// const PREFERRED_VIDEO_ITAGS = [
// 	'264',	// 1440p MP4 AVC
// 	'137',	// 1080p MP4 AVC
// 	'136',	// 720p MP4 AVC
// 	'135',	// 480p MP4 AVC
// 	'400',	// 1440p MP4 AV1
// 	'399',	// 1080p MP4 AV1
// 	'398',	// 720p MP4 AV1
// 	'397',	// 480p MP4 AV1
// 	'271',	// 1440p webm VP9
// 	'248',	// 1080p webm VP9
// 	'247',	// 720p webm VP9
// 	'246',	// 480p webm VP9
// ] as const;

const PREFERRED_AUDIO_ITAGS = [
	'139',	// m4a 48kbps
	'140',	// m4a 128kbps
	'141',	// m4a 256kbps
	'249',	// webm 50kbps
	'250',	// webm 70kbps
	'251',	// webm 160kbps

] as const;

/**
 * Extract base itag from format ID (handles variants like "137-1")
 */
function getBaseItag(formatId: string): string {
	const dash = formatId.indexOf('-');
	return dash === -1 ? formatId : formatId.slice(0, dash);
};

/**
 * Pick streams by itag priority list
 */
function pickByStreamId<T extends Stream>(
	streams: T[],
	priorityList: readonly string[]
): T | undefined {
	for (const itag of priorityList) {
		const match = streams.find(s => getBaseItag(s.id) === itag);
		if (match) return match;
	}
};

function selectVideoStreams(streams: Stream[]): Stream[] {
	const selectedStreams: Stream[] = [];
	const qualities = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];

	// Try to get one stream per quality level
	for (const quality of qualities) {
		const match = streams.find(s =>
			s.videoOnly &&
			s.resolution === quality &&
			!selectedStreams.some(existing => existing.resolution === quality)
		);
		if (match) selectedStreams.push(match);
	}

	if (selectedStreams.length < 3) {
		for (const itag of PREFERRED_AUDIO_ITAGS) {
			const match = streams.find(s =>
				getBaseItag(s.id) === itag &&
				s.videoOnly &&
				!selectedStreams.some(existing => existing.id === s.id)
			);
			if (match) selectedStreams.push(match);
		}
	}

	return selectedStreams.filter(s => s.videoOnly);
}

/**
 * Group audio streams by language
 */
function groupAudioStreamsByLanguage(streams: Stream[]): Map<string, Stream[]> {
	const languageMap = new Map<string, Stream[]>();

	for (const stream of streams) {
		if (stream.videoOnly) continue;

		const language = stream.itagItem.audioLocale ||
			stream.itagItem.audioTrackId ||
			'und';

		if (!languageMap.has(language)) {
			languageMap.set(language, []);
		}
		languageMap.get(language)!.push(stream);
	}

	return languageMap;
}

/**
 * Select best audio streams - one per available language
 * Return array of audio stream with different languages
 */
function selectBestAudioStreams(streams: Stream[]): Stream[] {
	const languageMap = groupAudioStreamsByLanguage(streams);
	const selectedStreams: Stream[] = [];

	// For each language, select the best stream
	for (const [language, langStreams] of languageMap.entries()) {
		let bestStream: Stream | undefined;

		console.log(`  Processing language: ${language} (${langStreams.length} streams available)`);

		const candidate = pickByStreamId(langStreams, PREFERRED_AUDIO_ITAGS);
		if (candidate) {
			bestStream = candidate;
		} else {
			// Fallback: Best M4A AAC stream by bitrate
			const m4aStreams = langStreams.filter(
				s => (s.format === 'M4A' || s.format === 'MP4A') &&
					(s.codec?.toLowerCase().includes('mp4a') || s.codec?.toLowerCase().includes('aac'))
			);

			if (m4aStreams.length > 0) {
				m4aStreams.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
				bestStream = m4aStreams[0];
			} else {
				const sortedStreams = [...langStreams].toSorted((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
				bestStream = sortedStreams[0];
			}
		}

		if (bestStream) {
			selectedStreams.push(bestStream);
		}
	}

	// Sort by language preference (original/primary first, then alphabetically)
	selectedStreams.sort((a, b) => {
		const langA = a.itagItem?.audioLocale || a.itagItem?.audioTrackId || 'und';
		const langB = b.itagItem?.audioLocale || b.itagItem?.audioTrackId || 'und';

		// Prioritize 'und' or original audio
		if (langA === 'und' || langA === 'original') return -1;
		if (langB === 'und' || langB === 'original') return 1;

		return langA.localeCompare(langB);
	});

	return selectedStreams;
}

/**
 * Page load function - fetches and transforms data
 */
export const load: PageLoad = async ({ params, fetch }): Promise<PageData> => {
	try {
		// Fetch video metadata and streams in parallel
		const [details, { videoStreams, audioStreams }] = await Promise.all([
			getVideoDetails(params.id, fetch),
			getAllStreams(params.id, fetch)
		]);

		console.log('Raw audio:', audioStreams.slice(0, 3).map(s => ({
			id: s.id,
			audioLocale: s.itagItem?.audioLocale,
			audioTrackId: s.itagItem?.audioTrackId,
			audioTrackName: s.itagItem?.audioTrackName
		})));

		// Select best streams
		const selectedVideoStreams = selectVideoStreams(videoStreams);
		const selectedAudioStreams = selectBestAudioStreams(audioStreams);

		// Log selected streams for debugging
		if (!selectedVideoStreams || selectedVideoStreams.length === 0) {
			console.warn('No suitable video stream found');
		} else {
			console.log(`Selected ${selectedVideoStreams.length}`);
			selectedVideoStreams.forEach((stream, index) => {
				console.log(`  ${index + 1}. ${stream.resolution} - ${stream.codec} - ${stream.bitrate} bps`);
			});
		}

		if (!selectedAudioStreams || selectedAudioStreams.length === 0) {
			console.warn('No suitable audio streams found');
		} else {
			console.log(`Selected ${selectedAudioStreams.length} audio streams`);
			selectedAudioStreams.forEach((stream, index) => {
				const language = stream.itagItem?.audioLocale || stream.itagItem?.audioTrackId || 'und';
				const languageName = stream.itagItem?.audioTrackName || 'Unknown';
				console.log(`  ${index + 1}. ${languageName} (${language}) - ${stream.codec} - ${stream.bitrate} bps`);
			});
		}

		// if (!audioStream) {
		// 	console.warn('No suitable audio stream found');
		// } else {
		// 	console.log('Selected audio stream:', {
		// 		id: audioStream.id,
		// 		codec: audioStream.codec,
		// 		bitrate: audioStream.bitrate
		// 	});
		// }



		// Calculate duration
		const duration = calculateDuration(selectedVideoStreams, selectedAudioStreams);

		if (!duration || duration === 0) {
			console.warn('Video duration is missing or zero, this may cause playback issues.');
		}

		// Transform data using adapters
		const playerConfig = adaptPlayerConfig(
			selectedVideoStreams,
			selectedAudioStreams,
			duration,
			thumbnailPlaceholder
		);

		const metadata = adaptVideoMetadata(
			details,
			thumbnailPlaceholder // fallback avatar
		);

		return {
			playerConfig,
			metadata
		};

	} catch (error) {
		console.error('Error loading video data:', error);

		return {
			playerConfig: {
				videoStream: null,
				audioStream: null,
				duration: 0,
				poster: thumbnailPlaceholder
			},
			metadata: {
				title: 'Error Loading Video',
				description: 'Failed to load video information',
				channelName: 'Unknown',
				channelAvatar: null,
				viewCount: 0,
				uploadDate: '',
				likeCount: 0,
				dislikeCount: 0,
				subscriberCount: 0
			},
			error: error instanceof Error ? error.message : 'Unknown error loading video'
		};
	}
};
