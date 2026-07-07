import { describe, it, expect } from 'vitest';
import { extractIdFromUrl } from './streamSelection';

describe('extractIdFromUrl', () => {
	it.each([
		['watch ?v= URL', 'https://www.youtube.com/watch?v=abc123', 'abc123'],
		['playlist ?list= URL', 'https://www.youtube.com/playlist?list=PLxyz', 'PLxyz'],
		['v param beats list param', 'https://www.youtube.com/watch?v=abc&list=PLx', 'abc'],
		['channel path URL', 'https://www.youtube.com/channel/UCtest456', 'UCtest456'],
		['path-style watch URL', 'https://www.youtube.com/watch/video1', 'video1'],
		['trailing slash ignored', 'https://www.youtube.com/channel/UCx/', 'UCx'],
		['valid URL with empty path', 'https://example.com/', ''],
		['empty string', '', ''],
		['protocol-less v param', 'watch?v=abc123', 'abc123'],
		['protocol-less youtu.be', 'youtu.be/abc123', 'abc123'],
		['protocol-less embed', 'embed/abc123', 'abc123'],
		['nothing matches', 'complete garbage', '']
	])('%s → %j', (_label, url, expected) => {
		expect(extractIdFromUrl(url)).toBe(expected);
	});
});
