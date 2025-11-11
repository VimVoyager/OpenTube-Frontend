/**
 * Test Suite: codecUtils.ts
 * 
 * Tests for codec normalization and MIME type inference utilities
 */

import { describe, it, expect } from 'vitest';
import {
	normalizeDashCodec,
} from './codecUtils';

// =============================================================================
// normalizeDashCodec() Tests
// =============================================================================

describe('normalizeDashCodec', () => {
	describe('already normalized codecs', () => {
		it('should return avc1 codecs unchanged', () => {
			expect(normalizeDashCodec('avc1.42E01E')).toBe('avc1.42E01E');
			expect(normalizeDashCodec('avc1.640028')).toBe('avc1.640028');
			expect(normalizeDashCodec('avc1.64002a')).toBe('avc1.64002a');
		});

		it('should return vp09 codecs unchanged', () => {
			expect(normalizeDashCodec('vp09.00.10.08')).toBe('vp09.00.10.08');
			expect(normalizeDashCodec('vp09.01.20.08')).toBe('vp09.01.20.08');
		});

		it('should return av01 codecs unchanged', () => {
			expect(normalizeDashCodec('av01.0.05M.08')).toBe('av01.0.05M.08');
			expect(normalizeDashCodec('av01.0.08M.08')).toBe('av01.0.08M.08');
		});

		it('should return mp4a codecs unchanged', () => {
			expect(normalizeDashCodec('mp4a.40.2')).toBe('mp4a.40.2');
			expect(normalizeDashCodec('mp4a.40.5')).toBe('mp4a.40.5');
		});

		it('should return opus codec unchanged', () => {
			expect(normalizeDashCodec('opus')).toBe('opus');
		});

		it('should return vorbis codec unchanged', () => {
			expect(normalizeDashCodec('vorbis')).toBe('vorbis');
		});
	});

	describe('codec normalization', () => {
		it('should normalize h264 variants to avc1', () => {
			expect(normalizeDashCodec('h264')).toBe('avc1.42E01E');
			expect(normalizeDashCodec('H264')).toBe('avc1.42E01E');
			expect(normalizeDashCodec('H.264')).toBe('avc1.42E01E');
		});

		it('should normalize vp9 variants to vp09', () => {
			expect(normalizeDashCodec('vp9')).toBe('vp09.00.10.08');
			expect(normalizeDashCodec('VP9')).toBe('vp09.00.10.08');
			expect(normalizeDashCodec('VP-9')).toBe('vp09.00.10.08');
		});

		it('should normalize av1 variants to av01', () => {
			expect(normalizeDashCodec('av1')).toBe('av01.0.05M.08');
			expect(normalizeDashCodec('AV1')).toBe('av01.0.05M.08');
			expect(normalizeDashCodec('AV-1')).toBe('av01.0.05M.08');
		});

		it('should normalize aac variants to mp4a', () => {
			expect(normalizeDashCodec('aac')).toBe('mp4a.40.2');
			expect(normalizeDashCodec('AAC')).toBe('mp4a.40.2');
			expect(normalizeDashCodec('aac-lc')).toBe('mp4a.40.2');
		});

		it('should normalize opus variants', () => {
			expect(normalizeDashCodec('OPUS')).toBe('opus');
			expect(normalizeDashCodec('Opus')).toBe('opus');
		});

		it('should normalize vorbis variants', () => {
			expect(normalizeDashCodec('VORBIS')).toBe('vorbis');
			expect(normalizeDashCodec('Vorbis')).toBe('vorbis');
		});
	});

	describe('case sensitivity', () => {
		it('should handle uppercase codecs', () => {
			expect(normalizeDashCodec('AVC1.42E01E')).toBe('AVC1.42E01E');
			expect(normalizeDashCodec('VP09.00.10.08')).toBe('VP09.00.10.08');
			expect(normalizeDashCodec('MP4A.40.2')).toBe('MP4A.40.2');
		});

		it('should handle mixed case codecs', () => {
			expect(normalizeDashCodec('Avc1.42E01E')).toBe('Avc1.42E01E');
			expect(normalizeDashCodec('Mp4a.40.2')).toBe('Mp4a.40.2');
		});

		it('should normalize case-insensitive common names', () => {
			expect(normalizeDashCodec('H264')).toBe('avc1.42E01E');
			expect(normalizeDashCodec('h264')).toBe('avc1.42E01E');
			expect(normalizeDashCodec('VP9')).toBe('vp09.00.10.08');
			expect(normalizeDashCodec('vp9')).toBe('vp09.00.10.08');
		});
	});

	describe('unknown codecs', () => {
		it('should return unknown codecs unchanged', () => {
			expect(normalizeDashCodec('unknown')).toBe('unknown');
			expect(normalizeDashCodec('xyz123')).toBe('xyz123');
			expect(normalizeDashCodec('custom-codec')).toBe('custom-codec');
		});

		it('should handle empty string', () => {
			expect(normalizeDashCodec('')).toBe('');
		});

		it('should handle codecs with special characters', () => {
			expect(normalizeDashCodec('codec-with-dashes')).toBe('codec-with-dashes');
			expect(normalizeDashCodec('codec_with_underscores')).toBe('codec_with_underscores');
		});
	});

	describe('partial matches', () => {
		it('should match codecs containing h264', () => {
			expect(normalizeDashCodec('video-h264-main')).toBe('avc1.42E01E');
			expect(normalizeDashCodec('h264-baseline')).toBe('avc1.42E01E');
		});

		it('should match codecs containing vp9', () => {
			expect(normalizeDashCodec('video-vp9-profile0')).toBe('vp09.00.10.08');
			expect(normalizeDashCodec('vp9-hdr')).toBe('vp09.00.10.08');
		});

		it('should match codecs containing aac', () => {
			expect(normalizeDashCodec('audio-aac-stereo')).toBe('mp4a.40.2');
			expect(normalizeDashCodec('aac-he')).toBe('mp4a.40.2');
		});
	});

	describe('edge cases', () => {
		it('should handle very long codec strings', () => {
			const longCodec = 'a'.repeat(1000);
			expect(normalizeDashCodec(longCodec)).toBe(longCodec);
		});

		it('should handle codec strings with numbers', () => {
			expect(normalizeDashCodec('h264-1080p')).toBe('avc1.42E01E');
			expect(normalizeDashCodec('vp9-4k')).toBe('vp09.00.10.08');
		});

		it('should handle codec strings with dots', () => {
			expect(normalizeDashCodec('h264.main.profile')).toBe('avc1.42E01E');
		});
	});
});