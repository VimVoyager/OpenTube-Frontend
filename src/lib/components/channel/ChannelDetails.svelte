<script lang="ts">
	import logoPlaceholder from '$lib/assets/logo-placeholder.svg';
	import type { ChannelConfig } from '$lib/adapters/types';

	export type ChannelTab = 'home' | 'videos' | 'playlists';

	let {
		channel,
		activeTab = $bindable<ChannelTab>('home'),
		home,
		videos,
		playlists
	}: {
		channel: ChannelConfig;
		activeTab?: ChannelTab;
		home?: import('svelte').Snippet;
		videos?: import('svelte').Snippet;
		playlists?: import('svelte').Snippet;
	} = $props();

	const tabs: { id: ChannelTab; label: string }[] = [
		{ id: 'home', label: 'Home' },
		{ id: 'videos', label: 'Videos' },
		{ id: 'playlists', label: 'Playlists' }
	];

	let descriptionExpanded = $state(false);
	const MAX_DESC_LENGTH = 180;
	const isDescriptionLong = $derived(
		!!channel.description && channel.description.length > MAX_DESC_LENGTH
	);
	const displayedDescription = $derived(
		isDescriptionLong && !descriptionExpanded
			? channel.description!.slice(0, MAX_DESC_LENGTH) + '...'
			: (channel.description ?? '')
	);

	function handleAvatarError(e: Event) {
		(e.currentTarget as HTMLImageElement).src = logoPlaceholder;
	}
</script>

<div class="flex flex-col w-full">
	<!-- Banner -->
	<div class="w-full overflow-hidden bg-secondary" style="aspect-ratio: 32/9; max-height: 200px;">
		{#if channel.bannerUrl}
			<img src={channel.bannerUrl} alt="Channel banner" class="w-full h-full object-cover" />
		{:else}
			<div class="w-full h-full bg-gradient-to-r from-secondary to-muted opacity-60"></div>
		{/if}
	</div>

	<!-- Channel info row -->
	<div class="px-6 pt-3 pb-4">
		<div class="flex items-start gap-4">
			<!-- Avatar — pulls up over the banner -->
			<div class="shrink-0 -mt-10 z-10">
				<img
					src={channel.avatarUrl || logoPlaceholder}
					alt="{channel.name} avatar"
					class="w-20 h-20 rounded-full object-cover border-4 border-[var(--color-bg,#fff)] shadow-sm"
					onerror={handleAvatarError}
				/>
			</div>

			<!-- Name / stats / description -->
			<div class="flex flex-col min-w-0 mt-2 flex-1">
				<!-- Channel name + verified badge -->
				<div class="flex items-center gap-1.5">
					<h1 class="text-xl font-bold text-primary leading-tight">{channel.name}</h1>
					{#if channel.verified}
						<svg
							class="w-4 h-4 text-secondary shrink-0"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-label="Verified channel"
						>
							<path
								d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.59L6.7 12.7a.996.996 0 1 1 1.41-1.41l2.47 2.47 5.88-5.88a.996.996 0 1 1 1.41 1.41l-6.58 6.57a.996.996 0 0 1-1.41 0z"
							/>
						</svg>
					{/if}
				</div>

				<!-- Handle · subscribers · video count -->
				<div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-secondary mt-0.5">
					{#if channel.handle}
						<span>{channel.handle}</span>
						<span class="text-muted">·</span>
					{/if}
					<span>{channel.subscriberCount} subscribers</span>
					{#if channel.videoCount > 0}
						<span class="text-muted">·</span>
						<span>{channel.videoCount.toLocaleString()} videos</span>
					{/if}
				</div>

				<!-- Description with expand/collapse -->
				{#if channel.description}
					<div class="mt-2 text-xs text-secondary leading-relaxed max-w-2xl">
						<span>{displayedDescription}</span>
						{#if isDescriptionLong}
							<button
								onclick={() => (descriptionExpanded = !descriptionExpanded)}
								class="ml-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
							>
								{descriptionExpanded ? 'Show less' : '...more'}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Tab bar -->
	<div class="border-b border-default px-6">
		<div class="flex" role="tablist" aria-label="Channel sections">
			{#each tabs as tab}
				<button
					role="tab"
					aria-selected={activeTab === tab.id}
					onclick={() => (activeTab = tab.id)}
					class="relative px-4 py-3 text-sm font-medium transition-colors cursor-pointer
						{activeTab === tab.id
							? 'text-primary'
							: 'text-secondary hover:text-primary'}"
				>
					{tab.label}
					{#if activeTab === tab.id}
						<span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm"></span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Tab content -->
	<div class="mt-6">
		{#if activeTab === 'home'}
			{#if home}
				{@render home()}
			{:else}
				<div class="flex flex-col items-center justify-center py-12 text-center px-6">
					<div class="text-4xl mb-4">🏠</div>
					<p class="text-sm text-secondary">Home content coming soon</p>
				</div>
			{/if}
		{:else if activeTab === 'videos'}
			{#if videos}
				{@render videos()}
			{:else}
				<div class="flex flex-col items-center justify-center py-12 text-center px-6">
					<div class="text-4xl mb-4">📹</div>
					<p class="text-sm text-secondary">No videos available</p>
				</div>
			{/if}
		{:else if activeTab === 'playlists'}
			{#if playlists}
				{@render playlists()}
			{:else}
				<div class="flex flex-col items-center justify-center py-12 text-center px-6">
					<div class="text-4xl mb-4">📋</div>
					<p class="text-sm text-secondary">No playlists available</p>
				</div>
			{/if}
		{/if}
	</div>
</div>