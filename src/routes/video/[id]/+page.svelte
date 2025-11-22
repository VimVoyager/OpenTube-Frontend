<script lang="ts">
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import VideoDetail from '$lib/components/VideoDetail.svelte';
	import VideoListings from '$lib/components/VideoListings.svelte';
	import VideoLoading from '$lib/components/VideoLoading.svelte';
	import VideoListingsLoading from '$lib/components/VideoListingsLoading.svelte';

	export let data: PageData;

	// Loading state store
	const isLoadingStore = writable(false);

	// Reactive destructure - updates when data changes
	$: playerConfig = (data as any)?.playerConfig ?? {
		videoStream: null,
		audioStream: null,
		subtitles: [],
		duration: 0,
		poster: ''
	};

	$: metadata = (data as any)?.metadata ?? {
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

	$: relatedVideos = data.relatedVideos ?? [];
	$: error = (data as any)?.error ?? null;

	// Extract video ID for keying components
	$: videoId = playerConfig.videoStream?.[0]?.url || playerConfig.poster || Date.now().toString();

	// When data changes, turn off loading
	$: if (playerConfig || error) {
		isLoadingStore.set(false);
	}

	// Computed states
	$: hasError = !!error;
	$: hasValidStreams = !!(playerConfig.videoStream || playerConfig.audioStream);

	// Delay player initialisation until mounted (for Shaka Player)
	let showPlayer = false;
	onMount(() => {
		showPlayer = true;
	});
</script>

<div class="mt-4 flex h-screen w-full">
	<section class="flex w-2/3 flex-col items-start justify-start">
		<div class="p-4 sm:p-6 lg:p-8">
			{#if $isLoadingStore && !hasError}
				<!-- Show loading state during navigation -->
				<VideoLoading message="Loading video..." />
			{:else if hasError}
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
				{#key videoId}
					<VideoPlayer config={playerConfig} />
				{/key}
			{/if}

			{#if !hasError && !$isLoadingStore}
				{#key videoId}
					<VideoDetail {metadata} />
				{/key}
			{/if}
		</div>
	</section>
	<aside class="mt-7.75 flex w-1/3 flex-col gap-5">
		{#if $isLoadingStore && !hasError}
			<VideoListingsLoading />
		{:else if !hasError}
			<VideoListings videos={relatedVideos} {isLoadingStore} />
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
