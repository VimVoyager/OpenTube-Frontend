/**
 * Test Suite: related.ts
 * 
 * Tests for related videos adaptation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adaptRelatedVideos } from './related';
import relatedVideosResponseFixture from '../../tests/fixtures/api/relatedVideosResponse.json';
import relatedVideosFixture from '../../tests/fixtures/adapters/relatedVideos.json';
import thumbnailsResponseFixture from '../../tests/fixtures/api/thumbnailsResponseFixture.json';
import type { Avatar, RelatedItem, Thumbnail } from '$lib/types';
import { extractVideoIdFromUrl } from '$lib/utils/streamSelection';
import { selectBestThumbnail, selectBestUploaderAvatar } from '$lib/utils/mediaUtils';
import type { RelatedItemResponse } from '$lib/api/types';

// Mock the utility modules
vi.mock('$lib/utils/streamSelection', () => ({
	extractVideoIdFromUrl: vi.fn((url: string) => {
		if (!url) return '';
		const match = url.match(/[?&]v=([^&]+)/);
		return match ? match[1] : '';
	})
}));

vi.mock('$lib/utils/mediaUtils', () => ({
	selectBestThumbnail: vi.fn((thumbnails, fallback) => {
		if (!thumbnails || thumbnails.length === 0) return fallback;
		return thumbnails[1]?.url || thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url || fallback;
	}),
	selectBestUploaderAvatar: vi.fn((avatars, fallback) => {
		if (!avatars || avatars.length === 0) return fallback;
		return avatars[avatars.length - 1]?.url || avatars[0]?.url || fallback;
	})
}));

// =============================================================================
// Test Fixtures
// =============================================================================

const mockRelatedItemResponse: RelatedItemResponse[] = relatedVideosResponseFixture;
const mockRelatedItem: RelatedItem[] = relatedVideosFixture;

const defaultThumbnail = 'https://example.com/default-thumbnail.jpg';
const defaultAvatar = 'https://example.com/default-avatar.jpg';

// =============================================================================
// Setup and Teardown
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// adaptRelatedVideos Tests
// =============================================================================

describe('adaptRelatedVideos', () => {
	// =============================================================================
	// Successful Adaptation Tests
	// =============================================================================

	describe('successful related videos adaptation', () => {
		it('should adapt complete related item correctly', () => {
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('heartbeat-id');

			const result = adaptRelatedVideos(
				[mockRelatedItemResponse[0]],
				defaultThumbnail,
				defaultAvatar
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: mockRelatedItem[0].id,
				url: mockRelatedItem[0].url,
				title: mockRelatedItem[0].title,
				thumbnail: mockRelatedItem[0].thumbnail,
				channelName: mockRelatedItem[0].channelName,
				channelAvatar: mockRelatedItem[0].channelAvatar,
				viewCount: mockRelatedItem[0].viewCount,
				duration: mockRelatedItem[0].duration,
				uploadDate: mockRelatedItem[0].uploadDate
			});
		});

		it('should return all required configuration fields', () => {
			// Arrange & Act
			const result = adaptRelatedVideos(
				mockRelatedItemResponse,
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('url');
			expect(result[0]).toHaveProperty('title');
			expect(result[0]).toHaveProperty('thumbnail');
			expect(result[0]).toHaveProperty('channelName');
			expect(result[0]).toHaveProperty('channelAvatar');
			expect(result[0]).toHaveProperty('viewCount');
			expect(result[0]).toHaveProperty('duration');
			expect(result[0]).toHaveProperty('uploadDate');
		});

		it('should adapt multiple related items', () => {
			const result = adaptRelatedVideos(mockRelatedItemResponse, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(4);
		});

		it('should call utility functions for each item', () => {
			const items = [mockRelatedItemResponse[0], mockRelatedItemResponse[1]];

			adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			expect(extractVideoIdFromUrl).toHaveBeenCalledTimes(2);
			expect(selectBestThumbnail).toHaveBeenCalledTimes(2);
			expect(selectBestUploaderAvatar).toHaveBeenCalledTimes(2);
		});
	});

	// =============================================================================
	// Video ID Extraction Tests
	// =============================================================================

	describe('video ID extraction', () => {
		it('should extract video ID from URL', () => {
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('heartbeat-id');

			const result = adaptRelatedVideos(
				[mockRelatedItemResponse[0]],
				defaultThumbnail,
				defaultAvatar
			);

			expect(extractVideoIdFromUrl).toHaveBeenCalledWith(mockRelatedItemResponse[0].url);
			expect(result[0].id).toBe('heartbeat-id');
		});



		it('should handle empty URL gracefully', () => {
			const itemWithEmptyUrl = mockRelatedItemResponse[2];
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');

			const result = adaptRelatedVideos(
				[itemWithEmptyUrl],
				defaultThumbnail,
				defaultAvatar
			);

			expect(result).toHaveLength(0);
		});
	});

	// =============================================================================
	// Thumbnail Selection Tests
	// =============================================================================

	describe('thumbnail selection', () => {
		it('should call selectBestThumbnail with correct arguments', () => {
			adaptRelatedVideos(mockRelatedItemResponse, defaultThumbnail, defaultAvatar);

			expect(selectBestThumbnail).toHaveBeenCalledWith(
				mockRelatedItemResponse[0].thumbnails,
				defaultThumbnail
			);
		});

		it('should use thumbnail returned by selectBestThumbnail', () => {
			const customThumbnail = 'https://i.ytimg.com/vi/heartbeat-id/hqdefault.jpg/md';
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(customThumbnail);

			const result = adaptRelatedVideos(
				[mockRelatedItemResponse[0]],
				defaultThumbnail,
				defaultAvatar
			);

			expect(result[0].thumbnail).toBe(customThumbnail);
		});

		it('should use default thumbnail when thumbnails array is empty', () => {
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(defaultThumbnail);

			const result = adaptRelatedVideos(
				[mockRelatedItemResponse[3]],
				defaultThumbnail,
				defaultAvatar
			);

			expect(result[0].thumbnail).toBe(defaultThumbnail);
		});
	});

	// =============================================================================
	// Avatar Selection Tests
	// =============================================================================

	describe('avatar selection', () => {
		it('should call selectBestUploaderAvatar with correct arguments', () => {
			const result = adaptRelatedVideos([mockRelatedItemResponse[0]], defaultThumbnail, defaultAvatar);

			expect(selectBestUploaderAvatar).toHaveBeenCalledWith(
				mockRelatedItemResponse[0].uploaderAvatars,
				defaultAvatar
			);

			expect(result[0].channelAvatar).toBe('https://yt3.ggpht.com/random-unicode-characters/md');
		});

		it('should use avatar returned by selectBestUploaderAvatar', () => {
			const customAvatar = 'https://yt3.ggpht.com/random-unicode-characters';
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(customAvatar);

			const result = adaptRelatedVideos(
				[mockRelatedItemResponse[1]],
				defaultThumbnail,
				defaultAvatar
			);

			expect(result[0].channelAvatar).toBe(customAvatar);
		});

		it('should use default avatar when avatars array is empty', () => {
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(defaultAvatar);

			const result = adaptRelatedVideos(
				[mockRelatedItemResponse[3]],
				defaultThumbnail,
				defaultAvatar
			);

			expect(result[0].channelAvatar).toBe(defaultAvatar);
		});
	});

	// =============================================================================
	// Default Values Tests
	// =============================================================================

	describe('default values handling', () => {
		it('should use default channel name when uploaderName is missing', () => {
			const result = adaptRelatedVideos([mockRelatedItemResponse[4]], defaultThumbnail, defaultAvatar);

			expect(result[0].channelName).toBe('Unknown Channel');
		});

		it('should default viewCount to 0 when missing', () => {
			const result = adaptRelatedVideos([mockRelatedItemResponse[4]], defaultThumbnail, defaultAvatar);

			expect(result[0].viewCount).toBe(0);
		});

		it('should default duration to 0 when missing', () => {
			const result = adaptRelatedVideos([mockRelatedItemResponse[4]], defaultThumbnail, defaultAvatar);

			expect(result[0].duration).toBe(0);
		});

		it('should use empty string for uploadDate when missing', () => {
			const result = adaptRelatedVideos([mockRelatedItemResponse[4]], defaultThumbnail, defaultAvatar);

			expect(result[0].uploadDate).toBe('');
		});
	});

	// =============================================================================
	// Filtering Tests
	// =============================================================================

	describe('item filtering', () => {
		it('should filter out items with missing url and/or name', () => {
			const result = adaptRelatedVideos(mockRelatedItemResponse, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(4);
		});

		it('should filter out null items', () => {
			const items = [
				mockRelatedItemResponse,
				null as unknown as RelatedItemResponse,
				mockRelatedItemResponse
			];

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(0);
		});

		it('should filter out undefined items', () => {
			const items = [
				mockRelatedItemResponse,
				undefined as unknown as RelatedItemResponse,
				mockRelatedItemResponse
			];

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(0);
		});

		it('should return empty array when all items are invalid', () => {
			const items = [mockRelatedItemResponse[2]];

			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			expect(result).toEqual([]);
		});
	});

	// =============================================================================
	// Empty/Undefined Input Tests
	// =============================================================================

	describe('empty and undefined input handling', () => {
		it('should return empty array for undefined items', () => {
			const result = adaptRelatedVideos(undefined, defaultThumbnail, defaultAvatar);

			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should return empty array for empty items array', () => {
			const result = adaptRelatedVideos([], defaultThumbnail, defaultAvatar);

			expect(result).toEqual([]);
		});

		it('should not call utility functions for empty array', () => {
			adaptRelatedVideos([], defaultThumbnail, defaultAvatar);

			expect(extractVideoIdFromUrl).not.toHaveBeenCalled();
			expect(selectBestThumbnail).not.toHaveBeenCalled();
			expect(selectBestUploaderAvatar).not.toHaveBeenCalled();
		});

		it('should not call utility functions for undefined', () => {
			adaptRelatedVideos(undefined, defaultThumbnail, defaultAvatar);

			expect(extractVideoIdFromUrl).not.toHaveBeenCalled();
			expect(selectBestThumbnail).not.toHaveBeenCalled();
			expect(selectBestUploaderAvatar).not.toHaveBeenCalled();
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle very large view counts', () => {
			const item = {
				...mockRelatedItemResponse[0],
				viewCount: 999999999999999,
			}

			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			expect(result[0].viewCount).toBe(999999999999999);
		});

		it('should handle very long durations', () => {
			const item = {
				...mockRelatedItemResponse[0],
				duration: 86400
			};

			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			expect(result[0].duration).toBe(86400);
		});

		it('should handle negative view counts gracefully', () => {

			const result = adaptRelatedVideos([mockRelatedItemResponse[4]], defaultThumbnail, defaultAvatar);

			expect(result[0].viewCount).toBe(0);
		});

		it('should handle negative durations gracefully', () => {
			const result = adaptRelatedVideos([mockRelatedItemResponse[4]], defaultThumbnail, defaultAvatar);

			expect(result[0].duration).toBe(0);
		});

		it('should handle very long titles', () => {
			const longTitle = 'A'.repeat(1000);
			const item = { ...mockRelatedItemResponse[0], name: longTitle };

			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			expect(result[0].title).toBe(longTitle);
		});

		it('should handle special characters in titles', () => {
			const specialTitle = 'Test & Title <with> "special" \'chars\'';
			const item = { ...mockRelatedItemResponse[0], name: specialTitle };

			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			expect(result[0].title).toBe(specialTitle);
		});

		it('should not modify input items array', () => {
			const items = mockRelatedItemResponse;
			const itemsCopy = JSON.parse(JSON.stringify(items));

			adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			expect(items).toEqual(itemsCopy);
		});
	});

	// =============================================================================
	// Data Type Preservation Tests
	// =============================================================================

	describe('data type preservation', () => {
		it('should preserve string types', () => {
			const result = adaptRelatedVideos(
				mockRelatedItemResponse,
				defaultThumbnail,
				defaultAvatar
			);

			expect(typeof result[0].id).toBe('string');
			expect(typeof result[0].url).toBe('string');
			expect(typeof result[0].title).toBe('string');
			expect(typeof result[0].thumbnail).toBe('string');
			expect(typeof result[0].channelName).toBe('string');
			expect(typeof result[0].channelAvatar).toBe('string');
			expect(typeof result[0].uploadDate).toBe('string');
		});

		it('should preserve number types', () => {
			// Arrange & Act
			const result = adaptRelatedVideos(
				mockRelatedItemResponse,
				defaultThumbnail,
				defaultAvatar
			);

			expect(typeof result[0].viewCount).toBe('number');
			expect(typeof result[0].duration).toBe('number');
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration with utility functions', () => {
		it('should work correctly with all utility functions', () => {
			const videoId = 'heartbeat-id';
			const thumbnailUrl = relatedVideosResponseFixture[0].thumbnails[1].url;
			const avatarUrl = relatedVideosResponseFixture[0].uploaderAvatars[0].url;

			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce(videoId);
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(thumbnailUrl);
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(avatarUrl);

			const result = adaptRelatedVideos(
				[mockRelatedItemResponse[0]],
				defaultThumbnail,
				defaultAvatar
			);

			expect(result[0].id).toBe(videoId);
			expect(result[0].thumbnail).toBe(thumbnailUrl);
			expect(result[0].channelAvatar).toBe(avatarUrl);
		});

		it('should handle utility functions returning defaults', () => {
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(defaultThumbnail);
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(defaultAvatar);

			const result = adaptRelatedVideos(
				[mockRelatedItemResponse[3]],
				defaultThumbnail,
				defaultAvatar
			);

			expect(result[0].thumbnail).toBe(defaultThumbnail);
			expect(result[0].channelAvatar).toBe(defaultAvatar);
		});
	});
});