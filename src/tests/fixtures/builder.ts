/**
 * Shared test-data builders — one per API response type.
 * Defaults are modelled on the real fixtures in src/tests/fixtures/api/.
 *
 * Conventions:
 *  - Shallow merge only: { ...defaults, ...overrides }. Override whole fields.
 *  - Single-element thumbnail/avatar arrays by default, so which element the
 *    media selectors pick is never incidentally re-tested in adapter tests.
 *    Tests about selection pass multi-element arrays explicitly.
 *  - Real URL shapes (watch?v=, playlist?list=, /channel/) so the real
 *    extractIdFromUrl parses them once utils are un-mocked.
 *
 */

import type {
	PlaylistResponse,
	RelatedItemResponse,
	ChannelVideosResponse,
	CommentResponse,
	RelatedCommentItem,
	SearchResponse,
	ChannelInfoResponse,
	Image
} from '$lib/api/types';
import type { Thumbnail, Avatar, Details } from '$lib/types';

// ---------------------------------------------------------------------------
// Media primitives (exported — handy for mediaUtils/thumbnail tests too)
// ---------------------------------------------------------------------------

export const buildThumbnail = (overrides: Partial<Thumbnail> = {}): Thumbnail =>
	({
		url: 'https://i.ytimg.com/vi/test-id/hqdefault.jpg',
		width: 336,
		height: 188,
		estimatedResolutionLevel: 'MEDIUM',
		...overrides
	}) as Thumbnail;

export const buildAvatar = (overrides: Partial<Avatar> = {}): Avatar =>
	({
		url: 'https://yt3.ggpht.com/test-avatar.jpg',
		width: 88,
		height: 88,
		estimatedResolutionLevel: 'LOW',
		...overrides
	}) as Avatar;

// ---------------------------------------------------------------------------
// Streams / related items
// ---------------------------------------------------------------------------

export const buildRelatedItem = (
	overrides: Partial<RelatedItemResponse> = {}
): RelatedItemResponse =>
	({
		infoType: 'STREAM',
		serviceId: 0,
		url: 'https://www.youtube.com/watch?v=video1',
		name: 'Test Video',
		thumbnails: [buildThumbnail({ url: 'https://example.com/v1.jpg' })],
		streamType: 'VIDEO_STREAM',
		uploaderName: 'Test Channel',
		uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
		uploaderAvatars: [buildAvatar({ url: 'https://example.com/avatar.jpg', width: 48, height: 48 })],
		duration: 120,
		viewCount: 1000,
		textualUploadDate: '2 weeks ago',
		uploadDate: { approximation: true },
		uploaderVerified: true,
		shortFormContent: false,
		isShortFormContent: false,
		...overrides
	}) as RelatedItemResponse;

// ---------------------------------------------------------------------------
// Playlist
// ---------------------------------------------------------------------------

export const buildPlaylistResponse = (
	overrides: Partial<PlaylistResponse> = {}
): PlaylistResponse =>
	({
		id: 'PLtest123',
		serviceId: 1,
		sortFilter: 'asc',
		name: 'Test Playlist',
		url: 'https://www.youtube.com/playlist?list=PLtest123',
		originalUrl: 'https://www.youtube.com/playlist?list=PLtest123',
		uploaderName: 'Test Channel',
		uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
		uploaderVerified: true,
		uploaderAvatars: [buildAvatar({ url: 'https://example.com/avatar.jpg', width: 176, height: 176 })],
		banners: [{ url: 'https://example.com/banner.jpg', width: 1060, height: 175 }],
		thumbnails: [buildThumbnail({ url: 'https://example.com/thumb.jpg' })],
		description: {
			content: 'A test playlist description',
			type: 1
		},
		streamCount: 0,
		relatedItems: [],
		...overrides
	}) as PlaylistResponse;

// ---------------------------------------------------------------------------
// Channel — details + videos tab
// ---------------------------------------------------------------------------

export const buildChannelDetailsResponse = (
	overrides: Partial<ChannelInfoResponse> = {}
): {
	id: string;
	name: string;
	handle: string | null;
	subscriberCount: number;
	description: string | null;
	verified: boolean;
	avatars: Avatar[];
	banners: { url: string; height: number; width: number; estimatedResolution: string }[] | Image[];
	avatarUrl?: string | null;
	bannerUrl?: string | null;
	tabs?: string[]
} =>
	({
		id: 'UCtest456',
		name: 'Test Channel',
		handle: 'TestChannel',
		subscriberCount: 20_600_000,
		description: 'A test channel description',
		verified: true,
		avatars: [buildAvatar({ url: 'https://example.com/channel-avatar.jpg', height: 120, width: 120, estimatedResolutionLevel: 'MEDIUM' })],
		banners: [{ url: 'https://example.com/channel-banner.jpg', height: 175, width: 1060, estimatedResolution: 'HIGH' }],
		...overrides
});

export const buildChannelVideosResponse = (
	overrides: Partial<ChannelVideosResponse> = {}
): ChannelVideosResponse =>
	({
		tab: 'videos',
		channelId: 'UCtest456',
		items: [buildRelatedItem()],
		...overrides
	}) as ChannelVideosResponse;

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const buildCommentItem = (
	overrides: Partial<RelatedCommentItem> = {}
): RelatedCommentItem =>
	({
		infoType: 'COMMENT',
		serviceId: 0,
		url: 'https://www.youtube.com/watch?v=video1',
		name: '@TestUser',
		thumbnails: [buildThumbnail({ url: 'https://yt3.ggpht.com/comment-thumb.jpg', width: 88, height: 88 })],
		commentId: 'comment-test-id',
		commentText: 'A test comment',
		uploaderName: '@TestUser',
		uploaderAvatars: [buildAvatar()],
		uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
		uploaderVerified: false,
		textualUploadDate: '2 years ago',
		uploadDate: { approximation: true },
		likeCount: 100,
		textualLikeCount: '100',
		heartedByUploader: false,
		pinned: false,
		streamPosition: -1,
		replyCount: 0,
		replies: undefined,
		channelOwner: false,
		...overrides
	}) as RelatedCommentItem;

export const buildCommentResponse = (
	overrides: Partial<CommentResponse> = {}
): CommentResponse =>
	({
		serviceId: 0,
		id: 'video1',
		url: 'https://www.youtube.com/watch?v=video1',
		originalUrl: 'https://www.youtube.com/watch?v=video1',
		name: 'Comments',
		errors: [],
		relatedItems: [buildCommentItem()],
		...overrides
	}) as CommentResponse;

// ---------------------------------------------------------------------------
// Video details
// ---------------------------------------------------------------------------

export const buildVideoDetails = (
	overrides: Partial<Details> = {}
): Details =>
	({
		videoTitle: 'Test Video Title',
		description: {
			content: 'A test video description',
			type: 1
		},
		uploaderAvatars: [buildAvatar({ url: 'https://example.com/uploader-avatar.jpg', width: 176, height: 176 })],
		viewCount: 10_000,
		likeCount: 555,
		dislikeCount: 10,
		channelName: 'Test Channel',
		channelSubscriberCount: 50_000,
		uploadDate: '2021-10-29T16:00:13-07:00',
		...overrides
});

// ---------------------------------------------------------------------------
// Search — three item variants (discriminated by `type`) + envelope
// ---------------------------------------------------------------------------

export const buildSearchStreamItem = (overrides: Record<string, unknown> = {}) => ({
	type: 'stream',
	name: 'Test Video',
	url: 'https://www.youtube.com/watch?v=video1',
	thumbnailUrl: 'https://i.ytimg.com/vi/video1/hq720.jpg',
	uploaderName: 'Test Channel',
	channelId: 'UCtest456',
	uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
	uploaderAvatarUrl: 'https://yt3.ggpht.com/search-avatar.jpg',
	uploaderVerified: true,
	duration: 86,
	viewCount: 1000,
	uploadDate: '2025-11-13T16:00Z',
	description: 'A test video description',
	streamType: 'VIDEO_STREAM',
	shortFormContent: false,
	isShortFormContent: false,
	...overrides
});

export const buildSearchChannelItem = (overrides: Record<string, unknown> = {}) => ({
	type: 'channel',
	name: 'Test Channel',
	url: 'https://www.youtube.com/channel/UCtest456',
	thumbnailUrl: 'https://yt.ggpht.com/channel-avatar.jpg',
	uploaderVerified: true,
	subscriberCount: 20_600_000,
	streamCount: -1,
	description: 'A test channel description',
	...overrides
});

export const buildSearchPlaylistItem = (overrides: Record<string, unknown> = {}) => ({
	type: 'playlist',
	name: 'Test Playlist',
	url: 'https://www.youtube.com/playlist?list=PLtest123',
	thumbnailUrl: 'https://i.ytimg.com/vi/PLtest123/hq720.jpg',
	uploaderName: 'Test Channel',
	uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
	playlistType: 'NORMAL',
	videoCount: 8,
	...overrides
});

export const buildSearchResponse = (
	overrides: Partial<SearchResponse> = {}
): SearchResponse =>
	({
		correctedSearch: false,
		isCorrectedSearch: false,
		url: 'https://www.youtube.com/search?q=test',
		originalUrl: 'https://www.youtube.com/search?q=test',
		name: 'Search',
		searchString: 'test',
		searchSuggestion: '',
		items: [buildSearchStreamItem()],
		nextPageUrl: 'https://www.youtube.com/search?prettyPrint=false',
		hasNextPage: true,
		...overrides
	}) as SearchResponse;