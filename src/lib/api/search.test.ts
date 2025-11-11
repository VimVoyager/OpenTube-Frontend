/**
 * Test Suite: search.ts
 * 
 * Tests for video search functionality including query handling,
 * response parsing, and error scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
});