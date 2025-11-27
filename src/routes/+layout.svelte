<script lang="ts">
	import '../app.css';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/navbar.svelte';
	import SearchResultsLoading from '$lib/components/SearchResultsLoading.svelte';
	import VideoLoading from '$lib/components/VideoLoading.svelte';
	import VideoListingsLoading from '$lib/components/VideoListingsLoading.svelte';

	// Navigation state
	let isNavigating = $state(false);
	let targetRouteId = $state<string | null>(null);

	beforeNavigate((navigation) => {
		if (navigation.to) {
			isNavigating = true;
			targetRouteId = navigation.to.route.id;
		}
	});

	afterNavigate(() => {
		isNavigating = false;
		targetRouteId = null;
	});

	/**
	 * Determine which loading skeleton to show based on navigation target
	 *
	 * Route patterns:
	 *  - '/results' -> Search results page
	 *  - '/video/[id]' -> Video player page
	 */
	const isNavigatingToSearch = $derived(isNavigating && targetRouteId === '/results');
	const isNavigatingToVideo = $derived(isNavigating && targetRouteId === '/video/[id]');

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>
<div class="min-h-screen bg-black text-white">
	{#if isNavigatingToSearch}
		<SearchResultsLoading count={10} />
	{:else if isNavigatingToVideo}
		<div class="mt-4 flex h-screen w-full">
			<section class="flex w-2/3 flex-col items-start justify-start">
				<div class="p-4 sm:p-6 lg:p-8">
					<!-- Show loading state during navigation -->
					<VideoLoading message="Loading video..." />
				</div>
			</section>
			<aside class="mt-7.75 flex w-1/3 flex-col gap-5">
				<VideoListingsLoading />
			</aside>
		</div>
	{:else}
		<div class="fixed inset-x-0 top-0 z-40">
			<Navbar />
		</div>

		<div class="pt-16">
			{@render children?.()}
		</div>
	{/if}
</div>
