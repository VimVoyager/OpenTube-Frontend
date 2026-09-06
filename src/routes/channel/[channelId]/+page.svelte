<script lang="ts">
	import type { PageData } from './$types';
	import ChannelDetails from '$lib/components/channel/ChannelDetails.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';
	import type { ChannelTab } from '$lib/components/channel/ChannelDetails.svelte';
	import ChannelVideos from '$lib/components/channel/ChannelVideos.svelte';
	import type { NextPage } from '$lib/api/types';
	import { adaptChannelVideos, type ChannelVideoConfig } from '$lib/adapters/channel';
	import { getChannelVideosNextPage } from '$lib/api/channel';
	import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
	import avatarPlaceholder from '$lib/assets/logo-placeholder.svg';

	let { data }: { data: PageData } = $props();

	let channel = $derived(
		data.channel ?? {
			id: '',
			name: '',
			handle: '',
			avatarUrl: null,
			bannerUrl: null,
			description: null,
			subscriberCount: '0',
			videoCount: 0,
			verified: false
		}
	);

	let channelVideos = $derived<ChannelVideoConfig[]>([]);
	let nextPage = $state<NextPage | null>(null);
	let loadingMore = $state(false);
	let loadMoreError = $state<string | null>(null);

	let error = $derived(data.error ?? null);
	let activeTab = $state<ChannelTab>('videos');

	$effect(() => {
		channelVideos = data.videos ?? [];
		nextPage = data.nextPage ?? null;
		loadMoreError = null;
	});

	async function loadMore(): Promise<void> {
		if (!nextPage || loadingMore) return;

		loadingMore = true;
		loadMoreError = null;

		try {
			const nextPageData = await getChannelVideosNextPage(
				channel.id,
				channel.name,
				nextPage.url ?? '',
				nextPage.body ?? '',
				channel.verified ? 'VERIFIED' : 'UNVERIFIED'
			);
			const adapted = adaptChannelVideos(nextPageData, thumbnailPlaceholder, avatarPlaceholder);
			channelVideos = [...channelVideos, ...adapted.items];
			nextPage = adapted.nextPage ?? null;
		} catch (err) {
			loadMoreError = err instanceof Error ? err.message : 'Failed to load more channel videos';
		} finally {
			loadingMore = false;
		}
	}
</script>

<div class="bg-primary min-h-screen w-full">
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
			{#snippet videos()}
				<ChannelVideos videos={channelVideos} />

				<div class="mt-8 px-4 pb-8 text-center">
					{#if loadMoreError}
						<p class="mb-3 text-sm text-red-500">{loadMoreError}</p>
					{/if}

					{#if nextPage}
						<button
							type="button"
							class="btn-primary rounded px-4 py-2 text-sm disabled:opacity-50"
							onclick={loadMore}
							disabled={loadingMore}
						>
							{loadingMore ? 'Loading…' : 'Load more'}
						</button>
					{/if}
				</div>
			{/snippet}

			{#snippet playlists()}
				<div class="flex flex-col items-center justify-center px-6 py-12 text-center">
					<div class="mb-4 text-4xl">📋</div>
					<p class="text-secondary text-sm">Playlists coming soon</p>
				</div>
			{/snippet}
		</ChannelDetails>
	{/if}
</div>
