import { describe, it, expect, vi } from 'vitest';
import {
	createFailedFetch,
	createInvalidJSONFetch,
	createNetworkErrorFetch,
	createSuccessfulFetch,
} from '../../tests/helpers/apiHelpers';
import { getVideoThumbnails } from './thumbnails';
import thumbnailsResponseFixture from '../../tests/fixtures/api/thumbnailsResponseFixture.json';
import type { Thumbnail } from '$lib/types';

const mockThumbnailsResponse: Thumbnail[] = thumbnailsResponseFixture;

describe('getVideoThumbnails', () => {
    const mockVideoId = 'test-video-id';
    const mockApiUrl = 'http://localhost:8000/api/v1';

    describe('successful requests', () => {
        it('should fetch and return high quality thumbnail when available', async () => {
						const mockFetch = createSuccessfulFetch(mockThumbnailsResponse);

            const result = await getVideoThumbnails(mockVideoId, mockFetch);

            expect(mockFetch).toHaveBeenCalledWith(
                `${mockApiUrl}/streams/thumbnails?id=${encodeURIComponent(mockVideoId)}`
            );
            expect(result).toEqual(mockThumbnailsResponse[4]);
						expect(result.url).toBe('https://i.ytimg.com/vi/pilot-id/xl.jpg');
            expect(result.estimatedResolutionLevel).toBe('HIGH');
        });

        it('should return last thumbnail when no HIGH quality thumbnail exists', async () => {
            const mockThumbnails: Thumbnail[] = mockThumbnailsResponse.slice(0, -1);
						const mockFetch = createSuccessfulFetch(mockThumbnails);
            const result = await getVideoThumbnails(mockVideoId, mockFetch);

            expect(result).toEqual(mockThumbnails[3]);
						expect(result.url).toBe('https://i.ytimg.com/vi/pilot-id/lg.jpg');
            expect(result.estimatedResolutionLevel).toBe('MEDIUM');
        });

        it('should properly encode video ID in URL', async () => {
            const specialId = 'video@id#with$special&chars';
						const mockFetch = createSuccessfulFetch(mockThumbnailsResponse);
            await getVideoThumbnails(specialId, mockFetch);

            expect(mockFetch).toHaveBeenCalledWith(
                `${mockApiUrl}/streams/thumbnails?id=${encodeURIComponent(specialId)}`
            );
        });

        it('should use global fetch when no custom fetch is provided', async () => {
            const mockGlobalFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockThumbnailsResponse
						});
            globalThis.fetch = mockGlobalFetch;

            const result = await getVideoThumbnails(mockVideoId);

            expect(mockGlobalFetch).toHaveBeenCalled();
            expect(result).toEqual(mockThumbnailsResponse[4]);
        });
    });

    describe('error handling', () => {
        it('should throw error when response is not ok', async () => {
						const mockFetch = createFailedFetch(404, 'Not Found');

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                `Failed to fetch thumbnails for ${mockVideoId}: 404 Not Found`
            );
        });

        it('should throw error when response is 500', async () => {
						const mockFetch = createFailedFetch(500, 'Internal Server Error');

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                `Failed to fetch thumbnails for ${mockVideoId}: 500 Internal Server Error`
            );
        });

        it('should throw error when thumbnails array is empty', async () => {
						const mockFetch = createSuccessfulFetch([]);

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                `No thumbnails available for video ${mockVideoId}`
            );
        });

        it('should throw error when network request fails', async () => {
						const mockFetch = createNetworkErrorFetch()

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                'Network Error'
            );
        });

        it('should throw error when JSON parsing fails', async () => {
            // const mockFetch = vi.fn().mockResolvedValue({
            //     ok: true,
            //     json: async () => {
            //         throw new Error('Invalid JSON');
            //     }
            // });

						const mockFetch = createInvalidJSONFetch();

            await expect(getVideoThumbnails(mockVideoId, mockFetch)).rejects.toThrow(
                'Invalid JSON'
            );
        });

        it('should log error to console when error occurs', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const mockFetch = createFailedFetch(404, 'Not Found');

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
            const mockFetch = createSuccessfulFetch(mockThumbnailsResponse);

            await getVideoThumbnails('', mockFetch);

            expect(mockFetch).toHaveBeenCalledWith(
                `${mockApiUrl}/streams/thumbnails?id=`
            );
        });

        it('should handle multiple HIGH quality thumbnails and return the first one', async () => {
						mockThumbnailsResponse[3].estimatedResolutionLevel = 'HIGH';
						const mockThumbnails: Thumbnail[] = [mockThumbnailsResponse[3], mockThumbnailsResponse[4]];

            const mockFetch = createSuccessfulFetch(mockThumbnails);

            const result = await getVideoThumbnails(mockVideoId, mockFetch);

            expect(result).toEqual(mockThumbnails[0]);
        });
    });
});