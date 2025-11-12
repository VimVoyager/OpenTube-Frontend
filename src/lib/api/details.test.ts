/**
 * Test Suite: details.ts
 * 
 * Tests for video details fetching including metadata parsing,
 * error handling, and data validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getVideoDetails } from './details';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch,
	extractQueryParams,
	createMockConsoleError,
	getCallCount
} from '../../tests/helpers/apiHelpers';
import {
    mockVideoDetails,
    mockVideoDetailsMinimal
} from '../../tests/fixtures/apiFixtures';

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
// Successful Details Fetching Tests
// =============================================================================

describe('getVideoDetails', () => {
	describe('successful video details requests', () => {
		it('should fetch video details with valid ID', async () => {
			// Arrange
			const videoId = 'test-video-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockVideoDetails);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should return complete Details object', async () => {
			// Arrange
			const videoId = 'abc123';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toHaveProperty('videoTitle');
			expect(result).toHaveProperty('description');
			expect(result).toHaveProperty('uploadDate');
			expect(result).toHaveProperty('channelName');
			expect(result).toHaveProperty('viewCount');
			expect(result).toHaveProperty('likeCount');
			expect(result).toHaveProperty('dislikeCount');
			expect(result).toHaveProperty('channelSubscriberCount');
			expect(result).toHaveProperty('uploaderAvatars');
		});

		it('should use default fetch when fetchFn not provided', async () => {
			// Arrange
			const videoId = 'test-id';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(mockVideoDetails)
			});

			// Act
			const result = await getVideoDetails(videoId);

			// Assert
			expect(result).toEqual(mockVideoDetails);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});
	});

    // =============================================================================
	// Video Metadata Tests
	// =============================================================================

	describe('video metadata parsing', () => {
		it('should correctly parse video title', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.videoTitle).toBe('Test Video Title');
			expect(typeof result.videoTitle).toBe('string');
		});

		it('should correctly parse description', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.description).toHaveProperty('content');
			expect(result.description.content).toBe(
				'This is a test video description with details about the content.'
			);
		});

		it('should correctly parse upload date', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.uploadDate).toBe('2024-01-15');
			expect(typeof result.uploadDate).toBe('string');
		});

		it('should correctly parse channel name', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.channelName).toBe('Test Channel');
			expect(typeof result.channelName).toBe('string');
		});

		it('should correctly parse uploader avatars', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(Array.isArray(result.uploaderAvatars)).toBe(true);
			expect(result.uploaderAvatars).toHaveLength(1);
			expect(result.uploaderAvatars[0]).toHaveProperty('url');
			expect(result.uploaderAvatars[0]).toHaveProperty('height');
			expect(result.uploaderAvatars[0]).toHaveProperty('width');
		});
	});

    // =============================================================================
	// View Count Formatting Tests
	// =============================================================================

	describe('view count parsing', () => {
		it('should correctly parse view count', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.viewCount).toBe(1000000);
			expect(typeof result.viewCount).toBe('number');
		});

		it('should handle zero view count', async () => {
			// Arrange
			const videoId = 'test-id';
			const detailsWithZeroViews = {
				...mockVideoDetails,
				viewCount: 0
			};
			const mockFetch = createSuccessfulFetch(detailsWithZeroViews);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.viewCount).toBe(0);
		});

		it('should handle large view counts', async () => {
			// Arrange
			const videoId = 'test-id';
			const detailsWithLargeViews = {
				...mockVideoDetails,
				viewCount: 999999999
			};
			const mockFetch = createSuccessfulFetch(detailsWithLargeViews);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.viewCount).toBe(999999999);
		});
	});

    // =============================================================================
	// Like/Dislike Count Tests
	// =============================================================================

	describe('like and dislike count parsing', () => {
		it('should correctly parse like count', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.likeCount).toBe(50000);
			expect(typeof result.likeCount).toBe('number');
		});

		it('should correctly parse dislike count', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.dislikeCount).toBe(100);
			expect(typeof result.dislikeCount).toBe('number');
		});

		it('should handle zero likes and dislikes', async () => {
			// Arrange
			const videoId = 'test-id';
			const detailsWithZeroEngagement = {
				...mockVideoDetails,
				likeCount: 0,
				dislikeCount: 0
			};
			const mockFetch = createSuccessfulFetch(detailsWithZeroEngagement);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.likeCount).toBe(0);
			expect(result.dislikeCount).toBe(0);
		});
	});

    // =============================================================================
	// Channel Subscriber Count Tests
	// =============================================================================

	describe('channel subscriber count parsing', () => {
		it('should correctly parse subscriber count', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.channelSubscriberCount).toBe(1500000);
			expect(typeof result.channelSubscriberCount).toBe('number');
		});

		it('should handle zero subscribers', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetailsMinimal);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result.channelSubscriberCount).toBe(0);
		});
	});

    // =============================================================================
	// URL Construction Tests
	// =============================================================================

	describe('API URL construction', () => {
		it('should construct correct API URL', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain('http://localhost:8080/api/v1/streams/details');
			expect(callUrl).toContain(`id=${videoId}`);
		});

		it('should URL encode video ID', async () => {
			// Arrange
			const videoId = 'test-id-with-special-chars&=?';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});

		it('should handle video IDs with spaces', async () => {
			// Arrange
			const videoId = 'test id with spaces';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			const callUrl = mockFetch.mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});
	});

    // =============================================================================
	// Missing Video Handling Tests
	// =============================================================================

	describe('missing video handling', () => {
		it('should throw error for non-existent video (404)', async () => {
			// Arrange
			const videoId = 'non-existent-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch video details for ${videoId}: 404 Not Found`
			);
			expect(consoleErrorMock.mock).toHaveBeenCalled();
		});

		it('should log error to console for missing video', async () => {
			// Arrange
			const videoId = 'missing-video';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			// Act
			try {
				await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				// Expected to throw
			}

			// Assert
			expect(consoleErrorMock.mock).toHaveBeenCalledWith(
				'Error fetching video details:',
				expect.any(Error)
			);
		});
    });

    // =============================================================================
	// HTTP Error Tests
	// =============================================================================

	describe('HTTP error handling', () => {
		it('should throw error on 500 response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch video details for ${videoId}: 500 Internal Server Error`
			);
		});

		it('should throw error on 400 response', async () => {
			// Arrange
			const videoId = 'invalid-id';
			const mockFetch = createFailedFetch(400, 'Bad Request');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch video details for ${videoId}: 400 Bad Request`
			);
		});

		it('should throw error on 401 response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(401, 'Unauthorized');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				/401 Unauthorized/
			);
		});

		it('should throw error on 403 response', async () => {
			// Arrange
			const videoId = 'forbidden-id';
			const mockFetch = createFailedFetch(403, 'Forbidden');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				/403 Forbidden/
			);
		});

		it('should include video ID in error message', async () => {
			// Arrange
			const videoId = 'specific-video-id';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				new RegExp(videoId)
			);
		});

		it('should include status code in error message', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(503, 'Service Unavailable');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				/503/
			);
		});

		it('should include status text in error message', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(429, 'Too Many Requests');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
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
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
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
				await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				// Expected to throw
			}

			// Assert
			expect(consoleErrorMock.mock).toHaveBeenCalledWith(
				'Error fetching video details:',
				expect.any(Error)
			);
		});

		it('should throw error on timeout', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Request timeout');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				'Request timeout'
			);
		});

		it('should throw error on connection refused', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Connection refused');
			consoleErrorMock = createMockConsoleError();

			// Act & Assert
			await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
				'Connection refused'
			);
		});
	});

    // =============================================================================
	// Response Parsing Tests
	// =============================================================================

	describe('response parsing', () => {
		it('should parse complete Details object', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockVideoDetails);
		});

		it('should preserve all data types', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(typeof result.videoTitle).toBe('string');
			expect(typeof result.channelName).toBe('string');
			expect(typeof result.viewCount).toBe('number');
			expect(typeof result.likeCount).toBe('number');
			expect(typeof result.dislikeCount).toBe('number');
			expect(typeof result.channelSubscriberCount).toBe('number');
			expect(Array.isArray(result.uploaderAvatars)).toBe(true);
		});

		it('should handle minimal details response', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetailsMinimal);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockVideoDetailsMinimal);
			expect(result.uploaderAvatars).toHaveLength(0);
			expect(result.description.content).toBe('');
		});
	});

    // =============================================================================
	// Edge Cases
	// =============================================================================

	describe('edge cases', () => {
		it('should handle empty video ID', async () => {
			// Arrange
			const videoId = '';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockVideoDetails);
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain('id=');
		});

		it('should handle video ID with special characters', async () => {
			// Arrange
			const videoId = 'test-id!@#$%^&*()';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockVideoDetails);
		});

		it('should only call fetch once per request', async () => {
			// Arrange
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(getCallCount(mockFetch)).toBe(1);
		});

		it('should handle concurrent requests independently', async () => {
			// Arrange
			const videoId1 = 'video-1';
			const videoId2 = 'video-2';
			const mockFetch1 = createSuccessfulFetch(mockVideoDetails);
			const mockFetch2 = createSuccessfulFetch(mockVideoDetailsMinimal);

			// Act
			const [result1, result2] = await Promise.all([
				getVideoDetails(videoId1, mockFetch1 as unknown as typeof globalThis.fetch),
				getVideoDetails(videoId2, mockFetch2 as unknown as typeof globalThis.fetch)
			]);

			// Assert
			expect(result1).toEqual(mockVideoDetails);
			expect(result2).toEqual(mockVideoDetailsMinimal);
			expect(getCallCount(mockFetch1)).toBe(1);
			expect(getCallCount(mockFetch2)).toBe(1);
		});

		it('should handle very long video IDs', async () => {
			// Arrange
			const videoId = 'a'.repeat(1000);
			const mockFetch = createSuccessfulFetch(mockVideoDetails);

			// Act
			const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

			// Assert
			expect(result).toEqual(mockVideoDetails);
		});
	});
});