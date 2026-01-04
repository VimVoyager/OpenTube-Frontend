<script lang="ts">
	import { goto } from '$app/navigation';
	import logo from '../../assets/streaming-logo.png';
	import ThemeToggle from './ThemeToggle.svelte';

	let query = $state('');
	let showMobileSearch = $state(false);

	function executeSearch() {
		if (!query.trim()) return;

		goto(`/results?query=${encodeURIComponent(query.trim())}`);
		showMobileSearch = false; // Close mobile search after search
	}

	function handleKey(event: KeyboardEvent) {
		if (event.key === 'Enter') executeSearch();
	}

	function toggleMobileSearch() {
		showMobileSearch = !showMobileSearch;
	}
</script>

<nav class="relative bg-navbar border-b border-default">
	<div class="mx-auto px-2 sm:px-4 lg:px-8">
		<div class="flex h-14 justify-between items-center">
			<!-- Logo -->
			<div class="flex px-2 lg:px-0 shrink-0">
				<div class="flex items-center">
					<img
						src={logo}
						alt="OpenTube"
						class="h-11 w-auto dark:hidden"
					/>
					<img
						src={logo}
						alt="OpenTube"
						class="h-11 w-auto not-dark:hidden"
					/>
				</div>
			</div>

			<!-- Desktop Search - Hidden on mobile -->
			<div class="hidden md:flex flex-1 items-center justify-center px-2 lg:ml-6">
				<div class="grid w-full max-w-lg grid-cols-1">
					<input
						type="search"
						name="search"
						bind:value={query}
						onkeydown={handleKey}
						placeholder="Search"
						class="col-start-1 row-start-1 block w-full rounded-md bg-card py-1.5 pr-3 pl-10 text-base text-primary border border-default placeholder:text-muted focus:outline-2 focus:-outline-offset-2 focus:border-accent sm:text-sm/6"
					/>
					<svg
						viewBox="0 0 20 20"
						fill="currentColor"
						data-slot="icon"
						aria-hidden="true"
						class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-muted"
					>
						<path
							d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
							clip-rule="evenodd"
							fill-rule="evenodd"
						/>
					</svg>
				</div>
			</div>

			<!-- Right side buttons -->
			<div class="flex items-center gap-2">
				<!-- Mobile Search Button -->
				<button
					type="button"
					class="md:hidden relative inline-flex items-center justify-center rounded-md p-2 text-secondary hover:bg-secondary hover:text-primary focus:outline-2 focus:-outline-offset-1 focus:border-accent"
					onclick={toggleMobileSearch}
					aria-label="Search"
				>
					<svg
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-5"
					>
						<path
							d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
							clip-rule="evenodd"
							fill-rule="evenodd"
						/>
					</svg>
				</button>

				<!-- Theme toggle button -->
				<ThemeToggle />
			</div>
		</div>

		<!-- Mobile Search Dropdown -->
		{#if showMobileSearch}
			<div class="md:hidden py-3 px-2 border-t border-default">
				<div class="grid grid-cols-1">
					<input
						type="search"
						name="mobile-search"
						bind:value={query}
						onkeydown={handleKey}
						placeholder="Search"
						class="col-start-1 row-start-1 block w-full rounded-md bg-card py-1.5 pr-3 pl-10 text-base text-primary border border-default placeholder:text-muted focus:outline-2 focus:-outline-offset-2 focus:border-accent"
					/>
					<svg
						viewBox="0 0 20 20"
						fill="currentColor"
						data-slot="icon"
						aria-hidden="true"
						class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-muted"
					>
						<path
							d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
							clip-rule="evenodd"
							fill-rule="evenodd"
						/>
					</svg>
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Accent strip at bottom -->
	<div class="absolute inset-x-0 bottom-0 h-0.5 bg-accent"></div>
</nav>