import { PUBLIC_API_URL } from '$env/static/public';
import { DOMParser } from '@xmldom/xmldom';

const API_BASE_URL = PUBLIC_API_URL;


/**
 * Manifest response containing both blob URL and parsed metadata
 */
export interface ManifestResponse {
	url: string;
	duration: number;
	videoId?: string;
}

/**
 * Parse ISO 8601 duration format (PT2M56S) to seconds
 */
function parseDuration(duration: string): number {
	const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
	if (!match) return 0;
	
	const hours = parseInt(match[1] || '0');
	const minutes = parseInt(match[2] || '0');
	const seconds = parseFloat(match[3] || '0');
	
	return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch DASH manifest and extract metadata
 * Returns blob URL for player and parsed duration
 */
export async function getManifest(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<ManifestResponse> {
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
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(manifestXml, 'text/xml');
        const mpdElement = xmlDoc.getElementsByTagNameNS('urn:mpeg:dash:schema:mpd:2011', 'MPD')[0];
        
        const durationStr = mpdElement?.getAttribute('mediaPresentationDuration');
        const duration = durationStr ? parseDuration(durationStr) : 0;

				const adaptationSet = xmlDoc.getElementsByTagNameNS('urn:mpeg:dash:schema:mpd:2011', 'AdaptationSet')[0];
        const videoId = adaptationSet?.getAttribute('id');
        
        const blob = new Blob([manifestXml], { type: 'application/dash+xml' });
        const url = URL.createObjectURL(blob);
        
        console.log(`Manifest loaded for ${id}: duration=${duration}s, videoId=${videoId || 'not set'}`);
        
        return {
            url,
            duration,
            videoId: videoId || undefined
        };
        
    } catch (error) {
        console.error('Error fetching DASH manifest:', error);
        throw error;
    }
}

/**
 * Legacy function for backward compatibility
 * Returns just the URL (for code that hasn't been updated yet)
 */
export async function getManifestUrl(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<string> {
    const manifest = await getManifest(id, fetchFn);
    return manifest.url;
}