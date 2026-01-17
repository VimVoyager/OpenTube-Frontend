import type { PageLoad } from './$types';
import { getVideoDetails } from '$lib/api/details';
import { getRelatedStreams } from '$lib/api/related';
import { adaptPlayerConfig } from '$lib/adapters/player';
import { adaptVideoMetadata } from '$lib/adapters/metadata';
import { adaptRelatedVideos } from '$lib/adapters/relatedVideos';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
import { getManifest } from '$lib/api/manifest';
import { getVideoThumbnails } from '$lib/api/thumbnails';
import type { VideoPageData } from '../../types';

/**
 * Creates error page data with default values
 */
function createErrorPageData(error: unknown): VideoPageData {
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
	thumbnails: Awaited<ReturnType<typeof getVideoThumbnails>>;
	details: Awaited<ReturnType<typeof getVideoDetails>>;
	manifest: Awaited<ReturnType<typeof getManifest>>;
	relatedStreams: Awaited<ReturnType<typeof getRelatedStreams>>;
}> {
	// Fetch video metadata, manifest, and related videos in parallel
	const [thumbnails, details, manifest, relatedStreams] = await Promise.all([
		getVideoThumbnails(videoId, fetch),
		getVideoDetails(videoId, fetch),
		getManifest(videoId, fetch),
		getRelatedStreams(videoId, fetch).catch((error) => {
			console.warn('Failed to fetch related videos:', error);
			return [];
		})
	]);

	return { thumbnails, details, manifest, relatedStreams };
}

/**
 * Page load function - fetches and transforms data
 */
export const load: PageLoad = async ({ params, fetch }): Promise<VideoPageData> => {
	try {
		// Fetch all data in parallel
		const { thumbnails, details, manifest, relatedStreams } = await fetchVideoData(
			params.id,
			fetch
		);

		console.log(`Loaded manifest URL for video ${params.id} :`, manifest.url);

		// Transform data using adapters
		const playerConfig = adaptPlayerConfig(
			manifest.url,
			manifest.duration,
			thumbnails.url
		);

		const metadata = adaptVideoMetadata(
			details,
			thumbnails.url
		);

		const relatedVideos = adaptRelatedVideos(
			relatedStreams,
			logoPlaceholder,
			logoPlaceholder
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
