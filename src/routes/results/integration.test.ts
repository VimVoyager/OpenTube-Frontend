import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSearchResults } from '$lib/api/search';
import { adaptSearchResults } from '$lib/adapters/search';
// import { load } from './+page';
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
	});
});


