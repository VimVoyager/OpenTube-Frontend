import type { Stream } from "$lib/types";
import { env } from '$env/dynamic/public';

const API_BASE_URL = env.PUBLIC_API_URL + '/api/v1';


export interface VideoStreamsResponse {
    streams: Stream[];
    videoId: string;
}

export interface AudioStreamsResponse {
    streams: Stream[];
    videoId: string;
}

/**
 * Fetch video-only streams for a given video ID
 */
export async function getVideoStreams(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<Stream[]> {
    const fetcher = fetchFn ?? globalThis.fetch;

    try {
        const res = await fetcher(
            `${API_BASE_URL}/streams/video?id=${encodeURIComponent(id)}`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch video streams for ${id}: ${res.status} ${res.statusText}`
            );
        }

        const data = await res.json();

        // Handle different response formats
        if (Array.isArray(data)) {
            return data as Stream[];
        } else if (data.streams && Array.isArray(data.streams)) {
            return data.streams as Stream[];
        } else {
            throw new Error('Unexpected response format for video streams');
        }
    } catch (error) {
        console.error('Error fetching video streams:', error);
        throw error;
    }
}

/**
 * Fetch audio-only streams for a given video ID
 */
export async function getAudioStreams(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<Stream[]> {
    const fetcher = fetchFn ?? globalThis.fetch;

    try {
        const res = await fetcher(
            `${API_BASE_URL}/streams/audio?id=${encodeURIComponent(id)}`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch audio streams for ${id}: ${res.status} ${res.statusText}`
            );
        }

        const data = await res.json();

        // Handle different response formats
        if (Array.isArray(data)) {
            return data as Stream[];
        } else if (data.streams && Array.isArray(data.streams)) {
            return data.streams as Stream[];
        } else {
            throw new Error('Unexpected response format for audio streams');
        }
    } catch (error) {
        console.error('Error fetching audio streams:', error);
        throw error;
    }
}

/**
 * Fetch both video and audio streams in parallel
 */
export async function getAllStreams(
    id: string,
    fetchFn?: typeof globalThis.fetch
): Promise<{ videoStreams: Stream[]; audioStreams: Stream[] }> {
    const [videoStreams, audioStreams] = await Promise.all([
        getVideoStreams(id, fetchFn),
        getAudioStreams(id, fetchFn)
    ]);

    return { videoStreams, audioStreams };
}