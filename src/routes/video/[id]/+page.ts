import type { PageLoad } from './$types';
import type { Stream, Subtitle } from '$lib/types';
import { getVideoDetails } from '$lib/api/details';
import { getSubtitles } from '$lib/api/subtitles';
import { getAllStreams } from '$lib/api/streams';
import { getRelatedStreams } from '$lib/api/related';
import { adaptPlayerConfig } from '$lib/adapters/player';
import { adaptVideoMetadata } from '$lib/adapters/metadata';
import { adaptRelatedVideos } from '$lib/adapters/relatedVideos';
import {
	type VideoPlayerConfig,
	type VideoMetadata,
	type RelatedVideoConfig
} from '$lib/adapters/types';
import { calculateDuration } from '$lib/utils/streamSelection';
import {
	selectVideoStreams,
	selectBestAudioStreams,
	logSelectedStreams
} from '$lib/utils/streamSelection';
import { 
	selectSubtitles,
	logSelectedSubtitles
} from '$lib/utils/subtitleSelection';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';

/**
 * Page data structure
 */
export interface PageData {
	playerConfig: VideoPlayerConfig;
	metadata: VideoMetadata;
	relatedVideos: RelatedVideoConfig[];
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
			subtitleStream: null,
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
		relatedVideos: [],
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
	subtitles: Subtitle[];
	relatedStreams: Awaited<ReturnType<typeof getRelatedStreams>>;
}> {
	// Fetch video metadata and streams in parallel
	const [details, { videoStreams, audioStreams }, subtitles, relatedStreams] = await Promise.all([
		getVideoDetails(videoId, fetch),
		getAllStreams(videoId, fetch),
		getSubtitles(videoId, fetch),
		getRelatedStreams(videoId, fetch).catch((error) => {
			console.warn('Failed to fetch related videos:', error);
			return [];
		})
	]);

	return { details, videoStreams, audioStreams, subtitles, relatedStreams };
}

/**
 * Page load function - fetches and transforms data
 */
export const load: PageLoad = async ({ params, fetch }): Promise<PageData> => {
	try {
		// Fetch video metadata and streams in parallel
		const { details, videoStreams, audioStreams, subtitles, relatedStreams } = await fetchVideoData(
			params.id,
			fetch
		);

		const selectedVideoStreams = selectVideoStreams(videoStreams);
		const selectedAudioStreams = selectBestAudioStreams(audioStreams);
		const selectedSubtitles = selectSubtitles(subtitles);
		const duration = calculateDuration(selectedVideoStreams, selectedAudioStreams);

		validateStreamSelection(selectedVideoStreams, selectedAudioStreams, duration);
		logSelectedStreams(selectedVideoStreams, selectedAudioStreams);
		logSelectedSubtitles(selectedSubtitles);

		// Transform data using adapters
		const playerConfig = adaptPlayerConfig(
			selectedVideoStreams,
			selectedAudioStreams,
			selectedSubtitles,
			duration,
			thumbnailPlaceholder
		);

		const metadata = adaptVideoMetadata(
			details,
			thumbnailPlaceholder // fallback avatar
		);

		const relatedVideos = adaptRelatedVideos(
			relatedStreams,
			thumbnailPlaceholder,
			thumbnailPlaceholder
		)

		return {
			playerConfig,
			metadata,
			relatedVideos
		};

	} catch (error) {
		console.error('Error loading video data:', error);

		return createErrorPageData(error); 
	}
};
