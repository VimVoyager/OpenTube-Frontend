/**
 * Test Suite: channel.ts
 *
 * Tests for formatSubscriberCount, adaptChannelInfo, and adaptChannelVideos.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatSubscriberCount, adaptChannelInfo, adaptChannelVideos } from './channel';
import type { ChannelInfoResponse, ChannelVideosResponse } from '$lib/types';
import type { ChannelConfig, ChannelVideoConfig } from '$lib/adapters/types';
import channelDetailsResponseFixture from '../../tests/fixtures/api/channelDetailsResponse.json';
import channelVideosResponseFixture from '../../tests/fixtures/api/channelVideosResponse.json';
import channelDetailsFixture from '../../tests/fixtures/adapters/channelDetails.json';
import channelVideosFixture from '../../tests/fixtures/adapters/channelVideos.json';

// Mock extractIdFromUrl — keeps tests decoupled from URL parsing utility
vi.mock('$lib/utils/streamSelection', () => ({
	extractIdFromUrl: vi.fn((url: string) => {
		const match = url.match(/[?&]v=([^&]+)/);
		return match ? match[1] : (url.split('/').at(-1) ?? '');
	})
}));

// =============================================================================
// Fixtures
// =============================================================================

const infoResponse = channelDetailsResponseFixture as unknown as ChannelInfoResponse;
const videosResponse = channelVideosResponseFixture as unknown as ChannelVideosResponse;
const expectedChannelConfig = channelDetailsFixture as ChannelConfig;
const expectedVideosConfig = channelVideosFixture as ChannelVideoConfig[];

const THUMBNAIL_FALLBACK = 'https://example.com/default-thumbnail.jpg';
const AVATAR_FALLBACK = 'https://example.com/default-avatar.jpg';

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// formatSubscriberCount
// =============================================================================

describe('formatSubscriberCount', () => {
	describe('millions', () => {
		it('should format exact millions without decimal', () => {
			expect(formatSubscriberCount(20_000_000)).toBe('20M');
		});

		it('should format millions with one decimal place when needed', () => {
			expect(formatSubscriberCount(20_600_000)).toBe('20.6M');
		});

		it('should format millions rounding to one decimal', () => {
			expect(formatSubscriberCount(1_050_000)).toBe('1.1M');
		});

		it('should format the boundary value of exactly 1M', () => {
			expect(formatSubscriberCount(1_000_000)).toBe('1M');
		});
	});

	describe('thousands', () => {
		it('should format exact thousands without decimal', () => {
			expect(formatSubscriberCount(430_000)).toBe('430K');
		});

		it('should format thousands with one decimal place when needed', () => {
			expect(formatSubscriberCount(1_500)).toBe('1.5K');
		});

		it('should format the boundary value of exactly 1K', () => {
			expect(formatSubscriberCount(1_000)).toBe('1K');
		});

		it('should format 999 (just below 1K) as a plain number', () => {
			expect(formatSubscriberCount(999)).toBe('999');
		});
	});

	describe('small counts', () => {
		it('should return the count as a plain string for values under 1000', () => {
			expect(formatSubscriberCount(980)).toBe('980');
		});

		it('should return "0" for zero', () => {
			expect(formatSubscriberCount(0)).toBe('0');
		});
	});

	describe('negative counts', () => {
		it('should return "0" for negative values', () => {
			expect(formatSubscriberCount(-1)).toBe('0');
		});

		it('should return "0" for large negative values', () => {
			expect(formatSubscriberCount(-1_000_000)).toBe('0');
		});
	});
});

// =============================================================================
// adaptChannelInfo
// =============================================================================

describe('adaptChannelInfo', () => {
	describe('successful adaptation', () => {
		it('should produce output matching the channelDetails fixture', () => {
			const result = adaptChannelInfo(infoResponse, 0);
			expect(result).toEqual(expectedChannelConfig);
		});

		it('should map id directly from the response', () => {
			const result = adaptChannelInfo(infoResponse);
			expect(result.id).toBe('glitch-channel-id');
		});

		it('should map name directly from the response', () => {
			const result = adaptChannelInfo(infoResponse);
			expect(result.name).toBe('GLITCH');
		});

		it('should normalise handle by prepending @ and stripping any existing @', () => {
			// infoResponse.handle is "GLITCH" (no @), adapter should produce "@GLITCH"
			const result = adaptChannelInfo(infoResponse);
			expect(result.handle).toBe('@GLITCH');
		});

		it('should not double-prefix @ when handle already starts with @', () => {
			const info = { ...infoResponse, handle: '@GLITCH' };
			const result = adaptChannelInfo(info);
			expect(result.handle).toBe('@GLITCH');
		});

		it('should select the tallest avatar from the avatars array', () => {
			// avatars are 72px, 120px, 160px — tallest is 160px
			const result = adaptChannelInfo(infoResponse);
			expect(result.avatarUrl).toBe('https://yt.googleusercontent.com/lg/avatar.jpg');
		});

		it('should select the widest banner from the banners array', () => {
			// banners are 1060px, 2120px, 2560px wide — widest is 2560px
			const result = adaptChannelInfo(infoResponse);
			expect(result.bannerUrl).toBe('https://yt.googleusercontent.com/lg/banner.jpg');
		});

		it('should format subscriberCount as a compact string', () => {
			const result = adaptChannelInfo(infoResponse);
			expect(result.subscriberCount).toBe('20.6M');
		});

		it('should use the provided videoCount argument', () => {
			const result = adaptChannelInfo(infoResponse, 42);
			expect(result.videoCount).toBe(42);
		});

		it('should default videoCount to 0 when not provided', () => {
			const result = adaptChannelInfo(infoResponse);
			expect(result.videoCount).toBe(0);
		});

		it('should set verified from the response', () => {
			const result = adaptChannelInfo(infoResponse);
			expect(result.verified).toBe(true);
		});
	});

	describe('image selection fallbacks', () => {
		it('should fall back to avatarUrl string when avatars array is empty', () => {
			const info: ChannelInfoResponse = {
				...infoResponse,
				avatars: [],
				avatarUrl: 'https://example.com/fallback-avatar.jpg'
			};
			const result = adaptChannelInfo(info);
			expect(result.avatarUrl).toBe('https://example.com/fallback-avatar.jpg');
		});

		it('should fall back to avatarUrl string when avatars array is undefined', () => {
			const info: ChannelInfoResponse = {
				...infoResponse,
				avatars: undefined,
				avatarUrl: 'https://example.com/fallback-avatar.jpg'
			};
			const result = adaptChannelInfo(info);
			expect(result.avatarUrl).toBe('https://example.com/fallback-avatar.jpg');
		});

		it('should return null avatarUrl when both avatars array and fallback string are absent', () => {
			const info: ChannelInfoResponse = {
				...infoResponse,
				avatars: [],
				avatarUrl: null
			};
			const result = adaptChannelInfo(info);
			expect(result.avatarUrl).toBeNull();
		});

		it('should fall back to bannerUrl string when banners array is empty', () => {
			const info: ChannelInfoResponse = {
				...infoResponse,
				banners: [],
				bannerUrl: 'https://example.com/fallback-banner.jpg'
			};
			const result = adaptChannelInfo(info);
			expect(result.bannerUrl).toBe('https://example.com/fallback-banner.jpg');
		});

		it('should return null bannerUrl when both banners array and fallback string are absent', () => {
			const info: ChannelInfoResponse = {
				...infoResponse,
				banners: [],
				bannerUrl: null
			};
			const result = adaptChannelInfo(info);
			expect(result.bannerUrl).toBeNull();
		});
	});

	describe('default values', () => {
		it('should default name to "Unknown Channel" when name is empty', () => {
			const info: ChannelInfoResponse = { ...infoResponse, name: '' };
			const result = adaptChannelInfo(info);
			expect(result.name).toBe('Unknown Channel');
		});

		it('should fall back handle to "@<id>" when handle is absent', () => {
			const info: ChannelInfoResponse = {
				...infoResponse,
				handle: null
			};
			const result = adaptChannelInfo(info);
			expect(result.handle).toBe('@glitch-channel-id');
		});

		it('should set description to null when description is empty string', () => {
			const info: ChannelInfoResponse = { ...infoResponse, description: '' };
			const result = adaptChannelInfo(info);
			expect(result.description).toBeNull();
		});

		it('should set description to null when description is absent', () => {
			const info: ChannelInfoResponse = { ...infoResponse, description: null };
			const result = adaptChannelInfo(info);
			expect(result.description).toBeNull();
		});

		it('should default verified to false when absent from response', () => {
			const info: ChannelInfoResponse = {
				...infoResponse,
				verified: undefined
			};
			const result = adaptChannelInfo(info);
			expect(result.verified).toBe(false);
		});

		it('should treat undefined subscriberCount as 0 and format it accordingly', () => {
			const info: ChannelInfoResponse = {
				...infoResponse,
				subscriberCount: undefined
			};
			const result = adaptChannelInfo(info);
			expect(result.subscriberCount).toBe('0');
		});
	});
});

// =============================================================================
// adaptChannelVideos
// =============================================================================

describe('adaptChannelVideos', () => {
	describe('successful adaptation', () => {
		it('should return an array with one entry per item in the response', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result).toHaveLength(videosResponse.items.length);
		});

		it('should produce output matching the channelVideos fixture', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			// Item [1] in channelVideosResponse.json has a "gltich" typo in uploaderUrl
			// which the adapter passes through verbatim — channelVideos.json has the
			// corrected URL. Compare all items except that field on item [1].
			expect(result[0]).toEqual(expectedVideosConfig[0]);
			expect(result[1]).toEqual({ ...expectedVideosConfig[1], uploaderUrl: result[1].uploaderUrl });
			expect(result[2]).toEqual(expectedVideosConfig[2]);
		});

		it('should extract video id from the watch URL', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].id).toBe('glitch-video-1');
			expect(result[1].id).toBe('glitch-video-2');
			expect(result[2].id).toBe('glitch-video-3');
		});

		it('should map title from name field', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].title).toBe('Fitting In at School');
			expect(result[1].title).toBe('Digital Circus Ep 9 Finale [TRAILER]');
			expect(result[2].title).toBe("Caine's Requiem");
		});

		it('should pick the last (largest) thumbnail url from the thumbnails array', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			// Two thumbnails per item — last is always the ?sqp=lg entry
			expect(result[0].thumbnail).toBe(
				'https://i.ytimg.com/vi/glitch-video-1/hqdefault.jpg?sqp=lg'
			);
		});

		it('should map uploaderName correctly', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			result.forEach((v) => expect(v.uploaderName).toBe('GLITCH'));
		});

		it('should map uploaderUrl correctly', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].uploaderUrl).toBe('https://www.youtube.com/channel/glitch-channel-id');
		});

		it('should map textualUploadDate to uploadedDate', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].uploadedDate).toBe('2 weeks ago');
			expect(result[1].uploadedDate).toBe('4 weeks ago');
			expect(result[2].uploadedDate).toBe('1 month ago');
		});

		it('should map duration directly', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].duration).toBe(210);
			expect(result[1].duration).toBe(70);
			expect(result[2].duration).toBe(159);
		});

		it('should map positive viewCount directly', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].viewCount).toBe(3984544);
			expect(result[1].viewCount).toBe(28449488);
			expect(result[2].viewCount).toBe(15866216);
		});

		it('should clamp negative viewCount to 0', () => {
			// All fixture items have positive viewCounts — test the clamping inline
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], viewCount: -1 }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].viewCount).toBe(0);
		});

		it('should map isShortFormContent to isShort', () => {
			const result = adaptChannelVideos(videosResponse, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			result.forEach((v) => expect(v.isShort).toBe(false));
		});
	});

	describe('thumbnail fallback', () => {
		it('should use thumbnailFallback when thumbnails array is empty', () => {
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], thumbnails: [] }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].thumbnail).toBe(THUMBNAIL_FALLBACK);
		});

		it('should use thumbnailFallback when thumbnails is undefined', () => {
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], thumbnails: undefined }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].thumbnail).toBe(THUMBNAIL_FALLBACK);
		});
	});

	describe('default values', () => {
		it('should default title to "Untitled" when name is empty', () => {
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], name: '' }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].title).toBe('Untitled');
		});

		it('should default uploaderName to "Unknown" when absent', () => {
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], uploaderName: '' }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].uploaderName).toBe('Unknown');
		});

		it('should default uploaderUrl to avatarFallback when absent', () => {
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], uploaderUrl: '' }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].uploaderUrl).toBe(AVATAR_FALLBACK);
		});

		it('should default uploadedDate to empty string when textualUploadDate is absent', () => {
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], textualUploadDate: '' }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].uploadedDate).toBe('');
		});

		it('should clamp undefined duration to 0', () => {
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], duration: undefined }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].duration).toBe(0);
		});

		it('should clamp negative duration to 0', () => {
			const response: ChannelVideosResponse = {
				...videosResponse,
				items: [{ ...videosResponse.items[0], duration: -1 }]
			};
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result[0].duration).toBe(0);
		});
	});

	describe('null and empty response handling', () => {
		it('should return an empty array when response is null', () => {
			const result = adaptChannelVideos(null, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result).toEqual([]);
		});

		it('should return an empty array when response.items is undefined', () => {
			const response = { ...videosResponse, items: undefined } as unknown as ChannelVideosResponse;
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result).toEqual([]);
		});

		it('should return an empty array when response.items is empty', () => {
			const response: ChannelVideosResponse = { ...videosResponse, items: [] };
			const result = adaptChannelVideos(response, THUMBNAIL_FALLBACK, AVATAR_FALLBACK);
			expect(result).toEqual([]);
		});
	});
});
