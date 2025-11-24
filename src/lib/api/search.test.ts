/**
 * Test Suite: search.ts
 * 
 * Tests for video search functionality including query handling,
 * response parsing, and error scenarios
 */

import { describe, it, expect, vi, type Mock } from 'vitest';
import { getSearchResults } from './search';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch,
	extractQueryParams,
	getCallCount
} from '../../tests/helpers/apiHelpers';
import {
    mockEmptySearchResult,
	mockSearchResult,
} from '../../tests/fixtures/apiFixtures';

// =============================================================================
// Successful Search Tests
// =============================================================================

describe('getSearchResults', () => {
	describe('successful search requests', () => {
		it('should fetch search results with valid query', async () => {
			// Arrange
			const query = 'test query';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should return array of video results', async () => {
			// Arrange
			const query = 'javascript tutorial';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(mockSearchResult.length);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('name');
			expect(result[0]).toHaveProperty('url');
		});

		it('should handle single character queries', async () => {
			// Arrange
			const query = 'a';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should handle long queries', async () => {
			// Arrange
			const query = 'a'.repeat(500);
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should use default fetch when fetchFn not provided', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(mockSearchResult)
			});

			// Act
			const result = await getSearchResults(query, sortFilter);

			// Assert
			expect(result).toEqual(mockSearchResult);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});
	});

    // =============================================================================
	// Query Sanitization Tests
	// =============================================================================

	describe('query sanitization and encoding', () => {
		it('should URL encode query with special characters', async () => {
			// Arrange
			const query = 'test & query = value';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with spaces', async () => {
			// Arrange
			const query = 'test query with spaces';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			expect(callUrl).toContain('searchString=');
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with Unicode characters', async () => {
			// Arrange
			const query = 'test 测试 тест';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with emojis', async () => {
			// Arrange
			const query = 'test 😀 🎉';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with URL-sensitive characters', async () => {
			// Arrange
			const query = 'test?query&param=value#hash';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with quotes', async () => {
			// Arrange
			const query = 'test "quoted text" \'single quotes\'';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with forward slashes', async () => {
			// Arrange
			const query = 'test/path/to/something';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});
    });

    	// =============================================================================
	// URL Construction Tests
	// =============================================================================

	describe('API URL construction', () => {
		it('should construct correct API URL with all parameters', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			expect(callUrl).toContain('http://localhost:8080/api/v1/search/');
			expect(callUrl).toContain('sortFilter=asc');
			expect(callUrl).toContain('searchString=test');
		});

		it('should include sortFilter parameter', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.sortFilter).toBe('asc');
		});
	});

    // =============================================================================
	// Empty Results Tests
	// =============================================================================

	describe('empty search results', () => {
		it('should handle empty result array', async () => {
			// Arrange
			const query = 'nonexistent query xyz123';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockEmptySearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(0);
		});

		it('should return empty array for no results', async () => {
			// Arrange
			const query = 'asdfghjkl123456';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch([]);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});
	});

    // =============================================================================
	// HTTP Error Tests
	// =============================================================================

	describe('HTTP error handling', () => {
		it('should throw error on 404 response', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createFailedFetch(404, 'Not Found');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				`Could not load search results for ${query}: 404 Not Found`
			);
		});

		it('should throw error on 500 response', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				`Could not load search results for ${query}: 500 Internal Server Error`
			);
		});

		it('should throw error on 400 response', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createFailedFetch(400, 'Bad Request');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				`Could not load search results for ${query}: 400 Bad Request`
			);
		});

		it('should throw error on 401 response', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createFailedFetch(401, 'Unauthorized');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				`Could not load search results for ${query}: 401 Unauthorized`
			);
		});

		it('should throw error on 403 response', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createFailedFetch(403, 'Forbidden');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				`Could not load search results for ${query}: 403 Forbidden`
			);
		});

		it('should throw error on 503 response', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createFailedFetch(503, 'Service Unavailable');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				`Could not load search results for ${query}: 503 Service Unavailable`
			);
		});

		it('should include status code in error message', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createFailedFetch(418, "I'm a teapot");

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				/418/
			);
		});

		it('should include status text in error message', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createFailedFetch(429, 'Too Many Requests');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				/Too Many Requests/
			);
		});
	});

	// =============================================================================
	// Network Error Tests
	// =============================================================================

	describe('network error handling', () => {
		it('should throw error on network failure', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createNetworkErrorFetch('Failed to fetch');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				'Failed to fetch'
			);
		});

		it('should throw error on timeout', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createNetworkErrorFetch('Request timeout');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				'Request timeout'
			);
		});

		it('should throw error on connection refused', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createNetworkErrorFetch('Connection refused');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				'Connection refused'
			);
		});

		it('should throw error on DNS failure', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createNetworkErrorFetch('DNS resolution failed');

			// Act & Assert
			await expect(getSearchResults(query, sortFilter, mockFetch)).rejects.toThrow(
				'DNS resolution failed'
			);
		});
	});

    // =============================================================================
	// Response Parsing Tests
	// =============================================================================

	describe('response parsing', () => {
		it('should parse JSON response correctly', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('name');
			expect(result[0]).toHaveProperty('url');
			expect(result[0]).toHaveProperty('viewCount');
		});

		it('should handle response with all video properties', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const video = result[0];
			expect(video).toHaveProperty('id');
			expect(video).toHaveProperty('url');
			expect(video).toHaveProperty('name');
			expect(video).toHaveProperty('thumbnails');
			expect(video).toHaveProperty('duration');
			expect(video).toHaveProperty('uploaderName');
			expect(video).toHaveProperty('viewCount');
		});

		it('should preserve data types from response', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const video = result[0];
			expect(typeof video.id).toBe('string');
			expect(typeof video.name).toBe('string');
			expect(typeof video.duration).toBe('number');
			expect(typeof video.viewCount).toBe('number');
			expect(Array.isArray(video.thumbnails)).toBe(true);
		});
	});

	// =============================================================================
	// Edge Cases
	// =============================================================================

	describe('edge cases', () => {
		it('should handle empty string query', async () => {
			// Arrange
			const query = '';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			expect(callUrl).toContain('searchString=');
		});

		it('should handle query with only whitespace', async () => {
			// Arrange
			const query = '   ';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should only call fetch once per request', async () => {
			// Arrange
			const query = 'test';
			const sortFilter = 'asc';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, sortFilter, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(getCallCount(mockFetch)).toBe(1);
		});

		it('should handle concurrent requests independently', async () => {
			// Arrange
			const query1 = 'test1';
			const query2 = 'test2';
			const sortFilter = 'asc';
			const mockFetch1 = createSuccessfulFetch(mockSearchResult);
			const mockFetch2 = createSuccessfulFetch(mockEmptySearchResult);

			// Act
			const [result1, result2] = await Promise.all([
				getSearchResults(query1, sortFilter, mockFetch1 as unknown as typeof globalThis.fetch),
				getSearchResults(query2, sortFilter, mockFetch2 as unknown as typeof globalThis.fetch)
			]);

			// Assert
			expect(result1).toEqual(mockSearchResult);
			expect(result2).toEqual(mockEmptySearchResult);
			expect(getCallCount(mockFetch1)).toBe(1);
			expect(getCallCount(mockFetch2)).toBe(1);
		});
	});
});