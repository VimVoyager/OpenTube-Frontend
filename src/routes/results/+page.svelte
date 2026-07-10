<script lang="ts">
	import type { PageData } from './$types';
	import VideoResult from '$lib/components/search/VideoResult.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';
	import ChannelResult from '$lib/components/search/ChannelResult.svelte';
	import PlaylistResult from '$lib/components/search/PlaylistResult.svelte';

	let { data }: { data: PageData } = $props();

	let results = $derived(data.results);
	let query = $derived(data.query);
	let error = $derived(data.error);
	let hasResults = $derived(results && results.length > 0);
</script>

<!-- Content States -->
<div class="container mx-auto w-full max-w-7xl px-4 py-8">
	<!-- Search Query Header -->
	{#if query}
		<h1 class="text-primary mb-6 text-xl font-bold sm:text-2xl">
			Search Results for "{query}"
		</h1>
	{/if}

	<!-- Error State -->
	{#if error}
		<ErrorCard variant="error" title="Search Error" message={error}>
			<p class="text-secondary mt-4 text-sm">Please try again later.</p>
		</ErrorCard>

		<!-- Empty Query State -->
	{:else if !query}
		<ErrorCard
			variant="empty"
			title="No Search Query"
			message="Enter a search query to find videos"
			icon="🔍"
		/>

		<!-- No Results State -->
	{:else if !hasResults}
		<ErrorCard variant="info" title="No Results Found" message={`No results found for "${query}"`}>
			<p class="text-muted mt-4 text-sm">Try different keywords or check your spelling</p>
		</ErrorCard>

		<!-- Results List -->
	{:else}
		<div class="space-y-4">
			{#each results as result (result.id)}
				{#if result.type === 'channel'}
					<ChannelResult {result} />
				{:else if result.type === 'playlist'}
					<PlaylistResult {result} />
				{:else}
					<VideoResult {result} />
				{/if}
			{/each}
		</div>

		<!-- Results Count -->
		<div class="mt-8 text-center">
			<p class="text-secondary text-sm">
				Showing {results.length} result{results.length !== 1 ? 's' : ''}
			</p>
		</div>
	{/if}
</div>
