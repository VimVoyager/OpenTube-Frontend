import type { PageLoad } from './$types';
import type { Stream } from '$lib/types';
import { getVideoDetails } from '$lib/api/details';
import { getAllStreams } from '$lib/api/streams';


const PREFERRED_VIDEO_ITAGS = [
	'264',	// 1440p MP4 AVC
	'137',	// 1080p MP4 AVC
	'136',	// 720p MP4 AVC
	'135',	// 480p MP4 AVC
	'400',	// 1440p MP4 AV1
	'399',	// 1080p MP4 AV1
	'398',	// 720p MP4 AV1
	'397',	// 480p MP4 AV1
	'271',	// 1440p webm VP9
	'248',	// 1080p webm VP9
	'247',	// 720p webm VP9
	'246',	// 480p webm VP9
] as const;

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

/**
 * Select best video stream based on priority and quality
 */
function bestVideoStream(streams: Stream[]): Stream | undefined {
	// Try to find preferred itag
	const candidate = pickByStreamId(streams, PREFERRED_VIDEO_ITAGS);
	if (candidate && candidate.videoOnly) return candidate;

	// Fallback: Find best MP4 AVC stream by resolution
	const mp4Streams = streams.filter(
		s => s.videoOnly &&
			(s.format === 'MPEG_4') &&
			(s.codec?.toLowerCase().includes('avc') || s.codec?.toLowerCase().includes('h264'))
	);

	if (mp4Streams.length > 0) {
		mp4Streams.sort((a, b) =>
			(b.width ?? 0) * (b.height ?? 1) - (a.width ?? 0) * (a.height ?? 1)
		);
		return mp4Streams[0];
	}

	// Last resort: any video-only stream with highest resolution
	const videoOnlyStreams = streams.filter(s => s.videoOnly);
	if (videoOnlyStreams.length > 0) {
		videoOnlyStreams.sort((a, b) =>
			(b.width ?? 0) * (b.height ?? 1) - (a.width ?? 0) * (a.height ?? 1)
		);
		return videoOnlyStreams[0];
	}

	return undefined;
}

/**
 * Select best audio stream based on priority and quality 
 */
function bestAudioStream(streams: Stream[]): Stream | undefined {
	// Try to find preferred itag
	const candidate = pickByStreamId(streams, PREFERRED_AUDIO_ITAGS);
	if (candidate && !candidate.videoOnly) return candidate;

	// Fallback: Find best M4A AAC stream by bitrate
	const m4aStreams = streams.filter(
		s => !s.videoOnly &&
			(s.format === 'M4A' || s.format === 'MP4A') &&
			(s.codec?.toLowerCase().includes('mp4a') || s.codec?.toLowerCase().includes('aac'))
	);

	if (m4aStreams.length > 0) {
		m4aStreams.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
		return m4aStreams[0];
	}

	// Last resort: any audio-only stream with highest bitrate
	const audioOnlyStreams = streams.filter(s => !s.videoOnly);
	if (audioOnlyStreams.length > 0) {
		audioOnlyStreams.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
		return audioOnlyStreams[0];
	}

	return undefined;
}


export const load: PageLoad = async ({ params, fetch }) => {
	try {
		// Fetch video metadata and streams in parallel
		const [details, { videoStreams, audioStreams }] = await Promise.all([
			getVideoDetails(params.id, fetch),
			getAllStreams(params.id, fetch)
		]);

		// Select best streams
		const videoStream = bestVideoStream(videoStreams);
		const audioStream = bestAudioStream(audioStreams);

		if (!videoStream) {
			console.warn('No suitable video stream found');
		} else {
			console.log('Selected video stream:', {
				id: videoStream.id,
				resolution: videoStream.resolution,
				codec: videoStream.codec,
				bitrate: videoStream.bitrate
			});
		}

		if (!audioStream) {
			console.warn('No suitable audio stream found');
		} else {
			console.log('Selected audio stream:', {
				id: audioStream.id,
				codec: audioStream.codec,
				bitrate: audioStream.bitrate
			});
		}

		// Extract duration from itagItem (it's in milliseconds as approxDurationMs)
		const durationMs = videoStream?.itagItem?.approxDurationMs ||
			audioStream?.itagItem?.approxDurationMs ||
			0;
		const durationSeconds = durationMs / 1000;

		// Enhance stream metadata
		const videoFormat = videoStream ? {
			...videoStream,
			sampleRate: undefined 
		} : undefined;

		const audioFormat = audioStream ? {
			...audioStream,
			sampleRate: 44100 // default for audio
		} : undefined;

		return {
			details,
			videoStreams,
			audioStreams,
			videoFormat,
			audioFormat,
			duration: durationSeconds
		};
	} catch (error) {
		console.error('Error loading video data:', error);
		return {
			error: error instanceof Error ? error.message : 'Unknown error loading video'
		};
	}
};
