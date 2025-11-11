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