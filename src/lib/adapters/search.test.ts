/**
 * Test Suite: search.ts
 *
 * Tests for search results adaptation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptSearchResults } from './search';
import type { SearchResult, SearchItem } from '$lib/types';

// Mock the utility module
vi.mock('$lib/utils/streamSelection', () => ({
	extractVideoIdFromUrl: vi.fn((url: string) => {
		if (!url) return '';
		const match = url.match(/[?&]v=([^&]+)/);
		return match ? match[1] : '';
	})
}));

import { extractVideoIdFromUrl } from '$lib/utils/streamSelection';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSearchItem: SearchItem = {
	type: 'stream',
	name: 'Test Video Title',
	url: 'https://www.youtube.com/watch?v=test-video-id',
	thumbnailUrl: 'https://i.ytimg.com/vi/test/mqdefault.jpg',
	uploaderName: 'Test Channel',
	uploaderUrl: 'https://www.youtube.com/channel/test-channel',
	uploaderAvatarUrl: 'https://yt3.ggpht.com/avatar-s88.jpg',
	uploaderVerified: true,
	duration: 300,
	viewCount: 1000000,
	uploadDate: '2 days ago',
	streamType: 'VIDEO_STREAM',
	isShortFormContent: false,
	description: 'This is a test video description'
};

const mockSearchResult: SearchResult = {
	url: 'https://www.youtube.com/results?search_query=test',
	originalUrl: 'https://www.youtube.com/results?search_query=test',
	name: 'test',
	searchString: 'test',
	searchSuggestion: null,
	isCorrectedSearch: false,
	items: [mockSearchItem],
	nextPageUrl: 'https://www.youtube.com/results?search_query=test&page=2',
	hasNextPage: true
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
// adaptSearchResults Tests
// =============================================================================

describe('adaptSearchResults', () => {
	// =============================================================================
	// Successful Adaptation Tests
	// =============================================================================

	describe('successful search results adaptation', () => {
		it('should adapt complete search item correctly', () => {
			// Arrange
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('test-video-id');

			// Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: 'test-video-id',
				url: mockSearchItem.url,
				title: mockSearchItem.name,
				thumbnail: mockSearchItem.thumbnailUrl,
				channelName: mockSearchItem.uploaderName,
				channelUrl: mockSearchItem.uploaderUrl,
				channelAvatar: mockSearchItem.uploaderAvatarUrl,
				verified: mockSearchItem.uploaderVerified,
				viewCount: mockSearchItem.viewCount,
				duration: mockSearchItem.duration,
				uploadDate: mockSearchItem.uploadDate,
				description: mockSearchItem.description,
				type: mockSearchItem.type
			});
		});

		it('should return all required configuration fields', () => {
			// Arrange & Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('url');
			expect(result[0]).toHaveProperty('title');
			expect(result[0]).toHaveProperty('thumbnail');
			expect(result[0]).toHaveProperty('channelName');
			expect(result[0]).toHaveProperty('channelUrl');
			expect(result[0]).toHaveProperty('channelAvatar');
			expect(result[0]).toHaveProperty('verified');
			expect(result[0]).toHaveProperty('viewCount');
			expect(result[0]).toHaveProperty('duration');
			expect(result[0]).toHaveProperty('uploadDate');
			expect(result[0]).toHaveProperty('description');
			expect(result[0]).toHaveProperty('type');
		});

		it('should adapt multiple search items', () => {
			// Arrange
			const searchResultWithMultiple: SearchResult = {
				...mockSearchResult,
				items: [
					mockSearchItem,
					{ ...mockSearchItem, url: 'https://www.youtube.com/watch?v=video-2' },
					{ ...mockSearchItem, url: 'https://www.youtube.com/watch?v=video-3' }
				]
			};

			// Act
			const result = adaptSearchResults(searchResultWithMultiple, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(3);
		});

		it('should call extractVideoIdFromUrl for each item', () => {
			// Arrange
			const searchResultWithMultiple: SearchResult = {
				...mockSearchResult,
				items: [mockSearchItem, mockSearchItem]
			};

			// Act
			adaptSearchResults(searchResultWithMultiple, defaultThumbnail, defaultAvatar);

			// Assert
			expect(extractVideoIdFromUrl).toHaveBeenCalledTimes(2);
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
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(extractVideoIdFromUrl).toHaveBeenCalledWith(mockSearchItem.url);
			expect(result[0].id).toBe('extracted-id');
		});

		it('should use empty string when URL extraction fails', () => {
			// Arrange
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');

			// Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].id).toBe('');
		});

		it('should handle empty URL gracefully', () => {
			// Arrange
			const itemWithEmptyUrl: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, url: '' }]
			};
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');

			// Act
			const result = adaptSearchResults(itemWithEmptyUrl, defaultThumbnail, defaultAvatar);

			// Assert - item filtered out due to empty URL
			expect(result).toHaveLength(0);
		});
	});

	// =============================================================================
	// Thumbnail Handling Tests
	// =============================================================================

	describe('thumbnail handling', () => {
		it('should use thumbnailUrl from search item', () => {
			// Arrange & Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].thumbnail).toBe(mockSearchItem.thumbnailUrl);
		});

		it('should use default thumbnail when thumbnailUrl is empty', () => {
			// Arrange
			const itemWithoutThumbnail: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, thumbnailUrl: '' }]
			};

			// Act
			const result = adaptSearchResults(itemWithoutThumbnail, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].thumbnail).toBe(defaultThumbnail);
		});

		it('should use default thumbnail when thumbnailUrl is undefined', () => {
			// Arrange
			const itemWithUndefinedThumbnail: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, thumbnailUrl: undefined as unknown as string }]
			};

			// Act
			const result = adaptSearchResults(
				itemWithUndefinedThumbnail,
				defaultThumbnail,
				defaultAvatar
			);

			// Assert
			expect(result[0].thumbnail).toBe(defaultThumbnail);
		});
	});

	// =============================================================================
	// Avatar Handling Tests
	// =============================================================================

	describe('avatar handling', () => {
		it('should use uploaderAvatarUrl from search item', () => {
			// Arrange & Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].channelAvatar).toBe(mockSearchItem.uploaderAvatarUrl);
		});

		it('should use default avatar when uploaderAvatarUrl is empty', () => {
			// Arrange
			const itemWithoutAvatar: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderAvatarUrl: '' }]
			};

			// Act
			const result = adaptSearchResults(itemWithoutAvatar, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].channelAvatar).toBe(defaultAvatar);
		});

		it('should use default avatar when uploaderAvatarUrl is undefined', () => {
			// Arrange
			const itemWithUndefinedAvatar: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderAvatarUrl: undefined }]
			};

			// Act
			const result = adaptSearchResults(itemWithUndefinedAvatar, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].channelAvatar).toBe(defaultAvatar);
		});
	});

	// =============================================================================
	// Default Values Tests
	// =============================================================================

	describe('default values handling', () => {
		it('should use default title when name is empty', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, name: '' }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert - item filtered out due to empty name
			expect(result).toHaveLength(0);
		});

		it('should use "Untitled Video" when name is undefined after filtering', () => {
			// Arrange - item with name but testing the default in adaptSearchItem
			const itemWithWhitespaceName: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, name: '   ' }] // whitespace passes filter but is truthy
			};

			// Act
			const result = adaptSearchResults(itemWithWhitespaceName, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].title).toBe('   '); // whitespace is preserved as it's truthy
		});

		it('should use default channel name when uploaderName is missing', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderName: '' }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].channelName).toBe('Unknown Channel');
		});

		it('should use default channel name when uploaderName is undefined', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderName: undefined }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].channelName).toBe('Unknown Channel');
		});

		it('should default viewCount to 0 when missing', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, viewCount: undefined }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].viewCount).toBe(0);
		});

		it('should default duration to 0 when missing', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, duration: undefined }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].duration).toBe(0);
		});

		it('should use empty string for uploadDate when missing', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploadDate: undefined }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].uploadDate).toBe('');
		});

		it('should use empty string for description when missing', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, description: undefined }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].description).toBe('');
		});

		it('should use empty string for channelUrl when missing', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderUrl: undefined }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].channelUrl).toBe('');
		});

		it('should default verified to false when missing', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderVerified: undefined }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].verified).toBe(false);
		});

		it('should default type to "stream" when missing', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, type: undefined as unknown as string }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].type).toBe('stream');
		});
	});

	// =============================================================================
	// Verified Status Tests
	// =============================================================================

	describe('verified status handling', () => {
		it('should preserve true verified status', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderVerified: true }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].verified).toBe(true);
		});

		it('should preserve false verified status', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderVerified: false }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].verified).toBe(false);
		});
	});

	// =============================================================================
	// Type Handling Tests
	// =============================================================================

	describe('search result type handling', () => {
		it('should handle stream type', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, type: 'stream' }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].type).toBe('stream');
		});

		it('should handle channel type', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, type: 'channel' }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].type).toBe('channel');
		});

		it('should handle playlist type', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, type: 'playlist' }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].type).toBe('playlist');
		});
	});

	// =============================================================================
	// Filtering Tests
	// =============================================================================

	describe('item filtering', () => {
		it('should filter out items with missing url', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [mockSearchItem, { ...mockSearchItem, url: '' }, mockSearchItem]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should filter out items with missing name', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [mockSearchItem, { ...mockSearchItem, name: '' }, mockSearchItem]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should filter out items with both missing url and name', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [mockSearchItem, { ...mockSearchItem, url: '', name: '' }, mockSearchItem]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should filter out null items', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [mockSearchItem, null as unknown as SearchItem, mockSearchItem]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should filter out undefined items', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [mockSearchItem, undefined as unknown as SearchItem, mockSearchItem]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(2);
		});

		it('should return empty array when all items are invalid', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [
					{ ...mockSearchItem, url: '' },
					{ ...mockSearchItem, name: '' },
					null as unknown as SearchItem
				]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toEqual([]);
		});
	});

	// =============================================================================
	// Empty/Undefined Input Tests
	// =============================================================================

	describe('empty and undefined input handling', () => {
		it('should return empty array for undefined searchResult', () => {
			// Arrange & Act
			const result = adaptSearchResults(undefined, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should return empty array for searchResult with undefined items', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: undefined as unknown as SearchItem[]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toEqual([]);
		});

		it('should return empty array for empty items array', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: []
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toEqual([]);
		});

		it('should not call extractVideoIdFromUrl for empty items array', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: []
			};

			// Act
			adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(extractVideoIdFromUrl).not.toHaveBeenCalled();
		});

		it('should not call extractVideoIdFromUrl for undefined searchResult', () => {
			// Arrange & Act
			adaptSearchResults(undefined, defaultThumbnail, defaultAvatar);

			// Assert
			expect(extractVideoIdFromUrl).not.toHaveBeenCalled();
		});
	});

	// =============================================================================
	// Negative Count Handling Tests
	// =============================================================================

	describe('negative count handling', () => {
		it('should handle negative view counts gracefully', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, viewCount: -1 }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].viewCount).toBe(0);
		});

		it('should handle negative durations gracefully', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, duration: -1 }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].duration).toBe(0);
		});

		it('should preserve zero view count', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, viewCount: 0 }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].viewCount).toBe(0);
		});

		it('should preserve zero duration', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, duration: 0 }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].duration).toBe(0);
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle very large view counts', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, viewCount: 999999999999 }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].viewCount).toBe(999999999999);
		});

		it('should handle very long durations', () => {
			// Arrange
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, duration: 86400 }] // 24 hours
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].duration).toBe(86400);
		});

		it('should handle very long titles', () => {
			// Arrange
			const longTitle = 'A'.repeat(1000);
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, name: longTitle }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].title).toBe(longTitle);
		});

		it('should handle very long descriptions', () => {
			// Arrange
			const longDescription = 'B'.repeat(5000);
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, description: longDescription }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].description).toBe(longDescription);
		});

		it('should handle special characters in titles', () => {
			// Arrange
			const specialTitle = 'Test & Title <with> "special" \'chars\' @#$%^&*()';
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, name: specialTitle }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].title).toBe(specialTitle);
		});

		it('should handle special characters in descriptions', () => {
			// Arrange
			const specialDescription = 'Description with <html> & "quotes" and émojis 🎉';
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, description: specialDescription }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].description).toBe(specialDescription);
		});

		it('should handle unicode characters in channel names', () => {
			// Arrange
			const unicodeName = '日本語チャンネル 🇯🇵';
			const item: SearchResult = {
				...mockSearchResult,
				items: [{ ...mockSearchItem, uploaderName: unicodeName }]
			};

			// Act
			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].channelName).toBe(unicodeName);
		});

		it('should not modify input searchResult', () => {
			// Arrange
			const searchResultCopy = JSON.parse(JSON.stringify(mockSearchResult));

			// Act
			adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(mockSearchResult).toEqual(searchResultCopy);
		});
	});

	// =============================================================================
	// Data Type Preservation Tests
	// =============================================================================

	describe('data type preservation', () => {
		it('should preserve string types', () => {
			// Arrange & Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(typeof result[0].id).toBe('string');
			expect(typeof result[0].url).toBe('string');
			expect(typeof result[0].title).toBe('string');
			expect(typeof result[0].thumbnail).toBe('string');
			expect(typeof result[0].channelName).toBe('string');
			expect(typeof result[0].channelUrl).toBe('string');
			expect(typeof result[0].channelAvatar).toBe('string');
			expect(typeof result[0].uploadDate).toBe('string');
			expect(typeof result[0].description).toBe('string');
			expect(typeof result[0].type).toBe('string');
		});

		it('should preserve number types', () => {
			// Arrange & Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(typeof result[0].viewCount).toBe('number');
			expect(typeof result[0].duration).toBe('number');
		});

		it('should preserve boolean types', () => {
			// Arrange & Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(typeof result[0].verified).toBe('boolean');
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration with utility functions', () => {
		it('should work correctly with extractVideoIdFromUrl', () => {
			// Arrange
			const videoId = 'extracted-video-id';
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce(videoId);

			// Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].id).toBe(videoId);
		});

		it('should handle extractVideoIdFromUrl returning empty string', () => {
			// Arrange
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');

			// Act
			const result = adaptSearchResults(mockSearchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result[0].id).toBe('');
		});
	});

	// =============================================================================
	// Real-world Scenario Tests
	// =============================================================================

	describe('real-world scenarios', () => {
		it('should handle mixed valid and invalid items', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [
					mockSearchItem,
					{ ...mockSearchItem, url: '' }, // invalid - no URL
					{ ...mockSearchItem, name: '' }, // invalid - no name
					mockSearchItem,
					null as unknown as SearchItem, // invalid - null
					{ ...mockSearchItem, uploaderName: undefined }, // valid - optional field
					mockSearchItem
				]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(4);
		});

		it('should handle search results with all types mixed', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [
					{ ...mockSearchItem, type: 'stream' },
					{ ...mockSearchItem, type: 'channel', url: 'https://youtube.com/channel/123' },
					{ ...mockSearchItem, type: 'playlist', url: 'https://youtube.com/playlist?list=123' }
				]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(3);
			expect(result[0].type).toBe('stream');
			expect(result[1].type).toBe('channel');
			expect(result[2].type).toBe('playlist');
		});

		it('should handle search result with pagination info', () => {
			// Arrange
			const searchResult: SearchResult = {
				...mockSearchResult,
				nextPageUrl: 'https://youtube.com/results?page=2',
				hasNextPage: true
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert - pagination info doesn't affect items adaptation
			expect(result).toHaveLength(1);
		});

		it('should handle items with all optional fields missing', () => {
			// Arrange
			const minimalItem: SearchItem = {
				type: 'stream',
				name: 'Minimal Video',
				url: 'https://youtube.com/watch?v=minimal',
				thumbnailUrl: ''
			};
			const searchResult: SearchResult = {
				...mockSearchResult,
				items: [minimalItem]
			};

			// Act
			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0].title).toBe('Minimal Video');
			expect(result[0].thumbnail).toBe(defaultThumbnail);
			expect(result[0].channelName).toBe('Unknown Channel');
			expect(result[0].channelUrl).toBe('');
			expect(result[0].channelAvatar).toBe(defaultAvatar);
			expect(result[0].verified).toBe(false);
			expect(result[0].viewCount).toBe(0);
			expect(result[0].duration).toBe(0);
			expect(result[0].uploadDate).toBe('');
			expect(result[0].description).toBe('');
		});
	});
});