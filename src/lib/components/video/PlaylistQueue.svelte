<script lang="ts">
	import type { RelatedVideoConfig } from '$lib/adapters/types';
	import { formatDuration } from '$lib/utils/formatters';
	import { tick } from 'svelte';

	interface Props {
		videos: RelatedVideoConfig[];
		playlistId: string;
		currentIndex: number;
		playlistName?: string;
	}

	let { videos, playlistId, currentIndex, playlistName = 'Playlist' }: Props = $props();

	function scrollActiveIntoView(node: HTMLElement, isActive: boolean) {
		if (isActive) tick().then(() => node.scrollIntoView({ block: 'nearest' }));
		return {
			update(newIsActive: boolean) {
				if (newIsActive) node.scrollIntoView({ block: 'nearest' });
			}
		};
	}
</script>

<div class="flex flex-col h-full max-h-105 rounded-lg border border-default bg-card overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-default shrink-0">
		<div>
			<h2 class="text-sm font-semibold text-primary">{playlistName}</h2>
			<p class="text-xs text-muted mt-0.5">{currentIndex + 1} / {videos.length}</p>
		</div>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
		</svg>
	</div>

	<!-- Scrollable list -->
	<div class="overflow-y-auto flex-1 py-1">
		{#each videos as video, i (video.id)}
			{@const isActive = i === currentIndex}

			<a
				use:scrollActiveIntoView={isActive}
				href="/video/{encodeURIComponent(video.id)}?playlist={encodeURIComponent(playlistId)}&index={i}"
				class="flex gap-3 px-3 py-2 transition-colors hover:bg-secondary relative
        {isActive ? 'bg-accent/10' : ''}"
				aria-current={isActive ? 'true' : undefined}
			>
			<!-- Active bar -->
			{#if isActive}
				<div class="absolute left-0 top-0 bottom-0 w-0.5 bg-accent rounded-r"></div>
			{/if}

			<!-- Index / playing indicator -->
			<div class="shrink-0 w-5 flex items-center justify-center">
				{#if isActive}
					<!-- Animated playing bars -->
					<div class="flex items-end gap-px h-4">
						<span class="w-0.5 bg-accent rounded-sm animate-[bounce_0.8s_ease-in-out_infinite]" style="height:60%"></span>
						<span class="w-0.5 bg-accent rounded-sm animate-[bounce_0.8s_ease-in-out_0.15s_infinite]" style="height:100%"></span>
						<span class="w-0.5 bg-accent rounded-sm animate-[bounce_0.8s_ease-in-out_0.3s_infinite]" style="height:40%"></span>
					</div>
				{:else}
					<span class="text-xs text-muted">{i + 1}</span>
				{/if}
			</div>

			<!-- Thumbnail -->
			<div class="relative shrink-0 w-28">
				<div class="relative" style="aspect-ratio: 16/9;">
					<img
						src={video.thumbnail}
						alt={`Thumbnail for ${video.title}`}
						class="w-full h-full rounded object-cover {isActive ? 'ring-1 ring-accent' : ''}"
					/>
					{#if video.duration > 0}
							<span class="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
								{formatDuration(video.duration)}
							</span>
					{/if}
				</div>
			</div>

			<!-- Info -->
			<div class="flex flex-col flex-1 min-w-0 justify-center">
				<h3 class="text-xs font-medium text-primary line-clamp-2 {isActive ? 'text-accent' : ''}">
					{video.title}
				</h3>
				<p class="text-xs text-muted mt-1 truncate">{video.channelName}</p>
			</div>
			</a>
		{/each}
	</div>
</div>