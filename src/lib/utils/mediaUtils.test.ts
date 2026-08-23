/**
 * Test Suite: mediaUtils.ts
 *
 * Tests for media thumbnail and avatar selection utilities
 */
import { describe, it, expect } from 'vitest';
import { selectBestThumbnail, selectBestUploaderAvatar, selectBestAvatar } from './mediaUtils';
import type { Thumbnail, Avatar } from '$lib/types';

const t = (url: string, width = 100): Thumbnail =>
	({ url, width, height: Math.round((width * 9) / 16) }) as Thumbnail;
const a = (url: string): Avatar => ({ url, width: 100, height: 100 }) as Avatar;

describe('selectBestThumbnail (rule: index 1 → last → first → fallback)', () => {
	it.each([
		['ascending widths → widest', [t('a', 168), t('b', 246), t('c', 336)], 'c'],
		['descending widths → widest', [t('a', 336), t('b', 246), t('c', 168)], 'a'],
		['unordered widths → widest', [t('a', 246), t('b', 336), t('c', 168)], 'b'],
		['equal widths → first', [t('a', 200), t('b', 200), t('c', 200)], 'a'],
		['single element → that one', [t('only', 168)], 'only'],
		['widest url empty → fallback', [t('a', 168), t('', 336)], 'FB'],
		['empty array → fallback', [], 'FB'],
		['undefined → fallback', undefined as never, 'FB']
	])('%s', (_label, thumbs, expected) => {
		expect(selectBestThumbnail(thumbs, 'FB')).toBe(expected);
	});
});

describe('selectBestUploaderAvatar (rule: last → first → fallback)', () => {
	it.each([
		['three elements → last', [a('a'), a('b'), a('c')], 'c'],
		['single element → that one', [a('only')], 'only'],
		['last url empty → falls through to first', [a('a'), a('')], 'a'],
		['empty array → fallback', [], 'FB'],
		['undefined → fallback', undefined as never, 'FB']
	])('%s', (_label, avatars, expected) => {
		expect(selectBestUploaderAvatar(avatars, 'FB')).toBe(expected);
	});
});

describe('selectBestAvatar (rule: index 2 → first → fallback)', () => {
	it.each([
		['four elements → index 2', [a('a'), a('b'), a('c'), a('d')], 'c'],
		['fewer than three → first', [a('a'), a('b')], 'a'],
		['index-2 url empty → falls through to first', [a('a'), a('b'), a('')], 'a'],
		['empty array → fallback', [], 'FB'],
		['undefined → fallback', undefined as never, 'FB']
	])('%s', (_label, avatars, expected) => {
		expect(selectBestAvatar(avatars, 'FB')).toBe(expected);
	});
});
