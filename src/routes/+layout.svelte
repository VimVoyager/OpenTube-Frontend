<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/navbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="fixed inset-x-0 top-0 z-40">
	<Navbar />
</div>
<div class="pt-16">
	{@render children?.()}
</div>
