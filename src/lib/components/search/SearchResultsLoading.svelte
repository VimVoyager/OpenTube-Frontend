<script lang="ts">
	import VideoResultLoading from './VideoResultLoading.svelte';

	/**
	 * Number of loading skeleton items to display
	 */
	export let count: number = 10;
  // export let query: string = '';
</script>

<div class="container mx-auto w-3/4 px-4 py-8">
    <!-- Loading header skeleton -->
    <div class="mb-6">
      <div class="h-8 w-64 animate-pulse rounded bg-gray-700"></div>
    </div>

    <!-- Loading skeleton items -->
    <div class="space-y-4" role="status" aria-label="Loading search results">
      {#each Array(count) as _, i}
        <VideoResultLoading />
      {/each}
    </div>

    <!-- Loading count skeleton -->
    <div class="mt-8 flex justify-center">
      <div class="h-4 w-32 animate-pulse rounded bg-gray-700"></div>
    </div>
</div>