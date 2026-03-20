import type { PageLoad } from '../../$types';
import {
	getChannelInfo,
	getChannelVideos
} from '$lib/api/channel';
import {
	adaptChannelInfo,
	adaptChannelVideos
} from '$lib/adapters/channel';
import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
import type { ChannelPageData } from '../../types';
import type {
	ChannelConfig,
	ChannelVideoConfig
} from '$lib/adapters/types';

/**
 * Creates error page data with safe defaults
 */
function createErrorPageData(error: unknown): ChannelPageData {
	const errorMessage = error instanceof Error ? error.message : 'Unknown error loading channel';

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

/**
 * Page load function - fetches channel info and videos in parallel
 */
export const load: PageLoad = async ({ params, fetch }): Promise<ChannelPageData> => {
	try {
		const channelId: string = params.channelId;

		const [info, videosResponse] = await Promise.all([
			getChannelInfo(channelId, fetch),
			getChannelVideos(channelId, fetch).catch((error) => {
				console.warn('Failed to fetch channel videos:', error);
				return null;
			})
		]);

		const videos: ChannelVideoConfig[] = adaptChannelVideos(videosResponse, thumbnailPlaceholder, logoPlaceholder);

		const channel: ChannelConfig = adaptChannelInfo(info);

		return {
			channel,
			videos
		};
	} catch (error) {
		console.error('Error loading channel data:', error);
		return createErrorPageData(error);
	}
};
