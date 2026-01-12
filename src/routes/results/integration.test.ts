import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSearchResults } from '$lib/api/search';
import { adaptSearchResults } from '$lib/adapters/search';
import { load } from './+page';
import type { SearchResult } from '$lib/types';

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
			const mockApiResponse: SearchResult = {
				searchString: 'test',
				items: [
					{
						url: 'https://youtube.com/watch?v=abc123',
						name: 'Test Video',
						thumbnailUrl: 'https://example.com/thumb.jpg',
						uploaderName: 'Test Channel',
						uploaderUrl: 'https://youtube.com/channel/test',
						uploaderAvatarUrl: 'https://example.com/avatar.jpg',
						uploaderVerified: true,
						viewCount: 1000,
						duration: 120,
						uploadDate: '2024-01-01',
						description: 'Test description',
						type: 'stream'
					}
				]
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
				id: 'abc123',
				url: 'https://youtube.com/watch?v=abc123',
				title: 'Test Video',
				thumbnail: 'https://example.com/thumb.jpg',
				channelName: 'Test Channel',
				channelUrl: 'https://youtube.com/channel/test',
				channelAvatar: 'https://example.com/avatar.jpg',
				verified: true,
				viewCount: 1000,
				duration: 120,
				uploadDate: '2024-01-01',
				description: 'Test description',
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
			const mockApiResponse: SearchResult = {
				searchString: 'test',
				items: [
					// Valid item with all fields
					{
						url: 'https://youtube.com/watch?v=valid',
						name: 'Valid Video',
						thumbnailUrl: 'https://example.com/thumb.jpg',
						uploaderName: 'Channel',
						uploaderUrl: 'https://youtube.com/channel/test',
						uploaderAvatarUrl: 'https://example.com/avatar.jpg',
						uploaderVerified: false,
						viewCount: 500,
						duration: 60,
						uploadDate: '2024-01-01',
						description: 'Description',
						type: 'stream'
					},
					// Invalid item - missing required fields
					{
						url: '',
						name: '',
						thumbnailUrl: '',
						uploaderName: '',
						uploaderUrl: '',
						uploaderAvatarUrl: '',
						uploaderVerified: false,
						viewCount: 0,
						duration: 0,
						uploadDate: '',
						description: '',
						type: 'stream'
					},
					// Valid item with negative counts (should be converted to 0)
					{
						url: 'https://youtube.com/watch?v=negative',
						name: 'Video with Unknown Stats',
						thumbnailUrl: '',
						uploaderName: '',
						uploaderUrl: '',
						uploaderAvatarUrl: '',
						uploaderVerified: false,
						viewCount: -1,
						duration: -1,
						uploadDate: '',
						description: '',
						type: 'stream'
					}
				]
			};

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse
			});

			const searchData = await getSearchResults('test', 'asc', mockFetch);
			const results = adaptSearchResults(searchData, 'default-thumb.jpg', 'default-avatar.svg');

			expect(results).toHaveLength(2); // Invalid item filtered out
			expect(results[1]).toEqual({
				id: 'negative',
				url: 'https://youtube.com/watch?v=negative',
				title: 'Video with Unknown Stats',
				thumbnail: 'default-thumb.jpg', // Uses default
				channelName: 'Unknown Channel', // Uses default
				channelUrl: '',
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
			const mockApiResponse: SearchResult = {
				searchString: 'test',
				items: [
					{
						url: 'https://youtube.com/watch?v=test123',
						name: 'Integration Test Video',
						thumbnailUrl: 'https://example.com/thumb.jpg',
						uploaderName: 'Test Channel',
						uploaderUrl: 'https://youtube.com/channel/test',
						uploaderAvatarUrl: 'https://example.com/avatar.jpg',
						uploaderVerified: true,
						viewCount: 5000,
						duration: 300,
						uploadDate: '2024-01-15',
						description: 'Test video description',
						type: 'stream'
					}
				]
			};

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse
			});

			// Mock URL with search params
			const mockUrl = new URL('https://example.com/search?query=integration%20test&sort=desc');

			const result = await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/search?searchString=integration%20test&sortFilter=desc')
			);
			expect(result.results).toHaveLength(1);
			expect(result.query).toBe('integration test');
			expect(result.sortFilter).toBe('desc');
			expect(result.error).toBeNull();
			expect(result.results[0].title).toBe('Integration Test Video');
		});

		it('should return empty results for empty query', async () => {
			const mockUrl = new URL('https://example.com/search?query=');

			const result = await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as any);

			expect(result.results).toEqual([]);
			expect(result.query).toBe('');
			expect(result.error).toBeNull();
		});

		it('should return empty results for whitespace-only query', async () => {
			const mockUrl = new URL('https://example.com/search?query=%20%20%20');

			const result = await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as any);

			expect(result.results).toEqual([]);
			expect(result.query).toBe('');
			expect(result.error).toBeNull();
		});

		it('should handle missing query parameter', async () => {
			const mockUrl = new URL('https://example.com/search');

			const result = await load({
				url: mockUrl,
				fetch: vi.fn(),
				params: {},
				route: { id: '/search' },
				data: {}
			} as any);

			expect(result.results).toEqual([]);
			expect(result.query).toBe('');
			expect(result.error).toBeNull();
		});

		it('should use default sort filter when not provided', async () => {
			const mockApiResponse: SearchResult = { searchString: 'test', items: [] };

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockApiResponse
			});

			const mockUrl = new URL('https://example.com/search?query=test');

			const result = await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('sortFilter=asc'));
			expect(result.sortFilter).toBe('asc');
		});

		it('should handle API errors gracefully', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			const mockUrl = new URL('https://example.com/search?query=error%20test&sort=asc');

			const result = await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as any);

			expect(result.results).toEqual([]);
			expect(result.query).toBe('error test');
			expect(result.sortFilter).toBe('asc');
			expect(result.error).toContain('Could not load search results');
		});

		it('should handle network errors gracefully', async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

			const mockUrl = new URL('https://example.com/search?query=network%20error');

			const result = await load({
				url: mockUrl,
				fetch: mockFetch,
				params: {},
				route: { id: '/search' },
				data: {}
			} as any);

			expect(result.results).toEqual([]);
			expect(result.query).toBe('network error');
			expect(result.error).toBe('Failed to fetch');
		});
	});
});


