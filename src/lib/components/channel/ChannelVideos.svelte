<script lang="ts">
	import { formatCount, formatDuration } from '$lib/utils/formatters';
	import type { ChannelVideoConfig } from '$lib/adapters/types';

	let {videos} : {videos: ChannelVideoConfig[]} = $props();
</script>


<div>
	{#if videos.length === 0}
		<div class="flex flex-col items-center justify-center py-12 text-center px-6">
			<div class="text-4xl mb-4">📹</div>
			<p class="text-sm text-secondary">No videos available</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6 pb-8">
			{#each videos as video (video.id)}
				<a
					href="/video/{video.id}"
					data-sveltekit-preload-data="tap"
					class="group flex flex-col gap-2 hover:bg-secondary rounded-lg transition-colors p-2 cursor-pointer"
				>
					<!-- Thumbnail -->
					<div class="relative w-full" style="aspect-ratio: 16/9;">
						<img
							src={video.thumbnail}
							alt={video.title}
							class="w-full h-full rounded-md object-cover"
						/>
						{#if video.duration > 0}
										<span
											class="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded"
										>
											{formatDuration(video.duration)}
										</span>
						{/if}
					</div>

					<!-- Info -->
					<div class="flex flex-col">
						<h3
							class="text-sm font-semibold text-primary line-clamp-2 group-hover:text-accent transition-colors"
						>
							{video.title}
						</h3>
						<div class="mt-1 flex items-center gap-x-1.5 text-xs text-secondary flex-wrap">
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