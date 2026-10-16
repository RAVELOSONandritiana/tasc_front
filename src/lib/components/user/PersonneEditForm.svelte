<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Pencil } from '@lucide/svelte/icons';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	type Props = {
		/** Informations actuelles de la personne (préremplissage). */
		current: {
			name: string;
			lastname: string;
			email: string;
			phone: string;
			domicile: string;
			fokontany: string;
			commune: string;
		};
		/** Vrai si l'utilisateur peut éditer (admin ou opérateur). */
		peutEditer: boolean;
	};

	const { current, peutEditer }: Props = $props();

	let ouvert = $state(false);
	let form = $state<ActionResult<{ success?: boolean; error?: string }> | null>(null);

	let valeur = $state({
		name: '',
		lastname: '',
		email: '',
		phone: '',
		domicile: '',
		fokontany: '',
		commune: ''
	});

	// Remplit puis resynchronise les champs à chaque mise à jour des données
	// serveur (realtime, invalidation) tant que le formulaire est fermé.
	$effect(() => {
		if (ouvert) return;
		valeur = {
			name: current.name,
			lastname: current.lastname,
			email: current.email,
			phone: current.phone,
			domicile: current.domicile,
			fokontany: current.fokontany,
			commune: current.commune
		};
	});
</script>

{#if peutEditer}
	<div>
		<Button variant="outline" size="sm" onclick={() => (ouvert = !ouvert)} class="gap-2">
			<Pencil class="size-4" />
			{ouvert ? 'Fermer l\u2019édition' : 'Modifier'}
		</Button>

		{#if ouvert}
			<form
				method="POST"
				action="?/updateInfo"
				class="mt-4 rounded-lg border border-sidebar-border bg-muted/20 p-4"
				use:enhance={() =>
					async ({ result, update }) => {
						form = result;
						update({ reset: false });
						if (result.type === 'success') ouvert = false;
					}}
			>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div class="grid gap-1">
						<Label for="edit-name">Nom</Label>
						<Input id="edit-name" name="name" bind:value={valeur.name} required />
					</div>
					<div class="grid gap-1">
						<Label for="edit-lastname">Prénom(s)</Label>
						<Input id="edit-lastname" name="lastname" bind:value={valeur.lastname} required />
					</div>
					<div class="grid gap-1">
						<Label for="edit-email">Email</Label>
						<Input id="edit-email" name="email" type="email" bind:value={valeur.email} />
					</div>
					<div class="grid gap-1">
						<Label for="edit-phone">Téléphone</Label>
						<Input id="edit-phone" name="phone" bind:value={valeur.phone} />
					</div>
					<div class="grid gap-1">
						<Label for="edit-domicile">Domicile</Label>
						<Input id="edit-domicile" name="domicile" bind:value={valeur.domicile} />
					</div>
					<div class="grid gap-1">
						<Label for="edit-fokontany">Fokontany</Label>
						<Input id="edit-fokontany" name="fokontany" bind:value={valeur.fokontany} />
					</div>
					<div class="grid gap-1">
						<Label for="edit-commune">Commune</Label>
						<Input id="edit-commune" name="commune" bind:value={valeur.commune} />
					</div>
				</div>
				<div class="mt-4 flex items-center gap-3">
					<Button type="submit" size="sm">Enregistrer</Button>
					{#if form?.type === 'success'}
						<span class="text-xs text-emerald-600">Informations mises à jour.</span>
					{:else if form?.type === 'failure'}
						<span class="text-xs text-destructive">{form.data?.error ?? 'Erreur'}</span>
					{/if}
				</div>
			</form>
		{/if}
	</div>
{/if}
