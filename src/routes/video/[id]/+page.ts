import type { PageLoad } from './$types';
import { getVideoDetails } from '$lib/api/details';
import { getRelatedStreams } from '$lib/api/related';
import { adaptPlayerConfig } from '$lib/adapters/player';
import { adaptVideoMetadata } from '$lib/adapters/metadata';
import { adaptRelatedVideos } from '$lib/adapters/relatedVideos';
import {
	type VideoPlayerConfig,
	type VideoMetadata,
	type RelatedVideoConfig
} from '$lib/adapters/types';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import { getManifest } from '$lib/api/manifest';

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
			manifestUrl: '',
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
 * Fetches and processes video data
 */
async function fetchVideoData(
	videoId: string,
	fetch: typeof globalThis.fetch
): Promise<{
	details: Awaited<ReturnType<typeof getVideoDetails>>;
	manifest: Awaited<ReturnType<typeof getManifest>>;
	relatedStreams: Awaited<ReturnType<typeof getRelatedStreams>>;
}> {
	// Fetch video metadata, manifest, and related videos in parallel
	const [details, manifest, relatedStreams] = await Promise.all([
		getVideoDetails(videoId, fetch),
		getManifest(videoId, fetch),
		getRelatedStreams(videoId, fetch).catch((error) => {
			console.warn('Failed to fetch related videos:', error);
			return [];
		})
	]);

	return { details, manifest, relatedStreams };
}

/**
 * Page load function - fetches and transforms data
 */
export const load: PageLoad = async ({ params, fetch }): Promise<PageData> => {
	try {
		// Fetch all data in parallel
		const { details, manifest, relatedStreams } = await fetchVideoData(
			params.id,
			fetch
		);

		console.log(`Loaded manifest URL for video ${params.id} :`, manifest.url);

		// Transform data using adapters
		const playerConfig = adaptPlayerConfig(
			manifest.url,
			manifest.duration,
			thumbnailPlaceholder
		);

		const metadata = adaptVideoMetadata(
			details,
			thumbnailPlaceholder
		);

		const relatedVideos = adaptRelatedVideos(
			relatedStreams,
			thumbnailPlaceholder,
			thumbnailPlaceholder
		);

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
