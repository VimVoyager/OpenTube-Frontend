<script lang="ts">
	import type { PageData } from './$types';
	import ChannelDetails from '$lib/components/channel/ChannelDetails.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';
	import type { ChannelTab } from '$lib/components/channel/ChannelDetails.svelte';
	import ChannelVideos from '$lib/components/channel/ChannelVideos.svelte';

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

	let channelVideos = $derived((data as any)?.videos ?? []);
	let error = $derived((data as any)?.error ?? null);

	let activeTab = $state<ChannelTab>('videos');
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
			{#snippet videos()}
				<ChannelVideos videos={channelVideos} />
			{/snippet}

			{#snippet playlists()}
				<div class="flex flex-col items-center justify-center py-12 text-center px-6">
					<div class="text-4xl mb-4">📋</div>
					<p class="text-sm text-secondary">Playlists coming soon</p>
				</div>
			{/snippet}
		</ChannelDetails>
	{/if}
</div>

