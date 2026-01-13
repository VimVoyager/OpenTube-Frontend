/**
 * API Response for Search
 */
export interface SearchResponse {
	correctedSearch: boolean;
	url: string;
	originalUrl: string;
	name: string;
	searchString: string;
	searchSuggestion: string;
	isCorrectedSearch: boolean;
	items: SearchResponseData[];
	nextPageUrl: string;
	hasNextPage: boolean;
}

export interface SearchResponseData {
	shortFormContent: boolean;
	type: string;
	name: string;
	url: string;
	thumbnailUrl: string;
	uploaderName: string;
	uploaderAvatarUrl: string;
	uploaderVerified: boolean;
	duration: number;
	viewCount: number;
	uploadDate?: string;
	streamType: string;
	isShortFormContent: boolean;
	uploaderUrl?: string;
}