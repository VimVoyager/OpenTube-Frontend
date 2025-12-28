<script lang="ts">
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import VideoDetail from '$lib/components/VideoDetail.svelte';
	import VideoListings from '$lib/components/VideoListings.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';

	let { data }: { data: PageData } = $props();

	// Reactive destructure - updates when data changes
	let playerConfig = $derived((data as any)?.playerConfig ?? {
		videoStream: null,
		audioStream: null,
		subtitles: [],
		duration: 0,
		poster: ''
	});

	let metadata = $derived((data as any)?.metadata ?? {
		title: '',
		description: '',
		channelName: '',
		channelAvatar: '',
		viewCount: 0,
		uploadDate: '',
		likeCount: 0,
		dislikeCount: 0,
		subscriberCount: 0
	});

	let relatedVideos = $derived(data.relatedVideos ?? []);
	let error = $derived((data as any)?.error ?? null);

	// Extract video ID for keying components
	let videoId = $derived(playerConfig.manifestUrl || playerConfig.poster || Date.now().toString());

	// Computed states
	let hasError = $derived(!!error);
	let hasValidManifest = $derived(!!(playerConfig.manifestUrl));

	// Delay player initialisation until mounted (for Shaka Player)
	let showPlayer = $state(false);
	onMount(() => {
		showPlayer = true;
	});

	// Mobile tab state - 'details' or 'related'
	let activeTab = $state<'details' | 'related'>('details');
</script>

<div class="w-full bg-primary">
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
		<!-- Desktop Layout (lg and above) - Two columns -->
		<div class="hidden lg:flex min-h-screen mt-4">
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

		<!-- Mobile/Tablet Layout (below lg) - Full width with tabs -->
		<div class="lg:hidden min-h-screen">
			<!-- Video Player - Full Width -->
			<div class="w-full">
				{#if showPlayer}
					{#key videoId}
						<VideoPlayer config={playerConfig} />
					{/key}
				{/if}
			</div>

			<!-- Tab Navigation -->
			<div class="sticky top-14 z-30 bg-navbar border-b border-default">
				<div class="flex">
					<button
						class="flex-1 py-3 text-sm font-medium transition-colors relative
							{activeTab === 'details' 
								? 'text-primary' 
								: 'text-secondary hover:text-primary'}"
						onclick={() => activeTab = 'details'}
					>
						Details
						{#if activeTab === 'details'}
							<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
						{/if}
					</button>
					<button
						class="flex-1 py-3 text-sm font-medium transition-colors relative
							{activeTab === 'related' 
								? 'text-primary' 
								: 'text-secondary hover:text-primary'}"
						onclick={() => activeTab = 'related'}
					>
						Related Videos
						{#if activeTab === 'related'}
							<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
						{/if}
					</button>
				</div>
			</div>

			<!-- Tab Content -->
			<div class="p-4">
				{#if activeTab === 'details'}
					{#key videoId}
						<VideoDetail {metadata} />
					{/key}
				{:else}
					<VideoListings videos={relatedVideos}/>
				{/if}
			</div>
		</div>
	{/if}
</div>