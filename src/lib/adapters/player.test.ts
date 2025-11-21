/**
 * Test Suite: player.ts
 * 
 * Tests for video player configuration adaptation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptPlayerConfig } from './player';
import type { Stream, ItagItem } from '$lib/types';
import { DEFAULT_VIDEO, DEFAULT_AUDIO, SUBTITLE_MIME_TYPES } from './constants';

// Mock the utility modules
vi.mock('$lib/utils/languageUtils', () => ({
	extractLanguageInfo: vi.fn((stream) => ({
		code: stream.itagItem?.audioLocale || 'en',
		name: stream.itagItem?.audioTrackName || 'English'
	})),
	normalizeLanguageCode: vi.fn((code) => code?.toLowerCase() || 'en'),
	getLanguageName: vi.fn((code) => {
		const names: Record<string, string> = {
			'en': 'English',
			'es': 'Spanish',
			'fr': 'French',
			'und': 'Unknown'
		};
		return names[code] || 'Unknown';
	})
}));

vi.mock('$lib/utils/streamSelection', () => ({
	extractByteRanges: vi.fn((itagItem) => ({
		initStart: itagItem?.initStart,
		initEnd: itagItem?.initEnd,
		indexStart: itagItem?.indexStart,
		indexEnd: itagItem?.indexEnd
	}))
}));

import { extractLanguageInfo, normalizeLanguageCode, getLanguageName } from '$lib/utils/languageUtils';
import { extractByteRanges } from '$lib/utils/streamSelection';
import { createMockSubtitle } from '../../tests/fixtures/mockSubtitleData';
import { createMockAudioStream, createMockVideoStream } from '../../tests/fixtures/mockStreamData';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockItagItem: ItagItem = {
	mediaFormat: 'MPEG_4',
	id: 137,
	itagType: 'VIDEO',
	avgBitrate: 5000000,
	resolutionString: '1920x1080',
	fps: 30,
	bitrate: 5000000,
	width: 1920,
	height: 1080,
	initStart: 0,
	initEnd: 740,
	indexStart: 741,
	indexEnd: 2296,
	quality: '1080p',
	codec: 'avc1.640028',
	targetDurationSec: 5,
	approxDurationMs: 300000,
	contentLength: 50000000,
	averageBitrate: 5000000
};

const mockAudioItagItem: ItagItem = {
	...mockItagItem,
	id: 140,
	itagType: 'AUDIO',
	sampleRate: 44100,
	audioChannels: 2,
	audioLocale: 'en',
	audioTrackId: 'en',
	audioTrackName: 'English',
	codec: 'mp4a.40.2'
};

const posterUrl = 'https://example.com/poster.jpg';
const duration = 300;

// =============================================================================
// Setup and Teardown
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// adaptPlayerConfig Tests
// =============================================================================

describe('adaptPlayerConfig', () => {
	// =============================================================================
	// Successful Adaptation Tests
	// =============================================================================

	describe('successful player configuration', () => {
		it('should adapt complete player configuration with all streams', () => {
			// Arrange
			const videoStreams = [createMockVideoStream()];
			const audioStreams = [createMockAudioStream()];
			const subtitles = [createMockSubtitle()];

			// Act
			const result = adaptPlayerConfig(
				videoStreams,
				audioStreams,
				subtitles,
				duration,
				posterUrl
			);

			// Assert
			expect(result.videoStream).toHaveLength(1);
			expect(result.audioStream).toHaveLength(1);
			expect(result.subtitleStream).toHaveLength(1);
			expect(result.duration).toBe(duration);
			expect(result.poster).toBe(posterUrl);
		});

		it('should return all required configuration fields', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				[createMockAudioStream()],
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			expect(result).toHaveProperty('videoStream');
			expect(result).toHaveProperty('audioStream');
			expect(result).toHaveProperty('subtitleStream');
			expect(result).toHaveProperty('duration');
			expect(result).toHaveProperty('poster');
		});

		it('should handle multiple video streams', () => {
			// Arrange
			const videoStreams = [
				createMockVideoStream(),
				{ ...createMockVideoStream(), id: 'video-2', resolution: '1280x720' }
			];

			// Act
			const result = adaptPlayerConfig(
				videoStreams,
				[createMockAudioStream()],
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			expect(result.videoStream).toHaveLength(2);
			expect(result.videoStream?.[0].url).toBe(createMockVideoStream().url);
			expect(result.videoStream?.[1].url).toBe(createMockVideoStream().url);
		});

		it('should handle multiple audio streams', () => {
			// Arrange
			const audioStreams = [
				createMockAudioStream(),
				{ ...createMockAudioStream(), id: 'audio-2' }
			];

			// Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				audioStreams,
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			expect(result.audioStream).toHaveLength(2);
		});

		it('should handle multiple subtitles', () => {
			// Arrange
			const subtitles = [
				createMockSubtitle(),
				{ ...createMockSubtitle(), id: 'subtitle-2', locale: 'es' }
			];

			// Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				[createMockAudioStream()],
				subtitles,
				duration,
				posterUrl
			);

			// Assert
			expect(result.subtitleStream).toHaveLength(2);
		});
	});

	// =============================================================================
	// Video Stream Adaptation Tests
	// =============================================================================

	describe('video stream adaptation', () => {
		it('should correctly adapt video stream properties', () => {
			// Arrange
			const videoStreams = [createMockVideoStream()];

			// Act
			const result = adaptPlayerConfig(
				videoStreams,
				undefined,
				undefined,
				duration,
				posterUrl
			);

			// Assert
			const videoConfig = result.videoStream?.[0];
			expect(videoConfig?.url).toBe(createMockVideoStream().url);
			expect(videoConfig?.codec).toBe(createMockVideoStream().codec);
			expect(videoConfig?.width).toBe(createMockVideoStream().width);
			expect(videoConfig?.height).toBe(createMockVideoStream().height);
			expect(videoConfig?.bandwidth).toBe(createMockVideoStream().bitrate);
			expect(videoConfig?.frameRate).toBe(createMockVideoStream().fps);
			expect(videoConfig?.format).toBe(createMockVideoStream().format);
		});

		it('should use default values for missing video properties', () => {
			// Arrange
			const incompleteStream = {
				...createMockVideoStream(),
				codec: undefined,
				width: undefined,
				height: undefined,
				bitrate: undefined,
				fps: undefined,
				format: undefined
			} as unknown as Stream;

			// Act
			const result = adaptPlayerConfig(
				[incompleteStream],
				undefined,
				undefined,
				duration,
				posterUrl
			);

			// Assert
			const videoConfig = result.videoStream?.[0];
			expect(videoConfig?.codec).toBe(DEFAULT_VIDEO.CODEC);
			expect(videoConfig?.mimeType).toBe(DEFAULT_VIDEO.MIME_TYPE);
			expect(videoConfig?.width).toBe(DEFAULT_VIDEO.WIDTH);
			expect(videoConfig?.height).toBe(DEFAULT_VIDEO.HEIGHT);
			expect(videoConfig?.bandwidth).toBe(DEFAULT_VIDEO.BANDWIDTH);
			expect(videoConfig?.frameRate).toBe(DEFAULT_VIDEO.FRAME_RATE);
			expect(videoConfig?.format).toBe(DEFAULT_VIDEO.FORMAT);
		});

		it('should include byte ranges for video streams', () => {
			// Arrange
			vi.mocked(extractByteRanges).mockReturnValueOnce({
				initStart: 0,
				initEnd: 740,
				indexStart: 741,
				indexEnd: 2296
			});

			// Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				undefined,
				undefined,
				duration,
				posterUrl
			);

			// Assert
			expect(extractByteRanges).toHaveBeenCalledWith(createMockVideoStream().itagItem);
			const videoConfig = result.videoStream?.[0];
			expect(videoConfig?.initStart).toBe(0);
			expect(videoConfig?.initEnd).toBe(740);
			expect(videoConfig?.indexStart).toBe(741);
			expect(videoConfig?.indexEnd).toBe(2296);
		});
	});

	// =============================================================================
	// Audio Stream Adaptation Tests
	// =============================================================================

	describe('audio stream adaptation', () => {
		it('should correctly adapt audio stream properties', () => {
			// Arrange
			const audioStreams = [createMockAudioStream()];

			// Act
			const result = adaptPlayerConfig(
				undefined,
				audioStreams,
				undefined,
				duration,
				posterUrl
			);

			// Assert
			const audioConfig = result.audioStream?.[0];
			expect(audioConfig?.url).toBe(createMockAudioStream().url);
			expect(audioConfig?.codec).toBe(createMockAudioStream().codec);
			expect(audioConfig?.bandwidth).toBe(createMockAudioStream().bitrate);
			expect(audioConfig?.format).toBe(createMockAudioStream().format);
		});

		it('should extract language information from audio stream', () => {
			// Arrange
			vi.mocked(extractLanguageInfo).mockReturnValueOnce({
				code: 'en',
				name: 'English'
			});

			// Act
			const result = adaptPlayerConfig(
				undefined,
				[createMockAudioStream()],
				undefined,
				duration,
				posterUrl
			);

			// Assert
			expect(extractLanguageInfo).toHaveBeenCalledWith(createMockAudioStream());
			const audioConfig = result.audioStream?.[0];
			expect(audioConfig?.language).toBe('en');
			expect(audioConfig?.languageName).toBe('English');
		});

		it('should use default values for missing audio properties', () => {
			// Arrange
			const incompleteStream = {
				...createMockAudioStream(),
				codec: undefined,
				bitrate: undefined,
				format: undefined,
				itagItem: {
					...mockAudioItagItem,
					sampleRate: undefined,
					audioChannels: undefined
				}
			} as unknown as Stream;

			// Act
			const result = adaptPlayerConfig(
				undefined,
				[incompleteStream],
				undefined,
				duration,
				posterUrl
			);

			// Assert
			const audioConfig = result.audioStream?.[0];
			expect(audioConfig?.codec).toBe(DEFAULT_AUDIO.CODEC);
			expect(audioConfig?.mimeType).toBe(DEFAULT_AUDIO.MIME_TYPE);
			expect(audioConfig?.bandwidth).toBe(DEFAULT_AUDIO.BANDWIDTH);
			expect(audioConfig?.sampleRate).toBe(DEFAULT_AUDIO.SAMPLE_RATE);
			expect(audioConfig?.channels).toBe(DEFAULT_AUDIO.CHANNELS);
			expect(audioConfig?.format).toBe(DEFAULT_AUDIO.FORMAT);
		});

		it('should include byte ranges for audio streams', () => {
			// Arrange
			vi.mocked(extractByteRanges).mockReturnValueOnce({
				initStart: 0,
				initEnd: 500,
				indexStart: 501,
				indexEnd: 1500
			});

			// Act
			const result = adaptPlayerConfig(
				undefined,
				[createMockAudioStream()],
				undefined,
				duration,
				posterUrl
			);

			// Assert
			expect(extractByteRanges).toHaveBeenCalledWith(createMockAudioStream().itagItem);
			const audioConfig = result.audioStream?.[0];
			expect(audioConfig?.initStart).toBe(0);
			expect(audioConfig?.initEnd).toBe(500);
		});
	});

	// =============================================================================
	// Subtitle Stream Adaptation Tests
	// =============================================================================

	describe('subtitle stream adaptation', () => {
		it('should correctly adapt subtitle properties', () => {
			// Arrange
			vi.mocked(normalizeLanguageCode).mockReturnValueOnce('en');
			vi.mocked(getLanguageName).mockReturnValueOnce('English');

			// Act
			const result = adaptPlayerConfig(
				undefined,
				undefined,
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			const subtitleConfig = result.subtitleStream?.[0];
			expect(subtitleConfig?.url).toBe(createMockSubtitle().url);
			expect(subtitleConfig?.language).toBe('en');
			expect(subtitleConfig?.languageName).toBe('English');
			expect(subtitleConfig?.format).toBe('vtt');
			expect(subtitleConfig?.kind).toBe('subtitles');
			expect(subtitleConfig?.isAutoGenerated).toBe(false);
		});

		it('should set kind to captions for autogenerated subtitles', () => {
			// Arrange
			const autoSubtitle = { ...createMockSubtitle(), autogenerated: true };

			// Act
			const result = adaptPlayerConfig(
				undefined,
				undefined,
				[autoSubtitle],
				duration,
				posterUrl
			);

			// Assert
			const subtitleConfig = result.subtitleStream?.[0];
			expect(subtitleConfig?.kind).toBe('captions');
			expect(subtitleConfig?.isAutoGenerated).toBe(true);
		});

		it('should use correct MIME type for different formats', () => {
			// Arrange
			const vttSubtitle = { ...createMockSubtitle(), format: 'vtt' };
			const srtSubtitle = { ...createMockSubtitle(), format: 'srt' };

			// Act
			const vttResult = adaptPlayerConfig(
				undefined,
				undefined,
				[vttSubtitle],
				duration,
				posterUrl
			);
			const srtResult = adaptPlayerConfig(
				undefined,
				undefined,
				[srtSubtitle],
				duration,
				posterUrl
			);

			// Assert
			expect(vttResult.subtitleStream?.[0].mimeType).toBe(SUBTITLE_MIME_TYPES['vtt']);
			expect(srtResult.subtitleStream?.[0].mimeType).toBe(SUBTITLE_MIME_TYPES['srt']);
		});

		it('should default to vtt MIME type for unknown formats', () => {
			// Arrange
			const unknownSubtitle = { ...createMockSubtitle(), format: 'unknown' };

			// Act
			const result = adaptPlayerConfig(
				undefined,
				undefined,
				[unknownSubtitle],
				duration,
				posterUrl
			);

			// Assert
			expect(result.subtitleStream?.[0].mimeType).toBe('text/vtt');
		});

		it('should normalize subtitle language codes', () => {
			// Arrange
			vi.mocked(normalizeLanguageCode).mockReturnValueOnce('es');

			// Act
			const result = adaptPlayerConfig(
				undefined,
				undefined,
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			expect(normalizeLanguageCode).toHaveBeenCalledWith(createMockSubtitle().locale);
			expect(result.subtitleStream?.[0].language).toBe('es');
		});
	});

	// =============================================================================
	// Empty/Undefined Stream Handling Tests
	// =============================================================================

	describe('empty and undefined stream handling', () => {
		it('should return null for undefined video streams', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				undefined,
				[createMockAudioStream()],
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			expect(result.videoStream).toBeNull();
		});

		it('should return null for empty video streams array', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				[],
				[createMockAudioStream()],
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			expect(result.videoStream).toBeNull();
		});

		it('should return null for undefined audio streams', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				undefined,
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			expect(result.audioStream).toBeNull();
		});

		it('should return null for empty audio streams array', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				[],
				[createMockSubtitle()],
				duration,
				posterUrl
			);

			// Assert
			expect(result.audioStream).toBeNull();
		});

		it('should return null for undefined subtitles', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				[createMockAudioStream()],
				undefined,
				duration,
				posterUrl
			);

			// Assert
			expect(result.subtitleStream).toBeNull();
		});

		it('should return null for empty subtitles array', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				[createMockAudioStream()],
				[],
				duration,
				posterUrl
			);

			// Assert
			expect(result.subtitleStream).toBeNull();
		});

		it('should handle all streams being undefined', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				undefined,
				undefined,
				undefined,
				duration,
				posterUrl
			);

			// Assert
			expect(result.videoStream).toBeNull();
			expect(result.audioStream).toBeNull();
			expect(result.subtitleStream).toBeNull();
			expect(result.duration).toBe(duration);
			expect(result.poster).toBe(posterUrl);
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle zero duration', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				[createMockAudioStream()],
				[createMockSubtitle()],
				0,
				posterUrl
			);

			// Assert
			expect(result.duration).toBe(0);
		});

		it('should handle very long duration', () => {
			// Arrange
			const longDuration = 86400; // 24 hours

			// Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				[createMockAudioStream()],
				[createMockSubtitle()],
				longDuration,
				posterUrl
			);

			// Assert
			expect(result.duration).toBe(longDuration);
		});

		it('should handle empty poster URL', () => {
			// Arrange & Act
			const result = adaptPlayerConfig(
				[createMockVideoStream()],
				[createMockAudioStream()],
				[createMockSubtitle()],
				duration,
				''
			);

			// Assert
			expect(result.poster).toBe('');
		});

		it('should not modify input stream arrays', () => {
			// Arrange
			const videoStreams = [createMockVideoStream()];
			const audioStreams = [createMockAudioStream()];
			const subtitles = [createMockSubtitle()];
			const videoStreamsCopy = [...videoStreams];
			const audioStreamsCopy = [...audioStreams];
			const subtitlesCopy = [...subtitles];

			// Act
			adaptPlayerConfig(
				videoStreams,
				audioStreams,
				subtitles,
				duration,
				posterUrl
			);

			// Assert
			expect(videoStreams).toEqual(videoStreamsCopy);
			expect(audioStreams).toEqual(audioStreamsCopy);
			expect(subtitles).toEqual(subtitlesCopy);
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration with utility functions', () => {
		it('should call extractByteRanges for each video stream', () => {
			// Arrange
			const videoStreams = [createMockVideoStream(), createMockVideoStream()];

			// Act
			adaptPlayerConfig(
				videoStreams,
				undefined,
				undefined,
				duration,
				posterUrl
			);

			// Assert
			expect(extractByteRanges).toHaveBeenCalledTimes(2);
		});

		it('should call extractLanguageInfo for each audio stream', () => {
			// Arrange
			const audioStreams = [createMockAudioStream(), createMockAudioStream()];

			// Act
			adaptPlayerConfig(
				undefined,
				audioStreams,
				undefined,
				duration,
				posterUrl
			);

			// Assert
			expect(extractLanguageInfo).toHaveBeenCalledTimes(2);
		});

		it('should call normalizeLanguageCode for each subtitle', () => {
			// Arrange
			const subtitles = [createMockSubtitle(), createMockSubtitle()];

			// Act
			adaptPlayerConfig(
				undefined,
				undefined,
				subtitles,
				duration,
				posterUrl
			);

			// Assert
			expect(normalizeLanguageCode).toHaveBeenCalledTimes(2);
		});
	});
});