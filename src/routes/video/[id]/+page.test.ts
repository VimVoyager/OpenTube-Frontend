import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { load } from './+page';
import type { PageLoad } from './$types';
import type { Stream } from '$lib/types';
import { getVideoDetails } from '$lib/api/details';
import { getSubtitles } from '$lib/api/subtitles';
import { getAllStreams } from '$lib/api/streams';
import {
    adaptPlayerConfig,
    adaptVideoMetadata,
    calculateDuration
} from '$lib/adapters';
import {
    selectVideoStreams,
    selectBestAudioStreams,
    logSelectedStreams
} from '$lib/utils/streamSelection';
import {
    selectSubtitles,
    logSelectedSubtitles
} from '$lib/utils/subtitleSelection';
import { 
    mockVideoStream, 
    mockAudioStream, 
    mockSubtitleStream, 
    mockPlayerConfig 
} from '../../../tests/fixtures/videoPlayerFixtures';
import { mockMetadata } from '../../../tests/fixtures/videoDetailFixtures';

// Mock all dependencies
vi.mock('$lib/api/details');
vi.mock('$lib/api/subtitles');
vi.mock('$lib/api/streams');
vi.mock('$lib/adapters');
vi.mock('$lib/utils/streamSelection');
vi.mock('$lib/utils/subtitleSelection');

describe('+page.ts', () => {
    // Mock data fixtures
    const mockVideoId = 'test-video-123';
    const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

    const mockVideoDetails = {
        id: mockVideoId,
        title: 'Test Video',
        description: 'Test Description',
        uploaderName: 'Test Channel',
        uploaderAvatar: 'https://example.com/avatar.jpg',
        viewCount: 1000000,
        uploadDate: '2024-01-01',
        likeCount: 50000,
        dislikeCount: 500,
        subscriberCount: 100000
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mock implementations
        (getVideoDetails as Mock).mockResolvedValue(mockVideoDetails);
        (getAllStreams as Mock).mockResolvedValue({
            videoStreams: [mockVideoStream],
            audioStreams: [mockAudioStream]
        });
        (getSubtitles as Mock).mockResolvedValue([mockSubtitleStream]);
        (selectVideoStreams as Mock).mockReturnValue([mockVideoStream]);
        (selectBestAudioStreams as Mock).mockReturnValue([mockAudioStream]);
        (selectSubtitles as Mock).mockReturnValue([mockSubtitleStream]);
        (calculateDuration as Mock).mockReturnValue(300);
        (adaptPlayerConfig as Mock).mockReturnValue(mockPlayerConfig);
        (adaptVideoMetadata as Mock).mockReturnValue(mockMetadata);
        (logSelectedStreams as Mock).mockImplementation(() => { });
        (logSelectedSubtitles as Mock).mockImplementation(() => { });
    });

    describe('load function - success path', () => {
        it('should fetch video data and return page data successfully', async () => {
            // Arrange
            const params = { id: mockVideoId };

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result).toEqual({
                playerConfig: mockPlayerConfig,
                metadata: mockMetadata
            });
            expect(result!.error).toBeUndefined();
        });

        it('should call all API functions with correct parameters', async () => {
            // Arrange
            const params = { id: mockVideoId };

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(getVideoDetails).toHaveBeenCalledWith(mockVideoId, mockFetch);
            expect(getAllStreams).toHaveBeenCalledWith(mockVideoId, mockFetch);
            expect(getSubtitles).toHaveBeenCalledWith(mockVideoId, mockFetch);
        });

        it('should call API functions in parallel using Promise.all', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const promiseAllSpy = vi.spyOn(Promise, 'all');

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(promiseAllSpy).toHaveBeenCalled();
        });

        it('should call stream selection functions with fetched data', async () => {
            // Arrange
            const params = { id: mockVideoId };

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(selectVideoStreams).toHaveBeenCalledWith([mockVideoStream]);
            expect(selectBestAudioStreams).toHaveBeenCalledWith([mockAudioStream]);
            expect(selectSubtitles).toHaveBeenCalledWith([mockSubtitleStream]);
        });

        it('should calculate duration with selected streams', async () => {
            // Arrange
            const params = { id: mockVideoId };

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(calculateDuration).toHaveBeenCalledWith(
                [mockVideoStream],
                [mockAudioStream]
            );
        });

        it('should call logging functions for selected streams and subtitles', async () => {
            // Arrange
            const params = { id: mockVideoId };

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(logSelectedStreams).toHaveBeenCalledWith(
                [mockVideoStream],
                [mockAudioStream]
            );
            expect(logSelectedSubtitles).toHaveBeenCalledWith([mockSubtitleStream]);
        });

        it('should call adapters with correct parameters', async () => {
            // Arrange
            const params = { id: mockVideoId };

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(adaptPlayerConfig).toHaveBeenCalledWith(
                [mockVideoStream],
                [mockAudioStream],
                [mockSubtitleStream],
                300,
                expect.any(String) // thumbnail placeholder
            );
            expect(adaptVideoMetadata).toHaveBeenCalledWith(
                mockVideoDetails,
                expect.any(String) // thumbnail placeholder
            );
        });
    });

    describe('load function - edge cases', () => {
        it('should handle empty video streams', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            (selectVideoStreams as Mock).mockReturnValue([]);

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(consoleWarnSpy).toHaveBeenCalledWith('No suitable video stream found');
        });

        it('should handle empty audio streams', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            (selectBestAudioStreams as Mock).mockReturnValue([]);

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(consoleWarnSpy).toHaveBeenCalledWith('No suitable audio streams found');
        });

        it('should handle zero duration', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            (calculateDuration as Mock).mockReturnValue(0);

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Video duration is missing or zero, this may cause playback issues.'
            );
        });

        it('should handle missing duration', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            (calculateDuration as Mock).mockReturnValue(null);

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Video duration is missing or zero, this may cause playback issues.'
            );
        });

        it('should handle empty subtitles array', async () => {
            // Arrange
            const params = { id: mockVideoId };
            (getSubtitles as Mock).mockResolvedValue([]);
            (selectSubtitles as Mock).mockReturnValue([]);

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result!.playerConfig.subtitleStream).toBeDefined();
            expect(selectSubtitles).toHaveBeenCalledWith([]);
        });
    });

    describe('load function - error handling', () => {
        it('should return error page data when getVideoDetails fails', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const error = new Error('Failed to fetch video details');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getVideoDetails as Mock).mockRejectedValue(error);

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result!.error).toBe('Failed to fetch video details');
            expect(result!.playerConfig).toEqual({
                videoStream: null,
                audioStream: null,
                subtitleStream: null,
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

        it('should return error page data when getAllStreams fails', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const error = new Error('Failed to fetch streams');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getAllStreams as Mock).mockRejectedValue(error);

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result!.error).toBe('Failed to fetch streams');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
        });

        it('should return error page data when getSubtitles fails', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const error = new Error('Failed to fetch subtitles');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getSubtitles as Mock).mockRejectedValue(error);

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result!.error).toBe('Failed to fetch subtitles');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
        });

        it('should handle non-Error exceptions with default message', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getVideoDetails as Mock).mockRejectedValue('String error');

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result!.error).toBe('Unknown error loading video');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', 'String error');
        });

        it('should handle undefined error with default message', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getVideoDetails as Mock).mockRejectedValue(undefined);

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result!.error).toBe('Unknown error loading video');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', undefined);
        });

        it('should handle errors during stream selection', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const error = new Error('Stream selection failed');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (selectVideoStreams as Mock).mockImplementation(() => {
                throw error;
            });

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result!.error).toBe('Stream selection failed');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
        });

        it('should handle errors during adaptation', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const error = new Error('Adaptation failed');
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (adaptPlayerConfig as Mock).mockImplementation(() => {
                throw error;
            });

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result!.error).toBe('Adaptation failed');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
        });
    });

    describe('load function - data flow', () => {
        it('should pass through video ID from params', async () => {
            // Arrange
            const customVideoId = 'custom-video-789';
            const params = { id: customVideoId };

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(getVideoDetails).toHaveBeenCalledWith(customVideoId, expect.any(Function));
            expect(getAllStreams).toHaveBeenCalledWith(customVideoId, expect.any(Function));
            expect(getSubtitles).toHaveBeenCalledWith(customVideoId, expect.any(Function));
        });

        it('should use provided fetch function', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const customFetch = vi.fn() as unknown as typeof globalThis.fetch;

            // Act
            await load({ params, fetch: customFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(getVideoDetails).toHaveBeenCalledWith(expect.any(String), customFetch);
            expect(getAllStreams).toHaveBeenCalledWith(expect.any(String), customFetch);
            expect(getSubtitles).toHaveBeenCalledWith(expect.any(String), customFetch);
        });

        it('should maintain data integrity through the pipeline', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const customVideoStream = { ...mockVideoStream, quality: '4K' };
            const customAudioStream = { ...mockAudioStream, quality: 'ultra' };
            const customSubtitle = { ...mockSubtitleStream, code: 'es' };

            (getAllStreams as Mock).mockResolvedValue({
                videoStreams: [customVideoStream],
                audioStreams: [customAudioStream]
            });
            (getSubtitles as Mock).mockResolvedValue([customSubtitle]);
            (selectVideoStreams as Mock).mockReturnValue([customVideoStream]);
            (selectBestAudioStreams as Mock).mockReturnValue([customAudioStream]);
            (selectSubtitles as Mock).mockReturnValue([customSubtitle]);

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(selectVideoStreams).toHaveBeenCalledWith([customVideoStream]);
            expect(selectBestAudioStreams).toHaveBeenCalledWith([customAudioStream]);
            expect(selectSubtitles).toHaveBeenCalledWith([customSubtitle]);
        });
    });

    describe('load function - performance', () => {
        it('should not await stream selection operations unnecessarily', async () => {
            // Arrange
            const params = { id: mockVideoId };
            let apiCallsComplete = false;
            let selectionStarted = false;

            (getAllStreams as Mock).mockImplementation(async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                apiCallsComplete = true;
                return {
                    videoStreams: [mockVideoStream],
                    audioStreams: [mockAudioStream]
                };
            });

            (selectVideoStreams as Mock).mockImplementation((streams: Stream[]) => {
                selectionStarted = true;
                return streams;
            });

            // Act
            await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(apiCallsComplete).toBe(true);
            expect(selectionStarted).toBe(true);
        });
    });

    describe('TypeScript type safety', () => {
        it('should return PageData type', async () => {
            // Arrange
            const params = { id: mockVideoId };

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result).toHaveProperty('playerConfig');
            expect(result).toHaveProperty('metadata');
            expect(result!.playerConfig).toHaveProperty('videoStream');
            expect(result!.playerConfig).toHaveProperty('audioStream');
            expect(result!.playerConfig).toHaveProperty('subtitleStream');
            expect(result!.playerConfig).toHaveProperty('duration');
            expect(result!.playerConfig).toHaveProperty('poster');
            expect(result!.metadata).toHaveProperty('title');
            expect(result!.metadata).toHaveProperty('description');
            expect(result!.metadata).toHaveProperty('channelName');
        });

        it('should handle error PageData type', async () => {
            // Arrange
            const params = { id: mockVideoId };
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (getVideoDetails as Mock).mockRejectedValue(new Error('Test error'));

            // Act
            const result = await load({ params, fetch: mockFetch } as Parameters<PageLoad>[0]);

            // Assert
            expect(result).toHaveProperty('playerConfig');
            expect(result).toHaveProperty('metadata');
            expect(result).toHaveProperty('error');
            expect(result!.playerConfig.videoStream).toBeNull();
            expect(result!.playerConfig.audioStream).toBeNull();
            expect(result!.playerConfig.subtitleStream).toBeNull();
        });
    });
});