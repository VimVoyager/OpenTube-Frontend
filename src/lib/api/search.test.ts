/**
 * Test Suite: search.ts
 * 
 * Tests for video search functionality including query handling,
 * response parsing, and error scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { getSearchResults } from './search';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch,
	extractQueryParams,
	suppressConsoleError,
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
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, mockFetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should return array of video results', async () => {
			// Arrange
			const query = 'javascript tutorial';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, mockFetch);

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
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, mockFetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should handle long queries', async () => {
			// Arrange
			const query = 'a'.repeat(500);
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			const result = await getSearchResults(query, mockFetch);

			// Assert
			expect(result).toEqual(mockSearchResult);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should use default fetch when fetchFn not provided', async () => {
			// Arrange
			const query = 'test';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(mockSearchResult)
			});

			// Act
			const result = await getSearchResults(query);

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
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with spaces', async () => {
			// Arrange
			const query = 'test query with spaces';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			expect(callUrl).toContain('searchString=');
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with Unicode characters', async () => {
			// Arrange
			const query = 'test 测试 тест';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with emojis', async () => {
			// Arrange
			const query = 'test 😀 🎉';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with URL-sensitive characters', async () => {
			// Arrange
			const query = 'test?query&param=value#hash';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with quotes', async () => {
			// Arrange
			const query = 'test "quoted text" \'single quotes\'';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.searchString).toBe(query);
		});

		it('should handle queries with forward slashes', async () => {
			// Arrange
			const query = 'test/path/to/something';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch);

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
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			expect(callUrl).toContain('http://localhost:8000/api/v1/search');
			expect(callUrl).toContain('serviceId=0');
			expect(callUrl).toContain('sortFilter=asc');
			expect(callUrl).toContain('searchString=test');
		});

		it('should include serviceId parameter', async () => {
			// Arrange
			const query = 'test';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = (mockFetch as Mock).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.serviceId).toBe('0');
		});

		it('should include sortFilter parameter', async () => {
			// Arrange
			const query = 'test';
			const mockFetch = createSuccessfulFetch(mockSearchResult);

			// Act
			await getSearchResults(query, mockFetch as unknown as typeof globalThis.fetch);

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
			const mockFetch = createSuccessfulFetch(mockEmptySearchResult);

			// Act
			const result = await getSearchResults(query, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(0);
		});

		it('should return empty array for no results', async () => {
			// Arrange
			const query = 'asdfghjkl123456';
			const mockFetch = createSuccessfulFetch([]);

			// Act
			const result = await getSearchResults(query, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});
	});
});