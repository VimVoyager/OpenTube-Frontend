import type { Avatar, Description, RelatedItem, Thumbnail } from '$lib/types';

/**
 * API Response for Search
 */
export interface SearchResponse {
	correctedSearch?: boolean;
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
	description?: string;
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
	isMuxed?: boolean;
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
	commentText: string;
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

interface Replies {
	url: string;
	id: string;
}

interface UploadDate {
	approximation: boolean;
}

export interface Image {
	url: string;
	height: number;
	width: number;
	estimatedResolution?: string;
}

export interface ChannelVideoItem {
	url: string;
	name: string;
	uploaderName: string;
	uploaderUrl: string | null;
	uploaderVerified: boolean;
	duration: number;
	viewCount: number;
	textualUploadDate: string | null;
	thumbnails: Thumbnail[];
	isShortFormContent: boolean;
}

export interface ChannelInfoResponse {
	id: string;
	name: string;
	avatarUrl: string | null;
	bannerUrl: string | null;
	description: string | null;
	subscriberCount: number;
	handle: string | null;
	verified: boolean;
	tabs: string[];
	avatars?: Avatar[];
	banners?: Image[];
}

export interface ChannelVideosResponse {
	channelId: string;
	items: ChannelVideoItem[];
	nextPageToken: string | null;
}

export interface PlaylistResponse {
	serviceId: number;
	id: string;
	url: string;
	originalUrl: string;
	name: string;
	errors?: never[];
	relatedItems: RelatedItem[];
	contentFilters?: never[];
	sortFilter: string;
	uploaderUrl: string;
	uploaderName: string;
	subChannelUrl: string;
	subChannelName: string;
	description: Description;
	banners?: never[];
	subChannelAvatars?: never[];
	thumbnails: Thumbnail[];
	uploaderAvatars: Avatar[];
}
