import type { SearchResultsPage } from '$lib/adapters/search';
import type { VideoPlayerConfig } from '$lib/adapters/player';
import type { VideoMetadata } from '$lib/adapters/metadata';
import type { RelatedVideoConfig } from '$lib/adapters/related';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/channel';
import type { CommentConfig } from '$lib/adapters/comments';
import type { PlaylistInfoConfig } from '$lib/adapters/playlist';

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
