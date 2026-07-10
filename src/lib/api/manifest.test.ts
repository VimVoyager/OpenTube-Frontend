/**
 * Test Suite: manifest.ts
 *
 * Tests for DASH manifest fetching including XML parsing, duration extraction,
 * blob URL generation, error handling, and backward compatibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getManifest, getManifestUrl } from './manifest';
import {
	createSuccessfulFetch,
	createFailedFetch,
	createNetworkErrorFetch
} from '../../tests/helpers/apiHelpers';
import manifestXmlFixture from '../../tests/fixtures/api/manifestXmlFixture.xml?raw';

const createMockManifestXml = (duration: string = 'PT2M56S'): string =>
	manifestXmlFixture
		.replace('STANDARD_DURATION', `duration="${duration}"`)
		.replace('MEDIA_PRESENTATION_DURATION', `mediaPresentationDuration="${duration}"`);

const createManifestXmlWithoutDuration = (): string =>
	manifestXmlFixture.replace('STANDARD_DURATION', '').replace('MEDIA_PRESENTATION_DURATION', '');

const createMuxedFetch = (directUrl: string) =>
	vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		statusText: 'OK',
		headers: new Headers({ 'X-Stream-Type': 'muxed-progressive' }),
		text: vi.fn().mockResolvedValue(directUrl)
	}) as unknown as typeof globalThis.fetch;

beforeEach(() => {
	global.URL.createObjectURL = vi.fn(() => `blob:http://localhost/${Math.random()}`);
	global.URL.revokeObjectURL = vi.fn();
});

describe('getManifest', () => {
	it('returns a blob URL, parsed duration, and video id for a DASH manifest', async () => {
		const mockFetch = createSuccessfulFetch(createMockManifestXml('PT2M56S'), { format: 'xml' });
		vi.spyOn(console, 'log').mockImplementation(() => {});

		const result = await getManifest('video-id', mockFetch as never);

		expect(result.url).toMatch(/^blob:/);
		expect(result.duration).toBe(176);
		expect(result.videoId).toBe('0'); // AdaptationSet id in the fixture
		expect(result.isMuxed).toBeUndefined();

		// blob created once, with the DASH mime type
		const createObjectURL = vi.mocked(URL.createObjectURL);
		expect(createObjectURL).toHaveBeenCalledTimes(1);
		expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe('application/dash+xml');
	});

	it('falls back to a direct URL for muxed-progressive streams (X-Stream-Type header)', async () => {
		const directUrl = 'https://rr3---sn-test.googlevideo.com/videoplayback?id=123';
		vi.spyOn(console, 'log').mockImplementation(() => {});

		const result = await getManifest('video-id', createMuxedFetch(directUrl));

		expect(result).toEqual({
			url: directUrl,
			duration: 0,
			isMuxed: true
		});
		expect(URL.createObjectURL).not.toHaveBeenCalled();
	});

	it('defaults duration to 0 when mediaPresentationDuration is absent', async () => {
		const mockFetch = createSuccessfulFetch(createManifestXmlWithoutDuration(), { format: 'xml' });
		vi.spyOn(console, 'log').mockImplementation(() => {});

		const result = await getManifest('video-id', mockFetch as never);

		expect(result.duration).toBe(0);
		expect(result.url).toMatch(/^blob:/);
	});

	it('uses global fetch when none is injected', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		global.fetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' }) as never;

		const result = await getManifest('video-id');

		expect(result.url).toMatch(/^blob:/);
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it.each([
		[404, 'Not Found'],
		[503, 'Service Unavailable']
	])('throws with id, status and statusText on HTTP %i', async (status, statusText) => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const mockFetch = createFailedFetch(status, statusText);

		await expect(getManifest('bad-id', mockFetch)).rejects.toThrow(
			new RegExp(`bad-id[\\s\\S]*${status}[\\s\\S]*${statusText}`)
		);
	});

	it('propagates network errors', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(
			getManifest('video-id', createNetworkErrorFetch('Failed to fetch'))
		).rejects.toThrow('Failed to fetch');
	});
});

describe('getManifestUrl (legacy wrapper)', () => {
	it('delegates to getManifest and returns just the URL', async () => {
		const mockFetch = createSuccessfulFetch(createMockManifestXml(), { format: 'xml' });
		vi.spyOn(console, 'log').mockImplementation(() => {});

		const url = await getManifestUrl('video-id', mockFetch as never);

		expect(url).toMatch(/^blob:/);
	});
});
