import { env } from '$env/dynamic/public';

const API_BASE_URL = env.PUBLIC_API_URL + '/api/v1';

export async function getManifest(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<string> {
    const fetcher = fetchFn ?? globalThis.fetch;

    try {
        const res = await fetcher(
            `${API_BASE_URL}/streams/dash?id=${encodeURIComponent(id)}`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch DASH manifest for ${id}: ${res.status} ${res.statusText}`
            );
        }

        const manifestXml = await res.text();
        // console.log('Fetched DASH manifest:', manifestXml);
        const blob = new Blob([manifestXml], { type: 'application/dash+xml' });
        return URL.createObjectURL(blob);
        
    } catch (error) {
        console.error('Error fetching DASH manifest:', error);
        throw error;
    }
}