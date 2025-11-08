import type { Subtitle } from "$lib/types";
import { env } from '$env/dynamic/public';

const API_BASE_URL = env.PUBLIC_API_URL + '/api/v1';

/**
 * Fetch subtitles for a given video ID
 */
export async function getSubtitles(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<Subtitle[]> {
    const fetcher = fetchFn ?? globalThis.fetch;

    try {
        const res = await fetcher(
            `${API_BASE_URL}/streams/subtitles?id=${encodeURIComponent(id)}`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch subtitles for ${id}: ${res.status} ${res.statusText}`
            );
        }

        const data = await res.json();

        // Handle different response formats
        if (Array.isArray(data)) {
            return data as Subtitle[];
        } else if (data.subtitles && Array.isArray(data.subtitles)) {
            return data.subtitles as Subtitle[];
        } else {
            throw new Error('Unexpected response format for subtitles');
        }
    } catch (error) {
        console.error('Error fetching subtitles:', error);
        throw error;
    }
}