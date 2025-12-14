import type { VideoPlayerConfig } from './types';




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
