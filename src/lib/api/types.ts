import type { Avatar, Thumbnail } from '$lib/types';

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

/**
 * API response for related videos
 */
export interface RelatedItemResponse {
	infoType: string;
	serviceId: number;
	url: string;
	name: string;
	thumbnails: Thumbnail[];
	streamType: string;
	uploaderName: string;
	textualUploadDate: string;
	uploadDate?: {
		approximation: boolean;
	};
	viewCount: number;
	duration: number;
	uploaderUrl: string;
	uploaderAvatars: Avatar[];
	uploaderVerified: boolean;
	shortFormContent: boolean;
}

/**
 * Manifest response containing both blob URL and parsed metadata
 */
export interface ManifestResponse {
	url: string;
	duration: number;
	videoId?: string;
}

/**
 * API response for comments
 */
export interface CommentResponse {
	commentId: string;
	commentText: {
		content: string;
		type: number;
	};
	uploaderName: string;
	uploaderAvatars: Avatar[];
	uploaderUrl: string;
	uploaderVerified: boolean;
	textualUploadDate: string;
	likeCount: number;
	textualLikeCount: string;
	heartedByUploader: boolean;
	pinned: boolean;
	replyCount: number;
	replies?: {
		url: string;
		id: string;
	};
	channelOwner: boolean;
}
