/**
 * Test Suite: related.ts
 * 
 * Tests for related video streams fetching
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getRelatedStreams } from './related';
import {
    createSuccessfulFetch,
    createFailedFetch,
    createNetworkErrorFetch,
    createMockConsoleError
} from '../../tests/helpers/apiHelpers';
import { 
    mockRelatedVideoStreamArrayResponse,
    mockRelatedStream,
    mockRelatedStreamObjectResponse
} from '../../tests/fixtures/apiFixtures';

// Mock environment variables
vi.mock('$env/dynamic/public', () => ({
    env: {
        PUBLIC_API_URL: 'http://localhost:8000'
    }
}));

// =============================================================================
// Setup and Teardown
// =============================================================================

let consoleErrorSpy: ReturnType<typeof createMockConsoleError> | undefined;

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
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(mockRelatedVideoStreamArrayResponse);

            // Act
            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result).toEqual(mockRelatedVideoStreamArrayResponse);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                `http://localhost:8000/api/v1/streams/related?id=${encodeURIComponent(videoId)}`
            );
        });

        it('should return array of related stream requests', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(mockRelatedVideoStreamArrayResponse);

            // Act
            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(mockRelatedVideoStreamArrayResponse.length);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('url');
            expect(result[0]).toHaveProperty('thumbnails');
            expect(result[0]).toHaveProperty('infoType');
            expect(result[0]).toHaveProperty('streamType');
            expect(result[0]).toHaveProperty('uploaderName');
            expect(result[0]).toHaveProperty('uploaderUrl');
            expect(result[0]).toHaveProperty('uploaderAvatars');
        });

        it('should handle object response format with streams property', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(mockRelatedStreamObjectResponse);

            // Act
            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(Array.isArray(result)).toBe(true);
            expect(result).toEqual(mockRelatedStreamObjectResponse.streams);
        });

        it('should properly URL encode video ID', async () => {
            // Arrange
            const videoId = 'test-video-id with spaces & special=chars';
            const mockFetch = createSuccessfulFetch(mockRelatedVideoStreamArrayResponse);

            // Act
            await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
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
            // Arrange
            const videoId = 'test-video-id';
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: vi.fn().mockResolvedValue(mockRelatedVideoStreamArrayResponse)
            });

            // Act
            const result = await getRelatedStreams(videoId);
            
            // Assert
            expect(result).toEqual(mockRelatedVideoStreamArrayResponse);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:8000/api/v1/streams/related?id=${encodeURIComponent(videoId)}`
            );
        });

        it('should use provided fetch function when supplied', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const customFetch = createSuccessfulFetch(mockRelatedVideoStreamArrayResponse);

            // Act
            await getRelatedStreams(videoId, customFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(customFetch).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================================================
    // HTTP Error Response Tests
    // =============================================================================

    describe('HTTP error handling', () => {
        it('should throw error on 404 response', async () => {
            // Arrange
            const videoId = 'nonexistent-video';
            const mockFetch = createFailedFetch(404, 'Not Found');
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Failed to fetch related streams for nonexistent-video: 404 Not Found');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error on 500 response', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Failed to fetch related streams for test-video-id: 500 Internal Server Error');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error on 403 response', async () => {
            // Arrange
            const videoId = 'forbidden-video';
            const mockFetch = createFailedFetch(403, 'Forbidden');
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
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
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createNetworkErrorFetch();
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Network error');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should handle timeout errors', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const timeoutError = new Error('Request timeout');
            const mockFetch = vi.fn().mockRejectedValue(timeoutError);
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
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
            // Arrange
            const videoId = 'test-video-id';
            const invalidResponse = { invalid: 'format' };
            const mockFetch = createSuccessfulFetch(invalidResponse);
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Unexpected response format for related streams');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error when response is null', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(null);
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Unexpected response format for related streams');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error when response is undefined', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch(undefined);
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
            await expect(
                getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch)
            ).rejects.toThrow('Unexpected response format for related streams');
            
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
        });

        it('should throw error when streams property is not an array', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const invalidResponse = { streams: 'not-an-array' };
            const mockFetch = createSuccessfulFetch(invalidResponse);
            consoleErrorSpy = createMockConsoleError();

            // Act & Assert
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
            // Arrange
            const videoId = 'test-video-id';
            const emptyResponse: never[] = [];
            const mockFetch = createSuccessfulFetch(emptyResponse);

            // Act
            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('should handle single related stream in array', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const singleItemResponse = [mockRelatedStream];
            const mockFetch = createSuccessfulFetch(singleItemResponse);

            // Act
            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockRelatedStream);
        });

        it('should handle empty streams array in object response', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const emptyObjectResponse = { streams: [], videoId: 'test-video-id' };
            const mockFetch = createSuccessfulFetch(emptyObjectResponse);

            // Act
            const result = await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);

            // Assert
            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });
    });

    // =============================================================================
    // Console Error Logging Tests
    // =============================================================================

    describe('error logging', () => {
        it('should log error to console when fetch fails', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createFailedFetch(500, 'Internal Server Error');
            consoleErrorSpy = createMockConsoleError();

            // Act
            try {
                await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);
            } catch {
                // Expected to throw
            }

            // Assert
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy.mock).toHaveBeenCalledWith(
                'Error fetching related streams:',
                expect.any(Error)
            );
        });

        it('should log error to console on invalid response format', async () => {
            // Arrange
            const videoId = 'test-video-id';
            const mockFetch = createSuccessfulFetch({ invalid: 'format' });
            consoleErrorSpy = createMockConsoleError();

            // Act
            try {
                await getRelatedStreams(videoId, mockFetch as unknown as typeof globalThis.fetch);
            } catch {
                // Expected to throw
            }

            // Assert
            expect(consoleErrorSpy.mock).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy.mock).toHaveBeenCalledWith(
                'Error fetching related streams:',
                expect.any(Error)
            );
        });
    });
});