import { PUBLIC_API_URL } from '$env/static/public';
import { DOMParser } from '@xmldom/xmldom';
import type { ManifestResponse } from '$lib/api/types';

const API_BASE_URL: string = PUBLIC_API_URL;

/**
 * Parse ISO 8601 duration format (PT2M56S) to seconds
 */
function parseDuration(duration: string): number {
	const match: RegExpMatchArray | null = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
	if (!match) return 0;
	
	const hours: number = parseInt(match[1] || '0');
	const minutes: number = parseInt(match[2] || '0');
	const seconds: number = parseFloat(match[3] || '0');
	
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
    const fetcher: {
			(input: (RequestInfo | URL), init?: RequestInit): Promise<Response>
			(input: (string | URL | Request), init?: RequestInit): Promise<Response>
		} = fetchFn ?? globalThis.fetch;

    try {
        const res: Response = await fetcher(
            `${API_BASE_URL}/streams/dash?id=${encodeURIComponent(id)}`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch DASH manifest for ${id}: ${res.status} ${res.statusText}`
            );
        }

				// Muxed progressive fallback
				const streamType: string = res.headers.get('X-Stream-Type') as string;
				if (streamType === 'muxed-progressive') {
					const directUrl = await res.text();
					console.log(`Muxed progressive fallback for ${id}`);
					return {
						url: directUrl,
						duration: 0,
						isMuxed: true
					};
				}


        const manifestXml: string = await res.text();
        
        const parser = new DOMParser();
        const xmlDoc: Document = parser.parseFromString(manifestXml, 'text/xml');
        const mpdElement: Element = xmlDoc.getElementsByTagNameNS('urn:mpeg:dash:schema:mpd:2011', 'MPD')[0];
        
        const durationStr: string | null = mpdElement?.getAttribute('mediaPresentationDuration');
        const duration: number = durationStr ? parseDuration(durationStr) : 0;

				const adaptationSet: Element = xmlDoc.getElementsByTagNameNS('urn:mpeg:dash:schema:mpd:2011', 'AdaptationSet')[0];
        const videoId: string | null = adaptationSet?.getAttribute('id');
        
        const blob = new Blob([manifestXml], { type: 'application/dash+xml' });
        const url: string = URL.createObjectURL(blob);
        
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
    const manifest: ManifestResponse = await getManifest(id, fetchFn);
    return manifest.url;
}