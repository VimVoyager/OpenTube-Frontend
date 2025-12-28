<script lang="ts">
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import VideoDetail from '$lib/components/VideoDetail.svelte';
	import VideoListings from '$lib/components/VideoListings.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';

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

	// Delay player initialisation until mounted (for Shaka Player)
	let showPlayer = false;
	onMount(() => {
		showPlayer = true;
	});
</script>

<div class="mt-4 w-full bg-primary">
	{#if hasError || !hasValidManifest}
		<!-- Full-width centered error states -->
		<div class="flex min-h-screen items-center justify-center px-4">
			{#if hasError}
				<ErrorCard
					variant="error"
					title="Failed to Load Video"
					message={error}
					showRetry={true}
					onRetry={() => window.location.reload()}
				/>
			{:else}
				<ErrorCard
					variant="warning"
					title="No Streams Available"
					message="Unable to load DASH manifest for this video. The video may be unavailable or restricted."
					showRetry={true}
					onRetry={() => window.location.reload()}
				/>
			{/if}
		</div>
	{:else}
		<!-- Normal two-column layout for video content -->
		<div class="flex min-h-screen">
			<section class="flex w-2/3 flex-col items-start justify-start">
				<div class="p-4 sm:p-6 lg:p-8 w-full">
					{#if showPlayer}
						{#key videoId}
							<VideoPlayer config={playerConfig} />
						{/key}
					{/if}

					{#key videoId}
						<VideoDetail {metadata} />
					{/key}
				</div>
			</section>
			<aside class="mt-7.75 flex w-1/3 flex-col gap-5">
				<VideoListings videos={relatedVideos}/>
			</aside>
		</div>
	{/if}
</div>