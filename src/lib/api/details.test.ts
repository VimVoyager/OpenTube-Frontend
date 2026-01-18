/**
 * Test Suite: details.ts
 * 
 * Tests for video details fetching including metadata parsing,
 * error handling, and data validation
 */

import { describe, it, expect, vi, afterEach, } from 'vitest';
import {
    createSuccessfulFetch,
    createFailedFetch,
    createNetworkErrorFetch,
    extractQueryParams,
    createMockConsoleError,
    getCallCount
} from '../../tests/helpers/apiHelpers';
import videoDetailsResponseFixture from '../../tests/fixtures/api/detailsResponseFixture.json';
import { getVideoDetails } from './details';
import type { Details } from '$lib/types';

// =============================================================================
// Setup and Teardown
// =============================================================================

let consoleErrorMock: ReturnType<typeof createMockConsoleError> | undefined;
const mockDetailsResponse: Details = videoDetailsResponseFixture[0];

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
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toEqual(mockDetailsResponse);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should return complete Details object', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toHaveProperty('videoTitle');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('uploadDate');
            expect(result).toHaveProperty('channelName');
            expect(result).toHaveProperty('viewCount');
            expect(result).toHaveProperty('likeCount');
            expect(result).toHaveProperty('dislikeCount');
            expect(result).toHaveProperty('channelSubscriberCount');
            expect(result).toHaveProperty('uploaderAvatars');

						expect(result).toEqual({
							videoTitle: mockDetailsResponse.videoTitle,
							description: mockDetailsResponse.description,
							uploadDate: mockDetailsResponse.uploadDate,
							channelName: mockDetailsResponse.channelName,
							viewCount: mockDetailsResponse.viewCount,
							likeCount: mockDetailsResponse.likeCount,
							dislikeCount: mockDetailsResponse.dislikeCount,
							channelSubscriberCount: mockDetailsResponse.channelSubscriberCount,
							uploaderAvatars: mockDetailsResponse.uploaderAvatars,
						})
        });

        it('should use default fetch when fetchFn not provided', async () => {
            // Arrange
            const videoId = 'test-id';
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: vi.fn().mockResolvedValue(mockDetailsResponse)
            });

            const result = await getVideoDetails(videoId);

            expect(result).toEqual(mockDetailsResponse);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================================================
    // Video Metadata Tests
    // =============================================================================

    describe('video metadata parsing', () => {
        it('should correctly parse video metadata', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);
						expect(result).toEqual({
							videoTitle: mockDetailsResponse.videoTitle,
							description: mockDetailsResponse.description,
							uploadDate: mockDetailsResponse.uploadDate,
							channelName: mockDetailsResponse.channelName,
							viewCount: mockDetailsResponse.viewCount,
							likeCount: mockDetailsResponse.likeCount,
							dislikeCount: mockDetailsResponse.dislikeCount,
							channelSubscriberCount: mockDetailsResponse.channelSubscriberCount,
							uploaderAvatars: mockDetailsResponse.uploaderAvatars
						});
        });
    });

    // =============================================================================
    // URL Construction Tests
    // =============================================================================

    describe('API URL construction', () => {
        it('should construct correct API URL', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

            const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(callUrl).toContain('http://localhost:8000/api/v1/streams/details');
            expect(callUrl).toContain(`id=${videoId}`);
        });

        it('should URL encode video ID', async () => {
            const videoId = 'test-id-with-special-chars&=?';
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

            const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            const params = extractQueryParams(callUrl);
            expect(params.id).toBe(videoId);
        });

        it('should handle video IDs with spaces', async () => {
            const videoId = 'test id with spaces';
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

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

            await expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                `Failed to fetch video details for ${videoId}: 404 Not Found`
            );
            expect(consoleErrorMock.mock).toHaveBeenCalled();

						expect(consoleErrorMock.mock).toHaveBeenCalledWith(
							'Error fetching video details:',
							expect.any(Error)
						);
        });

        it('should log error to console for missing video', async () => {
            const videoId = 'missing-video';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorMock = createMockConsoleError();

            try {
                await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);
            } catch (error) {
                console.error(error);
            }

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
        it('should throw error on 500 response', () => {
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorMock = createMockConsoleError();

            expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                `Failed to fetch video details for ${videoId}: 500 Internal Server Error`
            );
        });

        it('should throw error on 400 response', () => {
            const videoId = 'invalid-id';
            const mockFetch = createFailedFetch(400, 'Bad Request');
            consoleErrorMock = createMockConsoleError();

            expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                `Failed to fetch video details for ${videoId}: 400 Bad Request`
            );
        });

        it('should include video ID in error message', () => {
            const videoId = 'specific-video-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorMock = createMockConsoleError();

            expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                new RegExp(videoId)
            );
        });

        it('should include status code in error message', () => {
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(503, 'Service Unavailable');
            consoleErrorMock = createMockConsoleError();

            expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                /503/
            );
        });

        it('should include status text in error message', () => {
            const videoId = 'test-id';
            const mockFetch = createFailedFetch(429, 'Too Many Requests');
            consoleErrorMock = createMockConsoleError();

            expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                /Too Many Requests/
            );
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

            expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                'Failed to fetch'
            );
        });

        it('should log network errors to console', async () => {
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Network error');
            consoleErrorMock = createMockConsoleError();

            try {
                await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);
            } catch (error) {
                console.error(error);
            }

            expect(consoleErrorMock.mock).toHaveBeenCalledWith(
                'Error fetching video details:',
                expect.any(Error)
            );
        });

        it('should throw error on timeout', () => {
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Request timeout');
            consoleErrorMock = createMockConsoleError();

            expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                'Request timeout'
            );
        });

        it('should throw error on connection refused', () => {
            const videoId = 'test-id';
            const mockFetch = createNetworkErrorFetch('Connection refused');
            consoleErrorMock = createMockConsoleError();

            expect(getVideoDetails(videoId, mockFetch)).rejects.toThrow(
                'Connection refused'
            );
        });
    });

    // =============================================================================
    // Edge Cases
    // =============================================================================

    describe('edge cases', () => {
        it('should handle video ID with special characters', async () => {
            const videoId = 'test-id!@#$%^&*()';
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toEqual(mockDetailsResponse);
        });

        it('should only call fetch once per request', async () => {
            const videoId = 'test-id';
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(getCallCount((mockFetch as ReturnType<typeof vi.fn>))).toBe(1);
        });

        it('should handle concurrent requests independently', async () => {
            const videoId1 = 'video-1';
            const videoId2 = 'video-2';
            const mockFetch1 = createSuccessfulFetch(mockDetailsResponse);
            const mockFetch2 = createSuccessfulFetch(mockDetailsResponse);

            const [result1, result2] = await Promise.all([
                getVideoDetails(videoId1, mockFetch1 as unknown as typeof globalThis.fetch),
                getVideoDetails(videoId2, mockFetch2 as unknown as typeof globalThis.fetch)
            ]);

            expect(result1).toEqual(mockDetailsResponse);
            expect(result2).toEqual(mockDetailsResponse);
            expect(getCallCount(mockFetch1 as ReturnType<typeof vi.fn>)).toBe(1);
            expect(getCallCount(mockFetch2 as ReturnType<typeof vi.fn>)).toBe(1);
        });

        it('should handle very long video IDs', async () => {
            const videoId = 'a'.repeat(1000);
            const mockFetch = createSuccessfulFetch(mockDetailsResponse);

            const result = await getVideoDetails(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toEqual(mockDetailsResponse);
        });
    });
});