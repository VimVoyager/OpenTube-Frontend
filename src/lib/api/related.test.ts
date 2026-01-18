/**
 * Test Suite: related.ts
 * 
 * Tests for related video streams fetching
 */
import { describe, it, expect, vi, afterEach, } from 'vitest';
import {
    createSuccessfulFetch,
    createFailedFetch,
    createNetworkErrorFetch,
    createMockConsoleError
} from '../../tests/helpers/apiHelpers';
import relatedVideoStreamsResponseFixture from '../../tests/fixtures/api/relatedVideosResponse.json';
import { getRelatedStreams } from './related';
import type { RelatedItemResponse } from '$lib/api/types';

// =============================================================================
// Setup and Teardown
// =============================================================================

let consoleErrorSpy: ReturnType<typeof createMockConsoleError> | undefined;
const mockRelatedStreamsResponse: RelatedItemResponse[] = relatedVideoStreamsResponseFixture;

afterEach(() => {
    if (consoleErrorSpy) {
        consoleErrorSpy.restore();
        consoleErrorSpy = undefined;
    }
});

describe('getRelatedStreams', () => {
    // =============================================================================
    // Successful Related Video Stream Fetching Tests
    // =============================================================================

    describe('successful related stream requests', () => {
        it('should fetch related streams with valid ID', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(mockRelatedStreamsResponse);

            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toEqual(mockRelatedStreamsResponse);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                `http://localhost:8000/api/v1/streams/related?id=${encodeURIComponent(videoId)}`
            );
        });

        it('should return array of related stream requests', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(mockRelatedStreamsResponse);

            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(mockRelatedStreamsResponse.length);
            expect(result[0]).toHaveProperty('infoType');
						expect(result[0]).toHaveProperty('serviceId');
						expect(result[0]).toHaveProperty('url');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('thumbnails');
            expect(result[0]).toHaveProperty('streamType');
            expect(result[0]).toHaveProperty('uploaderName');
						expect(result[0]).toHaveProperty('textualUploadDate');
						expect(result[0]).toHaveProperty('viewCount');
						expect(result[0]).toHaveProperty('duration');
            expect(result[0]).toHaveProperty('uploaderUrl');
            expect(result[0]).toHaveProperty('uploaderAvatars');

						expect(result[0]).toEqual({
							infoType: mockRelatedStreamsResponse[0].infoType,
							serviceId: mockRelatedStreamsResponse[0].serviceId,
							url: mockRelatedStreamsResponse[0].url,
							name: mockRelatedStreamsResponse[0].name,
							thumbnails: mockRelatedStreamsResponse[0].thumbnails,
							streamType: mockRelatedStreamsResponse[0].streamType,
							uploaderName: mockRelatedStreamsResponse[0].uploaderName,
							textualUploadDate: mockRelatedStreamsResponse[0].textualUploadDate,
							uploadDate: mockRelatedStreamsResponse[0].uploadDate,
							viewCount: mockRelatedStreamsResponse[0].viewCount,
							duration: mockRelatedStreamsResponse[0].duration,
							uploaderUrl: mockRelatedStreamsResponse[0].uploaderUrl,
							uploaderAvatars: mockRelatedStreamsResponse[0].uploaderAvatars,
							uploaderVerified: mockRelatedStreamsResponse[0].uploaderVerified,
							shortFormContent: mockRelatedStreamsResponse[0].shortFormContent,
						})
        });

        // it('should handle object response format with streams property', async () => {
        //     const videoId = 'test-video-id';
        //     const mockFetch = createSuccessfulFetch(mockRelatedStreamsResponse);
				//
        //     const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);
				//
        //     expect(Array.isArray(result)).toBe(true);
        //     expect(result).toEqual(mockRelatedStreamObjectResponse.streams);
        // });

        it('should properly URL encode video ID', async () => {
            const videoId = 'test-video-id with spaces & special=chars';
            const mockFetch = createSuccessfulFetch(mockRelatedStreamsResponse);

            await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(mockFetch).toHaveBeenCalledWith(
                `http://localhost:8000/api/v1/streams/related?id=${encodeURIComponent(videoId)}`
            );
        });
    });

    // =============================================================================
    // Default Fetch Function Tests
    // =============================================================================

    describe('fetch function handling', () => {
        it('should use default fetch when fetchFn is not provided', async () => {
            const videoId = 'test-video-id';
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: vi.fn().mockResolvedValue(mockRelatedStreamsResponse),
            });

            const result = await getRelatedStreams(videoId);
            
            expect(result).toEqual(mockRelatedStreamsResponse);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:8000/api/v1/streams/related?id=${encodeURIComponent(videoId)}`
            );
        });

        it('should use provided fetch function when supplied', async () => {
            const videoId = 'test-video-id';
            const customFetch = createSuccessfulFetch(mockRelatedStreamsResponse);

            await getRelatedStreams(videoId, customFetch as unknown as typeof globalThis.fetch);

            expect(customFetch).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================================================
    // HTTP Error Response Tests
    // =============================================================================

    describe('HTTP error handling', () => {
        it('should throw error on 404 response', async () => {
            const videoId = 'nonexistent-video';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Failed to fetch related streams for nonexistent-video: 404 Not Found');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error on 500 response', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Failed to fetch related streams for test-video-id: 500 Internal Server Error');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error on 403 response', async () => {
            const videoId = 'forbidden-video';
            const mockFetch = createFailedFetch(403, 'Forbidden');
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Failed to fetch related streams for forbidden-video: 403 Forbidden');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================================================
    // Network Error Tests
    // =============================================================================

    describe('network error handling', () => {
        it('should handle network errors', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createNetworkErrorFetch();
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Network error');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should handle timeout errors', async () => {
            const videoId = 'test-video-id';
            const timeoutError = new Error('Request timeout');
            const mockFetch = vi.fn().mockRejectedValue(timeoutError);
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Request timeout');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================================================
    // Response Format Validation Tests
    // =============================================================================

    describe('response format validation', () => {
        it('should throw error for invalid response format', async () => {
            const videoId = 'test-video-id';
            const invalidResponse = { invalid: 'format' };
            const mockFetch = createSuccessfulFetch(invalidResponse);
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Unexpected response format for related streams');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error when response is null', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(null);
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Unexpected response format for related streams');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error when response is undefined', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(undefined);
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Unexpected response format for related streams');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error when streams property is not an array', async () => {
            const videoId = 'test-video-id';
            const invalidResponse = { streams: 'not-an-array' };
            const mockFetch = createSuccessfulFetch(invalidResponse);
            consoleErrorSpy = createMockConsoleError();

            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Unexpected response format for related streams');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================================================
    // Edge Case Tests
    // =============================================================================

    describe('edge cases', () => {
        it('should handle empty array response', async () => {
            const videoId = 'test-video-id';
            const emptyResponse: never[] = [];
            const mockFetch = createSuccessfulFetch(emptyResponse);

            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('should handle single related stream in array', async () => {
            const videoId = 'test-video-id';
            const singleItemResponse = [mockRelatedStreamsResponse[0]];
            const mockFetch = createSuccessfulFetch(singleItemResponse);

            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockRelatedStreamsResponse[0]);
        });

        it('should handle empty streams array in object response', async () => {
            const videoId = 'test-video-id';
            const emptyObjectResponse = { streams: [], videoId: 'test-video-id' };
            const mockFetch = createSuccessfulFetch(emptyObjectResponse);

            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });
    });

    // =============================================================================
    // Console Error Logging Tests
    // =============================================================================

    describe('error logging', () => {
        it('should log error to console when fetch fails', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorSpy = createMockConsoleError();

            try {
                await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);
            } catch {
                // Expected to throw
            }

            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy.mock).toHaveBeenCalledWith(
                'Error fetching related streams:',
                expect.any(Error)
            );
        });

        it('should log error to console on invalid response format', async () => {
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch({ invalid: 'format' });
            consoleErrorSpy = createMockConsoleError();

            try {
                await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);
            } catch {
                // Expected to throw
            }

            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy.mock).toHaveBeenCalledWith(
                'Error fetching related streams:',
                expect.any(Error)
            );
        });
    });
});