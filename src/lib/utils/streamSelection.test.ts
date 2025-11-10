/**
 * Test Suite: streamSelection.ts
 * 
 * Tests for video and audio stream selection logic
 */

import { describe, it, expect } from 'vitest';
import { selectVideoStreams } from './streamSelection';
// import type { Stream } from '$lib/types';
import {
    createMockAudioStream,
	createMockMixedStreams,
	createMockStreamsWithVariants,
	createMockVideoStream,
	createMockVideoStreamSet,
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