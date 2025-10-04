<script lang="ts">
	import type { PageData } from './$types';
	import type { Format, RelatedItem, Video } from '$lib/types';

	import { onMount } from 'svelte';
	import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import VideoDetail from '$lib/components/VideoDetail.svelte';
	import VideoListings from '$lib/components/VideoListings.svelte';

	export let data: PageData;

	const videoSrc = data.video?.videoOnlyStreams?.[2]?.url ?? '';
	const audioSrc = data.video?.audioStreams?.[0]?.url ?? '';
	const videoHeight = data.video?.videoOnlyStreams?.[2]?.height ?? 1440;
	const videoWidth = data.video?.videoOnlyStreams?.[2]?.width ?? 2560;
	const poster = data.video?.thumbnails?.[data.video?.thumbnails?.length - 1]?.url ?? thumbnailPlaceholder;
	const duration = data.video?.duration ?? 0;
	const videoTitle = data.video?.name ?? 'Video Title';
	const channelAvatar = data.video?.uploaderAvatars?.[2]?.url;
	const channelName = data.video?.uploaderName ?? 'Channel Name';
	const viewCount = data.video?.viewCount ?? 237951;
	const videoDescription = data.video?.description?.content ?? 'No description available';

// console.log('Video: ', data.video);

	const formats: Format[] = [];

	const videos: RelatedItem[] = Array.from({ length: 8 }, (_, i) => ({
		id: `vid-${i}`,
		infoType: data.video?.relatedItems?.[i]?.infoType ?? 'STREAM',
		url: data.video?.relatedItems?.[i]?.url ?? '',
		name: data.video?.relatedItems?.[i]?.name ?? '',
		thumbnails: data.video?.relatedItems?.[i]?.thumbnails ?? [],
		streamType: data.video?.relatedItems?.[i]?.streamType ?? '',
		textualUploadDate: data.video?.relatedItems?.[i]?.textualUploadDate ?? 'Date unknown',
		viewCount: data.video?.relatedItems?.[i]?.viewCount ?? 1000,
		duration: data.video?.relatedItems?.[i]?.duration ?? 600,
		uploaderName: data.video?.relatedItems?.[i]?.uploaderName ?? '',
		uploaderUrl: data.video?.relatedItems?.[i]?.uploaderUrl ?? '',
		uploaderAvatars: data.video?.relatedItems?.[i]?.uploaderAvatars ?? [],
		uploaderSubscriberCount: data.video?.relatedItems?.[i]?.uploaderSubscriberCount ?? 0,
		shortFormContent: data.video?.relatedItems?.[i]?.shortFormContent ?? false
	}));

	let showPlayer = false;

	onMount(() => {
		showPlayer = true;
	});
</script>

<div class="mt-4 flex h-screen w-full">
	<section class="flex w-2/3 flex-col items-start justify-start">
		<div class="p-4 sm:p-6 lg:p-8">
			{#if showPlayer}
				<!-- <Player {videoSrc} {audioSrc} {videoHeight} {videoWidth} {poster} {duration} /> -->
				<VideoPlayer {videoSrc} {audioSrc} {poster} {videoHeight} {videoWidth} />
			{/if}
			<VideoDetail {videoTitle} {channelAvatar} {channelName} {viewCount} {videoDescription}/>
		</div>
	</section>
	<aside class="mt-7.75 flex w-1/3 flex-col gap-5">
		<VideoListings {videos} />
	</aside>
</div>
