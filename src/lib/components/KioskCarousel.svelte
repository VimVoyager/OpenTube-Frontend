<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { KioskVideoConfig } from '$lib/adapters/types';
	import { resolve } from '$app/paths';
	import { formatCount } from '$lib/utils/formatters';
	import VideoThumbnail from '$lib/components/VideoThumbnail.svelte';

	interface Props {
		title: string;
		videos: KioskVideoConfig[];
		card?: Snippet<[KioskVideoConfig]>;
	}

	let { title, videos, card }: Props = $props();

	let track: HTMLDivElement | undefined = $state();
	let atStart: boolean = $state(true);
	let atEnd: boolean = $state(false);

	function updateEdges(): void {
		if (!track) return;
		const { scrollLeft, scrollWidth, clientWidth } = track;
		atStart = scrollLeft <= 1;
		atEnd = scrollLeft + clientWidth >= scrollWidth - 1;
	}

	function page(direction: 1 | -1): void {
		if (!track) return;
		track.scrollBy({ left: direction * Math.round(track.clientWidth * 0.9), behavior: 'smooth' });
	}

	$effect(() => {
		if (!track || videos.length === 0) return;
		updateEdges();
	});
</script>

<svelte:window onresize={updateEdges} />

<section class="mb-10">
	<div class="mb-3 flex items-center justify-between gap-4 px-1">
		<h2 class="text-primary text-lg font-semibold">{title}</h2>

		<div class="flex items-center gap-2">
			<button
				type="button"
				class="hidden size-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-100 disabled:opacity-30 sm:flex"
				aria-label="Scroll {title} left"
				disabled={atStart}
				onclick={() => page(-1)}
			>
				&#8249;
			</button>
			<button
				type="button"
				class="hidden size-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-100 disabled:opacity-30 sm:flex"
				aria-label="Scroll {title} right"
				disabled={atEnd}
				onclick={() => page(1)}
			>
				&#8250;
			</button>
		</div>
	</div>

	<div
		bind:this={track}
		onscroll={updateEdges}
		class="flex snap-x snap-mandatory scrollbar-none gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none]"
		role="list"
		aria-label={title}
	>
		{#each videos as video (video.id)}
			<div role="listitem" class="w-64 shrink-0 snap-start sm:w-72">
				{#if card}
					{@render card(video)}
				{:else}
					<a
						href={resolve('/video/[id]', { id: video.id })}
						aria-label={video.title}
						class="group block rounded-lg"
					>
						<VideoThumbnail
							src={video.thumbnail}
							alt={`${video.title} thumbnail`}
							duration={video.duration}
						/>
						<h3 class="text-primary mt-2 line-clamp-2 text-sm leading-snug font-semibold">
							{video.title}
						</h3>
						<p class="mt-1 truncate text-xs text-neutral-400">{video.channelName}</p>
						<p class="text-xs text-neutral-400">
							{#if video.viewCount > 0}
								{formatCount(video.viewCount)} views
							{/if}
							{#if video.viewCount > 0 && video.uploadDate}
								<span aria-hidden="true"> · </span>
							{/if}
							{video.uploadDate}
						</p>
					</a>
				{/if}
			</div>
		{/each}
	</div>
</section>
