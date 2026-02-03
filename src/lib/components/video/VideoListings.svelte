<script lang="ts">
	import { goto } from '$app/navigation';
	import type { RelatedVideoConfig } from '$lib/adapters/types';

	let { videos = [] }: { videos?: RelatedVideoConfig[] } = $props();

	const formatViewCount = (viewCount: number): string => {
		const formatter = Intl.NumberFormat('en-US');
		return formatter.format(viewCount);
	};

	const formatDuration = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	const handleVideoClick = (videoId: string) => {
		goto(`/video/${videoId}`);
	};
</script>

<div class="flex w-full flex-col gap-4 px-6">
	{#if videos.length === 0}
		<!-- Empty state -->
		<div class="flex flex-col items-center justify-center py-8 text-center">
			<div class="text-4xl mb-4">📹</div>
			<p class="text-sm text-secondary">No related Videos available</p>
		</div>
	{:else}
		{#each videos as video (video.id)}
			<div 
				role="button" 
				tabindex="0"
				onclick={() => handleVideoClick(video.id)}
				onkeydown={(e) => e.key === 'Enter' && handleVideoClick(video.id)} 
				class="group flex gap-2 hover:bg-secondary rounded-lg transition-colors p-2 mx-2 cursor-pointer">
				<!-- Thumbnail -->
				<div class="relative shrink-0 w-40">
					<div class="relative" style="aspect-ratio: 16/9;">
						<img 
							src={video.thumbnail} 
							alt={`thumbnail-${video.id}`}
							class="w-full h-full rounded-md object-cover"
						/>
						<!-- Duration badge -->
						{#if video.duration > 0}
							<span class="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
								{formatDuration(video.duration)}
							</span>
						{/if}
					</div>
				</div>

				<!-- Video Info -->
				<div class="flex flex-col flex-1 min-w-0">
					<!-- Title -->
					<h3 class="text-sm font-semibold text-primary line-clamp-2 group-hover:text-accent transition-colors">
						{video.title}
					</h3>

					<!-- Channel Info -->
					<div class="mt-1 flex items-center gap-2">
						{#if video.channelAvatar}
							<img 
								src={video.channelAvatar} 
								alt={`${video.id}-channel-avatar-${video.channelName}`}
								class="h-6 w-6 rounded-full object-cover shrink-0"
							/>
						{/if}
						<p class="text-xs text-secondary truncate">
							{video.channelName}
						</p>
					</div>

					<!-- Video Stats -->
					<div class="mt-1 flex flex-row text-xs text-muted">
						<span>{formatViewCount(video.viewCount)} views</span>
						{#if video.uploadDate}
							<span class="mx-2">•</span>
							<span>{video.uploadDate}</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>