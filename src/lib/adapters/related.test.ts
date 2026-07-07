/**
 * Test Suite: related.ts
 *
 * Tests for related videos adaptation
 */

import { describe, it, expect } from 'vitest';
import { adaptRelatedVideos } from './related';
import { buildRelatedItem } from '../../tests/fixtures/builder';
import relatedVideosResponseFixture from '../../tests/fixtures/api/relatedVideosResponse.json';
import relatedVideosFixture from '../../tests/fixtures/adapters/relatedVideos.json';
import type { RelatedItemResponse } from '$lib/api/types';
import type { RelatedVideoConfig } from '$lib/adapters/types';

const defaultThumbnail = 'fallback-thumb.jpg';
const defaultAvatar = 'fallback-avatar.jpg';

const adapt = (items: RelatedItemResponse[] | undefined) =>
	adaptRelatedVideos(items, defaultThumbnail, defaultAvatar);

describe('adaptRelatedVideos', () => {
	it('adapts a single item with all fields mapped', () => {
		const result: RelatedVideoConfig[] = adapt([buildRelatedItem()]);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			id: 'video1',
			url: 'https://www.youtube.com/watch?v=video1',
			title: 'Test Video',
			thumbnail: 'https://example.com/v1.jpg',
			channelName: 'Test Channel',
			channelAvatar: 'https://example.com/avatar.jpg',
			viewCount: 1000,
			duration: 120,
			uploadDate: '2 weeks ago',
			channelId: 'UCtest456'
		});
	});

	it('matches the relatedVideos round-trip fixture (includes filtering the invalid row)', () => {
		const result = adapt(relatedVideosResponseFixture as RelatedItemResponse[]);
		expect(result).toEqual(relatedVideosFixture);
	});

	describe('invalid item filtering', () => {
		it.each([
			['missing url', buildRelatedItem({ url: '' })],
			['missing name', buildRelatedItem({ name: '' })]
		])('drops item with %s', (_label, invalidItem) => {
			const result = adapt([invalidItem, buildRelatedItem({ name: 'Survivor' })]);
			expect(result).toHaveLength(1);
			expect(result[0].title).toBe('Survivor');
		});
	});

	describe('fallbacks and clamping', () => {
		it.each([
			['empty uploaderName', { uploaderName: '' }, 'channelName', 'Unknown Channel'],
			['empty thumbnails', { thumbnails: [] }, 'thumbnail', defaultThumbnail],
			['missing thumbnails', { thumbnails: undefined }, 'thumbnail', defaultThumbnail],
			['empty avatars', { uploaderAvatars: [] }, 'channelAvatar', defaultAvatar],
			['missing avatars', { uploaderAvatars: undefined }, 'channelAvatar', defaultAvatar],
			['empty upload date', { textualUploadDate: '' }, 'uploadDate', ''],
			['negative viewCount', { viewCount: -1 }, 'viewCount', 0],
			['missing viewCount', { viewCount: undefined }, 'viewCount', 0],
			['negative duration', { duration: -1 }, 'duration', 0],
			['missing duration', { duration: undefined }, 'duration', 0],
			[
				'positive counts preserved',
				{ viewCount: 39_000_000, duration: 1049 },
				'viewCount',
				39_000_000
			]
		])('%s', (_label, override, field, expected) => {
			const [video] = adapt([buildRelatedItem(override as never)]);
			expect(video[field as keyof RelatedVideoConfig]).toBe(expected);
		});
	});

	it.each([
		['undefined', undefined],
		['empty array', []]
	])('returns [] for %s input', (_label, input) => {
		expect(adapt(input)).toEqual([]);
	});
});