<script lang="ts">
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import VideoDetail from '$lib/components/VideoDetail.svelte';
	import VideoListings from '$lib/components/VideoListings.svelte';

	export let data: PageData;

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
	$: videoId = playerConfig.manifestUrl || playerConfig.poster || Date.now().toString();

	// Computed states
	$: hasError = !!error;
	$: hasValidManifest = !!(playerConfig.manifestUrl);

	$: console.log('Video Page Data:', {
		playerConfig,
		metadata,
		relatedVideos,
		error
	});
	// Delay player initialisation until mounted (for Shaka Player)
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
					<p class="error-message">{error}</p>
					<button class="retry-btn" on:click={() => window.location.reload()}> Retry </button>
				</div>
			{:else if !hasValidManifest}
				<div class="error-container">
					<div class="error-icon">📹</div>
					<h2 class="error-title">No Streams Available</h2>
					<p class="error-message">
						Unable to load DASH manifest for this video. The video may be unavailable or restricted.
					</p>
					<button class="retry-btn" on:click={() => window.location.reload()}> Retry </button>
				</div>
			{:else if showPlayer}
				{#key videoId}
					<VideoPlayer config={playerConfig} />
				{/key}
			{/if}

			{#if !hasError}
				{#key videoId}
					<VideoDetail {metadata} />
				{/key}
			{/if}
		</div>
	</section>
	<aside class="mt-7.75 flex w-1/3 flex-col gap-5">
		{#if !hasError}
			<VideoListings videos={relatedVideos}/>
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
