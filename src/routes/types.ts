import type {
	ChannelConfig,
	ChannelVideoConfig,
	CommentConfig,
	PlaylistInfoConfig,
	RelatedVideoConfig,
	VideoMetadata,
	VideoPlayerConfig
} from '$lib/adapters/types';
import type { SearchResultsPage } from '$lib/adapters/search';

export interface LoadSearchResponse {
	results: SearchResultsPage;
	query: string;
	sortFilter?: string;
	error: string | null;
}

export interface VideoPageData {
	playerConfig: VideoPlayerConfig;
	metadata: VideoMetadata;
	relatedVideos: RelatedVideoConfig[];
	comments?: CommentConfig[];
	playlistId?: string | null;
	playlistIndex?: number | null;
	playlistVideos?: RelatedVideoConfig[] | null;
	playlistInfo?: PlaylistInfoConfig | null;
	videoId?: string | null;
	error?: string;
}

export interface ChannelPageData {
	channel: ChannelConfig;
	videos: ChannelVideoConfig[];
	error?: string;
}
