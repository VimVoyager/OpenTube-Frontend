<script lang="ts">
	import type { PageData } from './$types';
	import VideoResult from '$lib/components/VideoResult.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import { goto } from '$app/navigation';

	export let data: PageData;

	$: ({ results, query, error } = data);
	$: hasResults = results && results.length > 0;
</script>

<div class="container mx-auto w-3/4 px-4 py-8">
	<!-- Search Query Header -->
	{#if query}
		<h1 class="mb-6 text-2xl font-bold text-white">
			Search Results for "{query}"
		</h1>
	{/if}
	<!-- Error State -->
	{#if error}
		<div class="rounded-lg bg-red-900/20 p-6 text-center">
			<p class="text-lg text-red-400">Error: {error}</p>
			<p class="mt-2 text-sm text-gray-400">Please try again later.</p>
		</div>

		<!-- Empty Query State -->
	{:else if !query}
		<div class="text-center text-gray-400">
			<p class="text-lg">Enter a search query to find videos</p>
		</div>

		<!-- No Results State -->
	{:else if !hasResults}
		<div class="text-center text-gray-400">
			<p class="text-lg">No results found for "{query}"</p>
			<p class="mt-2 text-sm">Try different keywords or check your spelling</p>
		</div>

		<!-- Results List -->
	{:else}
		<div class="space-y-4">
			{#each results as result (result.id)}
				<VideoResult {result} />
			{/each}
		</div>

		<!-- Results Count -->
		<div class="mt-8 text-center">
			<p class="text-sm text-gray-400">
				Showing {results.length} result{results.length !== 1 ? 's' : ''}
			</p>
		</div>
	{/if}
</div>
