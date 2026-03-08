import { PUBLIC_API_URL } from '$env/static/public';
import type { ChannelInfoResponse, ChannelVideosResponse } from '$lib/types';

const API_BASE_URL = PUBLIC_API_URL;

/**
 * Fetch channel info (banner, avatar, name, description, etc.)
 */
export async function getChannelInfo(
	channelId: string,
	fetchFn?: typeof globalThis.fetch
): Promise<ChannelInfoResponse> {
	const fetcher = fetchFn ?? globalThis.fetch;

	try {
		const res = await fetcher(`${API_BASE_URL}/channels?id=${encodeURIComponent(channelId)}`);

		if (!res.ok) {
			throw new Error(
				`Failed to fetch channel info for ${channelId}: ${res.status} ${res.statusText}`
			);
		}

		const channelInfo: ChannelInfoResponse = await res.json();
		console.log('channelInfo', channelInfo);

		return channelInfo;
	} catch (error) {
		console.error('Error fetching channel info:', error);
		throw error;
	}
}

/**
 * Fetch a page of videos uploaded by a channel
 */
export async function getChannelVideos(
	channelId: string,
	fetchFn?: typeof globalThis.fetch
): Promise<ChannelVideosResponse> {
	const fetcher = fetchFn ?? globalThis.fetch;

	try {
		const res = await fetcher(
			`${API_BASE_URL}/channels/videos?id=${encodeURIComponent(channelId)}`
		);

		if (!res.ok) {
			throw new Error(
				`Failed to fetch channel videos for ${channelId}: ${res.status} ${res.statusText}`
			);
		}

		return await res.json();
	} catch (error) {
		console.error('Error fetching channel videos:', error);
		throw error;
	}
}
