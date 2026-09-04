import { getChannelInfo, getChannelVideos } from '$lib/api/channel';
import { adaptChannelInfo, adaptChannelVideos } from '$lib/adapters/channel';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
import type { ChannelPageData } from '../../routes/channel/[channelId]/+page';

/**
 * Creates error page data with safe defaults
 */
function createErrorPageData(error: unknown): ChannelPageData {
	const errorMessage: string =
		error instanceof Error ? error.message : 'Unknown error loading channel';

	return {
		channel: {
			id: '',
			name: 'Error Loading Channel',
			handle: '',
			avatarUrl: null,
			bannerUrl: null,
			description: null,
			subscriberCount: '0',
			videoCount: 0,
			verified: false
		},
		videos: [],
		error: errorMessage
	};
}

export async function loadChannelData(
	channelId: string,
	fetch: typeof globalThis.fetch
): Promise<ChannelPageData> {
	try {
		const [info, videosResponse] = await Promise.all([
			getChannelInfo(channelId, fetch),
			getChannelVideos(channelId, fetch).catch((error) => {
				console.warn('Failed to fetch channel videos:', error);
				return null;
			})
		]);

		const videos = adaptChannelVideos(videosResponse, thumbnailPlaceholder, logoPlaceholder);
		const channel = adaptChannelInfo(info);

		return { channel, videos };
	} catch (error) {
		console.error('Error loading channel data:', error);
		return createErrorPageData(error);
	}
}
