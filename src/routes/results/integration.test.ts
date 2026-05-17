import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSearchResults } from '$lib/api/search';
import { adaptSearchResults } from '$lib/adapters/search';
import { load } from './+page';
import type { SearchResult } from '$lib/types';
import type { SearchResponse } from '$lib/api/types';
import searchResponseFixture from '../../tests/fixtures/api/searchResponseFixture.json';
import type { LoadResponse } from '../types';
import type { SearchResultConfig, VideoSearchResultConfig } from '$lib/adapters/types';

describe('Search Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('API + Adapter Integration', () => {
		it('should fetch and transform a single stream result correctly', async (): Promise<void> => {
			const mockApiResponse: SearchResponse = searchResponseFixture;
			const singleResponse: SearchResponse = {
				...searchResponseFixture,
				items: [mockApiResponse.items[0]]
			};

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => singleResponse
			});

			const searchData: SearchResponse = await getSearchResults('murder drones', 'asc', mockFetch);
			const results: SearchResultConfig[] = adaptSearchResults(
				searchData,
				'default-thumb.jpg',
				'default-avatar.svg'
			);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/search?searchString=murder%20drones&sortFilter=asc')
			);
			expect(results).toHaveLength(1);
			expect(results[0]).toEqual({
				id: 'pilot-id',
				url: 'https://www.youtube.com/watch?v=pilot-id',
				title: 'MURDER DRONES - Pilot',
				thumbnail: 'https://i.ytimg.com/vi/pilot-id/hq720.jpg',
				channelName: 'GLITCH',
				channelUrl: 'https://www.youtube.com/channel/channel-id',
				channelAvatar: 'https://yt3.ggpht.com/random-unicode-characters',
				description: 'description here',
				verified: true,
				viewCount: 10717139,
				duration: 86,
				uploadDate: '2025-11-13T16:00Z',
				type: 'stream'
			});
		});

		it('should handle empty search results', async (): Promise<void> => {
			const mockApiResponse: SearchResult = {
				searchString: 'test',
				items: []
			};

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async (): Promise<SearchResult> => mockApiResponse
			});

			const searchData: SearchResponse = await getSearchResults('no results', 'asc', mockFetch);
			const results: SearchResultConfig[] = adaptSearchResults(
				searchData,
				'default-thumb.jpg',
				'default-avatar.svg'
			);

			expect(results).toEqual([]);
		});

		it('should filter out invalid items and correctly adapt all valid types', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => searchResponseFixture
			});

			const searchData = await getSearchResults('murder drones', 'asc', mockFetch);
			const results = adaptSearchResults(searchData, 'default-thumb.jpg', 'default-avatar.svg');

			// Fixture has 5 items: 1 valid stream, 1 invalid (filtered), 1 valid stream,
			// 1 channel, 1 playlist = 4 valid results after filtering
			expect(results).toHaveLength(4);

			const streams = results.filter((r) => r.type === 'stream');
			const channels = results.filter((r) => r.type === 'channel');
			const playlists = results.filter((r) => r.type === 'playlist');

			expect(streams).toHaveLength(2);
			expect(channels).toHaveLength(1);
			expect(playlists).toHaveLength(1);
		});

		it('should correctly adapt the second stream with defaults for missing fields', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => searchResponseFixture
			});

			const searchData = await getSearchResults('murder drones', 'asc', mockFetch);
			const results = adaptSearchResults(searchData, 'default-thumb.jpg', 'default-avatar.svg');

			// Find the absolute-end stream by id rather than by position
			const absoluteEnd = results.find(
				(r) =>
					r.type === 'stream' &&
					(r as VideoSearchResultConfig).title === 'MURDER DRONES - Absolute End'
			) as VideoSearchResultConfig;

			expect(absoluteEnd).toBeDefined();
			expect(absoluteEnd).toEqual({
				id: 'absolute-end-id',
				url: 'https://www.youtube.com/watch?v=absolute-end-id',
				title: 'MURDER DRONES - Absolute End',
				thumbnail: 'default-thumb.jpg', // Falls back to default — no thumbnailUrl
				channelName: 'Unknown Channel', // Falls back to default — no uploaderName
				channelUrl: 'https://www.youtube.com/channel/channel-id',
				description: '',
				channelAvatar: 'default-avatar.svg', // Falls back to default — no uploaderAvatarUrl
				verified: false,
				viewCount: 0, // -1 clamped to 0
				duration: 0, // -1 clamped to 0
				uploadDate: '',
				type: 'stream'
			});
		});

		it('should correctly adapt the channel result', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => searchResponseFixture
			});

			const searchData = await getSearchResults('murder drones', 'asc', mockFetch);
			const results = adaptSearchResults(searchData, 'default-thumb.jpg', 'default-avatar.svg');

			const channel = results.find((r) => r.type === 'channel');

			expect(channel).toBeDefined();
			expect(channel).toEqual({
				type: 'channel',
				id: 'glitch-channel-id',
				name: 'GLITCH',
				avatar: 'https://yt.ggpht.com/channel-avatar',
				description:
					"Here you'll find fun, colourful animated shows with occasional violence and existential breakdowns :D.",
				subscriberCount: 20600000,
				verified: true
			});
		});

		it('should correctly adapt the playlist result', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => searchResponseFixture
			});

			const searchData = await getSearchResults('murder drones', 'asc', mockFetch);
			const results = adaptSearchResults(searchData, 'default-thumb.jpg', 'default-avatar.svg');

			const playlist = results.find((r) => r.type === 'playlist');

			expect(playlist).toBeDefined();
			expect(playlist).toEqual({
				type: 'playlist',
				id: 'md-playlist-id',
				url: 'https://www.youtube.com/playlist?list=md-playlist-id',
				title: 'Murder Drones',
				thumbnail: 'https://i.ytimg.com/vi/md-playlist-id/hq720.jpg',
				uploaderName: 'GLITCH',
				uploaderUrl: 'https://www.youtube.com/channel/glitch-channel-id',
				videoCount: 8
			});
		});

		it('should handle API errors', () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});

			expect(getSearchResults('error query', 'asc', mockFetch)).rejects.toThrow(
				'Could not load search results for error query: 500 Internal Server Error'
			);
		});

		it('should handle network errors', () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

			expect(getSearchResults('network fail', 'asc', mockFetch)).rejects.toThrow('Network error');
		});
	});

	describe('Route Load Function Integration', () => {
		it('should load search results through complete pipeline', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => searchResponseFixture
			});

			const mockUrl = new URL('https://example.com/search?query=murder%20drones&sort=desc');

			const search = (await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as never)) as LoadResponse;

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/search?searchString=murder%20drones&sortFilter=desc')
			);

			// Fixture produces 4 valid results (2 streams + 1 channel + 1 playlist)
			expect(search.results).toHaveLength(4);
			expect(search.query).toBe('murder drones');
			expect(search.sortFilter).toBe('desc');
			expect(search.error).toBeNull();

			// Confirm the pilot stream is present regardless of position
			const pilot = search.results.find(
				(r) =>
					r.type === 'stream' && (r as VideoSearchResultConfig).title === 'MURDER DRONES - Pilot'
			);
			expect(pilot).toBeDefined();
		});

		it('should return all three types in the correct proportions', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => searchResponseFixture
			});

			const mockUrl = new URL('https://example.com/search?query=murder%20drones');

			const search = (await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as never)) as LoadResponse;

			const streams = search.results.filter((r) => r.type === 'stream');
			const channels = search.results.filter((r) => r.type === 'channel');
			const playlists = search.results.filter((r) => r.type === 'playlist');

			expect(streams).toHaveLength(2);
			expect(channels).toHaveLength(1);
			expect(playlists).toHaveLength(1);
		});

		it('should return empty results for empty query', async () => {
			const mockUrl = new URL('https://example.com/search?query=');

			const search = (await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as never)) as LoadResponse;

			expect(search.results).toEqual([]);
			expect(search.query).toBe('');
			expect(search.error).toBeNull();
		});

		it('should return empty results for whitespace-only query', async () => {
			const mockUrl = new URL('https://example.com/search?query=%20%20%20');

			const search = (await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as never)) as LoadResponse;

			expect(search.results).toEqual([]);
			expect(search.query).toBe('');
			expect(search.error).toBeNull();
		});

		it('should handle missing query parameter', async () => {
			const mockUrl = new URL('https://example.com/search');

			const search = (await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as never)) as LoadResponse;

			expect(search.results).toEqual([]);
			expect(search.query).toBe('');
			expect(search.error).toBeNull();
		});

		it('should use default sort filter when not provided', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => searchResponseFixture
			});

			const mockUrl = new URL('https://example.com/search?query=test');

			const search = (await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as never)) as LoadResponse;

			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('sortFilter=asc'));
			expect(search.sortFilter).toBe('asc');
		});

		it('should handle API errors gracefully', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			const mockUrl = new URL('https://example.com/search?query=error%20test&sort=asc');

			const search = (await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as never)) as LoadResponse;

			expect(search.results).toEqual([]);
			expect(search.query).toBe('error test');
			expect(search.sortFilter).toBe('asc');
			expect(search.error).toContain('Could not load search results');
		});

		it('should handle network errors gracefully', async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

			const mockUrl = new URL('https://example.com/search?query=network%20error');

			const search = (await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as never)) as LoadResponse;

			expect(search.results).toEqual([]);
			expect(search.query).toBe('network error');
			expect(search.error).toBe('Failed to fetch');
		});
	});
});
