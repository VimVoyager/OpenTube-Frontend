<script lang="ts">
	import type { PageData } from './$types';
	import type { RelatedItem } from '$lib/types';

	import { onMount } from 'svelte';
	import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import VideoDetail from '$lib/components/VideoDetail.svelte';
	import VideoListings from '$lib/components/VideoListings.svelte';

	export let data: PageData;

	// Handle error state
	$: hasError = !!data.error;
	$: errorMessage = data.error ?? '';

	// Extract video stream data
	const videoFormat = data.videoFormat;
	const audioFormat = data.audioFormat;
	const details = data.details;

	// Video stream props
	const videoUrl = videoFormat?.url ?? '';
	const videoCodec = videoFormat?.codec ?? 'avc1.42E01E';
	const videoMimeType = 'video/mp4';
	const videoWidth = videoFormat?.width ?? 1920;
	const videoHeight = videoFormat?.height ?? 1080;
	const videoBandwidth = videoFormat?.bitrate ?? 1000000;
	const videoFrameRate = videoFormat?.fps ?? 30;
	const videoFormatStr = videoFormat?.format ?? 'MPEG_4';
  const videoInitStart = videoFormat?.itagItem.initStart;
  const videoInitEnd = videoFormat?.itagItem.initEnd;
  const videoIndexStart = videoFormat?.itagItem.indexStart;
  const videoIndexEnd = videoFormat?.itagItem.indexEnd;

	// Audio stream props
	const audioUrl = audioFormat?.url ?? '';
	const audioCodec = audioFormat?.codec ?? 'mp4a.40.2';
	const audioMimeType = 'audio/mp4';
	const audioBandwidth = audioFormat?.bitrate ?? 128000;
	const audioSampleRate = audioFormat?.itagItem.sampleRate ?? 44100;
	const audioChannels = audioFormat?.itagItem.audioChannels ?? 2; // Default to stereo
	const audioFormatStr = audioFormat?.format ?? 'M4A';
  const audioInitStart = audioFormat?.itagItem.initStart;
  const audioInitEnd = audioFormat?.itagItem.initEnd;
  const audioIndexStart = audioFormat?.itagItem.indexStart;
  const audioIndexEnd = audioFormat?.itagItem.indexEnd;

	// Video metadata
	const poster =
		details?.uploaderAvatars?.[details?.uploaderAvatars?.length - 1]?.url ?? thumbnailPlaceholder;
	const duration = data.duration ?? 0;

	// Log if duration is missing or zero
  if (!duration || duration === 0) {
    console.warn('Video duration is missing or zero, this may cause playback issues');
  }

	const videoTitle = data.video?.name ?? 'Video Title';
	const channelAvatar = details?.uploaderAvatars?.[2]?.url;
	const channelName = details?.channelName ?? 'Channel Name';
	const viewCount = details?.viewCount ?? 0;
	const videoDescription = details?.description?.content ?? 'No description available';

	// Check if we have valid streams
	$: hasValidStreams = !!videoUrl || !!audioUrl;

	// Related videos
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
			{#if hasError}
				<div class="error-container">
					<div class="error-icon">⚠️</div>
					<h2 class="error-title">Failed to Load Video</h2>
					<p class="error-message">{errorMessage}</p>
					<button class="retry-btn" on:click={() => window.location.reload()}> Retry </button>
				</div>
			{:else if !hasValidStreams}
				<div class="error-container">
					<div class="error-icon">📹</div>
					<h2 class="error-title">No Streams Available</h2>
					<p class="error-message">
						Unable to find playable video or audio streams for this video.
					</p>
					<button class="retry-btn" on:click={() => window.location.reload()}> Retry </button>
				</div>
			{:else if showPlayer}
				<VideoPlayer
					{videoUrl}
					{audioUrl}
					{poster}
					{duration}
					{videoCodec}
					{videoMimeType}
					{videoWidth}
					{videoHeight}
					{videoBandwidth}
					{videoFrameRate}
					videoFormat={videoFormatStr}
          {videoInitStart}
          {videoInitEnd}
          {videoIndexStart}
          {videoIndexEnd}
					{audioCodec}
					{audioMimeType}
					{audioBandwidth}
					{audioSampleRate}
					{audioChannels}
					audioFormat={audioFormatStr}
          {audioInitStart}
          {audioInitEnd}
          {audioIndexStart}
          {audioIndexEnd}
				/>
			{/if}

			{#if !hasError}
				<VideoDetail {videoTitle} {channelAvatar} {channelName} {viewCount} {videoDescription} />
			{/if}
		</div>
	</section>
	<aside class="mt-7.75 flex w-1/3 flex-col gap-5">
		{#if !hasError}
			<!-- <VideoListings {videos} /> -->
		{/if}
	</aside>
</div>

<style>
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 32px;
    background: #1a1a1a;
    border-radius: 12px;
    text-align: center;
  }

  .error-icon {
    font-size: 64px;
    margin-bottom: 24px;
  }

  .error-title {
    font-size: 24px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 16px 0;
  }

  .error-message {
    font-size: 16px;
    color: #aaa;
    margin: 0 0 32px 0;
    max-width: 500px;
    line-height: 1.6;
  }

  .retry-btn {
    background: #ff0000;
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .retry-btn:hover {
    background: #cc0000;
  }

  .retry-btn:active {
    transform: scale(0.98);
  }
</style>
