<script lang="ts">
	import type { PageData } from './$types';
	import VideoResult from '$lib/components/VideoResult.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import { goto } from '$app/navigation';

	export let data: PageData;

	$: loading = !data?.result;
	const videos = data.result ?? [];
</script>

<div class="container mx-auto w-3/4 px-4 py-8">
	{#if loading}
		<Loading />
	{:else}
		{#each videos as video (video.id)}
			<div
				class="mb-6 flex cursor-pointer justify-center"
				role="button"
				tabindex="0"
				on:click={() => goto(`/video/${video.id}`)}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						goto(`/video/${video.id}`);
					}
				}}
			>
				<VideoResult
					poster={video.thumbnail}
					title={video.title}
					uploadedAt={new Date(Date.now()).toISOString()}
					viewCount={video.view_count}
					description="Lorem ipsum"
				/>
			</div>
		{/each}
	{/if}
</div>
