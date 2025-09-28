import type { PageLoad } from './$types';
import type { Video, Stream } from '$lib/types';
import { getVideo } from '$lib/api/video';


const PREFERRED_VIDEO_ITAGS = [
	'264',	// 1440p MP4 AVC
	'137',	// 1080p MP4 AVC
	'136',	// 720p MP4 AVC
	'135',	// 480p MP4 AVC
	'400',	// 1440p MP4 AV1
	'399',	// 1080p MP4 AV1
	'398',	// 720p MP4 AV1
	'397',	// 480p MP4 AV1
	'271',	// 1440p webm VP9
	'248',	// 1080p webm VP9
	'247',	// 720p webm VP9
	'246',	// 480p webm VP9
] as const;

const PREFERRED_AUDIO_ITAGS = [
	'139',	// m4a 48kbps
	'140',	// m4a 128kbps
	'141',	// m4a 256kbps
	'249',	// webm 50kbps
	'250',	// webm 70kbps
	'251',	// webm 160kbps

] as const;

function getBaseItag(formatId: string): string {
	const dash = formatId.indexOf('-');
	return dash === -1 ? formatId : formatId.slice(0, dash);
};

function pickByStreamId<T extends Stream>(
	streams: T[],
	priorityList: readonly string[]
): T | undefined {
	for (const itag of priorityList) {
		const match = streams.find(s => getBaseItag(s.id) === itag);
		if (match) return match;
	}
};

function bestVideoStream(streams: Stream[]): Stream | undefined {
	const candidate = pickByStreamId(streams, PREFERRED_VIDEO_ITAGS);
	if (candidate && candidate.videoOnly) return candidate;

	const fallback = streams.filter(s => s.format === 'MPEG_4' && s.codec.startsWith('av'));

	if (!fallback.length) return undefined;

	fallback.sort((a, b) => (b.width ?? 0) * (b.height ?? 1) - (a.width ?? 0) * (a.height ?? 1));
	return fallback[0];
}

// function bestVideoFormat(formats: Format[]): Format | undefined {
// 	const candidate = pickByFormatId(formats, PREFERRED_VIDEO_ITAGS);
// 	if (candidate && candidate.acodec === 'none') return candidate;

// 	const fallback = formats.filter(f => f.ext === 'mp4' && f.vcodec?.startsWith('av') && !f.acodec);
// 	if (!fallback.length) return undefined;
// 	fallback.sort((a, b) => (b.width ?? 0) * (b.height ?? 1) - (a.width ?? 0) * (a.height ?? 1));
// 	return fallback[0];
// };

function bestAudioStream(streams: Stream[]): Stream | undefined {
	const candidate = pickByStreamId(streams, PREFERRED_AUDIO_ITAGS);
	if (candidate && !candidate.videoOnly) return candidate;

	const fallback = streams.filter(s => s.format === 'MP4A' && s.codec.startsWith('mp4a'));

	if (!fallback.length) return undefined;

	return fallback[0];
};


export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const video: Video = await getVideo(params.id, fetch);

		return {
			video,
			videoFormat: bestVideoStream(video.videoOnlyStreams),
			audioFormat: bestAudioStream(video.audioStreams),
		};
	} catch (error) {
		return { error: error instanceof Error ? error.message : 'Unknown error' };
	}
};
