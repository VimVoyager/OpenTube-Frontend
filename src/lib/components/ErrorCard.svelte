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

<div class="rounded-lg border {containerClasses} p-8 text-center mx-auto max-w-2xl">
	{#if displayIcon}
		<div class="text-5xl mb-4 {iconColorClasses}">
			{displayIcon}
		</div>
	{/if}
	
	<h2 class="text-lg font-semibold text-primary mb-2">
		{title}
	</h2>
	
	<p class="text-sm text-secondary max-w-md mx-auto">
		{message}
	</p>

	{#if showRetry && onRetry}
		<button 
			class="mt-6 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2 rounded-md transition-colors"
			onclick={onRetry}
		>
			Retry
		</button>
	{/if}

	<!-- Optional slot for custom actions -->
	{@render children?.()}
</div>