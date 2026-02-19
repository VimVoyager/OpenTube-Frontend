import type { PageLoad } from './$types';
import { getVideoDetails } from '$lib/api/details';
import { getRelatedStreams } from '$lib/api/related';
import { adaptPlayerConfig } from '$lib/adapters/player';
import { adaptVideoMetadata } from '$lib/adapters/metadata';
import { adaptRelatedVideos } from '$lib/adapters/related';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
import { getManifest } from '$lib/api/manifest';
import { getVideoThumbnails } from '$lib/api/thumbnails';
import type { VideoPageData } from '../../types';
import { getVideoComments } from '$lib/api/comments';
import type {
	CommentConfig,
	RelatedVideoConfig,
	VideoMetadata,
	VideoPlayerConfig
} from '$lib/adapters/types';
import { adaptCommentResponse, adaptComments } from '$lib/adapters/comments';

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
	comments: Awaited<ReturnType<typeof getVideoComments>>;
}> {
	// Fetch video metadata, manifest, related videos and comments in parallel
	const [thumbnails, details, manifest, relatedStreams, comments] = await Promise.all([
		getVideoThumbnails(videoId, fetch),
		getVideoDetails(videoId, fetch),
		getManifest(videoId, fetch),
		getRelatedStreams(videoId, fetch).catch((error) => {
			console.warn('Failed to fetch related videos:', error);
			return [];
		}),
		getVideoComments(videoId, fetch).catch((error) => {
			console.warn('Failed to fetch comments:', error);
			return null;
		})
	]);

	return { thumbnails, details, manifest, relatedStreams, comments };
}

/**
 * Page load function - fetches and transforms data
 */
export const load: PageLoad = async ({ params, fetch }): Promise<VideoPageData> => {
	try {
		// Fetch all data in parallel
		const { thumbnails, details, manifest, relatedStreams, comments } = await fetchVideoData(
			params.id,
			fetch
		);

		// Transform data using adapters
		const playerConfig: VideoPlayerConfig = adaptPlayerConfig(
			manifest.url,
			manifest.duration,
			thumbnails.url
		);

		const metadata: VideoMetadata = adaptVideoMetadata(
			details,
			thumbnails.url
		);

		const relatedVideos = adaptRelatedVideos(
			relatedStreams,
			thumbnailPlaceholder,
			logoPlaceholder
		);

		const adaptedComments = comments ? adaptCommentResponse(comments, logoPlaceholder) : [];

		return {
			playerConfig,
			metadata,
			relatedVideos,
			comments: adaptedComments
		};

	} catch (error) {
		console.error('Error loading video data:', error);
		return createErrorPageData(error); 
	}	
};
