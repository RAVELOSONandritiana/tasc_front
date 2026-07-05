<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { EleveCours } from '$lib/types/Materiel.type';

	interface Props {
		open?: boolean;
		eleves?: EleveCours[];
	}

	let { open = $bindable(false), eleves = [] }: Props = $props();

	let matricule = $state('');
	let motDePasse = $state('');
	let presenceEnCours = $state<Record<string, boolean>>({});

	function verifierProfesseur() {
		if (!matricule || !motDePasse) return false;
		console.log('Vérification:', { matricule, motDePasse });
		return true;
	}

	function demarrerPresence() {
		if (verifierProfesseur()) {
			presenceEnCours = {};
			eleves.forEach((e) => (presenceEnCours[e.id] = false));
		}
	}

	function validerPresence() {
		const presentIds = Object.entries(presenceEnCours)
			.filter(([_, present]) => present)
			.map(([id]) => id);
		console.log('Présents:', presentIds);
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content class="sm:max-w-2xl">
		<AlertDialog.Header>
			<AlertDialog.Title>Authentification du professeur</AlertDialog.Title>
			<AlertDialog.Description>
				Entrez vos identifiants pour démarrer la présence
			</AlertDialog.Description>
		</AlertDialog.Header>

		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="matricule">Matricule *</Label>
				<Input id="matricule" bind:value={matricule} placeholder="Ex: ENS-047" />
			</div>
			<div class="grid gap-2">
				<Label for="motdepasse">Mot de passe *</Label>
				<Input id="motdepasse" type="password" bind:value={motDePasse} placeholder="••••••••" />
			</div>

			{#if Object.keys(presenceEnCours).length > 0}
				<div class="mt-4">
					<Label class="mb-2 block font-semibold">Liste des élèves</Label>
					<div class="max-h-64 overflow-y-auto rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="w-12">Présent</Table.Head>
									<Table.Head>Élève</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each eleves as eleve (eleve.id)}
									<Table.Row>
										<Table.Cell>
											<Checkbox bind:checked={presenceEnCours[eleve.id]} />
										</Table.Cell>
										<Table.Cell>
											<span class="font-medium">{eleve.nom} {eleve.prenom}</span>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</div>
			{/if}
		</div>

		<AlertDialog.Footer class="flex justify-between">
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			{#if Object.keys(presenceEnCours).length === 0}
				<AlertDialog.Action onclick={demarrerPresence}>Démarrer</AlertDialog.Action>
			{:else}
				<AlertDialog.Action onclick={validerPresence}>Valider</AlertDialog.Action>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
