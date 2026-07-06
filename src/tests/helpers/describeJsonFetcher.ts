import { describe, it, expect, vi } from 'vitest';
import {
	createSuccessfulFetch, createFailedFetch, createNetworkErrorFetch, extractQueryParams
} from './apiHelpers';

interface JsonFetcherSpec<T, R = T> {
	name: string;
	call: (id: string, fetchFn?: typeof fetch) => Promise<R>;
	endpoint: string;
	idParam?: string;
	fixture: T;
	expected?: R;
}

export function describeJsonFetcher<T>(spec: JsonFetcherSpec<T>): void {
	const idParam: string = spec.idParam ?? 'id';
	const expected = (spec.expected ?? spec.fixture) as R;

	describe(`${spec.name} (fetcher contract)`, (): void => {
		it('calls the endpoint once with the URL-encoded id', async (): Promise<void> => {
			const id = 'abc 123&x=y';
			const fetchFn: {
				(input: (RequestInfo | URL), init?: RequestInit): Promise<Response>
				(input: (string | URL | Request), init?: RequestInit): Promise<Response>
			} = createSuccessfulFetch(spec.fixture);
			await spec.call(id, fetchFn as never);
			expect(fetchFn).toHaveBeenCalledTimes(1);
			const url: string = fetchFn.mock.calls[0][0] as string;
			expect(url).toContain(spec.endpoint);
			expect(extractQueryParams(url)[idParam]).toBe(id);
		});

		it('returns the parsed JSON body unmodified', async (): Promise<void> => {
			const fetchFn: {
				(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
				(input: string | URL | Request, init?: RequestInit): Promise<Response>;
			} = createSuccessfulFetch(spec.fixture);
			await expect(spec.call('id1', fetchFn as never)).resolves.toEqual(expected);
		});

		it('uses global fetch when none is injected', async (): Promise<void> => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true, status: 200, statusText: 'OK',
				json: vi.fn().mockResolvedValue(spec.fixture)
			}) as never;
			await expect(spec.call('id1')).resolves.toEqual(expected);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it.each([
			[404, 'Not Found'],
			[503, 'Service Unavailable']
		])('throws with id, status and statusText on HTTP %i', async (status: number, statusText: string): Promise<void> => {
			vi.spyOn(console, 'error').mockImplementation((): void => {});
			await expect(spec.call('bad-id', createFailedFetch(status, statusText)))
				.rejects.toThrow(new RegExp(`bad-id[\\s\\S]*${status}[\\s\\S]*${statusText}`));
		});

		it('propagates network errors', async (): Promise<void> => {
			vi.spyOn(console, 'error').mockImplementation((): void => {});
			await expect(spec.call('id1', createNetworkErrorFetch('Failed to fetch')))
				.rejects.toThrow('Failed to fetch');
		});
	});
}
