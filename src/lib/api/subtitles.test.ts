/**
 * Test Suite: subtitles.ts
 * 
 * Tests for subtitle fetching including language detection,
 * format handling, and error scenarios
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { getSubtitles } from './subtitles';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch,
	extractQueryParams,
	createMockConsoleError,
	getCallCount
} from '../../tests/helpers/apiHelpers';
import {
	mockSubtitle,
	mockSubtitlesArrayResponse,
	mockSubtitlesObjectResponse
} from '../../tests/fixtures/apiFixtures';

// Mock environment variable
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_URL: 'http://localhost:8000'
	}
}));

// =============================================================================
// Setup and Teardown
// =============================================================================

let consoleErrorMock: ReturnType<typeof createMockConsoleError> | undefined;

afterEach(() => {
	if (consoleErrorMock) {
		consoleErrorMock.restore();
		consoleErrorMock = undefined;
	}
});

// =============================================================================
// Successful Subtitle Fetching Tests
// =============================================================================

describe('getSubtitles', () => {
	describe('successful subtitle requests', () => {
		it('should fetch subtitles with valid video ID', async () => {
			// Arrange
			const videoId = 'test-video-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSubtitlesArrayResponse);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should return array of subtitles', async () => {
			// Arrange
			const videoId = 'abc123';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(mockSubtitlesArrayResponse.length);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('url');
			expect(result[0]).toHaveProperty('format');
			expect(result[0]).toHaveProperty('locale');
		});

		it('should use default fetch when fetchFn not provided', async () => {
			// Arrange
			const videoId = 'test-id';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(mockSubtitlesArrayResponse)
			});

			// Act
			const result = await getSubtitles(videoId);

			// Assert
			expect(result).toEqual(mockSubtitlesArrayResponse);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('should fetch subtitle for a single language', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockSubtitle]);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(mockSubtitle);
		});
	});

	// =============================================================================
	// Response Format Handling Tests
	// =============================================================================

	describe('response format handling', () => {
		it('should handle array response format', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual(mockSubtitlesArrayResponse);
		});

		it('should handle object response format with subtitles property', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesObjectResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual(mockSubtitlesObjectResponse.subtitles);
		});

		it('should throw error for unexpected response format', async () => {
			// Arrange
			const videoId = 'test-id';
			const invalidResponse = { data: 'invalid' };
			const mockFetch = createSuccessfulFetch(invalidResponse);
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
				'Unexpected response format for subtitles'
			);
		});

		it('should throw error for null response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch({ok: true, json: async () => null });
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
				'Unexpected response format for subtitles'
			);
		});

		it('should throw error for string response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch('invalid string');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
				'Unexpected response format for subtitles'
			);
		});

		it('should throw error for number response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(123);
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
				'Unexpected response format for subtitles'
			);
		});
	});

	// =============================================================================
	// Language Detection Tests
	// =============================================================================

	describe('language detection and parsing', () => {
		it('should correctly parse language locale', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].locale).toBe('en');
			expect(result[1].locale).toBe('es');
		});

		it('should correctly parse display language name', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].displayLanguageName).toBe('English');
			expect(result[1].displayLanguageName).toBe('Spanish');
		});

		it('should correctly parse language tag', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].languageTag).toBe('en');
			expect(result[1].languageTag).toBe('es');
		});

		it('should handle multiple languages', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const locales = result.map((sub) => sub.locale);
			expect(locales).toContain('en');
			expect(locales).toContain('es');
			expect(locales).toHaveLength(3);
		});

		it('should identify auto-generated subtitles', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].autogenerated).toBe(false);
			expect(result[2].autogenerated).toBe(true);
		});

		it('should identify manual subtitles', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const manualSubtitles = result.filter((sub) => !sub.autogenerated);
			expect(manualSubtitles).toHaveLength(2);
			expect(manualSubtitles[0].displayLanguageName).toBe('English');
			expect(manualSubtitles[1].displayLanguageName).toBe('Spanish');
		});
	});

	// =============================================================================
	// Subtitle Format Tests
	// =============================================================================

	describe('subtitle format parsing', () => {
		it('should correctly parse subtitle format', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockSubtitle]);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].format).toBe('vtt');
		});

		it('should handle VTT format subtitles', async () => {
			// Arrange
			const videoId = 'test-id';
			const vttSubtitle = { ...mockSubtitle, format: 'vtt' };
			const mockFetch = createSuccessfulFetch([vttSubtitle]);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].format).toBe('vtt');
		});

		it('should handle SRT format subtitles', async () => {
			// Arrange
			const videoId = 'test-id';
			const srtSubtitle = { ...mockSubtitle, format: 'srt' };
			const mockFetch = createSuccessfulFetch([srtSubtitle]);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].format).toBe('srt');
		});

		it('should preserve subtitle URLs', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockSubtitle]);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].url).toBe('https://example.com/subtitles/en.vtt');
			expect(result[0].url).toMatch(/^https?:\/\//);
		});

		it('should preserve subtitle IDs', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockSubtitle]);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result[0].id).toBe('subtitle-1');
			expect(typeof result[0].id).toBe('string');
		});
	});

	// =============================================================================
	// Missing Subtitles Tests
	// =============================================================================

	describe('missing subtitles handling', () => {
		it('should return empty array for videos without subtitles', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([]);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(0);
		});

		it('should handle object response with empty subtitles array', async () => {
			// Arrange
			const videoId = 'test-id';
			const emptyResponse = { subtitles: [], videoId: 'test-id' };
			const mockFetch = createSuccessfulFetch(emptyResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});
	});

	// =============================================================================
	// URL Construction Tests
	// =============================================================================

	describe('API URL construction', () => {
		it('should construct correct API URL', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain('http://localhost:8000/api/v1/streams/subtitles');
			expect(callUrl).toContain(`id=${videoId}`);
		});

		it('should URL encode video ID', async () => {
			// Arrange
			const videoId = 'test-id&special=chars';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});

		it('should handle video IDs with spaces', async () => {
			// Arrange
			const videoId = 'test id with spaces';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});

		it('should handle video IDs with Unicode characters', async () => {
			// Arrange
			const videoId = 'test-测试-тест';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});
	});

	// =============================================================================
	// HTTP Error Tests
	// =============================================================================

	describe('HTTP error handling', () => {
		it('should throw error on 404 response', async () => {
			// Arrange
			const videoId = 'non-existent-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch subtitles for ${videoId}: 404 Not Found`
			);
		});

		it('should throw error on 500 response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch subtitles for ${videoId}: 500 Internal Server Error`
			);
		});

		it('should throw error on 400 response', async () => {
			// Arrange
			const videoId = 'invalid-id';
			const mockFetch = createFailedFetch(400, 'Bad Request');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				/400 Bad Request/
			);
		});

		it('should throw error on 403 response', async () => {
			// Arrange
			const videoId = 'forbidden-id';
			const mockFetch = createFailedFetch(403, 'Forbidden');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				/403 Forbidden/
			);
		});

		it('should log errors to console', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			// Act
			try {
				await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				console.error(error);
			}

			// Assert
			expect(consoleErrorMock.mock).toHaveBeenCalledWith(
				'Error fetching subtitles:',
				expect.any(Error)
			);
		});

		it('should include video ID in error message', async () => {
			// Arrange
			const videoId = 'specific-video-id';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				new RegExp(videoId)
			);
		});

		it('should include status code in error message', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(503, 'Service Unavailable');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				/503/
			);
		});

		it('should include status text in error message', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(429, 'Too Many Requests');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
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
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Failed to fetch');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				'Failed to fetch'
			);
		});

		it('should log network errors to console', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Network error');
			consoleErrorMock = createMockConsoleError();

			// Act
			try {
				await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				console.error(error);
			}

			// Assert
			expect(consoleErrorMock.mock).toHaveBeenCalledWith(
				'Error fetching subtitles:',
				expect.any(Error)
			);
		});

		it('should throw error on timeout', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Request timeout');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				'Request timeout'
			);
		});

		it('should throw error on connection refused', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Connection refused');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				'Connection refused'
			);
		});

		it('should throw error on DNS failure', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('DNS resolution failed');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getSubtitles(videoId, mockFetch)).rejects.toThrow(
				'DNS resolution failed'
			);
		});
	});

	// =============================================================================
	// Response Parsing Tests
	// =============================================================================

	describe('response parsing', () => {
		it('should parse complete subtitle objects', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSubtitlesArrayResponse);
			const subtitle = result[0];
			expect(subtitle).toHaveProperty('id');
			expect(subtitle).toHaveProperty('url');
			expect(subtitle).toHaveProperty('format');
			expect(subtitle).toHaveProperty('locale');
			expect(subtitle).toHaveProperty('displayLanguageName');
			expect(subtitle).toHaveProperty('languageTag');
			expect(subtitle).toHaveProperty('autogenerated');
		});

		it('should preserve all data types', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch([mockSubtitle]);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const subtitle = result[0];
			expect(typeof subtitle.id).toBe('string');
			expect(typeof subtitle.url).toBe('string');
			expect(typeof subtitle.format).toBe('string');
			expect(typeof subtitle.locale).toBe('string');
			expect(typeof subtitle.displayLanguageName).toBe('string');
			expect(typeof subtitle.languageTag).toBe('string');
			expect(typeof subtitle.autogenerated).toBe('boolean');
		});
	});

	// =============================================================================
	// Edge Cases
	// =============================================================================

	describe('edge cases', () => {
		it('should handle empty video ID', async () => {
			// Arrange
			const videoId = '';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSubtitlesArrayResponse);
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain('id=');
		});

		it('should handle video ID with special characters', async () => {
			// Arrange
			const videoId = 'test-id!@#$%^&*()';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSubtitlesArrayResponse);
		});

		it('should only call fetch once per request', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(getCallCount(mockFetch)).toBe(1);
		});

		it('should handle concurrent requests independently', async () => {
			// Arrange
			const videoId1 = 'video-1';
			const videoId2 = 'video-2';
			const mockFetch1 = createSuccessfulFetch(mockSubtitlesArrayResponse);
			const mockFetch2 = createSuccessfulFetch([]);

			// Act
			const [result1, result2] = await Promise.all([
				getSubtitles(videoId1, mockFetch1 as unknown as typeof globalThis.fetch),
				getSubtitles(videoId2, mockFetch2 as unknown as typeof globalThis.fetch)
			]);

			// Assert
			expect(result1).toEqual(mockSubtitlesArrayResponse);
			expect(result2).toEqual([]);
			expect(getCallCount(mockFetch1)).toBe(1);
			expect(getCallCount(mockFetch2)).toBe(1);
		});

		it('should handle very long video IDs', async () => {
			// Arrange
			const videoId = 'a'.repeat(1000);
			const mockFetch = createSuccessfulFetch(mockSubtitlesArrayResponse);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockSubtitlesArrayResponse);
		});

		it('should handle subtitles with duplicate locales', async () => {
			// Arrange
			const videoId = 'test-id';
			const duplicateLocaleSubtitles = [
				mockSubtitle,
				{ ...mockSubtitle, id: 'subtitle-2', autogenerated: true }
			];
			const mockFetch = createSuccessfulFetch(duplicateLocaleSubtitles);

			// Act
			const result = await getSubtitles(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toHaveLength(2);
			expect(result[0].locale).toBe(result[1].locale);
			expect(result[0].autogenerated).not.toBe(result[1].autogenerated);
		});
	});
});