<script lang="ts">
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import VideoPlayer from '$lib/components/video/VideoPlayer.svelte';
	import VideoDetail from '$lib/components/video/VideoDetail.svelte';
	import VideoListings from '$lib/components/video/VideoListings.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';
	import Comments from '$lib/components/video/Comments.svelte';
	import PlaylistQueue from '$lib/components/video/PlaylistQueue.svelte';

	let { data }: { data: PageData } = $props();

	// Reactive destructure - updates when data changes
	let playerConfig = $derived(
		(data as any)?.playerConfig ?? {
			videoStream: null,
			audioStream: null,
			subtitles: [],
			duration: 0,
			poster: ''
		}
	);

	let metadata = $derived(
		(data as any)?.metadata ?? {
			title: '',
			description: '',
			channelName: '',
			channelAvatar: '',
			viewCount: 0,
			uploadDate: '',
			likeCount: 0,
			dislikeCount: 0,
			subscriberCount: 0
		}
	);

	let relatedVideos = $derived(data.relatedVideos ?? []);
	let comments = $derived((data as any)?.comments ?? []);
	let error = $derived((data as any)?.error ?? null);
	let playlistId = $derived((data as any)?.playlistId ?? null);
	let playlistIndex = $derived((data as any)?.playlistIndex ?? 0);

	// Extract video ID for keying components
	let videoId = $derived(playerConfig.manifestUrl || playerConfig.poster || Date.now().toString());

	// Computed states
	let hasError = $derived(!!error);
	let hasValidManifest = $derived(!!playerConfig.manifestUrl);

	let isPlaylist = $derived(!!playlistId);

	let playlistVideos = $derived((data as any)?.playlistVideos ?? null);
	let playlistInfo = $derived((data as any)?.playlistInfo ?? null);

	// Delay player initialisation until mounted (for Shaka Player)
	let showPlayer = $state(false);
	onMount(() => {
		showPlayer = true;
	});

	// Mobile tab state - 'details' or 'related'
	let activeTab = $state<'details' | 'playlist' | 'related' | 'comments'>('details');
</script>

<div class="bg-primary w-full">
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
		<div class="mt-4 hidden min-h-screen lg:flex">
			<section class="flex w-2/3 flex-col items-start justify-start">
				<div class="w-full p-4 sm:p-6 lg:p-8">
					{#if showPlayer}
						{#key videoId}
							<VideoPlayer config={playerConfig} />
						{/key}
					{/if}

					{#key videoId}
						<VideoDetail {metadata} />
						<!-- Comments Section -->
						{#if comments.length > 0}
							<div class="mt-6">
								<h2 class="mb-4 text-lg font-semibold">{comments.length} Comments</h2>
								<div class="divide-y divide-gray-200 dark:divide-gray-700">
									{#each comments as comment (comment.id)}
										<Comments {comment} />
									{/each}
								</div>
							</div>
						{/if}
					{/key}
				</div>
			</section>
			<aside class="mt-7.75 flex w-1/3 flex-col gap-5 px-6">
				{#if isPlaylist}
					<PlaylistQueue
						videos={playlistVideos}
						playlistName={playlistInfo?.name}
						{playlistId}
						currentIndex={playlistIndex}
					/>
				{/if}
				<VideoListings videos={relatedVideos} />
			</aside>
		</div>

		<!-- Mobile/Tablet Layout (below lg) - Full width with tabs -->
		<div class="min-h-screen lg:hidden">
			<!-- Video Player - Full Width -->
			<div class="w-full">
				{#if showPlayer}
					{#key videoId}
						<VideoPlayer config={playerConfig} />
					{/key}
				{/if}
			</div>

			<!-- Tab Navigation -->
			<div class="bg-navbar border-default sticky top-14 z-30 border-b">
				<div class="flex">
					<button
						class="relative flex-1 py-3 text-sm font-medium transition-colors
							{activeTab === 'details' ? 'text-primary' : 'text-secondary hover:text-primary'}"
						onclick={() => (activeTab = 'details')}
					>
						Details
						{#if activeTab === 'details'}
							<div class="bg-accent absolute right-0 bottom-0 left-0 h-0.5"></div>
						{/if}
					</button>

					{#if isPlaylist}
						<button
							class="relative flex-1 py-3 text-sm font-medium transition-colors
								{activeTab === 'playlist' ? 'text-primary' : 'text-secondary hover:text-primary'}"
							onclick={() => (activeTab = 'playlist')}
						>
							Playlist
							{#if activeTab === 'playlist'}
								<div class="bg-accent absolute right-0 bottom-0 left-0 h-0.5"></div>
							{/if}
						</button>
					{/if}

					<button
						class="relative flex-1 py-3 text-sm font-medium transition-colors
							{activeTab === 'related' ? 'text-primary' : 'text-secondary hover:text-primary'}"
						onclick={() => (activeTab = 'related')}
					>
						Related Videos
						{#if activeTab === 'related'}
							<div class="bg-accent absolute right-0 bottom-0 left-0 h-0.5"></div>
						{/if}
					</button>

					<button
						class="relative flex-1 py-3 text-sm font-medium transition-colors
							{activeTab === 'comments' ? 'text-primary' : 'text-secondary hover:text-primary'}"
						onclick={() => (activeTab = 'comments')}
					>
						Comments
						{#if activeTab === 'comments'}
							<div class="bg-accent absolute right-0 bottom-0 left-0 h-0.5"></div>
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
				{:else if activeTab === 'playlist' && isPlaylist}
					<PlaylistQueue videos={relatedVideos} {playlistId} currentIndex={playlistIndex} />
				{:else if activeTab === 'related'}
					<VideoListings videos={relatedVideos} />
				{:else if comments.length > 0}
					<div class="mt-6">
						<h2 class="mb-4 text-lg font-semibold">{comments.length} Comments</h2>
						<div class="divide-y divide-gray-200 dark:divide-gray-700">
							{#each comments as comment (comment.id)}
								<Comments {comment} />
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
