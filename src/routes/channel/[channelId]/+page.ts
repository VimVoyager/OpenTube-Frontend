import type { PageLoad } from '../../$types';
import { loadChannelData } from '$lib/loaders/channel';

/**
 * Page load function - fetches channel info and videos in parallel :LoadEvent<RouteParams, null, {} '/'>
 */
export const load: PageLoad = async ({ params, fetch }) =>
	loadChannelData((params as Record<string, string>).channelId, fetch);
