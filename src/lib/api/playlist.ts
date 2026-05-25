import { PUBLIC_API_URL } from '$env/static/public';
import type { PlaylistResponse } from '$lib/api/types';

const API_BASE_URL: string = PUBLIC_API_URL;

export async function getPlaylist(
	playlistId: string,
	fetchFn?: typeof globalThis.fetch
): Promise<PlaylistResponse> {
	const fetcher: {
		(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
		(input: string | URL | Request, init?: RequestInit): Promise<Response>;
	} = fetchFn ?? globalThis.fetch;

	try {
		const res: Response = await fetcher(`${API_BASE_URL}/playlists?id=${encodeURIComponent(playlistId)}`);

		if (!res.ok) {
			throw new Error(
				`Failed to fetch playlist ${playlistId}: ${res.status} ${res.statusText}`
			);
		}
		return await res.json();
	} catch (error) {
		console.error('Error fetching channel videos:', error);
		throw error;
	}
}