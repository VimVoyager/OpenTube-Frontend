import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSearchResults } from '$lib/api/search';
import { adaptSearchResults } from '$lib/adapters/search';
import { load } from './+page';
import type { SearchResult } from '$lib/types';
import type { SearchResponse } from '$lib/api/types';

describe('Search Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('API + Adapter Integration', () => {
		it('should fetch and transform search results correctly', async () => {
			// Mock API response
			const mockApiResponse: SearchResponse = {
				correctedSearch: false,
				url: 'https://www.youtube.com/search?q=murder drones',
				originalUrl: 'https://www.youtube.com/search?q=murder drones',
				name: 'Search',
				searchString: 'murder drones',
				searchSuggestion: '',
				isCorrectedSearch: false,
				items: [
					{
						shortFormContent: false,
						type: 'stream',
						name: 'MURDER DRONES - Pilot',
						url: 'https://www.youtube.com/watch?v=video-test-id',
						thumbnailUrl:
							'https://i.ytimg.com/vi/video-test-id/hq720.jpg',
						uploaderName: 'GLITCH',
						uploaderUrl: 'https://www.youtube.com/channel/channel-id',
						uploaderAvatarUrl:
							'https://yt3.ggpht.com/random-unicode-characters',
						uploaderVerified: true,
						duration: 86,
						viewCount: 10717139,
						uploadDate: '2025-11-13T16:00Z',
						streamType: 'VIDEO_STREAM',
						isShortFormContent: false
					}
				],
				nextPageUrl: 'https://www.youtube.com/search?prettyPrint=false',
				hasNextPage: true
			};

			// Mock fetch
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse
			});

			// Call API
			const searchData = await getSearchResults('test query', 'asc', mockFetch);

			// Transform with adapter
			const results = adaptSearchResults(searchData, 'default-thumb.jpg', 'default-avatar.svg');

			// Assertions
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/search?searchString=test%20query&sortFilter=asc')
			);
			expect(results).toHaveLength(1);
			expect(results[0]).toEqual({
				id: 'video-test-id',
				url: 'https://www.youtube.com/watch?v=video-test-id',
				title: 'MURDER DRONES - Pilot',
				thumbnail: 'https://i.ytimg.com/vi/video-test-id/hq720.jpg',
				channelName: 'GLITCH',
				channelUrl: 'https://www.youtube.com/channel/channel-id',
				channelAvatar: 'https://yt3.ggpht.com/random-unicode-characters',
				verified: true,
				viewCount: 10717139,
				duration: 86,
				uploadDate: '2025-11-13T16:00Z',
				description: '',
				type: 'stream'
			});
		});

		it('should handle empty search results', async () => {
			const mockApiResponse: SearchResult = {
				searchString: 'test',
				items: []
			};

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse
			});

			const searchData = await getSearchResults('no results', 'asc', mockFetch);
			const results = adaptSearchResults(searchData, 'default-thumb.jpg', 'default-avatar.svg');

			expect(results).toEqual([]);
		});

		it('should filter out invalid items and use defaults for missing fields', async () => {
			const mockApiResponse: SearchResponse = {
				correctedSearch: false,
				url: 'https://www.youtube.com/search?q=murder drones',
				originalUrl: 'https://www.youtube.com/search?q=murder drones',
				name: 'Search',
				searchString: 'murder drones',
				searchSuggestion: '',
				isCorrectedSearch: false,
				items: [
					// Valid item with all fields
					{
						shortFormContent: false,
						type: 'stream',
						name: 'MURDER DRONES - Pilot',
						url: 'https://www.youtube.com/watch?v=video-test-id',
						thumbnailUrl: 'https://i.ytimg.com/vi/video-test-id/hq720.jpg',
						uploaderName: 'GLITCH',
						uploaderUrl: 'https://www.youtube.com/channel/channel-id',
						uploaderAvatarUrl: 'https://yt3.ggpht.com/random-unicode-characters',
						uploaderVerified: false,
						duration: 86,
						viewCount: 10717139,
						uploadDate: '2025-11-13T16:00Z',
						streamType: 'VIDEO_STREAM',
						isShortFormContent: false
					},
					// Invalid item - missing required fields
					{
						shortFormContent: false,
						type: '',
						name: '',
						url: '',
						thumbnailUrl: '',
						uploaderName: '',
						uploaderUrl: '',
						uploaderAvatarUrl: '',
						uploaderVerified: false,
						duration: 0,
						viewCount: 0,
						uploadDate: '',
						streamType: 'VIDEO_STREAM',
						isShortFormContent: false
					},
					// Valid item with negative counts (should be converted to 0)
					{
						shortFormContent: false,
						type: 'stream',
						name: 'MURDER DRONES - Absolute End',
						url: 'https://www.youtube.com/watch?v=negative-video-id',
						thumbnailUrl: '',
						uploaderName: '',
						uploaderUrl: 'https://www.youtube.com/channel/channel-id',
						uploaderAvatarUrl: '',
						uploaderVerified: false,
						duration: -1,
						viewCount: -1,
						uploadDate: '',
						streamType: 'VIDEO_STREAM',
						isShortFormContent: false
					}
				],
				nextPageUrl: 'https://www.youtube.com/search?prettyPrint=false',
				hasNextPage: true
			};

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse
			});

			const searchData = await getSearchResults('murder drones', 'asc', mockFetch);
			const results = adaptSearchResults(searchData, 'default-thumb.jpg', 'default-avatar.svg');

			expect(results).toHaveLength(2); // Invalid item filtered out
			expect(results[1]).toEqual({
				id: 'negative-video-id',
				url: 'https://www.youtube.com/watch?v=negative-video-id',
				title: 'MURDER DRONES - Absolute End',
				thumbnail: 'default-thumb.jpg', // Uses default
				channelName: 'Unknown Channel', // Uses default
				channelUrl: 'https://www.youtube.com/channel/channel-id',
				channelAvatar: 'default-avatar.svg', // Uses default
				verified: false,
				viewCount: 0, // -1 converted to 0
				duration: 0, // -1 converted to 0
				uploadDate: '',
				description: '',
				type: 'stream'
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

			expect(getSearchResults('network fail', 'asc', mockFetch)).rejects.toThrow(
				'Network error'
			);
		});
	});

	describe('Route Load Function Integration', () => {
		it('should load search results through complete pipeline', async () => {
			const mockApiResponse: SearchResponse = {
				correctedSearch: false,
				url: 'https://www.youtube.com/search?q=murder drones',
				originalUrl: 'https://www.youtube.com/search?q=murder drones',
				name: 'Search',
				searchString: 'murder drones',
				searchSuggestion: '',
				isCorrectedSearch: false,
				items: [
					{
						shortFormContent: false,
						type: 'stream',
						name: 'MURDER DRONES - Pilot',
						url: 'https://www.youtube.com/watch?v=video-test-id',
						thumbnailUrl:
							'https://i.ytimg.com/vi/video-test-id/hq720.jpg',
						uploaderName: 'GLITCH',
						uploaderUrl: 'https://www.youtube.com/channel/channel-id',
						uploaderAvatarUrl:
							'https://yt3.ggpht.com/random-unicode-characters',
						uploaderVerified: true,
						duration: 86,
						viewCount: 10717139,
						uploadDate: '2025-11-13T16:00Z',
						streamType: 'VIDEO_STREAM',
						isShortFormContent: false
					}
				],
				nextPageUrl: 'https://www.youtube.com/search?prettyPrint=false',
				hasNextPage: true
			};

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse
			});

			// Mock URL with search params
			const mockUrl = new URL('https://example.com/search?query=murder%20drones&sort=desc');

			const search = await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/search?searchString=murder%20drones&sortFilter=desc')
			);
			expect(search.results).toHaveLength(1);
			expect(search.query).toBe('murder drones');
			expect(search.sortFilter).toBe('desc');
			expect(search.error).toBeNull();
			expect(search.results[0].title).toBe('MURDER DRONES - Pilot');
		});

		it('should return empty results for empty query', async () => {
			const mockUrl = new URL('https://example.com/search?query=');

			const search = await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as never);

			expect(search.results).toEqual([]);
			expect(search.query).toBe('');
			expect(search.error).toBeNull();
		});

		it('should return empty results for whitespace-only query', async () => {
			const mockUrl = new URL('https://example.com/search?query=%20%20%20');

			const search = await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as never);

			expect(search.results).toEqual([]);
			expect(search.query).toBe('');
			expect(search.error).toBeNull();
		});

		it('should handle missing query parameter', async () => {
			const mockUrl = new URL('https://example.com/search');

			const search = await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as never);

			expect(search.results).toEqual([]);
			expect(search.query).toBe('');
			expect(search.error).toBeNull();
		});

		it('should use default sort filter when not provided', async () => {
			const mockApiResponse: SearchResult = { searchString: 'test', items: [] };

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse
			});

			const mockUrl = new URL('https://example.com/search?query=test');

			const search = await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as never);

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

			const search = await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as never);

			expect(search.results).toEqual([]);
			expect(search.query).toBe('error test');
			expect(search.sortFilter).toBe('asc');
			expect(search.error).toContain('Could not load search results');
		});

		it('should handle network errors gracefully', async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

			const mockUrl = new URL('https://example.com/search?query=network%20error');

			const search = await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as never);

			expect(search.results).toEqual([]);
			expect(search.query).toBe('network error');
			expect(search.error).toBe('Failed to fetch');
		});
	});
});


