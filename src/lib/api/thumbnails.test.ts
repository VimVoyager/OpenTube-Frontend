import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockStaticEnv } from '../../tests/helpers/apiHelpers';
import { getVideoThumbnails } from './thumbnails';
import type { Thumbnail } from '$lib/types';

beforeEach(() =>{
    mockStaticEnv();
})

describe('getVideoThumbnails', () => {
    const mockVideoId = 'dQw4w9WgXcQ';
    const mockApiUrl = 'http://localhost:8000/api/v1';

    const createMockThumbnails = (): Thumbnail[] => [
        {
            url: 'https://example.com/thumb_low.jpg',
            height: 90,
            width: 120,
            estimatedResolutionLevel: 'LOW'
        },
        {
            url: 'https://example.com/thumb_medium.jpg',
            height: 180,
            width: 320,
            estimatedResolutionLevel: 'MEDIUM'
        },
        {
            url: 'https://example.com/thumb_high.jpg',
            height: 720,
            width: 1280,
            estimatedResolutionLevel: 'HIGH'
        }
    ];

    describe('successful requests', () => {
        it('should fetch and return high quality thumbnail when available', async () => {
            const mockThumbnails = createMockThumbnails();
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnails
            });

            const result = await getVideoThumbnails(mockVideoId, mockFetch);

            expect(mockFetch).toHaveBeenCalledWith(
                `${mockApiUrl}/streams/thumbnails?id=${encodeURIComponent(mockVideoId)}`
            );
            expect(result).toEqual(mockThumbnails[2]);
            expect(result.estimatedResolutionLevel).toBe('HIGH');
        });

        it('should return last thumbnail when no HIGH quality thumbnail exists', async () => {
            const mockThumbnails: Thumbnail[] = [
                {
                    url: 'https://example.com/thumb_low.jpg',
                    height: 90,
                    width: 120,
                    estimatedResolutionLevel: 'LOW'
                },
                {
                    url: 'https://example.com/thumb_medium.jpg',
                    height: 180,
                    width: 320,
                    estimatedResolutionLevel: 'MEDIUM'
                }
            ];
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnails
            });

            const result = await getVideoThumbnails(mockVideoId, mockFetch);

            expect(result).toEqual(mockThumbnails[1]);
            expect(result.estimatedResolutionLevel).toBe('MEDIUM');
        });

        it('should return first thumbnail as fallback when array length is 1', async () => {
            const mockThumbnails: Thumbnail[] = [
                {
                    url: 'https://example.com/thumb_only.jpg',
                    height: 90,
                    width: 120,
                    estimatedResolutionLevel: 'LOW'
                }
            ];
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnails
            });

            const result = await getVideoThumbnails(mockVideoId, mockFetch);

            expect(result).toEqual(mockThumbnails[0]);
        });

        it('should properly encode video ID in URL', async () => {
            const specialId = 'video@id#with$special&chars';
            const mockThumbnails = createMockThumbnails();
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnails
            });

            await getVideoThumbnails(specialId, mockFetch);

            expect(mockFetch).toHaveBeenCalledWith(
                `${mockApiUrl}/streams/thumbnails?id=${encodeURIComponent(specialId)}`
            );
        });

        it('should use global fetch when no custom fetch is provided', async () => {
            const mockThumbnails = createMockThumbnails();
            const mockGlobalFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnails
            });
            globalThis.fetch = mockGlobalFetch;

            const result = await getVideoThumbnails(mockVideoId);

            expect(mockGlobalFetch).toHaveBeenCalled();
            expect(result).toEqual(mockThumbnails[2]);
        });
    });

    describe('error handling', () => {
        it('should throw error when response is not ok', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                `Failed to fetch thumbnails for ${mockVideoId}: 404 Not Found`
            );
        });

        it('should throw error when response is 500', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                `Failed to fetch thumbnails for ${mockVideoId}: 500 Internal Server Error`
            );
        });

        it('should throw error when thumbnails array is empty', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => []
            });

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                `No thumbnails available for video ${mockVideoId}`
            );
        });

        it('should throw error when network request fails', async () => {
            const networkError = new Error('Network error');
            const mockFetch = vi.fn().mockRejectedValue(networkError);

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                'Network error'
            );
        });

        it('should throw error when JSON parsing fails', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            });

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                'Invalid JSON'
            );
        });

        it('should log error to console when error occurs', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error fetching video thumbnails:',
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe('edge cases', () => {
        it('should handle empty video ID', async () => {
            const mockThumbnails = createMockThumbnails();
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnails
            });

            await getVideoThumbnails('', mockFetch);

            expect(mockFetch).toHaveBeenCalledWith(
                `${mockApiUrl}/streams/thumbnails?id=`
            );
        });

        it('should handle multiple HIGH quality thumbnails and return the first one', async () => {
            const mockThumbnails: Thumbnail[] = [
                {
                    url: 'https://example.com/thumb_high1.jpg',
                    height: 720,
                    width: 1280,
                    estimatedResolutionLevel: 'HIGH'
                },
                {
                    url: 'https://example.com/thumb_high2.jpg',
                    height: 1080,
                    width: 1920,
                    estimatedResolutionLevel: 'HIGH'
                }
            ];
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnails
            });

            const result = await getVideoThumbnails(mockVideoId, mockFetch);

            expect(result).toEqual(mockThumbnails[0]);
        });

        it('should handle thumbnails with undefined estimatedResolutionLevel', async () => {
            const mockThumbnails: Thumbnail[] = [
                {
                    url: 'https://example.com/thumb1.jpg',
                    height: 90,
                    width: 120,
                    estimatedResolutionLevel: undefined as never
                },
                {
                    url: 'https://example.com/thumb2.jpg',
                    height: 180,
                    width: 320,
                    estimatedResolutionLevel: undefined as never
                }
            ];
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnails
            });

            const result = await getVideoThumbnails(mockVideoId, mockFetch);

            // Should fall back to last thumbnail
            expect(result).toEqual(mockThumbnails[1]);
        });
    });
});