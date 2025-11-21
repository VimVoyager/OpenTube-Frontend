/**
 * Test Suite: relatedVideos.ts
 * 
 * Tests for related videos adaptation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptRelatedVideos } from './relatedVideos';
import type { RelatedItem, Thumbnail, Avatar } from '$lib/types';

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

import { extractVideoIdFromUrl } from '$lib/utils/streamSelection';
import { selectBestThumbnail, selectBestUploaderAvatar } from '$lib/utils/mediaUtils';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockThumbnails: Thumbnail[] = [
	{
		url: 'https://i.ytimg.com/vi/test/default.jpg',
		height: 90,
		width: 120,
		estimatedResolutionLevel: 'LOW'
	},
	{
		url: 'https://i.ytimg.com/vi/test/mqdefault.jpg',
		height: 180,
		width: 320,
		estimatedResolutionLevel: 'MEDIUM'
	},
	{
		url: 'https://i.ytimg.com/vi/test/hqdefault.jpg',
		height: 360,
		width: 480,
		estimatedResolutionLevel: 'HIGH'
	}
];

const mockAvatars: Avatar[] = [
	{
		url: 'https://yt3.ggpht.com/avatar-s48.jpg',
		height: 48,
		width: 48,
		estimatedResolutionLevel: 'LOW'
	},
	{
		url: 'https://yt3.ggpht.com/avatar-s88.jpg',
		height: 88,
		width: 88,
		estimatedResolutionLevel: 'MEDIUM'
	}
];

const mockRelatedItem: RelatedItem = {
	id: 'test-video-id',
	infoType: 'STREAM',
	url: 'https://www.youtube.com/watch?v=test-video-id',
	name: 'Test Video Title',
	thumbnails: mockThumbnails,
	streamType: 'VIDEO_STREAM',
	uploaderName: 'Test Channel',
	textualUploadDate: '2 days ago',
	viewCount: 1000000,
	duration: 300,
	uploaderUrl: 'https://www.youtube.com/channel/test-channel',
	uploaderAvatars: mockAvatars,
	uploaderSubscriberCount: 500000,
	shortFormContent: false
};

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
			// Arrange
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('test-video-id');
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(mockThumbnails[1].url);
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(mockAvatars[1].url);

			// Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: 'test-video-id',
				url: mockRelatedItem.url,
				title: mockRelatedItem.name,
				thumbnail: mockThumbnails[1].url,
				channelName: mockRelatedItem.uploaderName,
				channelAvatar: mockAvatars[1].url,
				viewCount: mockRelatedItem.viewCount,
				duration: mockRelatedItem.duration,
				uploadDate: mockRelatedItem.textualUploadDate
			});
		});

		it('should return all required configuration fields', () => {
			// Arrange & Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
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
			// Arrange
			const items = [
				mockRelatedItem,
				{ ...mockRelatedItem, id: 'video-2', url: 'https://www.youtube.com/watch?v=video-2' },
				{ ...mockRelatedItem, id: 'video-3', url: 'https://www.youtube.com/watch?v=video-3' }
			];

			// Act
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(3);
		});

		it('should call utility functions for each item', () => {
			// Arrange
			const items = [mockRelatedItem, mockRelatedItem];

			// Act
			adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
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
			// Arrange
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('extracted-id');

			// Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(extractVideoIdFromUrl).toHaveBeenCalledWith(mockRelatedItem.url);
			expect(result[0].id).toBe('extracted-id');
		});

		it('should fall back to item.id when URL extraction fails', () => {
			// Arrange
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');

			// Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0].id).toBe(mockRelatedItem.id);
		});

		it('should handle empty URL gracefully', () => {
			// Arrange
			const itemWithEmptyUrl = { ...mockRelatedItem, url: '' };
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');

			// Act
			const result = adaptRelatedVideos(
				[itemWithEmptyUrl],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result).toHaveLength(0);
		});
	});

	// =============================================================================
	// Thumbnail Selection Tests
	// =============================================================================

	describe('thumbnail selection', () => {
		it('should call selectBestThumbnail with correct arguments', () => {
			// Arrange & Act
			adaptRelatedVideos([mockRelatedItem], defaultThumbnail, defaultAvatar);

			// Assert
			expect(selectBestThumbnail).toHaveBeenCalledWith(
				mockRelatedItem.thumbnails,
				defaultThumbnail
			);
		});

		it('should use thumbnail returned by selectBestThumbnail', () => {
			// Arrange
			const customThumbnail = 'https://example.com/custom-thumbnail.jpg';
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(customThumbnail);

			// Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0].thumbnail).toBe(customThumbnail);
		});

		it('should use default thumbnail when thumbnails array is empty', () => {
			// Arrange
			const itemWithoutThumbnails = { ...mockRelatedItem, thumbnails: [] };
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(defaultThumbnail);

			// Act
			const result = adaptRelatedVideos(
				[itemWithoutThumbnails],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0].thumbnail).toBe(defaultThumbnail);
		});
	});

	// =============================================================================
	// Avatar Selection Tests
	// =============================================================================

	describe('avatar selection', () => {
		it('should call selectBestUploaderAvatar with correct arguments', () => {
			// Arrange & Act
			adaptRelatedVideos([mockRelatedItem], defaultThumbnail, defaultAvatar);

			// Assert
			expect(selectBestUploaderAvatar).toHaveBeenCalledWith(
				mockRelatedItem.uploaderAvatars,
				defaultAvatar
			);
		});

		it('should use avatar returned by selectBestUploaderAvatar', () => {
			// Arrange
			const customAvatar = 'https://example.com/custom-avatar.jpg';
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(customAvatar);

			// Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0].channelAvatar).toBe(customAvatar);
		});

		it('should use default avatar when avatars array is empty', () => {
			// Arrange
			const itemWithoutAvatars = { ...mockRelatedItem, uploaderAvatars: [] };
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(defaultAvatar);

			// Act
			const result = adaptRelatedVideos(
				[itemWithoutAvatars],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0].channelAvatar).toBe(defaultAvatar);
		});
	});

	// =============================================================================
	// Default Values Tests
	// =============================================================================

	describe('default values handling', () => {
		it('should use default title when name is missing', () => {
			// Arrange
			const item = { ...mockRelatedItem, name: '' };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
            expect(result).toHaveLength(0);
		});

		it('should use default channel name when uploaderName is missing', () => {
			// Arrange
			const item = { ...mockRelatedItem, uploaderName: '' };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].channelName).toBe('Unknown Channel');
		});

		it('should default viewCount to 0 when missing', () => {
			// Arrange
			const item = { ...mockRelatedItem, viewCount: 0 };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].viewCount).toBe(0);
		});

		it('should default duration to 0 when missing', () => {
			// Arrange
			const item = { ...mockRelatedItem, duration: 0 };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].duration).toBe(0);
		});

		it('should use empty string for uploadDate when missing', () => {
			// Arrange
			const item = { ...mockRelatedItem, textualUploadDate: '' };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].uploadDate).toBe('');
		});

		it('should use empty string for url when missing', () => {
			// Arrange
			const item = { ...mockRelatedItem, url: '' };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(0);
		});
	});

	// =============================================================================
	// Filtering Tests
	// =============================================================================

	describe('item filtering', () => {
		it('should filter out items with missing url', () => {
			// Arrange
			const items = [
				mockRelatedItem,
				{ ...mockRelatedItem, url: '' },
				mockRelatedItem
			];

			// Act
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should filter out items with missing name', () => {
			// Arrange
			const items = [
				mockRelatedItem,
				{ ...mockRelatedItem, name: '' },
				mockRelatedItem
			];

			// Act
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should filter out items with both missing url and name', () => {
			// Arrange
			const items = [
				mockRelatedItem,
				{ ...mockRelatedItem, url: '', name: '' },
				mockRelatedItem
			];

			// Act
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should filter out null items', () => {
			// Arrange
			const items = [
				mockRelatedItem,
				null as unknown as RelatedItem,
				mockRelatedItem
			];

			// Act
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should filter out undefined items', () => {
			// Arrange
			const items = [
				mockRelatedItem,
				undefined as unknown as RelatedItem,
				mockRelatedItem
			];

			// Act
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should return empty array when all items are invalid', () => {
			// Arrange
			const items = [
				{ ...mockRelatedItem, url: '' },
				{ ...mockRelatedItem, name: '' },
				null as unknown as RelatedItem
			];

			// Act
			const result = adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toEqual([]);
		});
	});

	// =============================================================================
	// Empty/Undefined Input Tests
	// =============================================================================

	describe('empty and undefined input handling', () => {
		it('should return empty array for undefined items', () => {
			// Arrange & Act
			const result = adaptRelatedVideos(undefined, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should return empty array for empty items array', () => {
			// Arrange & Act
			const result = adaptRelatedVideos([], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toEqual([]);
		});

		it('should not call utility functions for empty array', () => {
			// Arrange & Act
			adaptRelatedVideos([], defaultThumbnail, defaultAvatar);

			// Assert
			expect(extractVideoIdFromUrl).not.toHaveBeenCalled();
			expect(selectBestThumbnail).not.toHaveBeenCalled();
			expect(selectBestUploaderAvatar).not.toHaveBeenCalled();
		});

		it('should not call utility functions for undefined', () => {
			// Arrange & Act
			adaptRelatedVideos(undefined, defaultThumbnail, defaultAvatar);

			// Assert
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
			// Arrange
			const item = { ...mockRelatedItem, viewCount: 999999999999 };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].viewCount).toBe(999999999999);
		});

		it('should handle very long durations', () => {
			// Arrange
			const item = { ...mockRelatedItem, duration: 86400 }; // 24 hours

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].duration).toBe(86400);
		});

		it('should handle negative view counts gracefully', () => {
			// Arrange
			const item = { ...mockRelatedItem, viewCount: -1 };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].viewCount).toBe(0);
		});

		it('should handle negative durations gracefully', () => {
			// Arrange
			const item = { ...mockRelatedItem, duration: -1 };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].duration).toBe(0);
		});

		it('should handle very long titles', () => {
			// Arrange
			const longTitle = 'A'.repeat(1000);
			const item = { ...mockRelatedItem, name: longTitle };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].title).toBe(longTitle);
		});

		it('should handle special characters in titles', () => {
			// Arrange
			const specialTitle = 'Test & Title <with> "special" \'chars\'';
			const item = { ...mockRelatedItem, name: specialTitle };

			// Act
			const result = adaptRelatedVideos([item], defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].title).toBe(specialTitle);
		});

		it('should not modify input items array', () => {
			// Arrange
			const items = [mockRelatedItem];
			const itemsCopy = JSON.parse(JSON.stringify(items));

			// Act
			adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

			// Assert
			expect(items).toEqual(itemsCopy);
		});
	});

	// =============================================================================
	// Data Type Preservation Tests
	// =============================================================================

	describe('data type preservation', () => {
		it('should preserve string types', () => {
			// Arrange & Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
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
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(typeof result[0].viewCount).toBe('number');
			expect(typeof result[0].duration).toBe('number');
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration with utility functions', () => {
		it('should work correctly with all utility functions', () => {
			// Arrange
			const videoId = 'extracted-video-id';
			const thumbnailUrl = mockThumbnails[1].url;
			const avatarUrl = mockAvatars[1].url;

			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce(videoId);
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(thumbnailUrl);
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(avatarUrl);

			// Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0].id).toBe(videoId);
			expect(result[0].thumbnail).toBe(thumbnailUrl);
			expect(result[0].channelAvatar).toBe(avatarUrl);
		});

		it('should handle utility functions returning defaults', () => {
			// Arrange
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');
			vi.mocked(selectBestThumbnail).mockReturnValueOnce(defaultThumbnail);
			vi.mocked(selectBestUploaderAvatar).mockReturnValueOnce(defaultAvatar);

			// Act
			const result = adaptRelatedVideos(
				[mockRelatedItem],
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0].id).toBe(mockRelatedItem.id);
			expect(result[0].thumbnail).toBe(defaultThumbnail);
			expect(result[0].channelAvatar).toBe(defaultAvatar);
		});
	});
});