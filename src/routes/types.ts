import type {
	ChannelConfig,
	ChannelVideoConfig,
	CommentConfig,
	PlaylistInfoConfig,
	RelatedVideoConfig,
	SearchResultConfig,
	VideoMetadata,
	VideoPlayerConfig
} from '$lib/adapters/types';

export interface LoadResponse {
	results: SearchResultConfig[];
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
	error?: string;
}

export interface ChannelPageData {
	channel: ChannelConfig;
	videos: ChannelVideoConfig[];
	error?: string;
}
