<script lang="ts">
	import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
	import { formatCount } from '$lib/utils/formatters';
	import { resolve } from '$app/paths';
	import VideoThumbnail from '$lib/components/VideoThumbnail.svelte';
	import type { RelatedVideoConfig } from '$lib/adapters/related';

	let { videos = [] }: { videos?: RelatedVideoConfig[] } = $props();

	function handleAvatarError(e: Event) {
		(e.currentTarget as HTMLImageElement).src = logoPlaceholder;
	}
</script>

<div class="flex w-full flex-col gap-4 px-6">
	{#if videos.length === 0}
		<!-- Empty state -->
		<div class="flex flex-col items-center justify-center py-8 text-center">
			<div class="mb-4 text-4xl">📹</div>
			<p class="text-secondary text-sm">No related Videos available</p>
		</div>
	{:else}
		{#each videos as video (video.id)}
			<div
				class="group hover:bg-secondary relative mx-2 flex gap-2 rounded-lg p-2 transition-colors"
			>
				<!-- Stretched invisible link covering the whole card -->
				<a
					href={resolve('/video/[id]', { id: video.id })}
					class="absolute inset-0 rounded-lg"
					aria-label={video.title}
				></a>

				<div class="relative w-40 shrink-0">
					<a href={resolve('/video/[id]', { id: video.id })} class="absolute inset-0 block w-full">
						<VideoThumbnail
							src={video.thumbnail}
							alt={`${video.title} thumbnail`}
							duration={video.duration}
						/>
					</a>
				</div>

				<div class="flex min-w-0 flex-1 flex-col">
					<h3
						class="text-primary group-hover:text-accent line-clamp-2 text-sm font-semibold transition-colors"
					>
						{video.title}
					</h3>

					<div class="mt-1 flex items-center">
						<a
							href={resolve('/channel/[channelId]', { channelId: video.channelId })}
							data-sveltekit-preload-data="tap"
							class="relative z-20 flex items-center gap-2"
						>
							{#if video.channelAvatar}
								<img
									src={video.channelAvatar || logoPlaceholder}
									alt={`${video.id}-channel-avatar-${video.channelName}`}
									class="h-6 w-6 shrink-0 rounded-full object-cover"
									onerror={handleAvatarError}
								/>
							{/if}
							<p class="text-secondary truncate text-xs">
								{video.channelName}
							</p>
						</a>
					</div>

					<div class="text-muted mt-1 flex flex-row text-xs">
						<span>{formatCount(video.viewCount)} views</span>
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
