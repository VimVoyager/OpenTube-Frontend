/**
 * Test Suite: search.ts
 *
 * Tests for search results adaptation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptSearchResults } from './search';
import searchResultFixture from '../../tests/fixtures/adapters/searchResult.json';
import searchResponseFixture from '../../tests/fixtures/api/searchResponseFixture.json';
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
import type { SearchResponse } from '$lib/api/types';
import type { SearchResultConfig } from '$lib/adapters/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSearchResponse: SearchResponse = searchResponseFixture;
const mockSearchResult: SearchResultConfig[] = searchResultFixture;

const defaultThumbnail = 'default-thumbnail.jpg';
const defaultAvatar = 'default-avatar.jpg';

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
		it('should adapt complete search item array correctly', () => {
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('pilot-id');

			const result = adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(mockSearchResult[0]);
			expect(result[1]).toEqual(mockSearchResult[1]);

			expect(extractVideoIdFromUrl).toHaveBeenCalledTimes(2);
			expect(extractVideoIdFromUrl).toHaveBeenCalledWith(mockSearchResult[0].url);

			expect(result[0].thumbnail).toBe(mockSearchResult[0].thumbnail);
			expect(result[1].thumbnail).toBe(defaultThumbnail);

			expect(result[0].channelAvatar).toBe(mockSearchResult[0].channelAvatar);
			expect(result[1].channelAvatar).toBe(defaultAvatar);

			expect(result[1].channelName).toBe('Unknown Channel')
			expect(result[1].type).toBe('stream');

			expect(mockSearchResponse.items[2].viewCount).toBe(-1);
			expect(result[1].viewCount).toBe(0);

			expect(mockSearchResponse.items[2].duration).toBe(-1);
			expect(result[1].duration).toBe(0);
		});
	});

	// =============================================================================
	// Video ID Extraction Tests
	// =============================================================================

	describe('video ID extraction', () => {
		it('should extract video ID from URL', () => {
			const result = adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);

			expect(extractVideoIdFromUrl).toHaveBeenCalledWith(mockSearchResult[0].url);
			expect(result[0].id).toBe(mockSearchResult[0].id);
		});

		it('should use empty string when URL extraction fails', () => {
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');

			const result = adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);

			expect(result[0].id).toBe('');
		});
	});

	// =============================================================================
	// Default Values Tests
	// =============================================================================

	describe('default values handling', () => {
		it('should use empty string for channelUrl when missing', () => {
			const item: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], uploaderUrl: undefined }]
			};

			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			expect(result[0].channelUrl).toBe('');
		});

		it('should default verified to false when missing', () => {
			const item: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], uploaderVerified: undefined }]
			};

			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			expect(result[0].verified).toBe(false);
		});
	});

	// =============================================================================
	// Type Handling Tests
	// =============================================================================

	describe('search result type handling', () => {
		it('should handle stream type', () => {
			const item: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], type: 'stream' }]
			};

			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			expect(result[0].type).toBe('stream');
		});

		// TODO: Add these tests back once channels and playlists have been implemented
		// it('should handle channel type', () => {
		// 	const item: SearchResult = {
		// 		...mockSearchResponse,
		// 		items: [{ ...mockSearchResponse.items[0], type: 'channel' }]
		// 	};
		//
		// 	const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);
		//
		// 	expect(result[0].type).toBe('channel');
		// });
		//
		// it('should handle playlist type', () => {
		// 	// Arrange
		// 	const item: SearchResult = {
		// 		...mockSearchResponse,
		// 		items: [{ ...mockSearchResponse.items[0], type: 'playlist' }]
		// 	};
		//
		// 	// Act
		// 	const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);
		//
		// 	// Assert
		// 	expect(result[0].type).toBe('playlist');
		// });
	});

	// =============================================================================
	// Filtering Tests
	// =============================================================================

	describe('item filtering', () => {
		it('should filter out null items', () => {
			const searchResult: SearchResult = {
				...mockSearchResponse,
				items: [mockSearchResponse.items[0], null as unknown as SearchItem, mockSearchResponse.items[0]]
			};

			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(2);
		});

		it('should filter out undefined items', () => {
			const searchResult: SearchResult = {
				...mockSearchResponse,
				items: [mockSearchResponse.items[0], undefined as unknown as SearchItem, mockSearchResponse.items[0]]
			};

			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(2);
		});

		it('should return empty array when all items are invalid', () => {
			const searchResult: SearchResult = {
				...mockSearchResponse,
				items: [
					{ ...mockSearchResponse.items[0], url: '' },
					{ ...mockSearchResponse.items[0], name: '' },
					null as unknown as SearchItem
				]
			};

			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			expect(result).toEqual([]);
		});
	});

	// =============================================================================
	// Edge Cases Tests
	// =============================================================================

	describe('edge cases', () => {
		it('should handle very large view counts', () => {
			const item: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], viewCount: 999999999999 }]
			};

			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			expect(result[0].viewCount).toBe(999999999999);
		});

		it('should handle very long durations', () => {
			const item: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], duration: 86400 }] // 24 hours
			};

			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			expect(result[0].duration).toBe(86400);
		});

		it('should handle very long titles', () => {
			const longTitle = 'A'.repeat(1000);
			const item: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], name: longTitle }]
			};

			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			expect(result[0].title).toBe(longTitle);
		});

		it('should handle special characters in titles', () => {
			const specialTitle = 'Test & Title <with> "special" \'chars\' @#$%^&*()';
			const item: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], name: specialTitle }]
			};

			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			expect(result[0].title).toBe(specialTitle);
		});

		it('should handle unicode characters in channel names', () => {
			const unicodeName = '日本語チャンネル 🇯🇵';
			const item: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], uploaderName: unicodeName }]
			};

			const result = adaptSearchResults(item, defaultThumbnail, defaultAvatar);

			expect(result[0].channelName).toBe(unicodeName);
		});

		it('should not modify input searchResult', () => {
			const searchResultCopy = JSON.parse(JSON.stringify(mockSearchResponse));

			adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);

			expect(mockSearchResponse).toEqual(searchResultCopy);
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('integration with utility functions', () => {
		it('should work correctly with extractVideoIdFromUrl', () => {
			const videoId = 'extracted-video-id';
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce(videoId);

			const result = adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);

			expect(result[0].id).toBe(videoId);
		});

		it('should handle extractVideoIdFromUrl returning empty string', () => {
			vi.mocked(extractVideoIdFromUrl).mockReturnValueOnce('');

			const result = adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);

			expect(result[0].id).toBe('');
		});
	});

	// =============================================================================
	// Real-world Scenario Tests
	// =============================================================================

	describe('real-world scenarios', () => {
		it('should handle search results with all types mixed', () => {
			const searchResult: SearchResult = {
				...mockSearchResponse,
				items: [
					{ ...mockSearchResponse.items[0], type: 'stream' },
					{ ...mockSearchResponse.items[0], type: 'channel', url: 'https://youtube.com/channel/123' },
					{ ...mockSearchResponse.items[0], type: 'playlist', url: 'https://youtube.com/playlist?list=123' }
				]
			};

			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(3);
			expect(result[0].type).toBe('stream');
			expect(result[1].type).toBe('channel');
			expect(result[2].type).toBe('playlist');
		});

		// it('should handle search result with pagination info', () => {
		// 	const searchResult: SearchResult = {
		// 		...mockSearchResponse,
		// 		nextPageUrl: 'https://youtube.com/results?page=2',
		// 		hasNextPage: true
		// 	};
		//
		// 	const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);
		//
		// 	// Pagination info doesn't affect items adaptation
		// 	expect(result).toHaveLength(1);
		// });

		it('should handle items with all optional fields missing', () => {
			const minimalItem: SearchItem = {
				type: 'stream',
				name: 'Minimal Video',
				url: 'https://youtube.com/watch?v=minimal',
				thumbnailUrl: ''
			};
			const searchResult: SearchResult = {
				...mockSearchResponse,
				items: [minimalItem]
			};

			const result = adaptSearchResults(searchResult, defaultThumbnail, defaultAvatar);

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
		});
	});
});