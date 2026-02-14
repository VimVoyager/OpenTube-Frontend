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

interface SearchResponseData {
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
	serviceId: number;
	id: string;
	url: string;
	originalUrl: string;
	name: string;
	errors: never[];
	relatedItems: RelatedCommentItem[];
}

export interface RelatedCommentItem {
	infoType: string;
	serviceId: number;
	url: string;
	name: string;
	thumbnails: Thumbnail[];
	commentId: string;
	commentText: CommentText;
	uploaderName: string;
	uploaderAvatars: Avatar[];
	uploaderUrl: string;
	uploaderVerified: boolean;
	textualUploadDate: string;
	uploadDate: UploadDate;
	likeCount: number;
	textualLikeCount: string;
	heartedByUploader: boolean;
	pinned: boolean;
	streamPosition: number;
	replyCount: number;
	replies: Replies;
	channelOwner: boolean;
}

interface CommentText {
	content: string;
	type: number;
}

interface Replies {
	url: string;
	id: string;
}

interface UploadDate {
	approximation: boolean;
}