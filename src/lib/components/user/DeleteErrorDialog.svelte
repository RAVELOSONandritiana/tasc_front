<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	let {
		open = $bindable(false),
		message = ''
	}: {
		open?: boolean;
		message?: string;
	} = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Suppression impossible</AlertDialog.Title>
			<AlertDialog.Description>{message}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Action onclick={() => (open = false)}>Compris</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
