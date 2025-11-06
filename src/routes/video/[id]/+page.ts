import type { PageLoad } from './$types';
import type { Stream } from '$lib/types';
import { getVideoDetails } from '$lib/api/details';
import { getAllStreams } from '$lib/api/streams';
import {
	adaptPlayerConfig,
	adaptVideoMetadata,
	calculateDuration,
	type VideoPlayerConfig,
	type VideoMetadata
} from '$lib/adapters';
import {
	selectVideoStreams,
	selectBestAudioStreams,
	logSelectedStreams
} from '$lib/utils/streamSelection';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';

/**
 * Page data structure
 */
export interface PageData {
	playerConfig: VideoPlayerConfig;
	metadata: VideoMetadata;
	error?: string;
}

/**
 * Creates error page data with default values
 */
function createErrorPageData(error: unknown): PageData {
	const errorMessage = error instanceof Error ? error.message : 'Unknown error loading video';

	return {
		playerConfig: {
			videoStream: null,
			audioStream: null,
			duration: 0,
			poster: thumbnailPlaceholder
		},
		metadata: {
			title: 'Error Loading Video',
			description: 'Failed to load video information',
			channelName: 'Unknown',
			channelAvatar: null,
			viewCount: 0,
			uploadDate: '',
			likeCount: 0,
			dislikeCount: 0,
			subscriberCount: 0
		},
		error: errorMessage
	};
}

/**
 * Validates that stream selection was successful
 */
function validateStreamSelection(
	videoStreams: Stream[],
	audioStreams: Stream[],
	duration: number
): void {
	if (videoStreams.length === 0) {
		console.warn('No suitable video stream found');
	}

	if (audioStreams.length === 0) {
		console.warn('No suitable audio streams found');
	}

	if (!duration || duration === 0) {
		console.warn('Video duration is missing or zero, this may cause playback issues.');
	}
}

/**
 * Fetches and processes video data
 */
async function fetchVideoData(
	videoId: string,
	fetch: typeof globalThis.fetch
): Promise<{
	details: Awaited<ReturnType<typeof getVideoDetails>>;
	videoStreams: Stream[];
	audioStreams: Stream[];
}> {
	// Fetch video metadata and streams in parallel
	const [details, { videoStreams, audioStreams }] = await Promise.all([
		getVideoDetails(videoId, fetch),
		getAllStreams(videoId, fetch)
	]);

	return { details, videoStreams, audioStreams };
}

/**
 * Page load function - fetches and transforms data
 */
export const load: PageLoad = async ({ params, fetch }): Promise<PageData> => {
	try {
		// Fetch video metadata and streams in parallel
		const { details, videoStreams, audioStreams } = await fetchVideoData(
			params.id,
			fetch
		);

		const selectedVideoStreams = selectVideoStreams(videoStreams);
		const selectedAudioStreams = selectBestAudioStreams(audioStreams);
		const duration = calculateDuration(selectedVideoStreams, selectedAudioStreams);
		validateStreamSelection(selectedVideoStreams, selectedAudioStreams, duration);
		logSelectedStreams(selectedVideoStreams, selectedAudioStreams);

		// Transform data using adapters
		const playerConfig = adaptPlayerConfig(
			selectedVideoStreams,
			selectedAudioStreams,
			duration,
			thumbnailPlaceholder
		);

		const metadata = adaptVideoMetadata(
			details,
			thumbnailPlaceholder // fallback avatar
		);

		return {
			playerConfig,
			metadata
		};

	} catch (error) {
		console.error('Error loading video data:', error);

		return createErrorPageData(error); 
	}
};
