/**
 * Test Suite: comments.ts
 *
 * Tests for video comments fetching including parsing,
 * error handling, and data validation
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch,
	extractQueryParams,
	createMockConsoleError,
	getCallCount
} from '../../tests/helpers/apiHelpers';
import commentsResponseFixture from '../../tests/fixtures/api/commentsResponse.json';
import { getVideoComments } from './comments';
import type { CommentResponse } from '$lib/api/types';

// =============================================================================
// Setup and Teardown
// =============================================================================

let consoleErrorMock: ReturnType<typeof createMockConsoleError> | undefined;
const mockCommentsResponse = commentsResponseFixture[0];
const mockEmptyCommentsResponse = commentsResponseFixture[1];

afterEach(() => {
	if (consoleErrorMock) {
		consoleErrorMock.restore();
		consoleErrorMock = undefined;
	}
});

// =============================================================================
// Successful Comments Fetching Tests
// =============================================================================

describe('getVideoComments', () => {
	describe('successful video comments requests', () => {
		it('should fetch video comments with valid ID', async () => {
			const videoId = 'test-video-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			expect(result).toEqual(mockCommentsResponse.relatedItems);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should return array of CommentResponse objects', async () => {
			const videoId = 'test-video-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(3);

			const firstComment = result[0];
			expect(firstComment).toHaveProperty('commentId');
			expect(firstComment).toHaveProperty('commentText');
			expect(firstComment).toHaveProperty('uploaderName');
			expect(firstComment).toHaveProperty('uploaderAvatars');
			expect(firstComment).toHaveProperty('uploaderUrl');
			expect(firstComment).toHaveProperty('uploaderVerified');
			expect(firstComment).toHaveProperty('textualUploadDate');
			expect(firstComment).toHaveProperty('likeCount');
			expect(firstComment).toHaveProperty('textualLikeCount');
			expect(firstComment).toHaveProperty('heartedByUploader');
			expect(firstComment).toHaveProperty('pinned');
			expect(firstComment).toHaveProperty('replyCount');
			expect(firstComment).toHaveProperty('channelOwner');
		});

		it('should handle video with no comments', async () => {
			const videoId = 'empty-video-id';
			const mockFetch = createSuccessfulFetch(mockEmptyCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});

		it('should use default fetch when fetchFn not provided', async () => {
			const videoId = 'test-id';
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				json: vi.fn().mockResolvedValue(mockCommentsResponse)
			});

			const result = await getVideoComments(videoId);

			expect(result).toEqual(mockCommentsResponse.relatedItems);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});
	});

	// =============================================================================
	// Comments Metadata Tests
	// =============================================================================

	describe('comments metadata parsing', () => {
		it('should correctly parse pinned comments', async () => {
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			const pinnedComment = result.find((c: CommentResponse) => c.pinned);
			expect(pinnedComment).toBeDefined();
			expect(pinnedComment?.pinned).toBe(true);
			expect(pinnedComment?.commentId).toBe('UgyiJE43h1yLACMgiwh4AaABAg');
		});

		it('should correctly parse channel owner comments', async () => {
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			const ownerComment = result.find((c: CommentResponse) => c.channelOwner);
			expect(ownerComment).toBeDefined();
			expect(ownerComment?.channelOwner).toBe(true);
			expect(ownerComment?.uploaderName).toBe('@GLITCH');
		});

		it('should correctly parse verified users', async () => {
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			const verifiedComment = result.find((c: CommentResponse) => c.uploaderVerified);
			expect(verifiedComment).toBeDefined();
			expect(verifiedComment?.uploaderVerified).toBe(true);
		});

		it('should correctly parse hearted comments', async () => {
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			const heartedComment = result.find((c: CommentResponse) => c.heartedByUploader);
			expect(heartedComment).toBeDefined();
			expect(heartedComment?.heartedByUploader).toBe(true);
			expect(heartedComment?.commentId).toBe('UgyiJE43h1yLACMgiwh4AaABAg');
		});

		it('should correctly parse reply information', async () => {
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			const commentWithReplies = result[0];
			expect(commentWithReplies.replyCount).toBe(914);
			expect(commentWithReplies.replies).toBeDefined();
			expect(commentWithReplies.replies?.url).toBe('https://www.youtube.com/watch?v=pilot-id');
			expect(commentWithReplies.replies?.id).toBe('reply-id-1');
		});
	});

	// =============================================================================
	// URL Construction Tests
	// =============================================================================

	describe('API URL construction', () => {
		it('should construct correct API URL', async () => {
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			await getVideoComments(videoId, mockFetch as unknown as typeof globalThis.fetch);

			const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(callUrl).toContain('http://localhost:8000/api/v1/comments');
			expect(callUrl).toContain(`id=${videoId}`);
		});

		it('should URL encode video ID', async () => {
			const videoId = 'test-id-with-special-chars&=?';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			await getVideoComments(videoId, mockFetch as unknown as typeof globalThis.fetch);

			const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});

		it('should handle video IDs with spaces', async () => {
			const videoId = 'test id with spaces';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			await getVideoComments(videoId, mockFetch as unknown as typeof globalThis.fetch);

			const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			const params = extractQueryParams(callUrl);
			expect(params.id).toBe(videoId);
		});
	});

	// =============================================================================
	// Missing Video Handling Tests
	// =============================================================================

	describe('missing video handling', () => {
		it('should throw error for non-existent video (404)', async () => {
			const videoId = 'non-existent-id';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			await expect(getVideoComments(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch comments for ${videoId}: 404 Not Found`
			);
			expect(consoleErrorMock.mock).toHaveBeenCalled();
			expect(consoleErrorMock.mock).toHaveBeenCalledWith(
				'Error fetching video comments:',
				expect.any(Error)
			);
		});

		it('should log error to console for missing video', async () => {
			const videoId = 'missing-video';
			const mockFetch = createFailedFetch(404, 'Not Found');
			consoleErrorMock = createMockConsoleError();

			try {
				await getVideoComments(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				// Error is expected
			}

			expect(consoleErrorMock.mock).toHaveBeenCalledWith(
				'Error fetching video comments:',
				expect.any(Error)
			);
		});
	});

	// =============================================================================
	// HTTP Error Tests
	// =============================================================================

	describe('HTTP error handling', () => {
		it('should throw error on 500 response', () => {
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			expect(getVideoComments(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch comments for ${videoId}: 500 Internal Server Error`
			);
		});

		it('should throw error on 400 response', () => {
			const videoId = 'invalid-id';
			const mockFetch = createFailedFetch(400, 'Bad Request');
			consoleErrorMock = createMockConsoleError();

			expect(getVideoComments(videoId, mockFetch)).rejects.toThrow(
				`Failed to fetch comments for ${videoId}: 400 Bad Request`
			);
		});

		it('should include video ID in error message', () => {
			const videoId = 'specific-video-id';
			const mockFetch = createFailedFetch(500, 'Internal Server Error');
			consoleErrorMock = createMockConsoleError();

			expect(getVideoComments(videoId, mockFetch)).rejects.toThrow(new RegExp(videoId));
		});

		it('should include status code in error message', () => {
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(503, 'Service Unavailable');
			consoleErrorMock = createMockConsoleError();

			expect(getVideoComments(videoId, mockFetch)).rejects.toThrow(/503/);
		});

		it('should include status text in error message', () => {
			const videoId = 'test-id';
			const mockFetch = createFailedFetch(429, 'Too Many Requests');
			consoleErrorMock = createMockConsoleError();

			expect(getVideoComments(videoId, mockFetch)).rejects.toThrow(/Too Many Requests/);
		});
	});

	// =============================================================================
	// Network Error Tests
	// =============================================================================

	describe('network error handling', () => {
		it('should throw error on network failure', () => {
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Failed to fetch');
			consoleErrorMock = createMockConsoleError();

			expect(getVideoComments(videoId, mockFetch)).rejects.toThrow('Failed to fetch');
		});

		it('should log network errors to console', async () => {
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Network error');
			consoleErrorMock = createMockConsoleError();

			try {
				await getVideoComments(videoId, mockFetch as unknown as typeof globalThis.fetch);
			} catch (error) {
				// Error is expected
			}

			expect(consoleErrorMock.mock).toHaveBeenCalledWith(
				'Error fetching video comments:',
				expect.any(Error)
			);
		});

		it('should throw error on timeout', () => {
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Request timeout');
			consoleErrorMock = createMockConsoleError();

			expect(getVideoComments(videoId, mockFetch)).rejects.toThrow('Request timeout');
		});

		it('should throw error on connection refused', () => {
			const videoId = 'test-id';
			const mockFetch = createNetworkErrorFetch('Connection refused');
			consoleErrorMock = createMockConsoleError();

			expect(getVideoComments(videoId, mockFetch)).rejects.toThrow('Connection refused');
		});
	});

	// =============================================================================
	// Edge Cases
	// =============================================================================

	describe('edge cases', () => {
		it('should handle video ID with special characters', async () => {
			const videoId = 'test-id!@#$%^&*()';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			expect(result).toEqual(mockCommentsResponse.relatedItems);
		});

		it('should only call fetch once per request', async () => {
			const videoId = 'test-id';
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			await getVideoComments(videoId, mockFetch as unknown as typeof globalThis.fetch);

			expect(getCallCount(mockFetch as ReturnType<typeof vi.fn>)).toBe(1);
		});

		it('should handle concurrent requests independently', async () => {
			const videoId1 = 'video-1';
			const videoId2 = 'video-2';
			const mockFetch1 = createSuccessfulFetch(mockCommentsResponse);
			const mockFetch2 = createSuccessfulFetch(mockCommentsResponse);

			const [result1, result2] = await Promise.all([
				getVideoComments(videoId1, mockFetch1 as unknown as typeof globalThis.fetch),
				getVideoComments(videoId2, mockFetch2 as unknown as typeof globalThis.fetch)
			]);

			expect(result1).toEqual(mockCommentsResponse.relatedItems);
			expect(result2).toEqual(mockCommentsResponse.relatedItems);
			expect(getCallCount(mockFetch1 as ReturnType<typeof vi.fn>)).toBe(1);
			expect(getCallCount(mockFetch2 as ReturnType<typeof vi.fn>)).toBe(1);
		});

		it('should handle very long video IDs', async () => {
			const videoId = 'a'.repeat(1000);
			const mockFetch = createSuccessfulFetch(mockCommentsResponse);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			expect(result).toEqual(mockCommentsResponse.relatedItems);
		});

		it('should handle response with missing relatedItems property', async () => {
			const videoId = 'test-id';
			const responseWithoutRelatedItems = { ...mockCommentsResponse };
			delete (responseWithoutRelatedItems as any).relatedItems;

			const mockFetch = createSuccessfulFetch(responseWithoutRelatedItems);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			expect(result).toEqual([]);
		});

		it('should handle response with null relatedItems', async () => {
			const videoId = 'test-id';
			const responseWithNullRelatedItems = {
				...mockCommentsResponse,
				relatedItems: null
			};

			const mockFetch = createSuccessfulFetch(responseWithNullRelatedItems);

			const result = await getVideoComments(
				videoId,
				mockFetch as unknown as typeof globalThis.fetch
			);

			expect(result).toEqual([]);
		});
	});
});
