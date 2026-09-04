/**
 * Video player configuration derived from selected streams
 */
export interface VideoPlayerConfig {
	manifestUrl: string;
	duration: number;
	poster: string;
	isMuxed?: boolean;
}

/**
 * Adapt video and audio streams into player configuration
 */
export function adaptPlayerConfig(
	manifestUrl: string,
	duration: number,
	posterUrl: string
): VideoPlayerConfig {
	return {
		manifestUrl,
		duration,
		poster: posterUrl
	};
}
