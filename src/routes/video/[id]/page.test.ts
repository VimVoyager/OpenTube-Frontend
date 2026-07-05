import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { load } from './+page';
import type { PageLoad } from './$types';
import { getVideoDetails } from '$lib/api/details';
import { getManifest } from '$lib/api/manifest';
import { getRelatedStreams } from '$lib/api/related';
import { getVideoThumbnails } from '$lib/api/thumbnails';
import { getPlaylist } from '$lib/api/playlist';
import { adaptPlayerConfig } from '$lib/adapters/player';
import { adaptVideoMetadata } from '$lib/adapters/metadata';
import { adaptRelatedVideos } from '$lib/adapters/related';
import { adaptPlaylistInfo, adaptPlaylistVideos } from '$lib/adapters/playlist';
import commentsResultFixture from '../../../tests/fixtures/adapters/commentsResult.json'
import type { CommentConfig } from '$lib/adapters/types';
import { adaptCommentResponse } from '$lib/adapters/comments';
import { getVideoComments } from '$lib/api/comments';

// Mock all dependencies
vi.mock('$lib/api/details');
vi.mock('$lib/api/manifest');
vi.mock('$lib/api/related');
vi.mock('$lib/api/thumbnails');
vi.mock('$lib/api/comments');
vi.mock('$lib/api/playlist');
vi.mock('$lib/adapters/metadata');
vi.mock('$lib/adapters/player');
vi.mock('$lib/adapters/related');
vi.mock('$lib/adapters/comments');
vi.mock('$lib/adapters/playlist');

describe('+page.ts', () => {
	// Mock data fixtures
	const mockVideoId = 'test-video-123';
	const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

	// The load function destructures `url` and reads url.searchParams,
	// so every invocation must provide a URL object
	const mockUrl = (search: string = ''): URL =>
		new URL(`http://localhost:5173/video/${mockVideoId}${search}`);

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

	const mockComments: CommentConfig = commentsResultFixture[0];

	const mockPlaylistId = 'PLtest123';

	const mockPlaylistResponse = {
		id: mockPlaylistId,
		name: 'Test Playlist',
		url: `https://www.youtube.com/playlist?list=${mockPlaylistId}`,
		uploaderName: 'Test Channel',
		uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
		relatedItems: []
	};

	const mockPlaylistVideos = [
		{
			id: 'playlist-video-1',
			url: 'https://www.youtube.com/watch?v=playlist-video-1',
			title: 'Playlist Video 1',
			thumbnail: 'https://example.com/pthumb1.jpg',
			channelName: 'Test Channel',
			channelId: 'UCtest456',
			channelAvatar: 'https://example.com/pavatar1.jpg',
			duration: 240,
			viewCount: 10000,
			uploadDate: '3 days ago'
		}
	];

	const mockPlaylistInfo = {
		id: mockPlaylistId,
		name: 'Test Playlist',
		url: `https://www.youtube.com/playlist?list=${mockPlaylistId}`,
		uploaderName: 'Test Channel',
		uploaderId: 'UCtest456',
		uploaderAvatarUrl: 'https://example.com/pavatar1.jpg',
		bannerUrl: null,
		thumbnailUrl: 'https://example.com/pthumb1.jpg',
		uploaderUrl: 'https://www.youtube.com/channel/UCtest456',
		description: null
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default mock implementations
		(getVideoThumbnails as Mock).mockResolvedValue(mockThumbnail);
		(getVideoDetails as Mock).mockResolvedValue(mockVideoDetails);
		(getManifest as Mock).mockResolvedValue(mockManifestResponse);
		(getRelatedStreams as Mock).mockResolvedValue(mockRelatedStreams);
		(getVideoComments as Mock).mockResolvedValue(mockComments);
		(getPlaylist as Mock).mockResolvedValue(mockPlaylistResponse);

		(adaptPlayerConfig as Mock).mockReturnValue(mockPlayerConfig);
		(adaptVideoMetadata as Mock).mockReturnValue(mockMetadata);
		(adaptRelatedVideos as Mock).mockReturnValue(mockRelatedVideos);
		(adaptCommentResponse as Mock).mockReturnValue(mockComments);
		(adaptPlaylistVideos as Mock).mockReturnValue(mockPlaylistVideos);
		(adaptPlaylistInfo as Mock).mockReturnValue(mockPlaylistInfo);
	});

	describe('load function - success path', () => {
		it('should fetch video data and return page data successfully', async () => {
			const params = { id: mockVideoId };
			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result).toEqual({
				playerConfig: { ...mockPlayerConfig, isMuxed: false },
				metadata: mockMetadata,
				relatedVideos: mockRelatedVideos,
				comments: mockComments,
				playlistId: null,
				playlistIndex: null,
				playlistVideos: null,
				playlistInfo: null
			});
			expect(result!.error).toBeUndefined();
		});

		it('should call all API functions with correct parameters', async () => {
			const params = { id: mockVideoId };

			await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(getVideoThumbnails).toHaveBeenCalledWith(mockVideoId, mockFetch);
			expect(getVideoDetails).toHaveBeenCalledWith(mockVideoId, mockFetch);
			expect(getManifest).toHaveBeenCalledWith(mockVideoId, mockFetch);
			expect(getRelatedStreams).toHaveBeenCalledWith(mockVideoId, mockFetch);
			expect(getVideoComments).toHaveBeenCalledWith(mockVideoId, mockFetch);
		});

		it('should call API functions in parallel using Promise.all', async () => {
			const params = { id: mockVideoId };
			const promiseAllSpy = vi.spyOn(Promise, 'all');

			await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(promiseAllSpy).toHaveBeenCalled();
		});

		it('should call adapters with correct parameters', async () => {
			const params = { id: mockVideoId };
			await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

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

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

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

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result!.playerConfig.duration).toBe(0);
		});

		it('should handle failed related videos fetch gracefully', async () => {
			const params = { id: mockVideoId };
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
			(getRelatedStreams as Mock).mockRejectedValue(new Error('Failed to fetch related'));
			// When related videos fail, adaptRelatedVideos is called with empty array
			(adaptRelatedVideos as Mock).mockReturnValue([]);

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

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

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

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

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result!.error).toBe('Failed to fetch manifest');
			expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
		});

		it('should handle non-Error exceptions with default message', async () => {
			const params = { id: mockVideoId };
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
			(getVideoDetails as Mock).mockRejectedValue('String error');

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result!.error).toBe('Unknown error loading video');
			expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', 'String error');
		});

		it('should handle undefined error with default message', async () => {
			const params = { id: mockVideoId };
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
			(getVideoDetails as Mock).mockRejectedValue(undefined);

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

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

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result!.error).toBe('Adaptation failed');
			expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading video data:', error);
		});
	});

	describe('load function - data flow', () => {
		it('should pass through video ID from params', async () => {
			const customVideoId = 'custom-video-789';
			const params = { id: customVideoId };

			await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(getVideoDetails).toHaveBeenCalledWith(customVideoId, mockFetch);
			expect(getManifest).toHaveBeenCalledWith(customVideoId, mockFetch);
		});

		it('should use provided fetch function', async () => {
			const params = { id: mockVideoId };
			const customFetch = vi.fn() as unknown as typeof globalThis.fetch;

			await load({ params, url: mockUrl(), fetch: customFetch } as Parameters<PageLoad>[0]);

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

			await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(adaptPlayerConfig).toHaveBeenCalledWith(
				expect.any(String),
				customDuration,
				expect.any(String)
			);
		});
	});

	describe('load function - playlist context', () => {
		it('should fetch and adapt playlist when playlist param is present', async () => {
			const params = { id: mockVideoId };

			const result = await load({
				params,
				url: mockUrl(`?playlist=${mockPlaylistId}&index=2`),
				fetch: mockFetch
			} as Parameters<PageLoad>[0]);

			expect(getPlaylist).toHaveBeenCalledWith(mockPlaylistId, mockFetch);
			expect(adaptPlaylistVideos).toHaveBeenCalledWith(mockPlaylistResponse);
			expect(adaptPlaylistInfo).toHaveBeenCalledWith(mockPlaylistResponse);
			expect(result!.playlistId).toBe(mockPlaylistId);
			expect(result!.playlistIndex).toBe(2);
			expect(result!.playlistVideos).toEqual(mockPlaylistVideos);
			expect(result!.playlistInfo).toEqual(mockPlaylistInfo);
		});

		it('should default playlist index to 0 when index param is missing', async () => {
			const params = { id: mockVideoId };

			const result = await load({
				params,
				url: mockUrl(`?playlist=${mockPlaylistId}`),
				fetch: mockFetch
			} as Parameters<PageLoad>[0]);

			expect(result!.playlistIndex).toBe(0);
		});

		it('should not fetch playlist when playlist param is absent', async () => {
			const params = { id: mockVideoId };

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(getPlaylist).not.toHaveBeenCalled();
			expect(adaptPlaylistVideos).not.toHaveBeenCalled();
			expect(adaptPlaylistInfo).not.toHaveBeenCalled();
			expect(result!.playlistId).toBeNull();
			expect(result!.playlistIndex).toBeNull();
			expect(result!.playlistVideos).toBeNull();
			expect(result!.playlistInfo).toBeNull();
		});

		it('should handle failed playlist fetch gracefully', async () => {
			const params = { id: mockVideoId };
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
			(getPlaylist as Mock).mockRejectedValue(new Error('Failed to fetch playlist'));

			const result = await load({
				params,
				url: mockUrl(`?playlist=${mockPlaylistId}&index=1`),
				fetch: mockFetch
			} as Parameters<PageLoad>[0]);

			expect(result!.error).toBeUndefined();
			expect(result!.playlistId).toBe(mockPlaylistId);
			expect(result!.playlistVideos).toBeNull();
			expect(result!.playlistInfo).toBeNull();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'Failed to fetch playlist:',
				expect.any(Error)
			);
		});
	});

	describe('load function - performance', () => {
		it('should fetch all data in parallel', async () => {
			const params = { id: mockVideoId };
			const promiseAllSpy = vi.spyOn(Promise, 'all');

			await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(promiseAllSpy).toHaveBeenCalledTimes(1);
			expect(promiseAllSpy).toHaveBeenCalledWith([
				expect.any(Promise), // getVideoThumbnails
				expect.any(Promise), // getVideoDetails
				expect.any(Promise), // getManifest
				expect.any(Promise), // getRelatedStreams
				expect.any(Promise), // getVideoComments
				expect.any(Promise)  // getPlaylist (or Promise.resolve(null))
			]);
		});
	});

	describe('TypeScript type safety', () => {
		it('should return PageData type with new structure', async () => {
			const params = { id: mockVideoId };

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

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

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result).toHaveProperty('playerConfig');
			expect(result).toHaveProperty('metadata');
			expect(result).toHaveProperty('error');
			expect(result!.playerConfig.manifestUrl).toBe('');
			expect(result!.playerConfig.duration).toBe(0);
			expect(result!.playerConfig).toHaveProperty('poster');
		});

		it('should have manifestUrl as string type', async () => {
			const params = { id: mockVideoId };

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(typeof result!.playerConfig.manifestUrl).toBe('string');
		});

		it('should have duration as number type', async () => {
			const params = { id: mockVideoId };

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(typeof result!.playerConfig.duration).toBe('number');
		});
	});

	describe('Manifest response structure', () => {
		it('should handle manifest response without videoId', async () => {
			const params = { id: mockVideoId };
			(getManifest as Mock).mockResolvedValue({
				url: 'blob:http://localhost:5173/abc-123',
				duration: 180
				// no videoId
			});

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result).toHaveProperty('playerConfig');
			expect(result!.error).toBeUndefined();
		});

		it('should default isMuxed to false when absent from manifest', async () => {
			const params = { id: mockVideoId };

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result!.playerConfig.isMuxed).toBe(false);
		});

		it('should propagate isMuxed flag from manifest response', async () => {
			const params = { id: mockVideoId };
			(getManifest as Mock).mockResolvedValue({
				url: 'https://example.com/direct-stream',
				duration: 0,
				isMuxed: true
			});

			const result = await load({ params, url: mockUrl(), fetch: mockFetch } as Parameters<PageLoad>[0]);

			expect(result!.playerConfig.isMuxed).toBe(true);
		});
	});
});