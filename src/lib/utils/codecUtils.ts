/**
 * Codec and MIME Type Utilities
 * 
 * Utilities for normalizing codec strings and inferring MIME types
 * for DASH manifest generation.
 */

/**
 * Normalizes codec strings to DASH-compatible format
 * 
 * @param codec - Raw codec string from stream metadata
 * @returns DASH-compatible codec string
 */
export function normalizeDashCodec(codec: string): string {
	const lowerCodec = codec.toLowerCase();

	// Already in correct DASH format
	if (lowerCodec.match(/^(avc1|vp09|av01|mp4a|opus|vorbis)\./)) {
		return codec;
	}

	// Map common codec variations to DASH format
	if (lowerCodec.includes('h264')) return 'avc1.42E01E';
	if (lowerCodec.includes('vp9')) return 'vp09.00.10.08';
	if (lowerCodec.includes('av1')) return 'av01.0.05M.08';
	if (lowerCodec.includes('aac')) return 'mp4a.40.2';
	if (lowerCodec.includes('opus')) return 'opus';
	if (lowerCodec.includes('vorbis')) return 'vorbis';

	// Return as-is if no match found
	return codec;
}

/**
 * Infers MIME type from format string and codec
 * Handles backend format strings like "MPEG_4", "MP4", "WEBM", "M4A", etc.
 * 
 * @param format - Format string from stream metadata
 * @param codec - Codec string from stream metadata
 * @param isVideo - Whether this is a video stream (vs audio)
 * @returns MIME type string (e.g., 'video/mp4', 'audio/webm')
 */
export function inferMimeType(
	format: string | undefined,
	codec: string | undefined,
	isVideo: boolean
): string {
	// Check format first - this is most reliable
	if (format) {
		const mimeType = inferMimeTypeFromFormat(format);
		if (mimeType) return mimeType;
	}

	// Fallback to codec-based inference
	if (codec) {
		const mimeType = inferMimeTypeFromCodec(codec);
		if (mimeType) return mimeType;
	}

	// Final fallback based on stream type
	return isVideo ? 'video/mp4' : 'audio/mp4';
}

/**
 * Infers MIME type from format string
 */
function inferMimeTypeFromFormat(format: string): string | null {
	const formatUpper = format.toUpperCase();

	// Video formats
	if (formatUpper === 'MPEG_4' || formatUpper === 'MP4') {
		return 'video/mp4';
	}
	if (formatUpper === 'WEBM' || formatUpper === 'V_VP9' || formatUpper === 'VP9') {
		return 'video/webm';
	}

	// Audio formats
	if (formatUpper === 'M4A' || formatUpper === 'MP4A') {
		return 'audio/mp4';
	}
	if (formatUpper === 'WEBMA' || formatUpper === 'OPUS' || formatUpper === 'VORBIS') {
		return 'audio/webm';
	}

	return null;
}

/**
 * Infers MIME type from codec string
 */
function inferMimeTypeFromCodec(codec: string): string | null {
	const codecLower = codec.toLowerCase();

	// Video codecs
	if (codecLower.includes('avc1') || codecLower.includes('h264')) {
		return 'video/mp4';
	}
	if (codecLower.includes('vp09') || codecLower.includes('vp9')) {
		return 'video/webm';
	}
	if (codecLower.includes('av01') || codecLower.includes('av1')) {
		return 'video/mp4';
	}

	// Audio codecs
	if (codecLower.includes('mp4a')) {
		return 'audio/mp4';
	}
	if (codecLower.includes('opus')) {
		return 'audio/webm';
	}
	if (codecLower.includes('vorbis')) {
		return 'audio/webm';
	}

	return null;
}