<script lang="ts">
	type Variant = 'error' | 'warning' | 'info' | 'empty';

	let {
		variant = 'error',
		title,
		message,
		icon = null,
		showRetry = false,
		onRetry = null,
		children
	}: {
		variant?: Variant;
		title: string;
		message: string;
		icon?: string | null;
		showRetry?: boolean;
		onRetry?: (() => void) | null;
		children?: any;
	} = $props();

	// Default icons for each variant
	const defaultIcons = {
		error: '⚠️',
		warning: '📹',
		info: 'ℹ️',
		empty: '🔍'
	};

	let displayIcon = $derived(icon ?? defaultIcons[variant]);

	// Variant styles
	const variantStyles = {
		error: 'bg-accent/10 border-accent/20',
		warning: 'bg-secondary border-default',
		info: 'bg-secondary border-default',
		empty: 'bg-secondary border-default'
	};

	const iconStyles = {
		error: 'text-accent',
		warning: 'text-muted',
		info: 'text-muted',
		empty: 'text-muted'
	};

	let containerClasses = $derived(variantStyles[variant]);
	let iconColorClasses = $derived(iconStyles[variant]);
</script>

<div class="rounded-lg border {containerClasses} mx-auto max-w-2xl p-8 text-center">
	{#if displayIcon}
		<div class="mb-4 text-5xl {iconColorClasses}">
			{displayIcon}
		</div>
	{/if}

	<h2 class="text-primary mb-2 text-lg font-semibold">
		{title}
	</h2>

	<p class="text-secondary mx-auto max-w-md text-sm">
		{message}
	</p>

	{#if showRetry && onRetry}
		<button
			class="bg-accent hover:bg-accent-hover mt-6 rounded-md px-6 py-2 font-medium text-white transition-colors"
			onclick={onRetry}
		>
			Retry
		</button>
	{/if}

	<!-- Optional slot for custom actions -->
	{@render children?.()}
</div>
