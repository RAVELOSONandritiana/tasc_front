<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input';
	let checked = $state(true);

	$effect(() => {
		document.documentElement.classList.toggle('dark', checked);
	});
</script>

<div class="space-y-8 bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-bold text-foreground">Gerer la plateforme</h2>
		<Switch {checked} onCheckedChange={(details) => (checked = details.checked)}>
			<Switch.Label><h3 class="text-md">Toogle theme</h3></Switch.Label>
			<Switch.Control>
				<Switch.Thumb />
			</Switch.Control>
			<Switch.HiddenInput />
		</Switch>
	</div>

	<section class="w-full space-y-2">
		<Label class="text-md">Anne Scolaire</Label>
		<div class="w-full space-y-4 rounded-md border p-4">
			<Label>Anne scolaire Actuel : <strong class="text-blue-500">2025-2026</strong></Label>
			<Label>Creer un nouveau annee scolaire.</Label>

			<AlertDialog.Root>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'default' })}>
					Nouveau
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Nouveau anne scolaire</AlertDialog.Title>
						<Alert.Root variant="destructive">
							<AlertCircleIcon />
							<Alert.Title
								>L'ancien annee scolaire va etre desactiver apres la creation de la nouvelle</Alert.Title
							>
						</Alert.Root>
						<div class="flex flex-col gap-3 w-full">
							<Label>Nom</Label>
							<Input placeholder="Nom de l'anne scolaire" />
						</div>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action>Continue</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</section>
</div>
