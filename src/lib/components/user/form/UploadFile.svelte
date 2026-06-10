<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Upload } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		header = 'uploader image',
		children,
		files = $bindable<FileList | null>(null),
		onSubmit
	}: {
		open?: boolean;
		header?: string;
		children?: Snippet;
		files?: FileList | null;
		onSubmit?: () => void;
	} = $props();
	let previewUrl = $state('');

	$effect(() => {
		if (files && files.length > 0) {
			previewUrl = URL.createObjectURL(files[0]);
		}
	});
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{header}</AlertDialog.Title>
		</AlertDialog.Header>

		<label
			for="image"
			class="flex h-50 w-full items-center justify-center overflow-hidden border border-2 border-dashed"
		>
			<input type="file" name="image" id="image" class="hidden" bind:files />
			{#if previewUrl.length > 0}
				<img src={previewUrl} alt="preview url" class="object-cover" />
			{:else}
				<Upload size={80} />
			{/if}
		</label>

		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (previewUrl = '')}>Annuler</AlertDialog.Cancel>
			{#if children}
				{@render children()}
			{:else if onSubmit}
				<AlertDialog.Action onclick={onSubmit}>Envoyer</AlertDialog.Action>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
