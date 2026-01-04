<script lang="ts">
	import { onMount } from 'svelte';

	let isDark = $state(false);

	onMount(() => {
		// Check localStorage for saved preference
		const savedTheme = localStorage.getItem('theme');
		
		if (savedTheme === 'dark') {
			isDark = true;
			document.documentElement.classList.add('dark');
		} else if (savedTheme === 'light') {
			isDark = false;
			document.documentElement.classList.remove('dark');
		} else {
			// Default to dark mode if no preference is saved
			isDark = true;
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		}
	});

	function toggleTheme() {
		isDark = !isDark;
		
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}
</script>

<button
	onclick={toggleTheme}
	class="relative inline-flex items-center justify-center rounded-md p-2 text-secondary hover:bg-secondary hover:text-primary focus:outline-2 focus:-outline-offset-1 focus:border-accent transition-colors"
	aria-label="Toggle theme"
	title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	<!-- Sun icon (shown in dark mode) -->
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="size-5 {isDark ? 'block' : 'hidden'}"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2" />
		<path d="M12 20v2" />
		<path d="m4.93 4.93 1.41 1.41" />
		<path d="m17.66 17.66 1.41 1.41" />
		<path d="M2 12h2" />
		<path d="M20 12h2" />
		<path d="m6.34 17.66-1.41 1.41" />
		<path d="m19.07 4.93-1.41 1.41" />
	</svg>

	<!-- Moon icon (shown in light mode) -->
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="size-5 {isDark ? 'hidden' : 'block'}"
		aria-hidden="true"
	>
		<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
	</svg>
</button>