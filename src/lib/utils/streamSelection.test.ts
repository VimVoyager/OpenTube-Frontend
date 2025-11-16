/**
 * Test Suite: streamSelection.ts
 * 
 * Tests for video and audio stream selection logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logSelectedStreams, selectBestAudioStreams, selectVideoStreams } from './streamSelection';
import type { Stream } from '$lib/types';
import {
    createMockAudioStream,
	createMockAudioStreamsWithMissingMetadata,
	createMockMixedStreams,
	createMockMultiLanguageAudioStreams,
	createMockStreamsWithVariants,
	createMockVideoStream,
	createMockVideoStreamSet,
	createMockWebMAudioStreams,
} from '../../tests/fixtures/mockStreamData';

// =============================================================================
// selectVideoStreams() Tests
// =============================================================================
describe('selectVideoStreams', () => {
    describe('quality selection', () => {
		it('should select one stream per quality level', () => {
			const streams = createMockVideoStreamSet();
			
			const result = selectVideoStreams(streams);
			
			// Should have multiple quality levels
			expect(result.length).toBeGreaterThan(0);
			
			// All should be video-only
			expect(result.every(s => s.videoOnly)).toBe(true);
			
			// Should have unique resolutions
			const resolutions = result.map(s => s.resolution);
			const uniqueResolutions = new Set(resolutions);
			expect(resolutions.length).toBe(uniqueResolutions.size);
		});

		it('should prefer higher quality levels first', () => {
			const streams = createMockVideoStreamSet();
			
			const result = selectVideoStreams(streams);
			
			// Check that quality levels are in descending order
			const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
			const selectedQualities = result.map(s => s.resolution);
			
			// Verify ordering
			for (let i = 0; i < selectedQualities.length - 1; i++) {
				const currentIndex = qualityOrder.indexOf(selectedQualities[i]!);
				const nextIndex = qualityOrder.indexOf(selectedQualities[i + 1]!);
				expect(currentIndex).toBeLessThan(nextIndex);
			}
		});

		it('should select at least minimum number of qualities', () => {
			const streams = [
				createMockVideoStream({ id: '137', resolution: '1080p' }),
				createMockVideoStream({ id: '136', resolution: '720p' }),
				createMockVideoStream({ id: '135', resolution: '480p' }),
				createMockVideoStream({ id: '134', resolution: '360p' })
			];
			
			const result = selectVideoStreams(streams);
			
			// Should have at least 3 streams (MIN_VIDEO_QUALITIES)
			expect(result.length).toBeGreaterThanOrEqual(3);
		});

		it('should handle limited quality options', () => {
			const streams = [
				createMockVideoStream({ id: '137', resolution: '1080p' }),
				createMockVideoStream({ id: '136', resolution: '720p' })
			];
			
			const result = selectVideoStreams(streams);
			
			expect(result.length).toBe(2);
			expect(result.every(s => s.videoOnly)).toBe(true);
		});

		it('should not select duplicate quality levels', () => {
			const streams = [
				createMockVideoStream({ id: '137', resolution: '1080p', bitrate: 5000000 }),
				createMockVideoStream({ id: '138', resolution: '1080p', bitrate: 6000000 }),
				createMockVideoStream({ id: '136', resolution: '720p' })
			];
			
			const result = selectVideoStreams(streams);
			
			// Should only have one 1080p stream
			const p1080Streams = result.filter(s => s.resolution === '1080p');
			expect(p1080Streams.length).toBe(1);
		});
	});

    describe('stream filtering', () => {
		it('should only return video-only streams', () => {
			const streams = createMockMixedStreams();
			
			const result = selectVideoStreams(streams);
			
			expect(result.every(s => s.videoOnly)).toBe(true);
			// Mixed stream (id: '22') should not be included
			expect(result.find(s => s.id === '22')).toBeUndefined();
		});

		it('should filter out audio-only streams', () => {
			const streams = [
				createMockVideoStream({ id: '137', resolution: '1080p' }),
				createMockAudioStream({ id: '140' }),
				createMockVideoStream({ id: '136', resolution: '720p' })
			];
			
			const result = selectVideoStreams(streams);
			
			expect(result.length).toBe(2);
			expect(result.every(s => s.videoOnly)).toBe(true);
		});
	});

    describe('variant itag handling', () => {
		it('should handle variant itags (e.g., "137-1")', () => {
			const streams = createMockStreamsWithVariants();
			
			const result = selectVideoStreams(streams);
			
			expect(result.length).toBeGreaterThan(0);
			expect(result.every(s => s.videoOnly)).toBe(true);
		});

		it('should not select duplicate base itags', () => {
			const streams = [
				createMockVideoStream({ id: '137-1', resolution: '1080p' }),
				createMockVideoStream({ id: '137-2', resolution: '1080p' }),
				createMockVideoStream({ id: '136', resolution: '720p' })
			];
			
			const result = selectVideoStreams(streams);
			
			// Should only have one 1080p stream from the 137 variants
			const p1080Streams = result.filter(s => s.resolution === '1080p');
			expect(p1080Streams.length).toBe(1);
		});
	});

    describe('edge cases', () => {
		it('should handle empty stream array', () => {
			const result = selectVideoStreams([]);
			
			expect(result).toEqual([]);
		});

		it('should handle array with no video-only streams', () => {
			const streams = [
				createMockAudioStream({ id: '140' }),
				createMockAudioStream({ id: '141' })
			];
			
			const result = selectVideoStreams(streams);
			
			expect(result).toEqual([]);
		});

		it('should handle streams with undefined resolution', () => {
			const streams = [
				createMockVideoStream({ resolution: undefined as unknown as string | undefined }),
				createMockVideoStream({ id: '136', resolution: '720p' })
			];
			
			const result = selectVideoStreams(streams);
			
			// Should still select the valid stream
			expect(result.length).toBeGreaterThan(0);
		});

		it('should handle single video stream', () => {
			const streams = [
				createMockVideoStream({ id: '137', resolution: '1080p' })
			];
			
			const result = selectVideoStreams(streams);
			
			expect(result.length).toBe(1);
			expect(result[0].id).toBe('137');
		});
	});
});

// =============================================================================
// selectBestAudioStreams() Tests
// =============================================================================

describe('selectBestAudioStreams', () => {
	describe('language grouping', () => {
		it('should select one stream per language', () => {
			const streams = createMockMultiLanguageAudioStreams();
			
			const result = selectBestAudioStreams(streams);
			
			// Should have 4 languages: und, en, es, fr
			expect(result.length).toBe(4);
			
			// All should be audio streams (not videoOnly)
			expect(result.every(s => !s.videoOnly)).toBe(true);
		});

		it('should select highest quality stream per language', () => {
			const streams = createMockMultiLanguageAudioStreams();
			
			const result = selectBestAudioStreams(streams);
			
			// English should select 256kbps (itag 141) over 128kbps (itag 140)
			const englishStream = result.find(s => s.itagItem.audioLocale === 'en');
			expect(englishStream?.bitrate).toBe(256000);
			expect(englishStream?.id).toBe('141');
		});

		it('should handle multiple streams of same language', () => {
			const baseStream = createMockAudioStream();
			const streams = [
				createMockAudioStream({
					id: '141',
					itag: 141,
					bitrate: 256000,
					itagItem: { ...baseStream.itagItem, id: 141, audioLocale: 'en', audioTrackId: 'en.0', audioTrackName: 'English', avgBitrate: 256000, bitrate: 256000 }
				}),
				createMockAudioStream({
					id: '140',
					itag: 140,
					bitrate: 128000,
					itagItem: { ...baseStream.itagItem, id: 140, audioLocale: 'en', audioTrackId: 'en.1', audioTrackName: 'English', avgBitrate: 128000, bitrate: 128000 }
				}),
				createMockAudioStream({
					id: '139',
					itag: 139,
					bitrate: 48000,
					itagItem: { ...baseStream.itagItem, id: 139, audioLocale: 'en', audioTrackId: 'en.2', audioTrackName: 'English', avgBitrate: 48000, bitrate: 48000 }
				})
			];
			
			const result = selectBestAudioStreams(streams);
			
			// Should only have one English stream - the best quality
			expect(result.length).toBe(1);
			expect(result[0].bitrate).toBe(256000);
		});
	});

	describe('quality selection', () => {
		it('should prefer preferred itag (141) over others', () => {
			const baseStream = createMockAudioStream();
			const streams = [
				createMockAudioStream({
					id: '141',
					itag: 141,
					bitrate: 256000,
					itagItem: { ...baseStream.itagItem, id: 141, audioLocale: 'en', audioTrackId: 'en.0', audioTrackName: 'English', avgBitrate: 256000, bitrate: 256000 }
				}),
				createMockAudioStream({
					id: '999',
					itag: 999,
					bitrate: 500000, // Higher bitrate but not preferred itag
					itagItem: { ...baseStream.itagItem, id: 999, audioLocale: 'en', audioTrackId: 'en.1', audioTrackName: 'English', avgBitrate: 500000, bitrate: 500000 }
				})
			];
			
			const result = selectBestAudioStreams(streams);
			
			// Should prefer itag 141 even though 999 has higher bitrate
			expect(result[0].id).toBe('141');
		});

		it('should prefer M4A/AAC format when no preferred itag', () => {
			const baseStream = createMockAudioStream();
			const streams = [
				createMockAudioStream({
					id: '999',
					itag: 999,
					format: 'M4A',
					codec: 'mp4a.40.2',
					bitrate: 128000,
					itagItem: { ...baseStream.itagItem, id: 999, mediaFormat: 'M4A', codec: 'mp4a.40.2', audioLocale: 'en', audioTrackId: 'en.0', audioTrackName: 'English', avgBitrate: 128000, bitrate: 128000 }
				}),
				createMockAudioStream({
					id: '998',
					itag: 998,
					format: 'WEBM',
					codec: 'opus',
					bitrate: 160000,
					itagItem: { ...baseStream.itagItem, id: 998, mediaFormat: 'WEBM', codec: 'opus', audioLocale: 'en', audioTrackId: 'en.1', audioTrackName: 'English', avgBitrate: 160000, bitrate: 160000 }
				})
			];
			
			const result = selectBestAudioStreams(streams);
			
			// Should prefer M4A format
			expect(result[0].format).toBe('M4A');
		});

		it('should fall back to highest bitrate when no preferred format', () => {
			const baseStream = createMockAudioStream();
			const streams = [
				createMockAudioStream({
					id: '998',
					itag: 998,
					format: 'WEBM',
					codec: 'opus',
					bitrate: 160000,
					itagItem: { ...baseStream.itagItem, id: 998, mediaFormat: 'WEBM', codec: 'opus', audioLocale: 'en', audioTrackId: 'en.0', audioTrackName: 'English', avgBitrate: 160000, bitrate: 160000 }
				}),
				createMockAudioStream({
					id: '997',
					itag: 997,
					format: 'WEBM',
					codec: 'opus',
					bitrate: 70000,
					itagItem: { ...baseStream.itagItem, id: 997, mediaFormat: 'WEBM', codec: 'opus', audioLocale: 'en', audioTrackId: 'en.1', audioTrackName: 'English', avgBitrate: 70000, bitrate: 70000 }
				})
			];
			
			const result = selectBestAudioStreams(streams);
			
			// Should select highest bitrate
			expect(result[0].bitrate).toBe(160000);
		});
	});

	describe('language priority sorting', () => {
		it('should sort undefined/original language first', () => {
			const streams = createMockMultiLanguageAudioStreams();
			
			const result = selectBestAudioStreams(streams);
			
			// First stream should be undefined/original
			expect(result[0].itagItem.audioLocale).toBe('und');
		});

		it('should sort English second', () => {
			const streams = createMockMultiLanguageAudioStreams();
			
			const result = selectBestAudioStreams(streams);
			
			// Second stream should be English
			expect(result[1].itagItem.audioLocale).toBe('en');
		});

		it('should sort other languages alphabetically after English', () => {
			const streams = createMockMultiLanguageAudioStreams();
			
			const result = selectBestAudioStreams(streams);
			
			// After und and en, should have es and fr alphabetically
			const otherLanguages = result.slice(2).map(s => s.itagItem.audioLocale);
			expect(otherLanguages[0]).toBe('es');
			expect(otherLanguages[1]).toBe('fr');
		});
	});

	describe('metadata handling', () => {
		it('should use audioLocale when available', () => {
			const baseStream = createMockAudioStream();
			const streams = [
				createMockAudioStream({
					id: '140',
					itag: 140,
					itagItem: {
						...baseStream.itagItem,
						id: 140,
						audioLocale: 'en',
						audioTrackId: 'track1',
						audioTrackName: 'English'
					}
				})
			];
			
			const result = selectBestAudioStreams(streams);
			
			expect(result[0].itagItem.audioLocale).toBe('en');
		});

		it('should fall back to audioTrackId when audioLocale missing', () => {
			const streams = createMockAudioStreamsWithMissingMetadata();
			
			const result = selectBestAudioStreams(streams);
			
			expect(result.length).toBeGreaterThan(0);
			// Should use trackId as fallback
			const streamWithTrackId = result.find(s => s.itagItem?.audioTrackId === 'track1');
			expect(streamWithTrackId).toBeDefined();
		});

		it('should use "und" when no language metadata', () => {
			const streams = createMockAudioStreamsWithMissingMetadata();
			
			const result = selectBestAudioStreams(streams);
			
			// Stream without audioLocale/trackId should be grouped as 'und'
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('stream filtering', () => {
		it('should skip video-only streams', () => {
			const streams = [
				createMockVideoStream({ id: '137', itag: 137, resolution: '1080p', quality: '1080p' }),
				createMockAudioStream({
					id: '140',
					itag: 140,
					itagItem: { ...createMockAudioStream().itagItem, audioLocale: 'en', audioTrackId: 'en.0', audioTrackName: 'English' }
				})
			];
			
			const result = selectBestAudioStreams(streams);
			
			expect(result.length).toBe(1);
			expect(result[0].videoOnly).toBe(false);
		});

		it('should handle mixed stream array', () => {
			const streams = createMockMixedStreams();
			
			const result = selectBestAudioStreams(streams);
			
			// Should only include audio streams
			expect(result.every(s => !s.videoOnly)).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('should handle empty stream array', () => {
			const result = selectBestAudioStreams([]);
			
			expect(result).toEqual([]);
		});

		it('should handle array with no audio streams', () => {
			const streams = [
				createMockVideoStream({ id: '137', itag: 137, resolution: '1080p', quality: '1080p' }),
				createMockVideoStream({ id: '136', itag: 136, resolution: '720p', quality: '720p' })
			];
			
			const result = selectBestAudioStreams(streams);
			
			expect(result).toEqual([]);
		});

		it('should handle single audio stream', () => {
			const streams = [
				createMockAudioStream({
					id: '140',
					itag: 140,
					itagItem: { ...createMockAudioStream().itagItem, audioLocale: 'en', audioTrackId: 'en.0', audioTrackName: 'English' }
				})
			];
			
			const result = selectBestAudioStreams(streams);
			
			expect(result.length).toBe(1);
			expect(result[0].id).toBe('140');
		});

		it('should handle streams with zero bitrate', () => {
			const baseStream = createMockAudioStream();
			const streams = [
				createMockAudioStream({
					id: '140',
					itag: 140,
					bitrate: 0,
					itagItem: { ...baseStream.itagItem, id: 140, audioLocale: 'en', audioTrackId: 'en.0', audioTrackName: 'English', avgBitrate: 0, bitrate: 0 }
				}),
				createMockAudioStream({
					id: '141',
					itag: 141,
					bitrate: 256000,
					itagItem: { ...baseStream.itagItem, id: 141, audioLocale: 'en', audioTrackId: 'en.1', audioTrackName: 'English', avgBitrate: 256000, bitrate: 256000 }
				})
			];
			
			const result = selectBestAudioStreams(streams);
			
			// Should select the one with defined bitrate
			expect(result[0].bitrate).toBe(256000);
		});
	});

	describe('WebM/Opus streams', () => {
		it('should handle WebM audio streams', () => {
			const streams = createMockWebMAudioStreams();
			
			const result = selectBestAudioStreams(streams);
			
			expect(result.length).toBe(1);
			expect(result[0].format).toBe('WEBM');
		});

		it('should prefer higher bitrate WebM when no M4A', () => {
			const streams = createMockWebMAudioStreams();
			
			const result = selectBestAudioStreams(streams);
			
			// Should select 251 (160kbps) over 250 (70kbps)
			expect(result[0].id).toBe('251');
			expect(result[0].bitrate).toBe(160000);
		});
	});
});

// =============================================================================
// logSelectedStreams() Tests
// =============================================================================

describe('logSelectedStreams', () => {
	beforeEach(() => {
		// Mock console methods
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	describe('video stream logging', () => {
		it('should log video stream information', () => {
			const videoStreams = [
				createMockVideoStream({ resolution: '1080p', codec: 'avc1', bitrate: 5000000 })
			];
			const audioStreams: Stream[] = [];
			
			logSelectedStreams(videoStreams, audioStreams);
			
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('Selected 1 video streams')
			);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('1080p')
			);
		});

		it('should warn when no video streams', () => {
			logSelectedStreams([], []);
			
			expect(console.warn).toHaveBeenCalledWith('No suitable video streams found');
		});

		it('should log multiple video streams', () => {
			const videoStreams = createMockVideoStreamSet().slice(0, 3);
			
			logSelectedStreams(videoStreams, []);
			
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('Selected 3 video streams')
			);
		});
	});

	describe('audio stream logging', () => {
		it('should log audio stream information with language', () => {
			const audioStreams = [
				createMockAudioStream({
					itagItem: {
						...createMockAudioStream().itagItem,
						audioLocale: 'en',
						audioTrackId: 'en.0',
						audioTrackName: 'English'
					},
					codec: 'mp4a',
					bitrate: 128000
				})
			];
			
			logSelectedStreams([], audioStreams);
			
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('Selected 1 audio streams')
			);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('English')
			);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('en')
			);
		});

		it('should warn when no audio streams', () => {
			logSelectedStreams([], []);
			
			expect(console.warn).toHaveBeenCalledWith('No suitable audio streams found');
		});

		it('should log multiple audio streams', () => {
			const audioStreams = createMockMultiLanguageAudioStreams().slice(0, 3);
			
			logSelectedStreams([], audioStreams);
			
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('Selected 3 audio streams')
			);
		});

		it('should handle streams with missing language name', () => {
			const baseStream = createMockAudioStream();
			const audioStreams = [
				createMockAudioStream({
					itagItem: {
						...baseStream.itagItem,
						audioLocale: 'en',
						audioTrackId: 'en.0',
						audioTrackName: undefined
					}
				})
			];
			
			logSelectedStreams([], audioStreams);
			
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('Unknown')
			);
		});
	});

	describe('combined logging', () => {
		it('should log both video and audio streams', () => {
			const videoStreams = [createMockVideoStream({ resolution: '1080p', quality: '1080p' })];
			const audioStreams = [createMockAudioStream()];
			
			logSelectedStreams(videoStreams, audioStreams);
			
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('video streams')
			);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('audio streams')
			);
		});
	});
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Stream Selection Integration', () => {
	it('should select optimal streams from complete stream set', () => {
		const allStreams = [
			...createMockVideoStreamSet(),
			...createMockMultiLanguageAudioStreams()
		];
		
		const videoStreams = selectVideoStreams(allStreams);
		const audioStreams = selectBestAudioStreams(allStreams);
		
		// Should have multiple video qualities
		expect(videoStreams.length).toBeGreaterThan(3);
		
		// Should have one stream per language
		expect(audioStreams.length).toBe(4); // und, en, es, fr
		
		// Should be properly sorted
		expect(audioStreams[0].itagItem.audioLocale).toBe('und');
		expect(audioStreams[1].itagItem.audioLocale).toBe('en');
		
		// All video streams should be video-only
		expect(videoStreams.every(s => s.videoOnly)).toBe(true);
		
		// All audio streams should not be video-only
		expect(audioStreams.every(s => !s.videoOnly)).toBe(true);
	});

	it('should handle real-world stream scenario', () => {
		const baseStream = createMockAudioStream();
		// Simulates a typical YouTube video with multiple qualities and languages
		const streams = [
			// Video streams
			createMockVideoStream({ id: '137', itag: 137, resolution: '1080p', quality: '1080p', bitrate: 5000000 }),
			createMockVideoStream({ id: '136', itag: 136, resolution: '720p', quality: '720p', bitrate: 2500000 }),
			createMockVideoStream({ id: '135', itag: 135, resolution: '480p', quality: '480p', bitrate: 1000000 }),
			
			// English audio (multiple qualities)
			createMockAudioStream({
				id: '141',
				itag: 141,
				bitrate: 256000,
				itagItem: { ...baseStream.itagItem, id: 141, audioLocale: 'en', audioTrackId: 'en.0', audioTrackName: 'English', avgBitrate: 256000, bitrate: 256000 }
			}),
			createMockAudioStream({
				id: '140',
				itag: 140,
				bitrate: 128000,
				itagItem: { ...baseStream.itagItem, id: 140, audioLocale: 'en', audioTrackId: 'en.1', audioTrackName: 'English', avgBitrate: 128000, bitrate: 128000 }
			}),
			
			// Spanish audio
			createMockAudioStream({
				id: '141',
				itag: 141,
				bitrate: 256000,
				itagItem: { ...baseStream.itagItem, id: 141, audioLocale: 'es', audioTrackId: 'es.0', audioTrackName: 'Spanish', avgBitrate: 256000, bitrate: 256000 }
			})
		];
		
		const videoStreams = selectVideoStreams(streams);
		const audioStreams = selectBestAudioStreams(streams);
		
		// Should select all 3 video qualities
		expect(videoStreams.length).toBe(3);
		expect(videoStreams.map(s => s.resolution)).toEqual(['1080p', '720p', '480p']);
		
		// Should select best audio for each language
		expect(audioStreams.length).toBe(2); // English and Spanish
		expect(audioStreams.every(s => s.bitrate === 256000)).toBe(true);
		
		// English should be first
		expect(audioStreams[0].itagItem.audioLocale).toBe('en');
	});
});
