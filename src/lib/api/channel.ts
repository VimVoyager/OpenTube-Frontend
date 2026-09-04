import { PUBLIC_API_URL } from '$env/static/public';
import type { Image } from '$lib/api/types';

const API_BASE_URL: string = PUBLIC_API_URL;

export interface ChannelVideoApiResponseItem {
	url: string;
	name: string;
	uploaderName: string;
	uploaderUrl: string | null;
	uploaderVerified: boolean;
	duration: number;
	viewCount: number;
	textualUploadDate: string | null;
	thumbnails: Image[];
	isShortFormContent?: boolean;
}

export interface ChannelInfoApiResponse {
	id: string;
	name: string;
	avatarUrl: string;
	bannerUrl: string;
	description: string;
	subscriberCount: number;
	handle: string | null;
	verified: boolean;
	tabs: string[];
	avatars: Image[];
	banners: Image[];
}

export interface ChannelVideosApiResponse {
	channelId: string;
	items: ChannelVideoApiResponseItem[];
	nextPageToken: string | null;
}

/**
 * Fetch channel info (banner, avatar, name, description, etc.)
 */
export async function getChannelInfo(
	channelId: string,
	fetchFn?: typeof globalThis.fetch
): Promise<ChannelInfoApiResponse> {
	const fetcher: {
		(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
		(input: string | URL | Request, init?: RequestInit): Promise<Response>;
	} = fetchFn ?? globalThis.fetch;

	try {
		const res: Response = await fetcher(
			`${API_BASE_URL}/channels?id=${encodeURIComponent(channelId)}`
		);

		if (!res.ok) {
			throw new Error(
				`Failed to fetch channel info for ${channelId}: ${res.status} ${res.statusText}`
			);
		}

		return await res.json();
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
): Promise<ChannelVideosApiResponse> {
	const fetcher: {
		(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
		(input: string | URL | Request, init?: RequestInit): Promise<Response>;
	} = fetchFn ?? globalThis.fetch;

	try {
		const res = await fetcher(`${API_BASE_URL}/channels/tab?id=${encodeURIComponent(channelId)}`);

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
