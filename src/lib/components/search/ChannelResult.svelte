<script lang="ts">
	import type { ChannelSearchResultConfig } from '$lib/adapters/types';
	import { formatCount } from '$lib/utils/formatters';
	import avatarPlaceholder from '$lib/assets/logo-placeholder.svg';
	import { goto } from '$app/navigation';

	let { result }: { result: ChannelSearchResultConfig } = $props();

	let avatar = $derived(result.thumbnail || avatarPlaceholder);

	const redirectToChannel = () => goto(`/channel/${result.id}`);
	function handleKey(event: KeyboardEvent) {
		if (event.key === 'Enter') redirectToChannel();
	}
</script>

<div>
	<!-- Desktop -->
	<div class="hidden sm:flex items-center gap-6 rounded-lg p-4 shadow-sm transition-colors hover:bg-secondary">
		<div
			role="button"
			tabindex="0"
			onclick={redirectToChannel}
			onkeydown={handleKey}
			class="cursor-pointer shrink-0"
		>
			<img src={avatar} alt={result.name} class="h-24 w-24 rounded-full object-cover" />
		</div>
		<div class="flex flex-col">
			<div
				role="button"
				tabindex="0"
				onclick={redirectToChannel}
				onkeydown={handleKey}
				class="cursor-pointer hover:underline"
			>
				<h3 class="text-lg font-semibold text-primary">
					{result.name}
					{#if result.verified}
						<span class="ml-1 text-muted" title="Verified">✓</span>
					{/if}
				</h3>
			</div>
			{#if result.subscriberCount > 0}
				<p class="text-sm text-muted">{formatCount(result.subscriberCount)} subscribers</p>
			{/if}
			{#if result.description}
				<p class="mt-2 line-clamp-2 text-sm text-secondary">{result.description}</p>
			{/if}
		</div>
	</div>

	<!-- Mobile -->
	<div
		role="button"
		tabindex="0"
		onclick={redirectToChannel}
		onkeydown={handleKey}
		class="sm:hidden flex items-center gap-4 rounded-lg p-3 shadow-sm transition-colors hover:bg-secondary cursor-pointer"
	>
		<img src={avatar} alt={result.name} class="h-16 w-16 rounded-full object-cover shrink-0" />
		<div class="flex flex-col">
			<h3 class="text-base font-semibold text-primary">
				{result.name}
				{#if result.verified}
					<span class="ml-1 text-muted text-xs" title="Verified">✓</span>
				{/if}
			</h3>
			{#if result.subscriberCount > 0}
				<p class="text-xs text-muted">{formatCount(result.subscriberCount)} subscribers</p>
			{/if}
		</div>
	</div>
</div>