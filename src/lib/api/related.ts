import type { RelatedItem } from "$lib/types";
import { PUBLIC_API_URL } from '$env/static/public';

const API_BASE_URL = PUBLIC_API_URL;

/**
 * Fetch related video streams for a given video ID
 */
export async function getRelatedStreams(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<RelatedItem[]> {
    const fetcher = fetchFn ?? globalThis.fetch;

    try {
        const res = await fetcher(
            `${API_BASE_URL}/streams/related?id=${encodeURIComponent(id)}`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch related streams for ${id}: ${res.status} ${res.statusText}`
            );
        }

        const data = await res.json();

        // Validate data exists first
        if (!data) {
            throw new Error('Unexpected response format for related streams');
        }

        // Handle different response formats
        if (Array.isArray(data)) {
            return data as RelatedItem[];
        } else if (data.streams && Array.isArray(data.streams)) {
            return data.streams as RelatedItem[];
        } else {
            throw new Error('Unexpected response format for related streams');
        }
    } catch (error) {
        console.error('Error fetching related streams:', error);
        throw error;
    }
}

