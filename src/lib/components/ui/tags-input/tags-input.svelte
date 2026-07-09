<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index';
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils';

	let {
		values = $bindable<string[]>([]),
		options = [] as string[],
		placeholder = 'Ajouter une matière',
		class: className = undefined as string | undefined,
		disabled = false,
		onvalues = undefined as ((vals: string[]) => void) | undefined
	} = $props();

	let inputValue = $state('');

	function normalizeTag(value: string) {
		return value.trim().replace(/,+$/, '');
	}

	function addTag(value: string) {
		const normalized = normalizeTag(value);
		if (!normalized) return;
		const allowed = options.length
			? options.find((option) => option.toLowerCase() === normalized.toLowerCase())
			: normalized;
		if (!allowed) return;
		const isDuplicate = values.some((tag) => tag.toLowerCase() === allowed.toLowerCase());
		if (isDuplicate) return;
		values = [...values, allowed];
		inputValue = '';
		onvalues?.(values);
	}

	function removeTag(index: number) {
		values = values.filter((_, i) => i !== index);
		onvalues?.(values);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;
		const { key } = event;
		if (key === 'Enter' || key === ',' || key === 'Tab') {
			event.preventDefault();
			addTag(inputValue);
		}
		if (key === 'Backspace' && !inputValue && values.length) {
			event.preventDefault();
			removeTag(values.length - 1);
		}
	}

	const filteredOptions = $derived(
		options
			.filter((option) => option.toLowerCase().includes(inputValue.toLowerCase()))
			.filter((option) => !values.some((tag) => tag.toLowerCase() === option.toLowerCase()))
	);
</script>

<div class={cn('grid gap-2', className)}>
	<div
		class="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
	>
		{#each values as tag, index}
			<Badge
				class="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-sm text-muted-foreground"
			>
				<span>{tag}</span>
				<button
					type="button"
					class="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
					onclick={() => removeTag(index)}
					aria-label="Supprimer {tag}"
				>
					<XIcon class="h-3 w-3" />
				</button>
			</Badge>
		{/each}
		<input
			class="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
			type="text"
			{placeholder}
			bind:value={inputValue}
			onkeydown={handleKeyDown}
			{disabled}
		/>
	</div>
	{#if filteredOptions.length && inputValue}
		<div
			class="max-h-40 overflow-auto rounded-b-md border border-t-0 border-input bg-popover p-2 shadow-sm"
		>
			{#each filteredOptions as option}
				<button
					type="button"
					class="w-full rounded-md px-2 py-1 text-left text-sm text-foreground transition hover:bg-muted"
					onclick={() => addTag(option)}
				>
					{option}
				</button>
			{/each}
		</div>
	{/if}
	<p class="text-xs text-muted-foreground">
		Sélectionnez une matière dans la liste et appuyez sur Entrée.
	</p>
</div>
