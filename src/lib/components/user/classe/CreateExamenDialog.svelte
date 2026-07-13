<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { loadingForm } from '$lib/actions/loadingForm';
	import { Calendar } from '@lucide/svelte/icons';
	import type { Examen } from '$lib/types/Materiel.type';

	let {
		open = $bindable(false),
		classeNom = '',
		onCreate
	}: {
		open?: boolean;
		classeNom?: string;
		onCreate?: (examen: Examen) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});

	let nouvelExamen = $state({
		nom: '',
		date: '',
		periode: ''
	});

	$effect(() => {
		if (open) {
			nouvelExamen = { nom: '', date: '', periode: '' };
			errors = {};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Créer un examen</Dialog.Title>
			<Dialog.Description>Examen pour la classe {classeNom}</Dialog.Description>
		</Dialog.Header>

		{#if errors._form}
			<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
				<p class="text-sm text-destructive">{errors._form}</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/createExamen"
			use:loadingForm={{
				handler: () => {
					errors = {};
					return async ({ result }) => {
						const data = result.data as
							| { examen?: Examen; error?: string; _form?: string }
							| undefined;
						if (result.type === 'success') {
							const examen = data?.examen;
							if (examen && onCreate) {
								onCreate({
									id: examen.id,
									nom: examen.nom,
									date: new Date(examen.date).toISOString().split('T')[0],
									classeId: examen.classeId,
									periode: examen.periode || undefined,
									sousExamens: examen.sousExamens || []
								});
							}
							open = false;
						} else if (result.type === 'failure') {
							const error = data?.error || data?._form || 'Erreur lors de la création';
							errors = { _form: error };
						}
					};
				}
			}}
			class="space-y-4"
		>
			<div class="grid gap-2">
				<Label for="examen_nom">Nom de l'examen *</Label>
				<Input id="examen_nom" name="nom" placeholder="Examen de mi-semestre" />
			</div>
			<div class="grid gap-2">
				<Label for="examen_date">Date *</Label>
				<Input id="examen_date" name="date" type="date" />
			</div>
			<div class="grid gap-2">
				<Label for="examen_periode">Période</Label>
				<Input id="examen_periode" name="periode" placeholder="Semestre 1" />
			</div>
			<Dialog.Footer class="gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}
					>Annuler</Button
				>
				<Button type="submit" size="sm">Créer</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
