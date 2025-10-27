import type { Details } from "$lib/types";
import { env } from '$env/dynamic/public';

const API_BASE_URL = env.PUBLIC_API_URL + '/api/v1';

/**
 * Fetch video details for a given video ID
 */
export async function getVideoDetails(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<Details[]> {
    const fetcher = fetchFn ?? globalThis.fetch;

    try {
        const res = await fetcher(
            `${API_BASE_URL}/streams/details?id=${encodeURIComponent(id)}`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch video details for ${id}: ${res.status} ${res.statusText}`
            );
        }

        const data = await res.json();
        return data;
        
    } catch (error) {
        console.error('Error fetching video details:', error);
        throw error;
    }
}