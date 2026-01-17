import type {
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
	error?: string;
}
