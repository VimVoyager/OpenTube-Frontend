/**
 * Mock Stream Data Fixtures
 * 
 * Reusable test data for stream selection tests
 */

import type { Stream } from '$lib/types';

/**
 * Creates a mock video stream
 */
export function createMockVideoStream(overrides: Partial<Stream> = {}): Stream {
	return {
		id: '137',
		content: '',
		resolution: '1080p',
		itag: 137,
		bitrate: 5000000,
		width: 1920,
		height: 1080,
		fps: 30,
		quality: '1080p',
		codec: 'avc1.640028',
		itagItem: {
			mediaFormat: 'MP4',
			id: 137,
			itagType: 'VIDEO',
			avgBitrate: 5000000,
			fps: 30,
			bitrate: 5000000,
			initStart: 0,
			initEnd: 0,
			indexStart: 0,
			indexEnd: 0,
			codec: 'avc1.640028',
			targetDurationSec: 5,
			approxDurationMs: 5000,
			contentLength: 1000000,
			averageBitrate: 5000000,
			resolutionString: '1080p',
			width: 1920,
			height: 1080
		},
		videoOnly: true,
		format: 'MP4',
		url: 'https://example.com/video.mp4',
		...overrides
	} as Stream;
}

/**
 * Creates a mock audio stream
 */
export function createMockAudioStream(overrides: Partial<Stream> = {}): Stream {
	return {
		id: '140',
		content: '',
		resolution: '',
		itag: 140,
		bitrate: 128000,
		width: 0,
		height: 0,
		fps: 0,
		quality: 'medium',
		codec: 'mp4a.40.2',
		itagItem: {
			mediaFormat: 'M4A',
			id: 140,
			itagType: 'AUDIO',
			avgBitrate: 128000,
			sampleRate: 44100,
			audioChannels: 2,
			fps: 0,
			bitrate: 128000,
			initStart: 0,
			initEnd: 0,
			indexStart: 0,
			indexEnd: 0,
			codec: 'mp4a.40.2',
			targetDurationSec: 5,
			approxDurationMs: 5000,
			contentLength: 1000000,
			audioTrackId: 'en.0',
			audioTrackName: 'English',
			audioLocale: 'en',
			averageBitrate: 128000
		},
		videoOnly: false,
		format: 'M4A',
		url: 'https://example.com/audio.m4a',
		...overrides
	} as Stream;
}

/**
 * Standard quality levels for testing
 */
export const MOCK_QUALITIES = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'] as const;

/**
 * Creates a full set of video streams across quality levels
 */
export function createMockVideoStreamSet(): Stream[] {
	return [
		createMockVideoStream({ id: '401', itag: 401, resolution: '2160p', quality: '2160p', bitrate: 10000000, width: 3840, height: 2160 }),
		createMockVideoStream({ id: '400', itag: 400, resolution: '1440p', quality: '1440p', bitrate: 7000000, width: 2560, height: 1440 }),
		createMockVideoStream({ id: '137', itag: 137, resolution: '1080p', quality: '1080p', bitrate: 5000000, width: 1920, height: 1080 }),
		createMockVideoStream({ id: '136', itag: 136, resolution: '720p', quality: '720p', bitrate: 2500000, width: 1280, height: 720 }),
		createMockVideoStream({ id: '135', itag: 135, resolution: '480p', quality: '480p', bitrate: 1000000, width: 854, height: 480 }),
		createMockVideoStream({ id: '134', itag: 134, resolution: '360p', quality: '360p', bitrate: 500000, width: 640, height: 360 }),
		createMockVideoStream({ id: '133', itag: 133, resolution: '240p', quality: '240p', bitrate: 250000, width: 426, height: 240 }),
		createMockVideoStream({ id: '160', itag: 160, resolution: '144p', quality: '144p', bitrate: 100000, width: 256, height: 144 })
	];
}

/**
 * Creates audio streams in multiple languages
 */
export function createMockMultiLanguageAudioStreams(): Stream[] {
	return [
		// English streams (multiple quality options)
		createMockAudioStream({
			id: '141',
			itag: 141,
			bitrate: 256000,
			itagItem: {
				...createMockAudioStream().itagItem,
				id: 141,
				audioLocale: 'en',
				audioTrackId: 'en.0',
				audioTrackName: 'English',
				avgBitrate: 256000,
				bitrate: 256000
			}
		}),
		createMockAudioStream({
			id: '140',
			itag: 140,
			bitrate: 128000,
			itagItem: {
				...createMockAudioStream().itagItem,
				id: 140,
				audioLocale: 'en',
				audioTrackId: 'en.1',
				audioTrackName: 'English',
				avgBitrate: 128000,
				bitrate: 128000
			}
		}),
		
		// Spanish streams
		createMockAudioStream({
			id: '141',
			itag: 141,
			bitrate: 256000,
			itagItem: {
				...createMockAudioStream().itagItem,
				id: 141,
				audioLocale: 'es',
				audioTrackId: 'es.0',
				audioTrackName: 'Spanish',
				avgBitrate: 256000,
				bitrate: 256000
			}
		}),
		createMockAudioStream({
			id: '140',
			itag: 140,
			bitrate: 128000,
			itagItem: {
				...createMockAudioStream().itagItem,
				id: 140,
				audioLocale: 'es',
				audioTrackId: 'es.1',
				audioTrackName: 'Spanish',
				avgBitrate: 128000,
				bitrate: 128000
			}
		}),
		
		// French stream
		createMockAudioStream({
			id: '140',
			itag: 140,
			bitrate: 128000,
			itagItem: {
				...createMockAudioStream().itagItem,
				id: 140,
				audioLocale: 'fr',
				audioTrackId: 'fr.0',
				audioTrackName: 'French',
				avgBitrate: 128000,
				bitrate: 128000
			}
		}),
		
		// Original/undefined language
		createMockAudioStream({
			id: '141',
			itag: 141,
			bitrate: 256000,
			itagItem: {
				...createMockAudioStream().itagItem,
				id: 141,
				audioLocale: 'und',
				audioTrackId: 'original',
				audioTrackName: 'Original',
				avgBitrate: 256000,
				bitrate: 256000
			}
		})
	];
}

/**
 * Creates streams with variant itags (e.g., "137-1", "137-2")
 */
export function createMockStreamsWithVariants(): Stream[] {
	return [
		createMockVideoStream({ id: '137-1', itag: 137, resolution: '1080p', quality: '1080p', bitrate: 5000000 }),
		createMockVideoStream({ id: '137-2', itag: 137, resolution: '1080p', quality: '1080p', bitrate: 4800000 }),
		createMockVideoStream({ id: '136-1', itag: 136, resolution: '720p', quality: '720p', bitrate: 2500000 })
	];
}

/**
 * Creates WebM format audio streams
 */
export function createMockWebMAudioStreams(): Stream[] {
	return [
		createMockAudioStream({
			id: '251',
			itag: 251,
			format: 'WEBM',
			codec: 'opus',
			bitrate: 160000,
			itagItem: {
				...createMockAudioStream().itagItem,
				id: 251,
				mediaFormat: 'WEBM',
				codec: 'opus',
				audioLocale: 'en',
				audioTrackId: 'en.0',
				audioTrackName: 'English',
				avgBitrate: 160000,
				bitrate: 160000
			}
		}),
		createMockAudioStream({
			id: '250',
			itag: 250,
			format: 'WEBM',
			codec: 'opus',
			bitrate: 70000,
			itagItem: {
				...createMockAudioStream().itagItem,
				id: 250,
				mediaFormat: 'WEBM',
				codec: 'opus',
				audioLocale: 'en',
				audioTrackId: 'en.1',
				audioTrackName: 'English',
				avgBitrate: 70000,
				bitrate: 70000
			}
		})
	];
}

/**
 * Creates mixed video/audio streams (not video-only)
 */
export function createMockMixedStreams(): Stream[] {
	return [
		createMockVideoStream({ id: '137', itag: 137, resolution: '1080p', quality: '1080p', videoOnly: true }),
		createMockAudioStream({ id: '140', itag: 140, videoOnly: false }),
		// Mixed stream (old format with both video and audio)
		{
			id: '22',
			content: '',
			resolution: '720p',
			itag: 22,
			bitrate: 3000000,
			width: 1280,
			height: 720,
			fps: 30,
			quality: '720p',
			codec: 'avc1.64001F, mp4a.40.2',
			itagItem: {
				mediaFormat: 'MP4',
				id: 22,
				itagType: 'MIXED',
				avgBitrate: 3000000,
				fps: 30,
				bitrate: 3000000,
				width: 1280,
				height: 720,
				initStart: 0,
				initEnd: 0,
				indexStart: 0,
				indexEnd: 0,
				codec: 'avc1.64001F, mp4a.40.2',
				targetDurationSec: 5,
				approxDurationMs: 5000,
				contentLength: 1000000,
				averageBitrate: 3000000
			},
			videoOnly: false,
			format: 'MP4',
			url: 'https://example.com/mixed.mp4'
		} as Stream
	];
}

/**
 * Creates audio streams without proper metadata
 */
export function createMockAudioStreamsWithMissingMetadata(): Stream[] {
	const baseAudioStream = createMockAudioStream();
	
	return [
		// Missing audioLocale in itagItem
		{
			...baseAudioStream,
			id: '140',
			itag: 140,
			itagItem: {
				...baseAudioStream.itagItem,
				id: 140,
				audioLocale: undefined,
				audioTrackId: undefined,
				audioTrackName: undefined
			}
		} as Stream,
		
		// Missing audioLocale but has trackId
		createMockAudioStream({
			id: '141',
			itag: 141,
			bitrate: 256000,
			itagItem: {
				...baseAudioStream.itagItem,
				id: 141,
				audioLocale: undefined,
				audioTrackId: 'track1',
				audioTrackName: 'Track 1',
				avgBitrate: 256000,
				bitrate: 256000
			}
		})
	];
}