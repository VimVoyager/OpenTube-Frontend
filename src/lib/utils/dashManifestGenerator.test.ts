/**
 * Test Suite: dashManifestGenerator.ts
 * 
 * Tests for DASH manifest generation with video, audio, and subtitle streams
 */

import { describe, it, expect, vi } from 'vitest';
import { 
    generateDashManifest,
    type DashManifestConfig
 } from './dashManifestGenerator';
import {
	createMockVideoStream,
	createMockAudioStream,
	createMockSubtitle,
	createMockVideoStreamSet,
	createMockMultiLanguageAudioStreams,
	createMockSubtitleSet,
	createMockDashConfig,
	createMinimalVideoConfig,
	createMinimalAudioConfig,
	createStreamsWithoutByteRanges,
	createStreamsWithPartialByteRanges,
	createMockWebMStreams,
	createStreamsWithSpecialCharacters,
	createAudioStreamsWithUndefinedLanguage
} from '../../tests/fixtures/mockDashData';


// =============================================================================
// generateDashManifest() Tests - Basic Functionality
// =============================================================================

describe('generateDashManifest', () => {
	describe('basic functionality', () => {
		it('should generate valid XML manifest', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(manifest).toContain('<MPD');
			expect(manifest).toContain('</MPD>');
		});

		it('should include DASH namespace', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('xmlns="urn:mpeg:dash:schema:mpd:2011"');
		});

		it('should set type to static', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('type="static"');
		});

		it('should set correct DASH profile', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('profiles="urn:mpeg:dash:profile:isoff-on-demand:2011"');
		});

		it('should include Period element', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<Period');
			expect(manifest).toContain('</Period>');
		});
	});

	describe('duration formatting', () => {
		it('should format duration in ISO 8601 format', () => {
			const config = createMinimalVideoConfig();
			config.duration = 120; // 2 minutes
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('mediaPresentationDuration="PT2M"');
		});

		it('should handle hours in duration', () => {
			const config = createMinimalVideoConfig();
			config.duration = 3665; // 1h 1m 5s
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT1H1M5S');
		});

		it('should handle seconds only', () => {
			const config = createMinimalVideoConfig();
			config.duration = 45;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT45S');
		});

		it('should handle fractional seconds', () => {
			const config = createMinimalVideoConfig();
			config.duration = 10.5;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT10.500S');
		});

		it('should handle zero duration', () => {
			const config = createMinimalVideoConfig();
			config.duration = 0;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT0S');
		});

		it('should handle very long durations', () => {
			const config = createMinimalVideoConfig();
			config.duration = 36000; // 10 hours
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT10H');
		});
	});

	describe('validation', () => {
		it('should throw error when no streams provided', () => {
			const config: DashManifestConfig = {
				duration: 120
			};
			
			expect(() => generateDashManifest(config)).toThrow(
				'At least one stream (video or audio) must be provided'
			);
		});

		it('should throw error when empty streams provided', () => {
			const config: DashManifestConfig = {
				videoStreams: [],
				audioStreams: [],
				duration: 120
			};
			
			expect(() => generateDashManifest(config)).toThrow(
				'At least one stream (video or audio) must be provided'
			);
		});

		it('should warn when duration is zero', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const config = createMinimalVideoConfig();
			config.duration = 0;
			
			generateDashManifest(config);
			
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Duration is 0 or undefined')
			);
			
			warnSpy.mockRestore();
		});

		it('should accept video-only configuration', () => {
			const config = createMinimalVideoConfig();
			
			expect(() => generateDashManifest(config)).not.toThrow();
		});

		it('should accept audio-only configuration', () => {
			const config = createMinimalAudioConfig();
			
			expect(() => generateDashManifest(config)).not.toThrow();
		});
	});
});

// =============================================================================
// Video Adaptation Set Tests
// =============================================================================

describe('generateDashManifest - Video Streams', () => {
	describe('video adaptation set', () => {
		it('should generate video AdaptationSet', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<AdaptationSet');
			expect(manifest).toContain('contentType="video"');
		});

		it('should set correct MIME type for video', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('mimeType="video/mp4"');
		});

		it('should set video adaptation set ID to 0', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toMatch(/<AdaptationSet[^>]*id="0"/);
		});

		it('should set subsegmentAlignment to true', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toMatch(/<AdaptationSet[^>]*subsegmentAlignment="true"/);
		});

		it('should handle WebM video streams', () => {
			const config: DashManifestConfig = {
				videoStreams: createMockWebMStreams(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('mimeType="video/webm"');
			expect(manifest).toContain('vp09.00.10.08');
		});
	});

	describe('video representations', () => {
		it('should generate Representation for each video stream', () => {
			const config: DashManifestConfig = {
				videoStreams: createMockVideoStreamSet(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('id="video-1"');
			expect(manifest).toContain('id="video-2"');
			expect(manifest).toContain('id="video-3"');
		});

		it('should include bandwidth in representation', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].bandwidth = 5000000;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('bandwidth="5000000"');
		});

		it('should include width and height', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].width = 1920;
			config.videoStreams![0].height = 1080;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('width="1920"');
			expect(manifest).toContain('height="1080"');
		});

		it('should include frameRate', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].frameRate = 60;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('frameRate="60"');
		});

		it('should include normalized codec', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].codec = 'avc1.640028';
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('codecs="avc1.640028"');
		});

		it('should normalize codec strings', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].codec = 'h264';
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('codecs="avc1.42E01E"');
		});

		it('should include BaseURL with stream URL', () => {
			const config = createMinimalVideoConfig();
			const url = 'https://example.com/video.mp4';
			config.videoStreams![0].url = url;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain(`<BaseURL>${url}</BaseURL>`);
		});

		it('should use default values when optional fields missing', () => {
			const config: DashManifestConfig = {
				videoStreams: [{
					url: 'https://example.com/video.mp4',
					codec: 'avc1.640028'
				}],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('bandwidth="1000000"'); // default
			expect(manifest).toContain('width="1920"'); // default
			expect(manifest).toContain('height="1080"'); // default
			expect(manifest).toContain('frameRate="30"'); // default
		});
	});

	describe('byte ranges', () => {
		it('should include SegmentBase with byte ranges', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].initStart = 0;
			config.videoStreams![0].initEnd = 740;
			config.videoStreams![0].indexStart = 741;
			config.videoStreams![0].indexEnd = 2500;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<SegmentBase');
			expect(manifest).toContain('indexRange="741-2500"');
			expect(manifest).toContain('<Initialization range="0-740"');
		});

		it('should omit SegmentBase when byte ranges missing', () => {
			const config: DashManifestConfig = {
				videoStreams: createStreamsWithoutByteRanges(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).not.toContain('<SegmentBase');
		});

		it('should omit SegmentBase when byte ranges incomplete', () => {
			const config: DashManifestConfig = {
				videoStreams: createStreamsWithPartialByteRanges(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).not.toContain('<SegmentBase');
		});
	});
});