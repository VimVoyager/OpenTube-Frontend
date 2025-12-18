<script lang="ts">
	import { goto } from '$app/navigation';

	let query = '';

	function executeSearch() {
		if (!query.trim()) return;

		goto(`/results?query=${encodeURIComponent(query.trim())}`);
	}

	function handleKey(event: KeyboardEvent) {
		if (event.key === 'Enter') executeSearch();
	}
</script>

<nav
	class="relative bg-white shadow-sm dark:bg-black dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:bottom-0 dark:after:h-px dark:after:bg-white/10"
>
	<div class="mx-auto px-2 sm:px-4 lg:px-8">
		<div class="flex h-14 justify-between">
			<div class="flex px-2 lg:px-0">
				<div class="flex shrink-0 items-center">
					<img
						src="src/lib/assets/streaming-logo.png"
						alt="Your Company"
						class="h-11 w-auto dark:hidden"
					/>
					<img
						src="src/lib/assets/streaming-logo.png"
						alt="Your Company"
						class="h-11 w-auto not-dark:hidden"
					/>
				</div>
			</div>
			<div class="flex flex-1 items-center justify-center px-2 lg:ml-6">
				<div class="grid w-full max-w-lg grid-cols-1">
					<input
						type="search"
						name="search"
						bind:value={query}
						on:keydown={handleKey}
						placeholder="Search"
						class="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-red-500"
					/>
					<svg
						viewBox="0 0 20 20"
						fill="currentColor"
						data-slot="icon"
						aria-hidden="true"
						class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400"
					>
						<path
							d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
							clip-rule="evenodd"
							fill-rule="evenodd"
						/>
					</svg>
				</div>
			</div>
			<div class="flex items-center lg:hidden">
				<!-- Mobile menu button -->
				<button
					type="button"
					command="--toggle"
					commandfor="mobile-menu"
					class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-2 focus:-outline-offset-1 focus:outline-red-600 dark:hover:bg-white/5 dark:hover:text-white dark:focus:outline-red-500"
				>
					<span class="absolute -inset-0.5"></span>
					<span class="sr-only">Open main menu</span>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						data-slot="icon"
						aria-hidden="true"
						class="size-6 in-aria-expanded:hidden"
					>
						<path
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						data-slot="icon"
						aria-hidden="true"
						class="size-6 not-in-aria-expanded:hidden"
					>
						<path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</div>
	</div>
</nav>
