<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table/index.js';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Settings, Shield, CalendarRange, Plus, Check, Ban, Lock } from '@lucide/svelte/icons';

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

	let listeAnnees = $state([
		{ id: '1', nom: '2024-2025', dateCreation: '2024-01-15', active: false },
		{ id: '2', nom: '2025-2026', dateCreation: '2025-01-15', active: true },
		{ id: '3', nom: '2026-2027', dateCreation: '2026-01-10', active: false },
	]);

	function creerAnneeScolaire() {
		if (!nouvelleAnnee.trim()) return;
		const annee = { id: Date.now().toString(), nom: nouvelleAnnee, dateCreation: new Date().toISOString().split('T')[0], active: false };
		listeAnnees = [...listeAnnees, annee];
		nouvelleAnnee = '';
	}

	function selectAnnee(id: string) {
		listeAnnees = listeAnnees.map((a) => ({ ...a, active: a.id === id }));
	}
</script>

<div class="min-h-full bg-background text-foreground">
	<div class="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
		<!-- Header -->
		<div class="animate-slide-down flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
				<Settings class="size-5 text-primary" />
			</div>
			<div>
				<h1 class="text-xl font-bold tracking-tight">Paramètres</h1>
				<p class="text-xs text-muted-foreground">Gérez votre établissement</p>
			</div>
		</div>

		<!-- Gestion des comptes -->
		<Card class="animate-slide-up stagger-1 opacity-0 p-5 space-y-4">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-2">
					<Shield class="size-4 text-primary" />
					<h2 class="font-semibold">Gestion des comptes</h2>
					<Badge variant="secondary" class="text-xs">{comptesFiltres.length}</Badge>
				</div>
				<SearchInput bind:value={searchCompte} placeholder="Rechercher un compte" class="w-64" />
			</div>

			<div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
				<div class="flex items-center gap-2">
					<AlertCircleIcon class="size-4 text-blue-500" />
					<span class="text-xs font-medium">Comptes en attente de validation</span>
				</div>
				<p class="mt-1 text-xs text-muted-foreground">
					Les comptes en attente ne sont pas actifs. Vous devez les valider pour qu'ils puissent accéder à la plateforme.
				</p>
			</div>

			<div class="overflow-x-auto rounded-lg border">
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
							<Table.Row class="transition-colors hover:bg-muted/50">
								<Table.Cell class="font-medium">{compte.nom}</Table.Cell>
								<Table.Cell>{compte.prenom}</Table.Cell>
								<Table.Cell class="text-xs">{compte.email}</Table.Cell>
								<Table.Cell>{compte.role}</Table.Cell>
								<Table.Cell class="text-xs">{compte.dateCreation}</Table.Cell>
								<Table.Cell>
									{#if compte.statut === 'en_attente'}
										<Badge variant="outline" class="gap-1 text-xs border-amber-500/30 bg-amber-500/10 text-amber-500">
											<span class="size-1.5 rounded-full bg-amber-500 animate-pulse-soft"></span>
											En attente
										</Badge>
									{:else if compte.statut === 'actif'}
										<Badge variant="outline" class="gap-1 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
											<span class="size-1.5 rounded-full bg-emerald-500"></span>
											Actif
										</Badge>
									{:else}
										<Badge variant="outline" class="gap-1 text-xs border-destructive/30 bg-destructive/10 text-destructive">
											<span class="size-1.5 rounded-full bg-destructive"></span>
											Bloqué
										</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									{#if compte.statut === 'en_attente'}
										<Button size="sm" variant="default" class="h-7 px-2 text-xs gap-1" onclick={() => validerCompte(compte.id)}>
											<Check class="size-3" />
											Valider
										</Button>
									{:else if compte.statut === 'actif'}
										<Button size="sm" variant="destructive" class="h-7 px-2 text-xs gap-1" onclick={() => bloquerCompte(compte.id)}>
											<Ban class="size-3" />
											Bloquer
										</Button>
									{:else}
										<Button size="sm" variant="secondary" class="h-7 px-2 text-xs gap-1" onclick={() => debloquerCompte(compte.id)}>
											<Lock class="size-3" />
											Débloquer
										</Button>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card>

		<!-- Gestion des années scolaires -->
		<Card class="animate-slide-up stagger-2 opacity-0 p-5 space-y-4">
			<div class="flex items-center gap-2">
				<CalendarRange class="size-4 text-primary" />
				<h2 class="font-semibold">Gestion des années scolaires</h2>
			</div>

			<div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
				<p class="text-xs">
					Année scolaire actuelle : <strong class="text-primary">{listeAnnees.find((a) => a.active)?.nom || 'Aucune'}</strong>
				</p>
			</div>

			<div class="overflow-x-auto rounded-lg border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Année</Table.Head>
							<Table.Head>Date création</Table.Head>
							<Table.Head>Statut</Table.Head>
							<Table.Head class="text-right">Action</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each listeAnnees as annee (annee.id)}
							<Table.Row class="transition-colors hover:bg-muted/50">
								<Table.Cell class="font-medium">{annee.nom}</Table.Cell>
								<Table.Cell class="text-xs">{annee.dateCreation}</Table.Cell>
								<Table.Cell>
									{#if annee.active}
										<Badge variant="outline" class="gap-1 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
											<span class="size-1.5 rounded-full bg-emerald-500"></span>
											Actuelle
										</Badge>
									{:else}
										<Badge variant="outline" class="gap-1 text-xs">
											<span class="size-1.5 rounded-full bg-muted-foreground"></span>
											Inactive
										</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									{#if !annee.active}
										<Button size="sm" variant="outline" class="h-7 px-2 text-xs" onclick={() => selectAnnee(annee.id)}>
											Sélectionner
										</Button>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<AlertDialog.Root>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'default', size: 'sm' })}>
					<Plus class="size-3.5" />
					Nouvelle année scolaire
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Nouvelle année scolaire</AlertDialog.Title>
						<div class="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
							<div class="flex items-center gap-2">
								<AlertCircleIcon class="size-4 text-destructive" />
								<span class="text-xs font-medium">L'ancienne année scolaire sera désactivée</span>
							</div>
							<p class="mt-1 text-xs text-muted-foreground">
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
		</Card>
	</div>
</div>
