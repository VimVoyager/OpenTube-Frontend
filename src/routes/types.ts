import type { SearchResultsPage } from '$lib/adapters/search';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/channel';

export interface LoadSearchResponse {
	results: SearchResultsPage;
	query: string;
	sortFilter?: string;
	error: string | null;
}

export interface ChannelPageData {
	channel: ChannelConfig;
	videos: ChannelVideoConfig[];
	error?: string;
}
