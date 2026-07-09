/**
 * Test Suite: codecUtils.ts
 *
 * Tests for codec normalization and MIME type inference utilities
 */

import { describe, it, expect } from 'vitest';
import { inferMimeType, normalizeDashCodec } from './codecUtils';

describe('normalizeDashCodec', () => {
	it.each([
		['avc1.42E01E'],
		['avc1.640028'],
		['vp09.00.10.08'],
		['av01.0.05M.08'],
		['mp4a.40.2'],
		['AVC1.42E01E'],
		['Mp4a.40.2'],
		['VP09.00.10.08']
	])('should return already-normalized codec %s unchanged', (codec) => {
		expect(normalizeDashCodec(codec)).toBe(codec);
	});

	it.each([
		['h264', 'avc1.42E01E'],
		['H.264', 'avc1.42E01E'],
		['video-h264-main', 'avc1.42E01E'],
		['h264.main.profile', 'avc1.42E01E'],
		['vp9', 'vp09.00.10.08'],
		['VP-9', 'vp09.00.10.08'],
		['vp9-hdr', 'vp09.00.10.08'],
		['av1', 'av01.0.05M.08'],
		['AV-1', 'av01.0.05M.08'],
		['aac', 'mp4a.40.2'],
		['aac-lc', 'mp4a.40.2'],
		['audio-aac-stereo', 'mp4a.40.2'],
		['opus', 'opus'],
		['OPUS', 'opus'],
		['vorbis', 'vorbis'],
		['VORBIS', 'vorbis']
	])('should normalize %s to %s', (input, expected) => {
		expect(normalizeDashCodec(input)).toBe(expected);
	});

	it.each([['unknown'], ['xyz123'], ['custom-codec'], ['codec_with_underscores'], ['']])(
		'should return unrecognised codec %j unchanged',
		(codec) => {
			expect(normalizeDashCodec(codec)).toBe(codec);
		}
	);
});

describe('inferMimeType', () => {
	it.each([
		['MPEG_4', true, 'video/mp4'],
		['mp4', true, 'video/mp4'],
		['WEBM', true, 'video/webm'],
		['WeBm', true, 'video/webm'],
		['V_VP9', true, 'video/webm'],
		['VP9', true, 'video/webm'],
		['M4A', false, 'audio/mp4'],
		['mp4a', false, 'audio/mp4'],
		['WEBMA', false, 'audio/webm'],
		['OPUS', false, 'audio/webm'],
		['VORBIS', false, 'audio/webm'],
		// format wins over isVideo:
		['M4A', true, 'audio/mp4'],
		['WEBM', false, 'video/webm'] // known quirk: WEBM maps to video even for audio streams
	])('should infer %s (isVideo: %s) as %s from format', (format, isVideo, expected) => {
		expect(inferMimeType(format, undefined, isVideo)).toBe(expected);
	});

	it.each([
		['avc1.42E01E', true, 'video/mp4'],
		['h264', true, 'video/mp4'],
		['vp09.00.10.08', true, 'video/webm'],
		['VP9', true, 'video/webm'],
		['av01.0.05M.08', true, 'video/mp4'],
		['av1', true, 'video/mp4'],
		['mp4a.40.2', false, 'audio/mp4'],
		['opus', false, 'audio/webm'],
		['vorbis', false, 'audio/webm'],
		// codec wins over isVideo:
		['avc1.42E01E', false, 'video/mp4'],
		['mp4a.40.2', true, 'audio/mp4']
	])(
		'should infer codec %s (isVideo: %s) as %s when format is absent',
		(codec, isVideo, expected) => {
			expect(inferMimeType(undefined, codec, isVideo)).toBe(expected);
		}
	);

	it('should prioritize format over codec when both are recognised', () => {
		expect(inferMimeType('MP4', 'vp9', true)).toBe('video/mp4');
		expect(inferMimeType('WEBM', 'avc1.42E01E', true)).toBe('video/webm');
	});

	it('should fall back to codec when the format is unrecognised', () => {
		expect(inferMimeType('MP4-VIDEO', 'vp09.00.10.08', true)).toBe('video/webm');
	});

	it.each([
		['unknown', 'unknown', true, 'video/mp4'],
		['unknown', 'unknown', false, 'audio/mp4'],
		[undefined, undefined, true, 'video/mp4'],
		[undefined, undefined, false, 'audio/mp4'],
		['', '', true, 'video/mp4'],
		['', '', false, 'audio/mp4']
	])(
		'should fall back for format %j / codec %j (isVideo: %s) to %s',
		(format, codec, isVideo, expected) => {
			expect(inferMimeType(format, codec, isVideo)).toBe(expected);
		}
	);
});
