/**
 * Test Suite: playlist.ts (adapter)
 *
 * Tests for playlist info and playlist video adaptation, including
 * banner/thumbnail/avatar selection, fallback handling, and value clamping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptPlaylistInfo, adaptPlaylistVideos } from './playlist';
import type { PlaylistResponse, RelatedItemResponse } from '$lib/api/types';
import type { PlaylistInfoConfig, RelatedVideoConfig } from './types';

// =============================================================================
// Module Mocks
// =============================================================================

// Mock asset imports so fallback values are deterministic
vi.mock('$lib/assets/logo-placeholder.svg', () => ({
	default: 'mock-logo-placeholder.svg'
}));
vi.mock('$lib/assets/thumbnail-placeholder.jpg', () => ({
	default: 'mock-thumbnail-placeholder.jpg'
}));

// Mock utility modules with simple, predictable implementations
vi.mock('$lib/utils/streamSelection', () => ({
	extractIdFromUrl: vi.fn((url: string | null | undefined): string | null =>
		url ? url.split('/').pop() ?? null : null
	)
}));

vi.mock('$lib/utils/mediaUtils', () => ({
	selectBestThumbnail: vi.fn(
		(thumbnails: { url: string }[] | undefined, fallback: string): string =>
			thumbnails && thumbnails.length > 0 ? thumbnails[0].url : fallback
	),
	selectBestUploaderAvatar: vi.fn(
		(avatars: { url: string }[] | undefined, fallback: string): string =>
			avatars && avatars.length > 0 ? avatars[0].url : fallback
	)
}));

import { extractIdFromUrl } from '$lib/utils/streamSelection';
import { selectBestThumbnail, selectBestUploaderAvatar } from '$lib/utils/mediaUtils';

// =============================================================================
// Mock Data
// =============================================================================

const createMockPlaylistResponse = (
	overrides: Partial<PlaylistResponse> = {}
): PlaylistResponse =>
	({
		id: 'PLtest123',
		name: 'Test Playlist',
		url: 'https://www.youtube.com/playlist?list=PLtest123',
		uploaderName: 'Test Channel',
		uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
		uploaderAvatars: [{ url: 'https://example.com/avatar.jpg', width: 176, height: 176 }],
		banners: [
			{ url: 'https://example.com/banner-small.jpg', width: 640 },
			{ url: 'https://example.com/banner-large.jpg', width: 2120 },
			{ url: 'https://example.com/banner-medium.jpg', width: 1060 }
		],
		thumbnails: [{ url: 'https://example.com/thumb.jpg', width: 336, height: 188 }],
		description: 'A test playlist description',
		relatedItems: [],
		...overrides
	}) as PlaylistResponse;

const createMockRelatedItem = (
	overrides: Partial<RelatedItemResponse> = {}
): RelatedItemResponse =>
	({
		url: 'https://www.youtube.com/watch/video1',
		name: 'Test Video',
		thumbnails: [{ url: 'https://example.com/v1.jpg', width: 336, height: 188 }],
		uploaderName: 'Test Channel',
		uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
		uploaderAvatars: [{ url: 'https://example.com/avatar.jpg', width: 48, height: 48 }],
		duration: 120,
		viewCount: 1000,
		textualUploadDate: '2 weeks ago',
		...overrides
	}) as RelatedItemResponse;

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// Playlist Info Adaptation Tests
// =============================================================================

describe('adaptPlaylistInfo', () => {
	describe('successful playlist info adaptation', () => {
		it('should adapt a full playlist response to PlaylistInfoConfig', () => {
			const info = createMockPlaylistResponse();

			const result: PlaylistInfoConfig = adaptPlaylistInfo(info);

			expect(result).toEqual({
				id: 'PLtest123',
				name: 'Test Playlist',
				url: 'https://www.youtube.com/playlist?list=PLtest123',
				uploaderName: 'Test Channel',
				uploaderId: 'UCtest456',
				uploaderAvatarUrl: 'https://example.com/avatar.jpg',
				bannerUrl: 'https://example.com/banner-large.jpg',
				thumbnailUrl: 'https://example.com/thumb.jpg',
				uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
				description: 'A test playlist description'
			});
		});

		it('should extract uploader ID from uploader URL', () => {
			const info = createMockPlaylistResponse({
				uploaderUrl: 'https://www.youtube.com/channel/UCabc789'
			});

			const result = adaptPlaylistInfo(info);

			expect(extractIdFromUrl).toHaveBeenCalledWith(
				'https://www.youtube.com/channel/UCabc789'
			);
			expect(result.uploaderId).toBe('UCabc789');
		});

		it('should delegate thumbnail selection to selectBestThumbnail', () => {
			const info = createMockPlaylistResponse();

			adaptPlaylistInfo(info);

			expect(selectBestThumbnail).toHaveBeenCalledWith(
				info.thumbnails,
				'mock-thumbnail-placeholder.jpg'
			);
		});

		it('should delegate avatar selection to selectBestUploaderAvatar', () => {
			const info = createMockPlaylistResponse();

			adaptPlaylistInfo(info);

			expect(selectBestUploaderAvatar).toHaveBeenCalledWith(
				info.uploaderAvatars,
				'mock-logo-placeholder.svg'
			);
		});
	});

	describe('banner selection', () => {
		it('should select the widest banner', () => {
			const info = createMockPlaylistResponse({
				banners: [
					{ url: 'https://example.com/banner-640.jpg', width: 640 },
					{ url: 'https://example.com/banner-2560.jpg', width: 2560 },
					{ url: 'https://example.com/banner-1060.jpg', width: 1060 }
				]
			});

			const result = adaptPlaylistInfo(info);

			expect(result.bannerUrl).toBe('https://example.com/banner-2560.jpg');
		});

		it('should return null when banners is undefined', () => {
			const info = createMockPlaylistResponse({ banners: undefined });

			const result = adaptPlaylistInfo(info);

			expect(result.bannerUrl).toBeNull();
		});

		it('should return null when banners is an empty array', () => {
			const info = createMockPlaylistResponse({ banners: [] });

			const result = adaptPlaylistInfo(info);

			expect(result.bannerUrl).toBeNull();
		});

		it('should handle a single banner', () => {
			const info = createMockPlaylistResponse({
				banners: [{ url: 'https://example.com/only-banner.jpg', width: 1060 }]
			});

			const result = adaptPlaylistInfo(info);

			expect(result.bannerUrl).toBe('https://example.com/only-banner.jpg');
		});

		it('should not mutate the original banners array when sorting', () => {
			const banners = [
				{ url: 'https://example.com/banner-small.jpg', width: 640 },
				{ url: 'https://example.com/banner-large.jpg', width: 2120 }
			];
			const info = createMockPlaylistResponse({ banners });

			adaptPlaylistInfo(info);

			expect(banners[0].url).toBe('https://example.com/banner-small.jpg');
			expect(banners[1].url).toBe('https://example.com/banner-large.jpg');
		});
	});

	describe('description handling', () => {
		it('should preserve a non-empty description', () => {
			const info = createMockPlaylistResponse({ description: 'My description' });

			const result = adaptPlaylistInfo(info);

			expect(result.description).toBe('My description');
		});

		it('should return null for an empty string description', () => {
			const info = createMockPlaylistResponse({ description: '' });

			const result = adaptPlaylistInfo(info);

			expect(result.description).toBeNull();
		});

		it('should return null for an undefined description', () => {
			const info = createMockPlaylistResponse({ description: undefined });

			const result = adaptPlaylistInfo(info);

			expect(result.description).toBeNull();
		});
	});

	describe('immutability', () => {
		it('should return a new object each time', () => {
			const info = createMockPlaylistResponse();

			const result1 = adaptPlaylistInfo(info);
			const result2 = adaptPlaylistInfo(info);

			expect(result1).toEqual(result2);
			expect(result1).not.toBe(result2); // Different objects
		});
	});
});

// =============================================================================
// Playlist Video Adaptation Tests
// =============================================================================

describe('adaptPlaylistVideos', () => {
	describe('successful video adaptation', () => {
		it('should adapt all related items to RelatedVideoConfig', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [
					createMockRelatedItem({ name: 'Video One' }),
					createMockRelatedItem({ name: 'Video Two' }),
					createMockRelatedItem({ name: 'Video Three' })
				]
			});

			const result: RelatedVideoConfig[] = adaptPlaylistVideos(response);

			expect(result).toHaveLength(3);
			expect(result[0].title).toBe('Video One');
			expect(result[1].title).toBe('Video Two');
			expect(result[2].title).toBe('Video Three');
		});

		it('should adapt a single video with all fields mapped', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem()]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0]).toEqual({
				id: 'video1',
				url: 'https://www.youtube.com/watch/video1',
				title: 'Test Video',
				thumbnail: 'https://example.com/v1.jpg',
				channelName: 'Test Channel',
				channelId: 'UCtest456',
				channelAvatar: 'https://example.com/avatar.jpg',
				duration: 120,
				viewCount: 1000,
				uploadDate: '2 weeks ago'
			});
		});

		it('should extract video ID from video URL', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [
					createMockRelatedItem({ url: 'https://www.youtube.com/watch/xyz789' })
				]
			});

			const result = adaptPlaylistVideos(response);

			expect(extractIdFromUrl).toHaveBeenCalledWith(
				'https://www.youtube.com/watch/xyz789'
			);
			expect(result[0].id).toBe('xyz789');
		});
	});

	describe('fallback handling', () => {
		it('should fall back to Untitled when video name is missing', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ name: undefined })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].title).toBe('Untitled');
		});

		it('should fall back to Untitled when video name is empty', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ name: '' })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].title).toBe('Untitled');
		});

		it('should fall back to Unknown when uploader name is missing', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ uploaderName: undefined })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].channelName).toBe('Unknown');
		});

		it('should use thumbnail placeholder when thumbnails are missing', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ thumbnails: undefined })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].thumbnail).toBe('mock-thumbnail-placeholder.jpg');
		});

		it('should use logo placeholder when uploader avatars are missing', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ uploaderAvatars: undefined })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].channelAvatar).toBe('mock-logo-placeholder.svg');
		});
	});

	describe('numeric value clamping', () => {
		it('should clamp negative duration to zero', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ duration: -1 })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].duration).toBe(0);
		});

		it('should default missing duration to zero', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ duration: undefined })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].duration).toBe(0);
		});

		it('should clamp negative view count to zero', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ viewCount: -50 })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].viewCount).toBe(0);
		});

		it('should default missing view count to zero', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ viewCount: undefined })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].viewCount).toBe(0);
		});

		it('should preserve valid positive durations and view counts', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem({ duration: 3600, viewCount: 1_000_000 })]
			});

			const result = adaptPlaylistVideos(response);

			expect(result[0].duration).toBe(3600);
			expect(result[0].viewCount).toBe(1_000_000);
		});
	});

	describe('edge cases', () => {
		it('should return empty array when relatedItems is undefined', () => {
			const response = createMockPlaylistResponse({ relatedItems: undefined });

			const result = adaptPlaylistVideos(response);

			expect(result).toEqual([]);
		});

		it('should return empty array when response is null', () => {
			const result = adaptPlaylistVideos(null as unknown as PlaylistResponse);

			expect(result).toEqual([]);
		});

		it('should return empty array when response is undefined', () => {
			const result = adaptPlaylistVideos(undefined as unknown as PlaylistResponse);

			expect(result).toEqual([]);
		});

		it('should adapt an empty relatedItems array to an empty result', () => {
			const response = createMockPlaylistResponse({ relatedItems: [] });

			const result = adaptPlaylistVideos(response);

			expect(result).toEqual([]);
		});

		it('should handle a large playlist', () => {
			const relatedItems = Array.from({ length: 200 }, (_: unknown, i: number) =>
				createMockRelatedItem({
					url: `https://www.youtube.com/watch/video${i}`,
					name: `Video ${i}`
				})
			);
			const response = createMockPlaylistResponse({ relatedItems });

			const result = adaptPlaylistVideos(response);

			expect(result).toHaveLength(200);
			expect(result[199].title).toBe('Video 199');
		});
	});

	describe('immutability', () => {
		it('should not modify the input response', () => {
			const item = createMockRelatedItem({ duration: -5 });
			const response = createMockPlaylistResponse({ relatedItems: [item] });

			adaptPlaylistVideos(response);

			expect((response.relatedItems?.[0] as RelatedItemResponse).duration).toBe(-5);
		});

		it('should return a new array each time', () => {
			const response = createMockPlaylistResponse({
				relatedItems: [createMockRelatedItem()]
			});

			const result1 = adaptPlaylistVideos(response);
			const result2 = adaptPlaylistVideos(response);

			expect(result1).toEqual(result2);
			expect(result1).not.toBe(result2); // Different arrays
		});
	});
});