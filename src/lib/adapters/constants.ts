
/**
 * Default values for stream properties
 */
export const DEFAULT_VIDEO = {
	CODEC: 'avc1.42E01E',
	MIME_TYPE: 'video/mp4',
	WIDTH: 1920,
	HEIGHT: 1080,
	BANDWIDTH: 1000000,
	FRAME_RATE: 30,
	FORMAT: 'MPEG_4'
} as const;
export const DEFAULT_AUDIO = {
	CODEC: 'mp4a.40.2',
	MIME_TYPE: 'audio/mp4',
	BANDWIDTH: 128000,
	SAMPLE_RATE: 44100,
	CHANNELS: 2,
	FORMAT: 'M4A'
} as const;

/**
 * Subtitle format to MIME type mapping
 */
export const SUBTITLE_MIME_TYPES: Record<string, string> = {
	'vtt': 'text/vtt',
	'srv3': 'application/ttml+xml',
	'srv2': 'application/ttml+xml',
	'srv1': 'application/x-subrip',
	'ttml': 'application/ttml+xml',
	'srt': 'application/x-subrip'
} as const;
