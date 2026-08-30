import type { Description } from '$lib/types';

export interface NextPage {
	url: string;
	id: string;
}

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
	nextPage: NextPage;
	hasNextPage: boolean;
}

export interface NextPageSearchApiResponse {
	items: SearchResponseData[];
	nextPage: NextPage;
	hasNextPage: boolean;
	itemCount: number;
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
	duration?: number;
	viewCount?: number;
	subscriberCount?: number
	videoCount?: number
	uploadDate?: string;
	streamType?: string;
	isShortFormContent?: boolean;
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
	thumbnails: Image[];
	streamType?: string;
	uploaderName: string;
	textualUploadDate: string;
	uploadDate?: {
		approximation: boolean;
	};
	viewCount: number;
	duration: number;
	uploaderUrl: string;
	uploaderAvatars: Image[];
	uploaderVerified: boolean;
	isShortFormContent?: boolean;
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
	originalUrl?: string;
	name: string;
	errors?: unknown[];
	relatedItems: RelatedCommentItem[];
}

export interface RelatedCommentItem {
	infoType: string;
	serviceId: number;
	url: string;
	name: string;
	thumbnails: Image[];
	commentId: string;
	commentText: string;
	uploaderName: string;
	uploaderAvatars: Image[];
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
	estimatedResolutionLevel?: string;
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
	thumbnails: Image[];
	isShortFormContent?: boolean;
}

export interface ChannelInfoResponse {
	id: string;
	name: string;
	avatarUrl: string;
	bannerUrl: string;
	description: string;
	subscriberCount: number;
	handle: string | null;
	verified: boolean;
	tabs: string[];
	avatars: Image[];
	banners: Image[];
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
	relatedItems: RelatedItemResponse[];
	contentFilters?: never[];
	sortFilter: string;
	uploaderUrl: string;
	uploaderName: string;
	subChannelUrl?: string;
	subChannelName?: string;
	description: Description;
	banners: Image[];
	uploaderAvatars: Image[];
	subChannelAvatars: Image[];
	thumbnails: Image[];
}

export interface KioskInfoResponse {
	id: string;
	name: string;
	url: string;
	items: KioskResponseItem[];
}

export interface KioskResponseItem {
	name: string;
	url: string;
	uploaderName: string;
	uploaderUrl: string;
	uploaderVerified: boolean;
	duration: number;
	viewCount: number;
	uploadDate: string;
	textualUploadDate: string;
	streamType: string;
	thumbnails: Image[];
}
