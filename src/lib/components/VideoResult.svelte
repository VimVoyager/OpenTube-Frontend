<script lang="ts">
	import type { SearchResultConfig } from '$lib/adapters/types';
	import { formatCount, formatDate } from '$lib/utils/formatters';
	import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
	import avatarPlaceholder from '$lib/assets/logo-placeholder.svg';

	export let result: SearchResultConfig;

	// Use placeholder only as fallbacks
	$: thumbnail = result.thumbnail || thumbnailPlaceholder;
	$: avatar = result.channelAvatar || avatarPlaceholder;
</script>

<div class="grid grid-cols-3 gap-4 rounded-lg p-4 shadow-sm transition-colors hover:bg-gray-900">
	<!-- Left side – thumbnail -->
	<div class="col-span-1 flex items-start justify-center">
		<a href={result.url}>
			<img
				src={thumbnail}
				alt={`Thumbnail for ${result.title}`}
				class="h-auto w-full rounded-md object-cover"
			/>
		</a>
	</div>

	<!-- Right side – text (2/3 of the width) -->
	<div class="col-span-2 flex flex-col">
		<a href={result.url} class="hover:underline">
			<h3 class="mb-1 text-lg font-semibold text-white">{result.title}</h3>
		</a>
		<p class="mb-2 text-sm text-gray-400">
			<span>{formatCount(result.viewCount)} views</span>
			<span class="mx-1 inline-block align-middle">•</span>
			<span>{formatDate(result.uploadDate)}</span>
		</p>
		<a
			href={result.channelUrl}
			class="col-space-2 my-3 flex items-center space-x-3 hover:opacity-80"
		>
			<img src={avatar} alt={result.channelName} class="h-8 w-8 rounded-full object-cover" />
			<p class="text-md font-semibold text-white">
				{result.channelName}
				{#if result.verified}
					<span class="ml-1 text-gray-400" title="Verified">✓</span>
				{/if}
			</p>
		</a>
		<p
			class="
					line-clamp-3 overflow-hidden
					text-sm
					text-gray-400
				"
		>
			{result.description}
		</p>
	</div>
</div>
