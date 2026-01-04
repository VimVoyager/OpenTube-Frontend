<script lang="ts">
	import type { PageData } from './$types';
	import VideoResult from '$lib/components/search/VideoResult.svelte';
	import ErrorCard from '$lib/components/ErrorCard.svelte';

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
		<h1 class="mb-6 text-xl sm:text-2xl font-bold text-primary">
			Search Results for "{query}"
		</h1>
	{/if}
	
	<!-- Error State -->
	{#if error}
		<ErrorCard
			variant="error"
			title="Search Error"
			message={error}
		>
			<p class="mt-4 text-sm text-secondary">Please try again later.</p>
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
		<ErrorCard
			variant="info"
			title="No Results Found"
			message='No results found for "{query}"'
		>
			<p class="mt-4 text-sm text-muted">Try different keywords or check your spelling</p>
		</ErrorCard>

	<!-- Results List -->
	{:else}
		<div class="space-y-4">
			{#each results as result (result.id)}
				<VideoResult {result} />
			{/each}
		</div>

		<!-- Results Count -->
		<div class="mt-8 text-center">
			<p class="text-sm text-secondary">
				Showing {results.length} result{results.length !== 1 ? 's' : ''}
			</p>
		</div>
	{/if}
</div>