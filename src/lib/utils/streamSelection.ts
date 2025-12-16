/**
 * Extracts video ID from YouTube URL
 * Handles variou YouTube URL formats
 */
export function extractVideoIdFromUrl(url: string): string {
	if (!url) return '';
	try {
		const urlObj = new URL(url);

		const vParam = urlObj.searchParams.get('v');
		if (vParam) {
			return vParam;
		}

		const pathParts = urlObj.pathname.split('/').filter(Boolean);
		if (pathParts.length > 0) {
			return pathParts[pathParts.length - 1];
		}

		return '';
	} catch {
		const patterns = [
			/[?&]v=([^&]+)/,           // ?v=ID or &v=ID
			/youtu\.be\/([^?&]+)/,     // youtu.be/ID
			/embed\/([^?&]+)/,         // embed/ID
			/\/watch\/([^?&]+)/        // /watch/ID
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match && match[1]) {
				return match[1];
			}
		}
		
		return '';
	}
}

