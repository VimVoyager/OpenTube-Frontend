<script lang="ts">
	import type { PageData } from './$types';
	import ChannelDetails from '$lib/components/channel/ChannelDetails.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';
	import type { ChannelTab } from '$lib/components/channel/ChannelDetails.svelte';

	let { data }: { data: PageData } = $props();

	let channel = $derived((data as any)?.channel ?? {
		id: '',
		name: '',
		handle: '',
		avatarUrl: null,
		bannerUrl: null,
		description: null,
		subscriberCount: '0',
		videoCount: 0,
		verified: false
	});

	// let videos = $derived((data as any)?.videos ?? []);
	let error = $derived((data as any)?.error ?? null);

	let activeTab = $state<ChannelTab>('home');

	// const formatViewCount = (viewCount: number): string =>
	// 	Intl.NumberFormat('en-US').format(viewCount);
	//
	// const formatDuration = (seconds: number): string => {
	// 	const hours = Math.floor(seconds / 3600);
	// 	const minutes = Math.floor((seconds % 3600) / 60);
	// 	const secs = seconds % 60;
	// 	if (hours > 0) {
	// 		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	// 	}
	// 	return `${minutes}:${secs.toString().padStart(2, '0')}`;
	// };
</script>

<div class="w-full bg-primary min-h-screen">
	{#if error && !channel.name}
		<!-- Full-page error if we couldn't load anything meaningful -->
		<div class="flex min-h-screen items-center justify-center px-4">
			<ErrorCard
				variant="error"
				title="Failed to Load Channel"
				message={error}
				showRetry={true}
				onRetry={() => window.location.reload()}
			/>
		</div>
	{:else}
		<ChannelDetails {channel} bind:activeTab>
			{#snippet home()}
				<!-- Placeholder: replace with a dedicated ChannelHome component later -->
				<div class="flex flex-col items-center justify-center py-12 text-center px-6">
					<div class="text-4xl mb-4">🏠</div>
					<p class="text-sm text-secondary">Featured and recent content will appear here</p>
				</div>
			{/snippet}

			{#snippet videos()}
				<!-- Placeholder: replace with a dedicated Channelvideos component later -->
				<div class="flex flex-col items-center justify-center py-12 text-center px-6">
					<div class="text-4xl mb-4">🏠</div>
					<p class="text-sm text-secondary">Videos by this channel will be displayed here</p>
				</div>
			{/snippet}

			<!--{#snippet videos()}-->
			<!--	{#if videos.length === 0}-->
			<!--		<div class="flex flex-col items-center justify-center py-12 text-center px-6">-->
			<!--			<div class="text-4xl mb-4">📹</div>-->
			<!--			<p class="text-sm text-secondary">No videos available</p>-->
			<!--		</div>-->
			<!--	{:else}-->
			<!--		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6 pb-8">-->
			<!--			{#each videos as video (video.id)}-->
			<!--				<a-->
			<!--					href="/video/{video.id}"-->
			<!--					class="group flex flex-col gap-2 hover:bg-secondary rounded-lg transition-colors p-2 cursor-pointer"-->
			<!--				>-->
			<!--					&lt;!&ndash; Thumbnail &ndash;&gt;-->
			<!--					<div class="relative w-full" style="aspect-ratio: 16/9;">-->
			<!--						<img-->
			<!--							src={video.thumbnail}-->
			<!--							alt={video.title}-->
			<!--							class="w-full h-full rounded-md object-cover"-->
			<!--						/>-->
			<!--						{#if video.duration > 0}-->
			<!--							<span-->
			<!--								class="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded"-->
			<!--							>-->
			<!--								{formatDuration(video.duration)}-->
			<!--							</span>-->
			<!--						{/if}-->
			<!--					</div>-->

			<!--					&lt;!&ndash; Info &ndash;&gt;-->
			<!--					<div class="flex flex-col">-->
			<!--						<h3-->
			<!--							class="text-sm font-semibold text-primary line-clamp-2 group-hover:text-accent transition-colors"-->
			<!--						>-->
			<!--							{video.title}-->
			<!--						</h3>-->
			<!--						<div class="mt-1 flex items-center gap-x-1.5 text-xs text-secondary flex-wrap">-->
			<!--							{#if video.viewCount > 0}-->
			<!--								<span>{formatViewCount(video.viewCount)} views</span>-->
			<!--							{/if}-->
			<!--							{#if video.uploadedDate}-->
			<!--								<span class="text-muted">·</span>-->
			<!--								<span>{video.uploadedDate}</span>-->
			<!--							{/if}-->
			<!--						</div>-->
			<!--					</div>-->
			<!--				</a>-->
			<!--			{/each}-->
			<!--		</div>-->
			<!--	{/if}-->
			<!--{/snippet}-->

			{#snippet playlists()}
				<div class="flex flex-col items-center justify-center py-12 text-center px-6">
					<div class="text-4xl mb-4">📋</div>
					<p class="text-sm text-secondary">Playlists coming soon</p>
				</div>
			{/snippet}
		</ChannelDetails>
	{/if}
</div>

