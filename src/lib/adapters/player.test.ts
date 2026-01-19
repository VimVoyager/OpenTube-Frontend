/**
 * Test Suite: player.ts
 * 
 * Tests for video player configuration adaptation
 */

import { describe, it, expect } from 'vitest';
import { adaptPlayerConfig } from './player';
import type { VideoPlayerConfig } from './types';

describe('adaptPlayerConfig', () => {
	describe('successful player configuration', () => {
		it('should create player config with all provided parameters', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 180;
			const posterUrl = 'https://example.com/poster.jpg';

			const result: VideoPlayerConfig = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result).toEqual({
				manifestUrl: 'blob:http://localhost:5173/abc-123',
				duration: 180,
				poster: 'https://example.com/poster.jpg'
			});

			expect(result).toHaveProperty('manifestUrl');
			expect(result).toHaveProperty('duration');
			expect(result).toHaveProperty('poster');
		});

		it('should handle long DASH manifest URLs', () => {
			const manifestUrl =
				'blob:http://localhost:5173/very-long-manifest-url-with-many-characters-' +
				'that-represents-a-typical-blob-url-generated-by-browser';
			const duration = 450;
			const posterUrl = 'https://example.com/poster.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.manifestUrl).toBe(manifestUrl);
			expect(result.manifestUrl.length).toBeGreaterThan(50);
		});
	});

	describe('edge cases', () => {
		it('should handle zero duration', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 0;
			const posterUrl = 'https://example.com/poster.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.duration).toBe(0);
		});

		it('should handle very long duration', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 86400; // 24 hours
			const posterUrl = 'https://example.com/poster.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.duration).toBe(86400);
		});

		it('should handle empty manifest URL', () => {
			const manifestUrl = '';
			const duration = 180;
			const posterUrl = 'https://example.com/poster.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.manifestUrl).toBe('');
		});

		it('should handle empty poster URL', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 180;
			const posterUrl = '';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.poster).toBe('');
		});

		it('should handle all empty values', () => {
			const manifestUrl = '';
			const duration = 0;
			const posterUrl = '';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result).toEqual({
				manifestUrl: '',
				duration: 0,
				poster: ''
			});
		});
	});

	describe('poster URL handling', () => {
		it('should accept full HTTP URLs for poster', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 180;
			const posterUrl = 'https://cdn.example.com/images/poster.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.poster).toBe('https://cdn.example.com/images/poster.jpg');
		});

		it('should accept relative URLs for poster', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 180;
			const posterUrl = '/images/poster.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.poster).toBe('/images/poster.jpg');
		});

		it('should accept data URLs for poster', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 180;
			const posterUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.poster).toContain('data:image/png;base64');
		});
	});

	describe('duration handling', () => {
		it('should handle typical video durations', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const durations = [30, 60, 120, 300, 600, 1800, 3600]; // Various durations in seconds
			const posterUrl = 'https://example.com/poster.jpg';

			durations.forEach((duration) => {
				const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);
				expect(result.duration).toBe(duration);
			});
		});

		it('should handle fractional seconds', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 180.5;
			const posterUrl = 'https://example.com/poster.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.duration).toBe(180.5);
		});

		it('should handle negative duration (edge case)', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = -1;
			const posterUrl = 'https://example.com/poster.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.duration).toBe(-1);
		});
	});

	describe('immutability', () => {
		it('should return a new object each time', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 180;
			const posterUrl = 'https://example.com/poster.jpg';

			const result1 = adaptPlayerConfig(manifestUrl, duration, posterUrl);
			const result2 = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result1).toEqual(result2);
			expect(result1).not.toBe(result2); // Different objects
		});

		it('should not modify input parameters', () => {
			const manifestUrl = 'blob:http://localhost:5173/abc-123';
			const duration = 180;
			const posterUrl = 'https://example.com/poster.jpg';
			const originalManifestUrl = manifestUrl;
			const originalDuration = duration;
			const originalPosterUrl = posterUrl;

			adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(manifestUrl).toBe(originalManifestUrl);
			expect(duration).toBe(originalDuration);
			expect(posterUrl).toBe(originalPosterUrl);
		});
	});

	describe('integration scenarios', () => {
		it('should create config for typical video playback scenario', () => {
			const manifestUrl = 'blob:http://localhost:5173/manifest-xyz';
			const duration = 176; // 2:56
			const posterUrl = 'https://i.ytimg.com/vi/abc123/maxresdefault.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.manifestUrl).toBeTruthy();
			expect(result.duration).toBeGreaterThan(0);
			expect(result.poster).toContain('ytimg.com');
		});

		it('should create config for live stream scenario (zero duration)', () => {
			const manifestUrl = 'blob:http://localhost:5173/live-stream';
			const duration = 0; // Live streams might have 0 duration
			const posterUrl = 'https://example.com/live-thumbnail.jpg';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result.manifestUrl).toBeTruthy();
			expect(result.duration).toBe(0);
			expect(result.poster).toBeTruthy();
		});

		it('should create config for error recovery scenario (empty values)', () => {
			const manifestUrl = '';
			const duration = 0;
			const posterUrl = '';

			const result = adaptPlayerConfig(manifestUrl, duration, posterUrl);

			expect(result).toHaveProperty('manifestUrl');
			expect(result).toHaveProperty('duration');
			expect(result).toHaveProperty('poster');
		});
	});
});