import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DOMParser as XMLDomParser } from '@xmldom/xmldom';
import { getVideoDetails } from '$lib/api/details';
import { getManifest } from '$lib/api/manifest';
import { getRelatedStreams } from '$lib/api/related';
import { getVideoThumbnails } from '$lib/api/thumbnails';
import { adaptPlayerConfig } from '$lib/adapters/player';
import { adaptVideoMetadata } from '$lib/adapters/metadata';
import { adaptRelatedVideos } from '$lib/adapters/related';
import { load } from './+page';
import detailsResponseFixture from '../../../tests/fixtures/api/detailsResponseFixture.json'
import thumbnailsResponseFixture from '../../../tests/fixtures/api/thumbnailsResponseFixture.json';
import manifestXmlFixture from '../../../tests/fixtures/api/manifestXmlFixture.xml?raw'
import relatedVideosFixture from '../../../tests/fixtures/api/relatedVideosResponse.json'
import type { Details, Thumbnail } from '$lib/types';
import type { RelatedItemResponse } from '$lib/api/types';
import type { VideoPageData } from '../../types';

const createMockManifestXml = (duration: string = 'PT2M56S'): string =>
	manifestXmlFixture
		.replace('STANDARD_DURATION', `duration="${duration}"`)
		.replace('MEDIA_PRESENTATION_DURATION', `mediaPresentationDuration="${duration}"`);

describe('Video Detail Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock DOMParser for manifest tests
		global.DOMParser = class DOMParser {
			parseFromString(str: string, type: string) {
				const parser = new XMLDomParser();
				return parser.parseFromString(str, type);
			}
		} as never;

		// Mock URL.createObjectURL
		global.URL.createObjectURL = vi.fn(() => 'blob:mock-manifest-url');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('API + Adapter Integration - Video Details', () => {
		it('should fetch and transform video details correctly', async () => {
			const mockDetails: Details = detailsResponseFixture[0];

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockDetails
			});

			const details = await getVideoDetails('test-video-id', mockFetch);
			const metadata = adaptVideoMetadata(details, 'default-avatar.jpg');

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/streams/details?id=test-video-id')
			);
			expect(metadata).toEqual({
				title: 'MURDER DRONES - Pilot',
				description: 'Murder Drones is a show about cute little robots that murder eachother',
				channelName: 'GLITCH',
				channelAvatar: "https://yt3.ggpht.com/random-unicode-characters/xl",
				viewCount: 10000,
				uploadDate: '2021-10-29T16:00:13-07:00',
				likeCount: 555,
				dislikeCount: 10,
				subscriberCount: 50000
			});
		});

		it('should handle missing optional fields in video details', async () => {
			const mockDetails: Details = detailsResponseFixture[1];

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockDetails
			});

			const details = await getVideoDetails('test-video-id', mockFetch);
			const metadata = adaptVideoMetadata(details, 'default-avatar.jpg');

			expect(metadata).toEqual({
				title: 'MURDER DRONES - Heartbeat',
				description: 'No description available',
				channelName: 'Unknown Channel',
				channelAvatar: 'default-avatar.jpg',
				viewCount: 0,
				uploadDate: '',
				likeCount: 0,
				dislikeCount: 0,
				subscriberCount: 0
			});
		});

		it('should handle API errors for video details', () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			expect(getVideoDetails('invalid-id', mockFetch)).rejects.toThrow(
				'Failed to fetch video details for invalid-id: 404 Not Found'
			);
		});
	});

	describe('API + Adapter Integration - Thumbnails', () => {
		it('should fetch and select high quality thumbnail', async () => {
			const mockThumbnails: Thumbnail[] = thumbnailsResponseFixture

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockThumbnails
			});

			const thumbnail = await getVideoThumbnails('test-id', mockFetch);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/streams/thumbnails?id=test-id')
			);
			expect(thumbnail).toEqual({
				url: 'https://i.ytimg.com/vi/pilot-id/xl.jpg',
				height: 1080,
				width: 1920,
				estimatedResolutionLevel: 'HIGH'
			});
		});

		it('should fallback to last thumbnail if no high quality available', async () => {
			const mockThumbnails: Thumbnail[] = [thumbnailsResponseFixture[2], thumbnailsResponseFixture[3]];

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockThumbnails
			});

			const thumbnail = await getVideoThumbnails('test-id', mockFetch);

			expect(thumbnail).toEqual({
				url: 'https://i.ytimg.com/vi/pilot-id/lg.jpg',
				height: 188,
				width: 336,
				estimatedResolutionLevel: 'MEDIUM'
			});
		});

		it('should handle missing thumbnails', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => []
			});

			await expect(getVideoThumbnails('test-id', mockFetch)).rejects.toThrow(
				'No thumbnails available for video test-id'
			);
		});
	});

	describe('API + Adapter Integration - Manifest', () => {
		it('should fetch and parse DASH manifest correctly', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				text: async () => createMockManifestXml('PT1H2M3S')
			});

			const manifest = await getManifest('test-id', mockFetch);

			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/streams/dash?id=test-id'));
			expect(manifest.url).toBe('blob:mock-manifest-url');
			expect(manifest.duration).toBe(3723);
			expect(manifest.videoId).toBe('0');
		});

		it('should parse different duration formats', async () => {
			const testCases = [
				{ xml: 'PT1H2M3S', expected: 3723 },
				{ xml: 'PT45M', expected: 2700 },
				{ xml: 'PT30S', expected: 30 },
				{ xml: 'PT2H', expected: 7200 },
				{ xml: 'PT1M30.5S', expected: 90.5 }
			];

			for (const testCase of testCases) {
				const mockFetch = vi.fn().mockResolvedValue({
					ok: true,
					text: async () => createMockManifestXml(testCase.xml)
				});

				const manifest = await getManifest('test-id', mockFetch);
				expect(manifest.duration).toBe(testCase.expected);
			}
		});

		it('should handle manifest without duration', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				text: async () => createMockManifestXml('')
			});

			const manifest = await getManifest('test-id', mockFetch);

			expect(manifest.duration).toBe(0);
		});

		it('should create player config from manifest', () => {
			const playerConfig = adaptPlayerConfig(
				'blob:mock-manifest-url',
				300,
				'https://example.com/poster.jpg'
			);

			expect(playerConfig).toEqual({
				manifestUrl: 'blob:mock-manifest-url',
				duration: 300,
				poster: 'https://example.com/poster.jpg'
			});
		});
	});

	describe('API + Adapter Integration - Related Videos', () => {
		it('should fetch and transform related videos correctly', async () => {
			const mockRelatedVideos: RelatedItemResponse[] = [relatedVideosFixture[0], relatedVideosFixture[1]];

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockRelatedVideos
			});

			const relatedStreams = await getRelatedStreams('test-id', mockFetch);
			const relatedVideos = adaptRelatedVideos(
				relatedStreams,
				'default-thumb.jpg',
				'default-avatar.jpg'
			);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/streams/related?id=test-id')
			);
			expect(relatedVideos).toHaveLength(2);
			expect(relatedVideos[0]).toEqual({
				id: "heartbeat-id",
				url: 'https://www.youtube.com/watch?v=heartbeat-id',
				title: 'MURDER DRONES - Heartbeat',
				thumbnail: 'https://i.ytimg.com/vi/heartbeat-id/hqdefault.jpg/md',
				channelName: 'GLITCH',
				channelAvatar: 'https://yt3.ggpht.com/random-unicode-characters/md',
				viewCount: 39000000,
				duration: 1049,
				uploadDate: '3 years ago'
			});
		});

		// it('should handle alternative response format with streams property', async () => {
		// 	const mockResponse = {
		// 		streams: [
		// 			{
		// 				url: 'https://youtube.com/watch?v=test',
		// 				id: 'test',
		// 				name: 'Test Video',
		// 				thumbnails: [],
		// 				uploaderName: 'Test',
		// 				uploaderAvatars: [],
		// 				viewCount: 100,
		// 				duration: 60,
		// 				textualUploadDate: 'today'
		// 			} as RelatedItemResponse
		// 		]
		// 	};
		//
		// 	const mockFetch = vi.fn().mockResolvedValue({
		// 		ok: true,
		// 		json: async () => mockResponse
		// 	});
		//
		// 	const relatedStreams = await getRelatedStreams('test-id', mockFetch);
		//
		// 	expect(relatedStreams).toHaveLength(1);
		// 	expect(relatedStreams[0].name).toBe('Test Video');
		// });

		it('should filter out invalid related videos', async () => {
			const mockRelatedVideos: RelatedItemResponse[] = relatedVideosFixture;

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockRelatedVideos
			});

			const relatedStreams = await getRelatedStreams('test-id', mockFetch);
			const relatedVideos = adaptRelatedVideos(
				relatedStreams,
				'default-thumb.jpg',
				'default-avatar.jpg'
			);

			expect(relatedVideos).toHaveLength(4);
			expect(relatedVideos[0].title).toBe('MURDER DRONES - Heartbeat');
			expect(relatedVideos[1].title).toBe('KNIGHTS OF GUINEVERE - Pilot');
			expect(relatedVideos[2].title).toBe('MURDER DRONES - Cabin Fever');
		});

		it('should handle empty related videos', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => []
			});

			const relatedStreams = await getRelatedStreams('test-id', mockFetch);
			const relatedVideos = adaptRelatedVideos(
				relatedStreams,
				'default-thumb.jpg',
				'default-avatar.jpg'
			);

			expect(relatedVideos).toEqual([]);
		});

		it('should handle negative counts in related videos', async () => {
			const mockRelatedVideos: RelatedItemResponse[] = [relatedVideosFixture[3]];

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockRelatedVideos
			});

			const relatedStreams = await getRelatedStreams('test-id', mockFetch);
			const relatedVideos = adaptRelatedVideos(
				relatedStreams,
				'default-thumb.jpg',
				'default-avatar.jpg'
			);

			expect(relatedVideos[0].viewCount).toBe(0);
			expect(relatedVideos[0].duration).toBe(0);
		});
	});

	describe('Route Load Function Integration', () => {
		it('should load complete video page data through full pipeline', async () => {
			const mockThumbnails: Thumbnail[] = thumbnailsResponseFixture;
			const mockDetails: Details = detailsResponseFixture[0];
			const mockRelatedVideos: RelatedItemResponse[] = relatedVideosFixture;

			const mockFetch = vi
				.fn()
				.mockResolvedValueOnce({ ok: true, json: async () => mockThumbnails })
				.mockResolvedValueOnce({ ok: true, json: async () => mockDetails })
				.mockResolvedValueOnce({ ok: true, text: async () => createMockManifestXml('PT1H2M3S') })
				.mockResolvedValueOnce({ ok: true, json: async () => mockRelatedVideos });

			const result = await load({
				params: { id: 'test-video-id' },
				fetch: mockFetch,
				url: new URL('https://opentube.com/video/test-video-123'),
				route: { id: '/video/[id]' },
				data: {}
			} as never) as VideoPageData;

			// Verify all API calls were made
			expect(mockFetch).toHaveBeenCalledTimes(5);
			expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/streams/thumbnails?id=test-video-id'));
			expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/streams/details?id=test-video-id'));
			expect(mockFetch).toHaveBeenNthCalledWith(3, expect.stringContaining('/streams/dash?id=test-video-id'));
			expect(mockFetch).toHaveBeenNthCalledWith(4, expect.stringContaining('/streams/related?id=test-video-id'));
			expect(mockFetch).toHaveBeenNthCalledWith(5, expect.stringContaining('/comments?id=test-video-id'));

			// Verify player config
			expect(result.playerConfig.manifestUrl).toBe('blob:mock-manifest-url');
			expect(result.playerConfig.duration).toBe(3723); // 10 minutes
			expect(result.playerConfig.poster).toBe('https://i.ytimg.com/vi/pilot-id/xl.jpg');

			// Verify metadata
			expect(result.metadata.title).toBe('MURDER DRONES - Pilot');
			expect(result.metadata.channelName).toBe('GLITCH');
			expect(result.metadata.viewCount).toBe(10000);

			// Verify related videos
			expect(result.relatedVideos).toHaveLength(4);
			expect(result.relatedVideos[0].title).toBe('MURDER DRONES - Heartbeat');

			// Verify no error
			expect(result.error).toBeUndefined();
		});

		it('should handle video not found (404)', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			const result = await load({
				params: { id: 'nonexistent-video' },
				fetch: mockFetch,
				url: new URL('https://example.com/video/nonexistent-video'),
				route: { id: '/video/[id]' },
				data: {}
			} as never) as VideoPageData;

			expect(result.metadata.title).toBe('Error Loading Video');
			expect(result.error).toContain('Failed to fetch');
			expect(result.playerConfig.manifestUrl).toBe('');
			expect(result.relatedVideos).toEqual([]);
		});

		it('should handle network errors gracefully', async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));

			const result = await load({
				params: { id: 'test-id' },
				fetch: mockFetch,
				url: new URL('https://example.com/video/test-id'),
				route: { id: '/video/[id]' },
				data: {}
			} as never) as VideoPageData;

			expect(result.metadata.title).toBe('Error Loading Video');
			expect(result.error).toBe('Network connection failed');
		});

		it('should continue loading even if related videos fail', async () => {
			const mockThumbnails: Thumbnail[] = thumbnailsResponseFixture;
			const mockDetails: Details = detailsResponseFixture[0];
			const mockManifestXml = manifestXmlFixture
				.replace('STANDARD_DURATION', 'duration="PT1H2M3S"')
			;
			console.log('mockManifestXml: ', mockManifestXml);

			const mockFetch = vi
				.fn()
				.mockResolvedValueOnce({ ok: true, json: async () => mockThumbnails })
				.mockResolvedValueOnce({ ok: true, json: async () => mockDetails })
				.mockResolvedValueOnce({ ok: true, text: async () => mockManifestXml })
				.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' });

			const result = await load({
				params: { id: 'test-id' },
				fetch: mockFetch,
				url: new URL('https://example.com/video/test-id'),
				route: { id: '/video/[id]' },
				data: {}
			} as never) as VideoPageData;

			// Video should still load successfully
			expect(result.metadata.title).toBe('MURDER DRONES - Pilot');
			expect(result.playerConfig.manifestUrl).toBe('blob:mock-manifest-url');
			// Related videos should be empty but not cause error
			expect(result.relatedVideos).toEqual([]);
			expect(result.error).toBeUndefined();
		});
	});
});

