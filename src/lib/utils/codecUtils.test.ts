/**
 * Test Suite: codecUtils.ts
 * 
 * Tests for codec normalization and MIME type inference utilities
 */

import { describe, it, expect } from 'vitest';
import {
	inferMimeType,
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

// =============================================================================
// inferMimeType() Tests
// =============================================================================

describe('inferMimeType', () => {
	describe('video formats', () => {
		it('should infer video/mp4 from MPEG_4 format', () => {
			expect(inferMimeType('MPEG_4', undefined, true)).toBe('video/mp4');
			expect(inferMimeType('mpeg_4', undefined, true)).toBe('video/mp4');
		});

		it('should infer video/mp4 from MP4 format', () => {
			expect(inferMimeType('MP4', undefined, true)).toBe('video/mp4');
			expect(inferMimeType('mp4', undefined, true)).toBe('video/mp4');
		});

		it('should infer video/webm from WEBM format', () => {
			expect(inferMimeType('WEBM', undefined, true)).toBe('video/webm');
			expect(inferMimeType('webm', undefined, true)).toBe('video/webm');
		});

		it('should infer video/webm from VP9 format', () => {
			expect(inferMimeType('VP9', undefined, true)).toBe('video/webm');
			expect(inferMimeType('V_VP9', undefined, true)).toBe('video/webm');
		});
	});

	describe('audio formats', () => {
		it('should infer audio/mp4 from M4A format', () => {
			expect(inferMimeType('M4A', undefined, false)).toBe('audio/mp4');
			expect(inferMimeType('m4a', undefined, false)).toBe('audio/mp4');
		});

		it('should infer audio/mp4 from MP4A format', () => {
			expect(inferMimeType('MP4A', undefined, false)).toBe('audio/mp4');
			expect(inferMimeType('mp4a', undefined, false)).toBe('audio/mp4');
		});

		it('should infer audio/webm from WEBMA format', () => {
			expect(inferMimeType('WEBMA', undefined, false)).toBe('audio/webm');
			expect(inferMimeType('webma', undefined, false)).toBe('audio/webm');
		});

		it('should infer audio/webm from OPUS format', () => {
			expect(inferMimeType('OPUS', undefined, false)).toBe('audio/webm');
			expect(inferMimeType('opus', undefined, false)).toBe('audio/webm');
		});

		it('should infer audio/webm from VORBIS format', () => {
			expect(inferMimeType('VORBIS', undefined, false)).toBe('audio/webm');
			expect(inferMimeType('vorbis', undefined, false)).toBe('audio/webm');
		});
	});

	describe('codec-based inference', () => {
		describe('video codecs', () => {
			it('should infer video/mp4 from avc1 codec', () => {
				expect(inferMimeType(undefined, 'avc1.42E01E', true)).toBe('video/mp4');
				expect(inferMimeType(undefined, 'AVC1.640028', true)).toBe('video/mp4');
			});

			it('should infer video/mp4 from h264 codec', () => {
				expect(inferMimeType(undefined, 'h264', true)).toBe('video/mp4');
				expect(inferMimeType(undefined, 'H264', true)).toBe('video/mp4');
			});

			it('should infer video/webm from vp09 codec', () => {
				expect(inferMimeType(undefined, 'vp09.00.10.08', true)).toBe('video/webm');
				expect(inferMimeType(undefined, 'VP09.01.20.08', true)).toBe('video/webm');
			});

			it('should infer video/webm from vp9 codec', () => {
				expect(inferMimeType(undefined, 'vp9', true)).toBe('video/webm');
				expect(inferMimeType(undefined, 'VP9', true)).toBe('video/webm');
			});

			it('should infer video/mp4 from av01 codec', () => {
				expect(inferMimeType(undefined, 'av01.0.05M.08', true)).toBe('video/mp4');
				expect(inferMimeType(undefined, 'AV01.0.08M.08', true)).toBe('video/mp4');
			});

			it('should infer video/mp4 from av1 codec', () => {
				expect(inferMimeType(undefined, 'av1', true)).toBe('video/mp4');
				expect(inferMimeType(undefined, 'AV1', true)).toBe('video/mp4');
			});
		});

		describe('audio codecs', () => {
			it('should infer audio/mp4 from mp4a codec', () => {
				expect(inferMimeType(undefined, 'mp4a.40.2', false)).toBe('audio/mp4');
				expect(inferMimeType(undefined, 'MP4A.40.5', false)).toBe('audio/mp4');
			});

			it('should infer audio/webm from opus codec', () => {
				expect(inferMimeType(undefined, 'opus', false)).toBe('audio/webm');
				expect(inferMimeType(undefined, 'OPUS', false)).toBe('audio/webm');
			});

			it('should infer audio/webm from vorbis codec', () => {
				expect(inferMimeType(undefined, 'vorbis', false)).toBe('audio/webm');
				expect(inferMimeType(undefined, 'VORBIS', false)).toBe('audio/webm');
			});
		});
	});

	describe('priority and fallback', () => {
		it('should prioritize format over codec', () => {
			// Even though codec says webm, format MP4 should win
			expect(inferMimeType('MP4', 'vp9', true)).toBe('video/mp4');
			expect(inferMimeType('WEBM', 'avc1.42E01E', true)).toBe('video/webm');
		});

		it('should use codec when format is undefined', () => {
			expect(inferMimeType(undefined, 'avc1.42E01E', true)).toBe('video/mp4');
			expect(inferMimeType(undefined, 'vp09.00.10.08', true)).toBe('video/webm');
		});

		it('should fall back to video/mp4 for unknown video format/codec', () => {
			expect(inferMimeType('unknown', 'unknown', true)).toBe('video/mp4');
			expect(inferMimeType(undefined, undefined, true)).toBe('video/mp4');
		});

		it('should fall back to audio/mp4 for unknown audio format/codec', () => {
			expect(inferMimeType('unknown', 'unknown', false)).toBe('audio/mp4');
			expect(inferMimeType(undefined, undefined, false)).toBe('audio/mp4');
		});

		it('should handle empty strings as undefined', () => {
			expect(inferMimeType('', '', true)).toBe('video/mp4');
			expect(inferMimeType('', '', false)).toBe('audio/mp4');
		});
	});

	describe('case sensitivity', () => {
		it('should handle mixed case formats', () => {
			expect(inferMimeType('Mp4', undefined, true)).toBe('video/mp4');
			expect(inferMimeType('WeBm', undefined, true)).toBe('video/webm');
			expect(inferMimeType('M4a', undefined, false)).toBe('audio/mp4');
		});

		it('should handle mixed case codecs', () => {
			expect(inferMimeType(undefined, 'Avc1.42E01E', true)).toBe('video/mp4');
			expect(inferMimeType(undefined, 'Vp09.00.10.08', true)).toBe('video/webm');
			expect(inferMimeType(undefined, 'Mp4a.40.2', false)).toBe('audio/mp4');
		});
	});

	describe('real-world scenarios', () => {
		it('should handle typical YouTube video streams', () => {
			// 1080p MP4 video
			expect(inferMimeType('MPEG_4', 'avc1.640028', true)).toBe('video/mp4');
			
			// VP9 WebM video
			expect(inferMimeType('WEBM', 'vp09.00.10.08', true)).toBe('video/webm');
			
			// AV1 video
			expect(inferMimeType('MP4', 'av01.0.05M.08', true)).toBe('video/mp4');
		});

		it('should handle typical YouTube audio streams', () => {
			// M4A AAC audio
			expect(inferMimeType('M4A', 'mp4a.40.2', false)).toBe('audio/mp4');
			
			// WebM Opus audio
			expect(inferMimeType('WEBM', 'opus', false)).toBe('video/webm'); // Note: format says WEBM which is video
			
			// Using WEBMA for audio
			expect(inferMimeType('WEBMA', 'opus', false)).toBe('audio/webm');
		});

		it('should handle format without codec', () => {
			expect(inferMimeType('MP4', undefined, true)).toBe('video/mp4');
			expect(inferMimeType('WEBM', undefined, true)).toBe('video/webm');
			expect(inferMimeType('M4A', undefined, false)).toBe('audio/mp4');
		});

		it('should handle codec without format', () => {
			expect(inferMimeType(undefined, 'avc1.640028', true)).toBe('video/mp4');
			expect(inferMimeType(undefined, 'vp09.00.10.08', true)).toBe('video/webm');
			expect(inferMimeType(undefined, 'mp4a.40.2', false)).toBe('audio/mp4');
		});

		it('should handle both format and codec provided', () => {
			expect(inferMimeType('MP4', 'avc1.640028', true)).toBe('video/mp4');
			expect(inferMimeType('WEBM', 'vp09.00.10.08', true)).toBe('video/webm');
			expect(inferMimeType('M4A', 'mp4a.40.2', false)).toBe('audio/mp4');
		});
	});

	describe('edge cases', () => {
		it('should handle null-like values', () => {
			expect(inferMimeType(undefined, undefined, true)).toBe('video/mp4');
			expect(inferMimeType(undefined, undefined, false)).toBe('audio/mp4');
		});

		it('should handle very long format strings', () => {
			const longFormat = 'MP4' + 'X'.repeat(1000);
			expect(inferMimeType(longFormat, undefined, true)).toBe('video/mp4');
		});

		it('should handle very long codec strings', () => {
			const longCodec = 'avc1.' + '0'.repeat(1000);
			expect(inferMimeType(undefined, longCodec, true)).toBe('video/mp4');
		});

		it('should handle format/codec with special characters', () => {
			expect(inferMimeType('MP4-VIDEO', undefined, true)).toBe('video/mp4');
			expect(inferMimeType(undefined, 'avc1-profile', true)).toBe('video/mp4');
		});
	});

	describe('isVideo parameter behavior', () => {
		it('should affect fallback MIME type', () => {
			// When both format and codec are unknown, isVideo matters
			expect(inferMimeType('unknown', 'unknown', true)).toBe('video/mp4');
			expect(inferMimeType('unknown', 'unknown', false)).toBe('audio/mp4');
		});

		it('should not affect MIME type when format is known', () => {
			// Format determines MIME type regardless of isVideo
			expect(inferMimeType('MP4', undefined, true)).toBe('video/mp4');
			expect(inferMimeType('M4A', undefined, true)).toBe('audio/mp4');
			expect(inferMimeType('WEBM', undefined, false)).toBe('video/webm');
		});

		it('should not affect MIME type when codec is known', () => {
			// Codec determines MIME type regardless of isVideo (when format is undefined)
			expect(inferMimeType(undefined, 'avc1.42E01E', false)).toBe('video/mp4');
			expect(inferMimeType(undefined, 'mp4a.40.2', true)).toBe('audio/mp4');
		});
	});
});