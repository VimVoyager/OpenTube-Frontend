<script lang="ts">
	import type { VideoSearchResultConfig } from '$lib/adapters/types';
	import { formatCount, formatDate } from '$lib/utils/formatters';
	import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
	import avatarPlaceholder from '$lib/assets/logo-placeholder.svg';
	import { extractIdFromUrl } from '$lib/utils/streamSelection';

	let { result }: { result: VideoSearchResultConfig } = $props();

	// Use placeholder only as fallbacks
	let thumbnail = $derived(result.thumbnail || thumbnailPlaceholder);
	let avatar = $derived(result.channelAvatar || avatarPlaceholder);

</script>

<div>
	<!-- Desktop Layout -->
	<div class="hidden sm:grid sm:grid-cols-3 gap-4 rounded-lg p-4 shadow-sm transition-colors hover:bg-secondary">
		<div class="col-span-1 flex items-start justify-center">
			<a href={`/video/${encodeURIComponent(result.id)}`} class="w-full">
				<img
					src={thumbnail}
					alt={`Thumbnail for ${result.title}`}
					class="h-auto w-full rounded-md object-cover"
				/>
			</a>
		</div>

		<div class="col-span-2 flex flex-col">
			<a href={`/video/${encodeURIComponent(result.id)}`} class="hover:underline">
				<h3 class="mb-1 text-lg font-semibold text-primary">{result.title}</h3>
			</a>
			<p class="mb-2 text-sm text-muted">
				<span>{formatCount(result.viewCount)} views</span>
				<span class="mx-1 inline-block align-middle">•</span>
				<span>{formatDate(result.uploadDate)}</span>
			</p>
			<a href={`/channel/${extractIdFromUrl(result.channelUrl)}`} class="col-space-2 my-3 flex items-center space-x-3 hover:opacity-80">
				<img src={avatar} alt={result.channelName} class="h-8 w-8 rounded-full object-cover" />
				<p class="text-md font-semibold text-primary">
					{result.channelName}
					{#if result.verified}
						<span class="ml-1 text-muted" title="Verified">✓</span>
					{/if}
				</p>
			</a>
			<p class="line-clamp-3 overflow-hidden text-sm text-secondary">{result.description}</p>
		</div>
	</div>

	<!-- Mobile Layout -->
	<div class="sm:hidden rounded-lg p-3 shadow-sm transition-colors hover:bg-secondary">
		<a href={`/video/${encodeURIComponent(result.id)}`} class="block w-full mb-3">
			<img
				src={thumbnail}
				alt={`Thumbnail for ${result.title}`}
				class="h-auto w-full rounded-md object-cover"
			/>
		</a>

		<div class="flex flex-col">
			<a href={`/video/${encodeURIComponent(result.id)}`} class="hover:underline">
				<h3 class="mb-2 text-base font-semibold text-primary line-clamp-2">{result.title}</h3>
			</a>
			<a href={`/channel/${extractIdFromUrl(result.channelUrl)}`} class="mb-2 flex items-center space-x-2 hover:opacity-80">
				<img src={avatar} alt={result.channelName} class="h-6 w-6 rounded-full object-cover" />
				<p class="text-sm font-medium text-primary">
					{result.channelName}
					{#if result.verified}
						<span class="ml-1 text-muted text-xs" title="Verified">✓</span>
					{/if}
				</p>
			</a>
			<p class="text-xs text-muted">
				<span>{formatCount(result.viewCount)} views</span>
				<span class="mx-1 inline-block align-middle">•</span>
				<span>{formatDate(result.uploadDate)}</span>
			</p>
			<p class="mt-2 line-clamp-2 overflow-hidden text-xs text-secondary">{result.description}</p>
		</div>
	</div>
</div>