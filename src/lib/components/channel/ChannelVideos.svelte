<script lang="ts">
	import { formatCount, formatDuration } from '$lib/utils/formatters';
	import type { ChannelVideoConfig } from '$lib/adapters/types';

	let { videos }: { videos: ChannelVideoConfig[] } = $props();
</script>

<div>
	{#if videos.length === 0}
		<div class="flex flex-col items-center justify-center px-6 py-12 text-center">
			<div class="mb-4 text-4xl">📹</div>
			<p class="text-secondary text-sm">No videos available</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each videos as video (video.id)}
				<a
					href="/video/{video.id}"
					data-sveltekit-preload-data="tap"
					class="group hover:bg-secondary flex cursor-pointer flex-col gap-2 rounded-lg p-2 transition-colors"
				>
					<!-- Thumbnail -->
					<div class="relative w-full" style="aspect-ratio: 16/9;">
						<img
							src={video.thumbnail}
							alt={video.title}
							class="h-full w-full rounded-md object-cover"
						/>
						{#if video.duration > 0}
							<span
								class="bg-opacity-80 absolute right-1 bottom-1 rounded bg-black px-1 py-0.5 text-xs text-white"
							>
								{formatDuration(video.duration)}
							</span>
						{/if}
					</div>

					<!-- Info -->
					<div class="flex flex-col">
						<h3
							class="text-primary group-hover:text-accent line-clamp-2 text-sm font-semibold transition-colors"
						>
							{video.title}
						</h3>
						<div class="text-secondary mt-1 flex flex-wrap items-center gap-x-1.5 text-xs">
							{#if video.viewCount > 0}
								<span>{formatCount(video.viewCount)} views</span>
							{/if}
							{#if video.uploadedDate}
								{#if video.viewCount > 0}
									<span class="text-muted">·</span>
								{/if}
								<span>{video.uploadedDate}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
