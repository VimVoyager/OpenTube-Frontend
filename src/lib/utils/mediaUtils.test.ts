/**
 * Test Suite: mediaUtils.ts
 *
 * Tests for media thumbnail and avatar selection utilities
 */
import { describe, it, expect } from 'vitest';
import { selectBestThumbnail, selectBestUploaderAvatar, selectBestAvatar } from './mediaUtils';
import type { Thumbnail, Avatar } from '$lib/types';

const t = (url: string): Thumbnail => ({ url, width: 100, height: 100 }) as Thumbnail;
const a = (url: string): Avatar => ({ url, width: 100, height: 100 }) as Avatar;

describe('selectBestThumbnail (rule: index 1 → last → first → fallback)', () => {
	it.each([
		['three elements → index 1', [t('a'), t('b'), t('c')], 'b'],
		['two elements → index 1', [t('a'), t('b')], 'b'],
		['single element → that one', [t('only')], 'only'],
		['index-1 url empty → falls through to last', [t('a'), t(''), t('c')], 'c'],
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
