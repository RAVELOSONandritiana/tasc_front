<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';

	let {
		open = $bindable(false),
		title = 'Confirmer la suppression',
		description = 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
		confirmLabel = 'Supprimer',
		loading = false,
		onConfirm
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		confirmLabel?: string;
		loading?: boolean;
		onConfirm?: () => void | Promise<void>;
	} = $props();

	async function handleConfirm() {
		await onConfirm?.();
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={loading}>Annuler</AlertDialog.Cancel>
			<Button type="button" variant="destructive" disabled={loading} onclick={handleConfirm}>
				{#if loading}
					<Spinner class="mr-2 size-4" />
				{/if}
				{confirmLabel}
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
