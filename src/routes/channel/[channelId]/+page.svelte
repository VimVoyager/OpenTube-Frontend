<script lang="ts">
	import type { PageData } from './$types';
	import ChannelDetails from '$lib/components/channel/ChannelDetails.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';
	import type { ChannelTab } from '$lib/components/channel/ChannelDetails.svelte';
	import ChannelVideos from '$lib/components/channel/ChannelVideos.svelte';

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

	let channelVideos = $derived(data.videos ?? []);
	let error = $derived(data.error ?? null);

	let activeTab = $state<ChannelTab>('videos');
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
