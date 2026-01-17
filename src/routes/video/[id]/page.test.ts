import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { load } from './+page';
import type { PageLoad } from './$types';
import { getVideoDetails } from '$lib/api/details';
import { getManifest } from '$lib/api/manifest';
import { getRelatedStreams } from '$lib/api/related';
import { getVideoThumbnails } from '$lib/api/thumbnails';
import { adaptPlayerConfig } from '$lib/adapters/player';
import { adaptVideoMetadata } from '$lib/adapters/metadata';
import { adaptRelatedVideos } from '$lib/adapters/related';
// import { mockStaticEnv } from '../../../tests/helpers/apiHelpers';

vi.mock('$env/static/public', () => {
    return Promise.resolve({
        PUBLIC_API_URL: 'http://localhost:8000/api/v1',
        PUBLIC_PROXY_URL: 'http://localhost:8888'
    });
});

// Mock all dependencies
vi.mock('$lib/api/details');
vi.mock('$lib/api/manifest');
vi.mock('$lib/api/related');
vi.mock('$lib/api/thumbnails');
vi.mock('$lib/adapters/metadata');
vi.mock('$lib/adapters/player');
vi.mock('$lib/adapters/relatedVideos');

describe('+page.ts', () => {
    // Mock data fixtures
    const mockVideoId = 'test-video-123';
    const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

    const mockThumbnail = {
        url: 'https://example.com/poster.jpg',
        estimatedResolutionLevel: 'HIGH' as const
    };

    const mockVideoDetails = {
        id: mockVideoId,
        videoTitle: 'Test Video Title',
        description: { content: 'This is a test video description with <strong>HTML</strong> content.' },
        channelName: 'Test Channel',
        uploaderAvatars: [
            { url: 'https://example.com/avatar.jpg', width: 48, height: 48 }
        ],
        viewCount: 1234567,
        uploadDate: '2024-01-15',
        likeCount: 50000,
        dislikeCount: 500,
        channelSubscriberCount: 1000000
    };

    const mockManifestResponse = {
        url: 'blob:http://localhost:5173/abc-123',
        duration: 180,
        videoId: 'video-test-video-123'
    };

    const mockRelatedStreams = [
        {
            id: 'related-1',
            url: 'https://www.youtube.com/watch?v=related-1',
            name: 'Related Video 1',
            thumbnails: [{ url: 'https://example.com/thumb1.jpg' }],
            uploaderName: 'Related Channel 1',
            uploaderAvatars: [{ url: 'https://example.com/avatar1.jpg' }],
            viewCount: 50000,
            duration: 300,
            textualUploadDate: '1 day ago'
        }
    ];

    const mockPlayerConfig = {
        manifestUrl: 'blob:http://localhost:5173/abc-123',
        duration: 180,
        poster: 'https://example.com/poster.jpg'
    };

    const mockMetadata = {
        title: 'Test Video Title',
        description: 'This is a test video description with <strong>HTML</strong> content.',
        channelName: 'Test Channel',
        channelAvatar: 'https://example.com/avatar.jpg',
        viewCount: 1234567,
        uploadDate: '2024-01-15',
        likeCount: 50000,
        dislikeCount: 500,
        subscriberCount: 1000000
    };

    const mockRelatedVideos = [
        {
            id: 'related-1',
            url: 'https://www.youtube.com/watch?v=related-1',
            title: 'Related Video 1',
            thumbnail: 'https://example.com/thumb1.jpg',
            channelName: 'Related Channel 1',
            channelAvatar: 'https://example.com/avatar1.jpg',
            viewCount: 50000,
            uploadDate: '1 day ago',
            duration: 300
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // mockStaticEnv();

        // Setup default mock implementations
        (getVideoThumbnails as Mock).mockResolvedValue(mockThumbnail);
        (getVideoDetails as Mock).mockResolvedValue(mockVideoDetails);
        (getManifest as Mock).mockResolvedValue(mockManifestResponse);
        (getRelatedStreams as Mock).mockResolvedValue(mockRelatedStreams);
        (adaptPlayerConfig as Mock).mockReturnValue(mockPlayerConfig);
        (adaptVideoMetadata as Mock).mockReturnValue(mockMetadata);
        (adaptRelatedVideos as Mock).mockReturnValue(mockRelatedVideos);
    });

    describe('load function - success path', () => {
        it('should fetch video data and return page data successfully', async () => {
            const params = { id: mockVideoId };
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result).toEqual({
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata,
                relatedVideos: mockRelatedVideos
            });
            expect(result!.error).toBeUndefined();
        });

        it('should call all API functions with correct parameters', async () => {
            const params = { id: mockVideoId };

            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(getVideoThumbnails).toHaveBeenCalledWith(mockVideoId, mockFetch);
            expect(getVideoDetails).toHaveBeenCalledWith(mockVideoId, mockFetch);
            expect(getManifest).toHaveBeenCalledWith(mockVideoId, mockFetch);
            expect(getRelatedStreams).toHaveBeenCalledWith(mockVideoId, mockFetch);
        });

        it('should call API functions in parallel using Promise.all', async () => {
            const params = { id: mockVideoId };
            const promiseAllSpy = vi.spyOn(Promise, 'all');

            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(promiseAllSpy).toHaveBeenCalled();
        });

        it('should call adapters with correct parameters', async () => {
            const params = { id: mockVideoId };
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(adaptPlayerConfig).toHaveBeenCalledWith(
                mockManifestResponse.url,
                mockManifestResponse.duration,
                mockThumbnail.url // Now using actual thumbnail URL from API
            );
            expect(adaptVideoMetadata).toHaveBeenCalledWith(
                mockVideoDetails,
                mockThumbnail.url // Now using actual thumbnail URL from API
            );
            expect(adaptRelatedVideos).toHaveBeenCalledWith(
                mockRelatedStreams,
                expect.any(String), // thumbnail placeholder
                expect.any(String)  // avatar placeholder
            );
        });
    });

    describe('load function - edge cases', () => {
        it('should handle missing manifest URL', async () => {
            const params = { id: mockVideoId };
            (getManifest as Mock).mockResolvedValue({
                url: '',
                duration: 0
            });

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Should still return page data, player will handle empty manifest
            expect(result).toHaveProperty('playerConfig');
            expect(result).toHaveProperty('metadata');
        });

        it('should handle zero duration from manifest', async () => {
            const params = { id: mockVideoId };
            (getManifest as Mock).mockResolvedValue({
                url: 'blob:http://localhost:5173/abc-123',
                duration: 0
            });
            // adaptPlayerConfig will use the duration from manifest response
            (adaptPlayerConfig as Mock).mockReturnValue({
                manifestUrl: 'blob:http://localhost:5173/abc-123',
                duration: 0,
                poster: 'https://example.com/poster.jpg'
            });

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result!.playerConfig.duration).toBe(0);
        });

        it('should handle failed related videos fetch gracefully', async () => {
            const params = { id: mockVideoId };
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            (getRelatedStreams as Mock).mockRejectedValue(new Error('Failed to fetch related'));
            // When related videos fail, adaptRelatedVideos is called with empty array
            (adaptRelatedVideos as Mock).mockReturnValue([]);

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result!.relatedVideos).toEqual([]);
            expect(result!.error).toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Failed to fetch related videos:',
                expect.any(Error)
            );
        });
    });

    describe('load function - error handling', () => {
        it('should return error page data when getVideoDetails fails', async () => {
            const params = { id: mockVideoId };
            const error = new Error('Failed to fetch video details');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getVideoDetails as Mock).mockRejectedValue(error);

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result!.error).toBe('Failed to fetch video details');
            expect(result!.playerConfig).toEqual({
                manifestUrl: '',
                duration: 0,
                poster: expect.any(String)
            });
            expect(result!.metadata).toEqual({
                title: 'Error Loading Video',
                description: 'Failed to load video information',
                channelName: 'Unknown',
                channelAvatar: null,
                viewCount: 0,
                uploadDate: '',
                likeCount: 0,
                dislikeCount: 0,
                subscriberCount: 0
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
        });

        it('should return error page data when getManifest fails', async () => {
            const params = { id: mockVideoId };
            const error = new Error('Failed to fetch manifest');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getManifest as Mock).mockRejectedValue(error);

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result!.error).toBe('Failed to fetch manifest');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
        });

        it('should handle non-Error exceptions with default message', async () => {
            const params = { id: mockVideoId };
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getVideoDetails as Mock).mockRejectedValue('String error');

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result!.error).toBe('Unknown error loading video');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', 'String error');
        });

        it('should handle undefined error with default message', async () => {
            const params = { id: mockVideoId };
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getVideoDetails as Mock).mockRejectedValue(undefined);

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result!.error).toBe('Unknown error loading video');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', undefined);
        });

        it('should handle errors during adaptation', async () => {
            const params = { id: mockVideoId };
            const error = new Error('Adaptation failed');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (adaptPlayerConfig as Mock).mockImplementation(() => {
                throw error;
            });

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result!.error).toBe('Adaptation failed');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
        });
    });

    describe('load function - data flow', () => {
        it('should pass through video ID from params', async () => {
            const customVideoId = 'custom-video-789';
            const params = { id: customVideoId };

            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(getVideoDetails).toHaveBeenCalledWith(customVideoId, mockFetch);
            expect(getManifest).toHaveBeenCalledWith(customVideoId, mockFetch);
        });

        it('should use provided fetch function', async () => {
            const params = { id: mockVideoId };
            const customFetch = vi.fn() as unknown as typeof globalThis.fetch;

            await load({ params, fetch: customFetch } as Parameters<PageLoad>[0]);

            expect(getVideoDetails).toHaveBeenCalledWith(mockVideoId, customFetch);
            expect(getManifest).toHaveBeenCalledWith(mockVideoId, customFetch);
        });

        it('should extract duration from manifest response', async () => {
            const params = { id: mockVideoId };
            const customDuration = 240;
            (getManifest as Mock).mockResolvedValue({
                url: 'blob:http://localhost:5173/xyz-456',
                duration: customDuration
            });

            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(adaptPlayerConfig).toHaveBeenCalledWith(
                expect.any(String),
                customDuration,
                expect.any(String)
            );
        });
    });

    describe('load function - performance', () => {
        it('should fetch all data in parallel', async () => {
            const params = { id: mockVideoId };
            const promiseAllSpy = vi.spyOn(Promise, 'all');

            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(promiseAllSpy).toHaveBeenCalledTimes(1);
            expect(promiseAllSpy).toHaveBeenCalledWith([
                expect.any(Promise), // getVideoThumbnails
                expect.any(Promise), // getVideoDetails
                expect.any(Promise), // getManifest
                expect.any(Promise)  // getRelatedStreams
            ]);
        });
    });

    describe('TypeScript type safety', () => {
        it('should return PageData type with new structure', async () => {
            const params = { id: mockVideoId };

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result).toHaveProperty('playerConfig');
            expect(result).toHaveProperty('metadata');
            expect(result).toHaveProperty('relatedVideos');
            expect(result!.playerConfig).toHaveProperty('manifestUrl');
            expect(result!.playerConfig).toHaveProperty('duration');
            expect(result!.playerConfig).toHaveProperty('poster');
            expect(result!.metadata).toHaveProperty('title');
            expect(result!.metadata).toHaveProperty('description');
            expect(result!.metadata).toHaveProperty('channelName');
        });

        it('should handle error PageData type with new structure', async () => {
            const params = { id: mockVideoId };
            vi.spyOn(console, 'error').mockImplementation(() => { });
            (getVideoDetails as Mock).mockRejectedValue(new Error('Test error'));

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result).toHaveProperty('playerConfig');
            expect(result).toHaveProperty('metadata');
            expect(result).toHaveProperty('error');
            expect(result!.playerConfig.manifestUrl).toBe('');
            expect(result!.playerConfig.duration).toBe(0);
            expect(result!.playerConfig).toHaveProperty('poster');
        });

        it('should have manifestUrl as string type', async () => {
            const params = { id: mockVideoId };

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(typeof result!.playerConfig.manifestUrl).toBe('string');
        });

        it('should have duration as number type', async () => {
            const params = { id: mockVideoId };

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(typeof result!.playerConfig.duration).toBe('number');
        });
    });

    describe('Manifest response structure', () => {
        it('should handle manifest response with videoId', async () => {
            const params = { id: mockVideoId };
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Check the actual console.log format from your +page.ts
            // Based on the error, it logs: "Loaded manifest URL for video {id} :", {url}
            expect(consoleLogSpy).toHaveBeenCalledWith(
                `Loaded manifest URL for video ${mockVideoId} :`,
                mockManifestResponse.url
            );
        });

        it('should handle manifest response without videoId', async () => {
            const params = { id: mockVideoId };
            (getManifest as Mock).mockResolvedValue({
                url: 'blob:http://localhost:5173/abc-123',
                duration: 180
                // no videoId
            });

            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            expect(result).toHaveProperty('playerConfig');
            expect(result!.error).toBeUndefined();
        });
    });
});