/**
 * Mock DASH Manifest Data Fixtures
 * 
 * Reusable test data for DASH manifest generator tests
 */

import type { StreamMetadata, SubtitleMetadata, DashManifestConfig } from '../../lib/utils/dashManifestGenerator';

/**
 * Creates a mock video stream with byte ranges
 */
export function createMockVideoStream(overrides: Partial<StreamMetadata> = {}): StreamMetadata {
	return {
		url: 'https://example.com/video-1080p.mp4',
		codec: 'avc1.640028',
		mimeType: 'video/mp4',
		bandwidth: 5000000,
		width: 1920,
		height: 1080,
		frameRate: 30,
		initStart: 0,
		initEnd: 740,
		indexStart: 741,
		indexEnd: 2500,
		format: 'MP4',
		...overrides
	};
}

/**
 * Creates a mock audio stream with byte ranges
 */
export function createMockAudioStream(overrides: Partial<StreamMetadata> = {}): StreamMetadata {
	return {
		url: 'https://example.com/audio-128k.m4a',
		codec: 'mp4a.40.2',
		mimeType: 'audio/mp4',
		bandwidth: 128000,
		audioSampleRate: 44100,
		audioChannels: 2,
		language: 'en',
		languageName: 'English',
		initStart: 0,
		initEnd: 648,
		indexStart: 649,
		indexEnd: 1200,
		format: 'M4A',
		...overrides
	};
}

/**
 * Creates a mock subtitle metadata
 */
export function createMockSubtitle(overrides: Partial<SubtitleMetadata> = {}): SubtitleMetadata {
	return {
		url: 'https://example.com/subtitles/en.vtt',
		language: 'en',
		languageName: 'English',
		mimeType: 'text/vtt',
		kind: 'subtitles',
		...overrides
	};
}

/**
 * Creates a set of video streams at different qualities
 */
export function createMockVideoStreamSet(): StreamMetadata[] {
	return [
		createMockVideoStream({
			url: 'https://example.com/video-1080p.mp4',
			bandwidth: 5000000,
			width: 1920,
			height: 1080,
			frameRate: 30
		}),
		createMockVideoStream({
			url: 'https://example.com/video-720p.mp4',
			bandwidth: 2500000,
			width: 1280,
			height: 720,
			frameRate: 30
		}),
		createMockVideoStream({
			url: 'https://example.com/video-480p.mp4',
			bandwidth: 1000000,
			width: 854,
			height: 480,
			frameRate: 30
		})
	];
}

/**
 * Creates audio streams in multiple languages
 */
export function createMockMultiLanguageAudioStreams(): StreamMetadata[] {
	return [
		createMockAudioStream({
			url: 'https://example.com/audio-en-256k.m4a',
			bandwidth: 256000,
			language: 'en',
			languageName: 'English'
		}),
		createMockAudioStream({
			url: 'https://example.com/audio-en-128k.m4a',
			bandwidth: 128000,
			language: 'en',
			languageName: 'English'
		}),
		createMockAudioStream({
			url: 'https://example.com/audio-es-256k.m4a',
			bandwidth: 256000,
			language: 'es',
			languageName: 'Spanish'
		}),
		createMockAudioStream({
			url: 'https://example.com/audio-fr-128k.m4a',
			bandwidth: 128000,
			language: 'fr',
			languageName: 'French'
		})
	];
}

/**
 * Creates multiple subtitle tracks
 */
export function createMockSubtitleSet(): SubtitleMetadata[] {
	return [
		createMockSubtitle({
			url: 'https://example.com/subtitles/en.vtt',
			language: 'en',
			languageName: 'English',
			kind: 'subtitles'
		}),
		createMockSubtitle({
			url: 'https://example.com/subtitles/es.vtt',
			language: 'es',
			languageName: 'Spanish',
			kind: 'subtitles'
		}),
		createMockSubtitle({
			url: 'https://example.com/captions/en.vtt',
			language: 'en',
			languageName: 'English (CC)',
			kind: 'captions'
		})
	];
}

/**
 * Creates a complete DASH manifest configuration
 */
export function createMockDashConfig(overrides: Partial<DashManifestConfig> = {}): DashManifestConfig {
	return {
		videoStreams: createMockVideoStreamSet(),
		audioStreams: createMockMultiLanguageAudioStreams(),
		subtitleStreams: createMockSubtitleSet(),
		duration: 600, // 10 minutes
		...overrides
	};
}

/**
 * Creates a minimal valid config (video only)
 */
export function createMinimalVideoConfig(): DashManifestConfig {
	return {
		videoStreams: [createMockVideoStream()],
		duration: 120
	};
}

/**
 * Creates a minimal valid config (audio only)
 */
export function createMinimalAudioConfig(): DashManifestConfig {
	return {
		audioStreams: [createMockAudioStream()],
		duration: 120
	};
}

/**
 * Creates streams without byte range information
 */
export function createStreamsWithoutByteRanges(): StreamMetadata[] {
	return [
		createMockVideoStream({
			initStart: undefined,
			initEnd: undefined,
			indexStart: undefined,
			indexEnd: undefined
		})
	];
}

/**
 * Creates streams with partial byte range information
 */
export function createStreamsWithPartialByteRanges(): StreamMetadata[] {
	return [
		createMockVideoStream({
			initStart: 0,
			initEnd: 740,
			indexStart: undefined,
			indexEnd: undefined
		})
	];
}

/**
 * Creates WebM format streams
 */
export function createMockWebMStreams(): StreamMetadata[] {
	return [
		createMockVideoStream({
			url: 'https://example.com/video.webm',
			codec: 'vp09.00.10.08',
			format: 'WEBM',
			mimeType: 'video/webm'
		})
	];
}

/**
 * Creates streams with special characters in URLs
 */
export function createStreamsWithSpecialCharacters(): StreamMetadata[] {
	return [
		createMockVideoStream({
			url: 'https://example.com/video?id=123&token=abc<>"\''
		})
	];
}

/**
 * Creates audio streams with undefined language
 */
export function createAudioStreamsWithUndefinedLanguage(): StreamMetadata[] {
	return [
		createMockAudioStream({
			language: 'und',
			languageName: 'Original'
		}),
		createMockAudioStream({
			language: 'en',
			languageName: 'English'
		})
	];
}