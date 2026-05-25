import type { PageLoad } from './$types';
import { getVideoDetails } from '$lib/api/details';
import { getRelatedStreams } from '$lib/api/related';
import { adaptPlayerConfig } from '$lib/adapters/player';
import { adaptVideoMetadata } from '$lib/adapters/metadata';
import { adaptRelatedVideos } from '$lib/adapters/related';
import { adaptPlaylistInfo, adaptPlaylistVideos } from '$lib/adapters/playlist';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
import { getManifest } from '$lib/api/manifest';
import { getVideoThumbnails } from '$lib/api/thumbnails';
import { getPlaylist} from '$lib/api/playlist';
import type { VideoPageData } from '../../types';
import { getVideoComments } from '$lib/api/comments';
import type {
	CommentConfig,
	RelatedVideoConfig,
	VideoMetadata,
	VideoPlayerConfig,
	PlaylistInfoConfig
} from '$lib/adapters/types';
import { adaptCommentResponse } from '$lib/adapters/comments';

/**
 * Creates error page data with default values
 */
function createErrorPageData(error: unknown): VideoPageData {
	const errorMessage: string = error instanceof Error ? error.message : 'Unknown error loading video';

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
// async function fetchVideoData(
// 	videoId: string,
// 	fetch: typeof globalThis.fetch
// ): Promise<{
// 	thumbnails: Awaited<ReturnType<typeof getVideoThumbnails>>;
// 	details: Awaited<ReturnType<typeof getVideoDetails>>;
// 	manifest: Awaited<ReturnType<typeof getManifest>>;
// 	relatedStreams: Awaited<ReturnType<typeof getRelatedStreams>>;
// 	comments: Awaited<ReturnType<typeof getVideoComments>>;
// }> {
// 	// Fetch video metadata, manifest, related videos and comments in parallel
// 	const [thumbnails, details, manifest, relatedStreams, comments] = await Promise.all([
// 		getVideoThumbnails(videoId, fetch),
// 		getVideoDetails(videoId, fetch),
// 		getManifest(videoId, fetch),
// 		getRelatedStreams(videoId, fetch).catch((error) => {
// 			console.warn('Failed to fetch related videos:', error);
// 			return [];
// 		}),
// 		getVideoComments(videoId, fetch).catch((error) => {
// 			console.warn('Failed to fetch comments:', error);
// 			return null;
// 		})
// 	]);
//
// 	return { thumbnails, details, manifest, relatedStreams, comments };
// }

/**
 * Page load function - fetches and transforms data
 */
export const load: PageLoad = async ({ params, url, fetch }): Promise<VideoPageData> => {
	try {
		const playlistId = url.searchParams.get('playlist') ?? null;
		const playlistIndex: number | null = playlistId
			? parseInt(url.searchParams.get('index') ?? '0', 10)
			: null;

		const [thumbnails, details, manifest, relatedStreams, comments, playlistResponse] =
			await Promise.all([
				getVideoThumbnails(params.id, fetch),
				getVideoDetails(params.id, fetch),
				getManifest(params.id, fetch),
				getRelatedStreams(params.id, fetch).catch((e) => {
					console.warn('Failed to fetch related videos:', e);
					return [];
				}),
				getVideoComments(params.id, fetch).catch((e) => {
					console.warn('Failed to fetch comments:', e);
					return null;
				}),
				playlistId
					? getPlaylist(playlistId, fetch).catch((e) => {
							console.warn('Failed to fetch playlist:', e);
							return null;
						})
					: Promise.resolve(null)
			]);

		const playerConfig: VideoPlayerConfig = adaptPlayerConfig(
			manifest.url,
			manifest.duration,
			thumbnails.url
		);
		const metadata: VideoMetadata = adaptVideoMetadata(details, thumbnails.url);
		const relatedVideos: RelatedVideoConfig[] = adaptRelatedVideos(
			relatedStreams,
			thumbnailPlaceholder,
			logoPlaceholder
		);
		const adaptedComments: CommentConfig[] = comments
			? adaptCommentResponse(comments, logoPlaceholder)
			: [];

		const playlistVideos: RelatedVideoConfig[] | null = playlistResponse
			? adaptPlaylistVideos(playlistResponse)
			: null;

		const playlistInfo: PlaylistInfoConfig | null = playlistResponse
			? adaptPlaylistInfo(playlistResponse)
			: null;

		return {
			playerConfig,
			metadata,
			relatedVideos,
			comments: adaptedComments,
			playlistId,
			playlistIndex,
			playlistVideos,
			playlistInfo
		};
	} catch (error) {
		console.error('Error loading video data:', error);
		return createErrorPageData(error);
	}
};
