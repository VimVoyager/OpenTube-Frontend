/**
 * Test Suite: search.ts
 *
 * Tests for search results adaptation — covers stream, channel, and playlist types.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptSearchResults } from './search';
import searchResultFixture from '../../tests/fixtures/adapters/searchResult.json';
import searchResponseFixture from '../../tests/fixtures/api/searchResponseFixture.json';
import type { SearchResult, SearchItem } from '$lib/types';

// Mock extractIdFromUrl to handle ?v= (video), ?list= (playlist), and path
// segments (channel) — matching the real implementation's priority order.
vi.mock('$lib/utils/streamSelection', () => ({
	extractIdFromUrl: vi.fn((url: string): string => {
		if (!url) return '';
		const vMatch = url.match(/[?&]v=([^&]+)/);
		if (vMatch) return vMatch[1];
		const listMatch = url.match(/[?&]list=([^&]+)/);
		if (listMatch) return listMatch[1];
		const pathParts = url.split('/').filter(Boolean);
		return pathParts[pathParts.length - 1] ?? '';
	})
}));

import { extractIdFromUrl } from '$lib/utils/streamSelection';
import type { SearchResponse } from '$lib/api/types';
import type {
	SearchResultConfig,
	VideoSearchResultConfig,
	ChannelSearchResultConfig,
	PlaylistSearchResultConfig
} from '$lib/adapters/types';

// =============================================================================
// Fixtures
// =============================================================================

const mockSearchResponse: SearchResponse = searchResponseFixture;

// Typed slices from the combined adapter output fixture — indexes match searchResult.json
const streamFixtures = searchResultFixture.slice(0, 2) as VideoSearchResultConfig[];
const channelFixture = searchResultFixture[2] as ChannelSearchResultConfig;
const playlistFixture = searchResultFixture[3] as PlaylistSearchResultConfig;

// Stream-only response — isolates stream tests from channel/playlist items so
// toHaveLength and index-based assertions remain stable as new types are added.
const streamOnlyResponse: SearchResult = {
	...mockSearchResponse,
	items: mockSearchResponse.items.filter((i) => !i.type || i.type === 'stream' || i.type === '')
};

// Single-item helpers — located by type so position in the array doesn't matter
const channelItem = mockSearchResponse.items.find((i) => i.type === 'channel')!;
const playlistItem = mockSearchResponse.items.find((i) => i.type === 'playlist')!;

const defaultThumbnail = 'default-thumbnail.jpg';
const defaultAvatar = 'default-avatar.jpg';

function adaptVideoResults(
	...args: Parameters<typeof adaptSearchResults>
): VideoSearchResultConfig[] {
	return adaptSearchResults(...args) as VideoSearchResultConfig[];
}

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// Tests
// =============================================================================

describe('adaptSearchResults', () => {
	// ===========================================================================
	// Stream adaptation
	// ===========================================================================

	describe('stream adaptation', () => {
		it('should adapt complete stream item array correctly', () => {
			vi.mocked(extractIdFromUrl).mockReturnValueOnce('pilot-id');

			const result = adaptVideoResults(streamOnlyResponse, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(streamFixtures[0]);
			expect(result[1]).toEqual(streamFixtures[1]);

			expect(extractIdFromUrl).toHaveBeenCalledTimes(2);
			expect(extractIdFromUrl).toHaveBeenCalledWith(streamFixtures[0].url);

			expect(result[0].thumbnail).toBe(streamFixtures[0].thumbnail);
			expect(result[1].thumbnail).toBe(defaultThumbnail);

			expect(result[0].channelAvatar).toBe(streamFixtures[0].channelAvatar);
			expect(result[1].channelAvatar).toBe(defaultAvatar);

			expect(result[1].channelName).toBe('Unknown Channel');
			expect(result[1].type).toBe('stream');

			// Negative counts from fixture items[2] are clamped to 0
			expect(mockSearchResponse.items[2].viewCount).toBe(-1);
			expect(result[1].viewCount).toBe(0);
			expect(mockSearchResponse.items[2].duration).toBe(-1);
			expect(result[1].duration).toBe(0);
		});

		it('should handle stream type explicitly set', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], type: 'stream' }]
			};
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].type).toBe('stream');
		});
	});

	// ===========================================================================
	// Channel adaptation
	// ===========================================================================

	describe('channel adaptation', () => {
		it('should adapt a channel item to ChannelSearchResultConfig', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(channelFixture);
		});

		it('should set type to "channel"', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].type).toBe('channel');
		});

		it('should extract channel id from the URL path', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].id).toBe('glitch-channel-id');
		});

		it('should map thumbnailUrl to avatar', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as ChannelSearchResultConfig[];
			expect(result[0].avatar).toBe('https://yt.ggpht.com/channel-avatar');
		});

		it('should fall back to defaultAvatar when thumbnailUrl is absent', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...channelItem, thumbnailUrl: '' }]
			};
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as ChannelSearchResultConfig[];
			expect(result[0].avatar).toBe(defaultAvatar);
		});

		it('should map subscriberCount correctly', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as ChannelSearchResultConfig[];
			expect(result[0].subscriberCount).toBe(20600000);
		});

		it('should clamp negative subscriberCount to 0', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...channelItem, subscriberCount: -1 }]
			};
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as ChannelSearchResultConfig[];
			expect(result[0].subscriberCount).toBe(0);
		});

		it('should map uploaderVerified to verified', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as ChannelSearchResultConfig[];
			expect(result[0].verified).toBe(true);
		});

		it('should map description correctly', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as ChannelSearchResultConfig[];
			expect(result[0].description).toBe(
				"Here you'll find fun, colourful animated shows with occasional violence and existential breakdowns :D."
			);
		});

		it('should set description to null when absent', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...channelItem, description: undefined }]
			};
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as ChannelSearchResultConfig[];
			expect(result[0].description).toBeNull();
		});
	});

	// ===========================================================================
	// Playlist adaptation
	// ===========================================================================

	describe('playlist adaptation', () => {
		it('should adapt a playlist item to PlaylistSearchResultConfig', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(playlistFixture);
		});

		it('should set type to "playlist"', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].type).toBe('playlist');
		});

		it('should extract playlist id from the ?list= param', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].id).toBe('md-playlist-id');
		});

		it('should map thumbnailUrl to thumbnail', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as PlaylistSearchResultConfig[];
			expect(result[0].thumbnail).toBe('https://i.ytimg.com/vi/md-playlist-id/hq720.jpg');
		});

		it('should fall back to defaultThumbnail when thumbnailUrl is absent', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...playlistItem, thumbnailUrl: '' }]
			};
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as PlaylistSearchResultConfig[];
			expect(result[0].thumbnail).toBe(defaultThumbnail);
		});

		it('should map videoCount correctly', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as PlaylistSearchResultConfig[];
			expect(result[0].videoCount).toBe(8);
		});

		it('should clamp negative videoCount to 0', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...playlistItem, videoCount: -1 }]
			};
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as PlaylistSearchResultConfig[];
			expect(result[0].videoCount).toBe(0);
		});

		it('should map uploaderName correctly', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as PlaylistSearchResultConfig[];
			expect(result[0].uploaderName).toBe('GLITCH');
		});

		it('should default uploaderName to "Unknown" when absent', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...playlistItem, uploaderName: '' }]
			};
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as PlaylistSearchResultConfig[];
			expect(result[0].uploaderName).toBe('Unknown');
		});

		it('should map uploaderUrl correctly', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as PlaylistSearchResultConfig[];
			expect(result[0].uploaderUrl).toBe('https://www.youtube.com/channel/glitch-channel-id');
		});

		it('should default uploaderUrl to empty string when absent', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...playlistItem, uploaderUrl: '' }]
			};
			const result = adaptSearchResults(
				response,
				defaultThumbnail,
				defaultAvatar
			) as PlaylistSearchResultConfig[];
			expect(result[0].uploaderUrl).toBe('');
		});
	});

	// ===========================================================================
	// Mixed type handling
	// ===========================================================================

	describe('mixed type handling', () => {
		it('should correctly route all three types from a single response', () => {
			const result = adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);

			const streams = result.filter((r) => r.type === 'stream');
			const channels = result.filter((r) => r.type === 'channel');
			const playlists = result.filter((r) => r.type === 'playlist');

			expect(streams.length).toBeGreaterThanOrEqual(1);
			expect(channels).toHaveLength(1);
			expect(playlists).toHaveLength(1);
		});

		it('should produce output matching all fixture entries for the full response', () => {
			// Provide correct return values for the two stream items that pass the filter
			vi.mocked(extractIdFromUrl)
				.mockReturnValueOnce('pilot-id')
				.mockReturnValueOnce('absolute-end-id');

			const result = adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);

			const pilot = result.find(
				(r) =>
					r.type === 'stream' && (r as VideoSearchResultConfig).title === 'MURDER DRONES - Pilot'
			);
			const channel = result.find((r) => r.type === 'channel') as ChannelSearchResultConfig;
			const playlist = result.find((r) => r.type === 'playlist') as PlaylistSearchResultConfig;

			expect(pilot).toEqual(streamFixtures[0]);
			expect(channel).toEqual(channelFixture);
			expect(playlist).toEqual(playlistFixture);
		});
	});

	// ===========================================================================
	// ID extraction
	// ===========================================================================

	describe('ID extraction', () => {
		it('should extract video ID from a watch URL for streams', () => {
			const result = adaptSearchResults(streamOnlyResponse, defaultThumbnail, defaultAvatar);
			expect(extractIdFromUrl).toHaveBeenCalledWith(streamFixtures[0].url);
			expect(result[0].id).toBe(streamFixtures[0].id);
		});

		it('should extract playlist ID from the ?list= param', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].id).toBe('md-playlist-id');
		});

		it('should extract channel ID from the URL path segment', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].id).toBe('glitch-channel-id');
		});

		it('should use empty string when URL extraction fails', () => {
			vi.mocked(extractIdFromUrl).mockReturnValueOnce('');
			const result = adaptSearchResults(streamOnlyResponse, defaultThumbnail, defaultAvatar);
			expect(result[0].id).toBe('');
		});
	});

	// ===========================================================================
	// Default values
	// ===========================================================================

	describe('default values handling', () => {
		it('should use empty string for channelUrl when missing on stream', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], uploaderUrl: undefined }]
			};
			const result = adaptVideoResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].channelUrl).toBe('');
		});

		it('should default verified to false when missing on stream', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], uploaderVerified: undefined }]
			};
			const result = adaptVideoResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].verified).toBe(false);
		});
	});

	// ===========================================================================
	// Filtering
	// ===========================================================================

	describe('item filtering', () => {
		it('should filter out null items', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [
					mockSearchResponse.items[0],
					null as unknown as SearchItem,
					mockSearchResponse.items[0]
				]
			};
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result).toHaveLength(2);
		});

		it('should filter out undefined items', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [
					mockSearchResponse.items[0],
					undefined as unknown as SearchItem,
					mockSearchResponse.items[0]
				]
			};
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result).toHaveLength(2);
		});

		it('should filter out items with no url', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], url: '' }]
			};
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result).toHaveLength(0);
		});

		it('should filter out items with no name', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], name: '' }]
			};
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result).toHaveLength(0);
		});

		it('should return empty array when all items are invalid', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [
					{ ...mockSearchResponse.items[0], url: '' },
					{ ...mockSearchResponse.items[0], name: '' },
					null as unknown as SearchItem
				]
			};
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result).toEqual([]);
		});
	});

	// ===========================================================================
	// Edge cases
	// ===========================================================================

	describe('edge cases', () => {
		it('should handle very large view counts', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], viewCount: 999999999999 }]
			};
			const result = adaptVideoResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].viewCount).toBe(999999999999);
		});

		it('should handle very long durations', () => {
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], duration: 86400 }]
			};
			const result = adaptVideoResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].duration).toBe(86400);
		});

		it('should handle very long titles', () => {
			const longTitle = 'A'.repeat(1000);
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], name: longTitle }]
			};
			const result = adaptVideoResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].title).toBe(longTitle);
		});

		it('should handle special characters in titles', () => {
			const specialTitle = 'Test & Title <with> "special" \'chars\' @#$%^&*()';
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], name: specialTitle }]
			};
			const result = adaptVideoResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].title).toBe(specialTitle);
		});

		it('should handle unicode characters in channel names', () => {
			const unicodeName = '日本語チャンネル 🇯🇵';
			const response: SearchResult = {
				...mockSearchResponse,
				items: [{ ...mockSearchResponse.items[0], uploaderName: unicodeName }]
			};
			const result = adaptVideoResults(response, defaultThumbnail, defaultAvatar);
			expect(result[0].channelName).toBe(unicodeName);
		});

		it('should not modify the input searchResult', () => {
			const copy = JSON.parse(JSON.stringify(mockSearchResponse));
			adaptSearchResults(mockSearchResponse, defaultThumbnail, defaultAvatar);
			expect(mockSearchResponse).toEqual(copy);
		});

		it('should return empty array for undefined input', () => {
			const result = adaptSearchResults(undefined, defaultThumbnail, defaultAvatar);
			expect(result).toEqual([]);
		});

		it('should return empty array for empty items array', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [] };
			const result = adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(result).toEqual([]);
		});
	});

	// ===========================================================================
	// Integration with extractIdFromUrl
	// ===========================================================================

	describe('integration with extractIdFromUrl', () => {
		it('should pass the item URL to extractIdFromUrl for streams', () => {
			const videoId = 'extracted-video-id';
			vi.mocked(extractIdFromUrl).mockReturnValueOnce(videoId);
			const result = adaptSearchResults(streamOnlyResponse, defaultThumbnail, defaultAvatar);
			expect(result[0].id).toBe(videoId);
		});

		it('should pass the item URL to extractIdFromUrl for channels', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [channelItem] };
			adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(extractIdFromUrl).toHaveBeenCalledWith(channelItem.url);
		});

		it('should pass the item URL to extractIdFromUrl for playlists', () => {
			const response: SearchResult = { ...mockSearchResponse, items: [playlistItem] };
			adaptSearchResults(response, defaultThumbnail, defaultAvatar);
			expect(extractIdFromUrl).toHaveBeenCalledWith(playlistItem.url);
		});
	});

	// ===========================================================================
	// Real-world scenarios
	// ===========================================================================

	describe('real-world scenarios', () => {
		it('should handle items with all optional fields missing', () => {
			const minimalItem: SearchItem = {
				type: 'stream',
				name: 'Minimal Video',
				url: 'https://youtube.com/watch?v=minimal',
				thumbnailUrl: ''
			};
			const response: SearchResult = { ...mockSearchResponse, items: [minimalItem] };
			const result = adaptVideoResults(response, defaultThumbnail, defaultAvatar);

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
