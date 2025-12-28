<script lang="ts">
	import type { SearchResultConfig } from '$lib/adapters/types';
	import { formatCount, formatDate } from '$lib/utils/formatters';
	import thumbnailPlaceholder from '$lib/assets/thumbnail-placeholder.jpg';
	import avatarPlaceholder from '$lib/assets/logo-placeholder.svg';
	import { goto } from '$app/navigation';

	let { result }: { result: SearchResultConfig } = $props();

	// Use placeholder only as fallbacks
	let thumbnail = $derived(result.thumbnail || thumbnailPlaceholder);
	let avatar = $derived(result.channelAvatar || avatarPlaceholder);

	const redirectToVideoPlayer = () => {
		goto(`/video/${encodeURIComponent(result.id)}`);
	};

	function handleKey(event: KeyboardEvent) {
		if (event.key === 'Enter') redirectToVideoPlayer();
	}
</script>

<div>
	<!-- Desktop Layout (sm and above) - Horizontal -->
	<div class="hidden sm:grid sm:grid-cols-3 gap-4 rounded-lg p-4 shadow-sm transition-colors hover:bg-secondary">
		<!-- Left side – thumbnail (1/3) -->
		<div class="col-span-1 flex items-start justify-center">
			<div
				role="button"
				tabindex="0"
				onclick={redirectToVideoPlayer}
				onkeydown={handleKey}
				class="cursor-pointer w-full"
			>
				<img
					src={thumbnail}
					alt={`Thumbnail for ${result.title}`}
					class="h-auto w-full rounded-md object-cover"
				/>
			</div>
		</div>

		<!-- Right side – text (2/3) -->
		<div class="col-span-2 flex flex-col">
			<div
				role="button"
				tabindex="0"
				onclick={redirectToVideoPlayer}
				onkeydown={handleKey}
				class="cursor-pointer hover:underline"
			>
				<h3 class="mb-1 text-lg font-semibold text-primary">{result.title}</h3>
			</div>
			<p class="mb-2 text-sm text-muted">
				<span>{formatCount(result.viewCount)} views</span>
				<span class="mx-1 inline-block align-middle">•</span>
				<span>{formatDate(result.uploadDate)}</span>
			</p>
			<a
				href={result.channelUrl}
				class="col-space-2 my-3 flex items-center space-x-3 hover:opacity-80"
			>
				<img src={avatar} alt={result.channelName} class="h-8 w-8 rounded-full object-cover" />
				<p class="text-md font-semibold text-primary">
					{result.channelName}
					{#if result.verified}
						<span class="ml-1 text-muted" title="Verified">✓</span>
					{/if}
				</p>
			</a>
			<p class="line-clamp-3 overflow-hidden text-sm text-secondary">
				{result.description}
			</p>
		</div>
	</div>

	<!-- Mobile Layout (below sm) - Vertical -->
	<div class="sm:hidden rounded-lg p-3 shadow-sm transition-colors hover:bg-secondary">
		<!-- Thumbnail - Full Width -->
		<div
			role="button"
			tabindex="0"
			onclick={redirectToVideoPlayer}
			onkeydown={handleKey}
			class="cursor-pointer w-full mb-3"
		>
			<img
				src={thumbnail}
				alt={`Thumbnail for ${result.title}`}
				class="h-auto w-full rounded-md object-cover"
			/>
		</div>

		<!-- Content Below Thumbnail -->
		<div class="flex flex-col">
			<!-- Title -->
			<div
				role="button"
				tabindex="0"
				onclick={redirectToVideoPlayer}
				onkeydown={handleKey}
				class="cursor-pointer hover:underline"
			>
				<h3 class="mb-2 text-base font-semibold text-primary line-clamp-2">{result.title}</h3>
			</div>

			<!-- Channel Info -->
			<a
				href={result.channelUrl}
				class="mb-2 flex items-center space-x-2 hover:opacity-80"
			>
				<img src={avatar} alt={result.channelName} class="h-6 w-6 rounded-full object-cover" />
				<p class="text-sm font-medium text-primary">
					{result.channelName}
					{#if result.verified}
						<span class="ml-1 text-muted text-xs" title="Verified">✓</span>
					{/if}
				</p>
			</a>

			<!-- Views and Date -->
			<p class="text-xs text-muted">
				<span>{formatCount(result.viewCount)} views</span>
				<span class="mx-1 inline-block align-middle">•</span>
				<span>{formatDate(result.uploadDate)}</span>
			</p>

			<!-- Description (Optional on mobile) -->
			<p class="mt-2 line-clamp-2 overflow-hidden text-xs text-secondary">
				{result.description}
			</p>
		</div>
	</div>
</div>