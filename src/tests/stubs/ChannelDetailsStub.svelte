<script lang="ts">
	import type { Snippet } from 'svelte';

	// Passthrough stub for ChannelDetails used in +page.svelte tests. Renders
	// both snippets so the page's snippet bodies (and the deriveds they read)
	// execute, without pulling in the real ChannelDetails dependency tree.
	// activeTab is $bindable because the page uses bind:activeTab.
	let {
		activeTab = $bindable('videos'),
		videos,
		playlists
	}: {
		channel?: unknown;
		activeTab?: string;
		videos?: Snippet;
		playlists?: Snippet;
	} = $props();
</script>

<div data-testid="channel-details-stub" data-active-tab={activeTab}>
	{@render videos?.()}
	{@render playlists?.()}
</div>