import type { CommentResponse } from './types';
import { PUBLIC_API_URL } from '$env/static/public';

const API_BASE_URL = PUBLIC_API_URL;

/**
 * Fetch comments for a given video ID
 */
export async function getVideoComments(
	id: string,
	fetchFn?: typeof globalThis.fetch
): Promise<CommentResponse | null> {
	const fetcher = fetchFn ?? globalThis.fetch;

	try {
		const res = await fetcher(`${API_BASE_URL}/comments?id=${encodeURIComponent(id)}`);

		if (!res.ok) {
			throw new Error(`Failed to fetch comments for ${id}: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		console.log(data)

		return data;
	} catch (error) {
		console.error('Error fetching video comments:', error);
		throw error;
	}
}
