import { PUBLIC_API_URL } from '$env/static/public';
import type { KioskInfoResponse } from '$lib/api/types';

const API_BASE_URL: string = PUBLIC_API_URL;

/**
 * Fetch kiosk info for a specified kiosk ID
 */
export async function getKioskInfo(
	kioskId: string,
	fetchFn?: typeof globalThis.fetch
): Promise<KioskInfoResponse> {
	const fetcher: {
		(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
		(input: string | URL | Request, init?: RequestInit): Promise<Response>;
	} = fetchFn ?? globalThis.fetch;

	try {
		const res: Response = await fetcher(`${API_BASE_URL}/kiosks/${encodeURIComponent(kioskId)}`);

		if (!res.ok) {
			throw new Error(
				`Failed to fetch ${kioskId} kiosk info: ${res.status} ${res.statusText}`
			);
		}

		return await res.json();
	} catch (error) {
		console.error('Error fetching channel info:', error);
		throw error;
	}
}