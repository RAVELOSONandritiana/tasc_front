<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table/index.js';
	import SearchInput from '$lib/components/user/SearchInput.svelte';

	let themeChecked = $state(true);

	$effect(() => {
		document.documentElement.classList.toggle('dark', themeChecked);
	});

	interface CompteEnAttente {
		id: string;
		nom: string;
		prenom: string;
		email: string;
		role: string;
		dateCreation: string;
		statut: 'en_attente' | 'actif' | 'bloque';
	}

	let comptesEnAttente = $state<CompteEnAttente[]>([
		{
			id: '1',
			nom: 'RAKOTO',
			prenom: 'Jean',
			email: 'jean.rakoto@email.com',
			role: 'Enseignant',
			dateCreation: '2026-01-15',
			statut: 'en_attente'
		},
		{
			id: '2',
			nom: 'ANDRIAMANARIVO',
			prenom: 'Marie',
			email: 'marie.andri@gmail.com',
			role: 'Surveillant',
			dateCreation: '2026-01-14',
			statut: 'en_attente'
		},
		{
			id: '3',
			nom: 'RASOLOFONIRINA',
			prenom: 'Paul',
			email: 'paul.raso@school.mg',
			role: 'Personnel',
			dateCreation: '2026-01-13',
			statut: 'actif'
		},
		{
			id: '4',
			nom: 'HERINDRINTSIANJARA',
			prenom: 'Sophie',
			email: 'sophie.heri@edu.mg',
			role: 'Enseignant',
			dateCreation: '2026-01-10',
			statut: 'bloque'
		}
	]);

	let searchCompte = $state('');
	let nouvelleAnnee = $state('');

	const comptesFiltres = $derived(
		comptesEnAttente.filter(
			(c) =>
				`${c.nom}${c.prenom}${c.email}${c.role}`
					.toLowerCase()
					.includes(searchCompte.toLowerCase())
		)
	);

	function validerCompte(id: string) {
		const compte = comptesEnAttente.find((c) => c.id === id);
		if (compte) {
			compte.statut = 'actif';
		}
	}

	function bloquerCompte(id: string) {
		const compte = comptesEnAttente.find((c) => c.id === id);
		if (compte && compte.statut === 'actif') {
			compte.statut = 'bloque';
		}
	}

	function debloquerCompte(id: string) {
		const compte = comptesEnAttente.find((c) => c.id === id);
		if (compte && compte.statut === 'bloque') {
			compte.statut = 'actif';
		}
	}

	function creerAnneeScolaire() {
		if (!nouvelleAnnee.trim()) return;
		const annee = { nom: nouvelleAnnee, dateCreation: new Date().toISOString().split('T')[0] };
		console.log('Nouvelle année scolaire créée:', annee);
		nouvelleAnnee = '';
	}
</script>

<div class="min-h-full bg-sidebar text-sidebar-foreground">
	<div class="space-y-8 p-4">
		<div class="flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-4">
			<h2 class="text-lg font-bold text-foreground">Gestion des comptes</h2>
			<SearchInput bind:value={searchCompte} placeholder="Rechercher un compte" class="w-64" />
		</div>

		<div class="rounded-md border border-blue-500 bg-blue-500/10 p-4">
			<div class="flex items-center gap-2">
				<AlertCircleIcon class="text-blue-500" />
				<span class="font-semibold">Comptes en attente de validation</span>
			</div>
			<p class="mt-1 text-sm">
				Les comptes en attente ne sont pas actifs. Vous devez les valider pour qu'ils puissent accéder à la plateforme.
			</p>
		</div>

		<div class="overflow-x-auto rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-40">Nom</Table.Head>
						<Table.Head>Prénom</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Rôle</Table.Head>
						<Table.Head>Date création</Table.Head>
						<Table.Head>Statut</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each comptesFiltres as compte (compte.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{compte.nom}</Table.Cell>
							<Table.Cell>{compte.prenom}</Table.Cell>
							<Table.Cell class="text-xs">{compte.email}</Table.Cell>
							<Table.Cell>{compte.role}</Table.Cell>
							<Table.Cell class="text-xs">{compte.dateCreation}</Table.Cell>
							<Table.Cell>
								<span class="inline-flex items-center gap-1 text-xs font-medium">
									{#if compte.statut === 'en_attente'}
										<span class="inline-block size-2 rounded-full bg-amber-500"></span>
										En attente
									{:else if compte.statut === 'actif'}
										<span class="inline-block size-2 rounded-full bg-emerald-500"></span>
										Actif
									{:else}
										<span class="inline-block size-2 rounded-full bg-destructive"></span>
										Bloqué
									{/if}
								</span>
							</Table.Cell>
							<Table.Cell class="text-right">
								{#if compte.statut === 'en_attente'}
									<Button size="sm" variant="default" class="h-7 px-2 text-xs" onclick={() => validerCompte(compte.id)}>
										<CheckCircleIcon class="mr-1 size-3" />
										Valider
									</Button>
								{:else if compte.statut === 'actif'}
									<Button size="sm" variant="destructive" class="h-7 px-2 text-xs" onclick={() => bloquerCompte(compte.id)}>
										<XCircleIcon class="mr-1 size-3" />
										Bloquer
									</Button>
								{:else}
									<Button size="sm" variant="secondary" class="h-7 px-2 text-xs" onclick={() => debloquerCompte(compte.id)}>
										Débloquer
									</Button>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>

	<div class="border-t border-sidebar-border p-4">
		<h2 class="mb-4 text-lg font-bold text-foreground">Gestion de l'année scolaire</h2>

		<div class="w-full max-w-md space-y-4 rounded-md border p-4">
			<Label class="text-md">Année scolaire actuelle : <strong class="text-blue-500">2025-2026</strong></Label>

			<AlertDialog.Root>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'default' })}>
					Nouvelle année scolaire
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Nouvelle année scolaire</AlertDialog.Title>
						<div class="rounded-md border border-destructive bg-destructive/10 p-3">
							<div class="flex items-center gap-2">
								<AlertCircleIcon />
								<span class="font-semibold">L'ancienne année scolaire sera désactivée</span>
							</div>
							<p class="mt-1 text-xs">
								La création d'une nouvelle année scolaire effacera les classes et élèves existants.
							</p>
						</div>
						<div class="mt-4 grid gap-3">
							<Label>Nom de l'année scolaire</Label>
							<Input placeholder="Ex: 2026-2027" bind:value={nouvelleAnnee} />
						</div>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
						<AlertDialog.Action onclick={creerAnneeScolaire}>Créer</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</div>
</div>