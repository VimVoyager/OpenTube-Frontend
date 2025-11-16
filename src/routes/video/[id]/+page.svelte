<script lang="ts">
	import type { PageData } from './$types';
	import type { RelatedItem } from '$lib/types';

	import { onMount } from 'svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import VideoDetail from '$lib/components/VideoDetail.svelte';
	import VideoListings from '$lib/components/VideoListings.svelte';

	export let data: PageData;

	// Destructure for clarity (use safe casts if PageData doesn't include these fields)
	const playerConfig = (data as any)?.playerConfig ?? {
		videoStream: null,
		audioStream: null,
		subtitles: [],
		duration: 0,
		poster: ''
	};
	const metadata = (data as any)?.metadata ?? {
		title: '',
		description: '',
		channelName: '',
		channelAvatar: '',
		viewCount: 0,
		uploadDate: '',
		likeCount: 0,
		dislikeCount: 0,
		subscriberCount: 0
	};
	const error = (data as any)?.error ?? null;

	// Computed states
	$: hasError = !!error;
	$: hasValidStreams = !!(playerConfig.videoStream || playerConfig.audioStream);

	// Delay player initialisation until mounted (for Shaka Player)
	let showPlayer = false;
	onMount(() => {
		showPlayer = true;
	});

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
</script>

<div class="mt-4 flex h-screen w-full">
	<section class="flex w-2/3 flex-col items-start justify-start">
		<div class="p-4 sm:p-6 lg:p-8">
			{#if hasError}
				<div class="error-container">
					<div class="error-icon">⚠️</div>
					<h2 class="error-title">Failed to Load Video</h2>
					<p class="error-message">{error}</p>
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
				<VideoPlayer config={playerConfig}/>
			{/if}

			{#if !hasError}
				<VideoDetail {metadata} />
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
