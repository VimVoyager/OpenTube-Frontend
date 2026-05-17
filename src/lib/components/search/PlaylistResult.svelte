<script lang="ts">
	import type { PlaylistSearchResultConfig } from '$lib/adapters/types';
	import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
	import { goto } from '$app/navigation';

	let { result }: { result: PlaylistSearchResultConfig } = $props();

	let thumbnail = $derived(result.thumbnail || thumbnailPlaceholder);

	// TODO: Update redirect to correct endpoint when created.
	const redirectToPlaylist = () => goto(`/video/${encodeURIComponent(result.id)}?playlist=${encodeURIComponent(result.id)}&index=0`);

	function handleKey(event: KeyboardEvent) {
		if (event.key === 'Enter') redirectToPlaylist();
	}
</script>

<div>
	<!-- Desktop Layout (sm and above) - Horizontal grid matching VideoResult -->
	<div class="hidden sm:grid sm:grid-cols-3 gap-4 rounded-lg p-4 shadow-sm transition-colors hover:bg-secondary">
		<!-- Left side – stacked thumbnail (1/3) -->
		<div class="col-span-1 flex items-start justify-center">/
			<div
				role="button"
				tabindex="0"
				onclick={redirectToPlaylist}
				onkeydown={handleKey}
				class="cursor-pointer w-full"
			>
				<!-- Stacked thumbnail effect — two offset layers suggest a pile of videos -->
				<div class="relative w-full">
					<div class="absolute inset-x-0 top-0 h-full -translate-y-1.5 translate-x-1 rounded-md bg-muted opacity-40"></div>
					<div class="absolute inset-x-0 top-0 h-full -translate-y-0.75 translate-x-0.5 rounded-md bg-muted opacity-60"></div>
					<img
						src={thumbnail}
						alt={`Thumbnail for ${result.title}`}
						class="relative w-full h-auto rounded-md object-cover"
					/>
					<!-- Video count badge -->
					<div class="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
						</svg>
						{result.videoCount} videos
					</div>
				</div>
			</div>
		</div>

		<!-- Right side – text (2/3) -->
		<div class="col-span-2 flex flex-col justify-center">
			<div
				role="button"
				tabindex="0"
				onclick={redirectToPlaylist}
				onkeydown={handleKey}
				class="cursor-pointer hover:underline"
			>
				<h3 class="mb-1 text-lg font-semibold text-primary">{result.title}</h3>
			</div>
			<p class="mb-1 text-sm text-muted">Playlist</p>
			<a
				href={result.uploaderUrl}
				class="mt-1 flex items-center gap-1 text-sm text-secondary hover:underline w-fit"
				onclick={(e) => e.stopPropagation()}
			>
				{result.uploaderName}
			</a>
			<button
				onclick={redirectToPlaylist}
				class="mt-3 w-fit rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
			>
				▶ Play all
			</button>
		</div>
	</div>

	<!-- Mobile Layout (below sm) - Vertical -->
	<div
		role="button"
		tabindex="0"
		onclick={redirectToPlaylist}
		onkeydown={handleKey}
		class="sm:hidden rounded-lg p-3 shadow-sm transition-colors hover:bg-secondary cursor-pointer"
	>
		<!-- Stacked thumbnail - Full Width -->
		<div class="relative w-full mb-3">
			<div class="absolute inset-x-0 top-0 h-full -translate-y-1.25 translate-x-0.75 rounded-md bg-muted opacity-40"></div>
			<div class="absolute inset-x-0 top-0 h-full translate-y-[-2.5px] translate-x-[1.5px] rounded-md bg-muted opacity-60"></div>
			<img
				src={thumbnail}
				alt={`Thumbnail for ${result.title}`}
				class="relative w-full h-auto rounded-md object-cover"
			/>
			<!-- Video count badge -->
			<div class="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
				</svg>
				{result.videoCount} videos
			</div>
		</div>

		<!-- Content below thumbnail -->
		<div class="flex flex-col">
			<p class="mb-0.5 text-xs text-muted uppercase tracking-wide">Playlist</p>
			<h3 class="mb-1 text-base font-semibold text-primary line-clamp-2">{result.title}</h3>
			<p class="text-sm text-secondary">{result.uploaderName}</p>
		</div>
	</div>
</div>