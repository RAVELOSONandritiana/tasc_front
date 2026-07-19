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
	import { Settings, Shield, CalendarRange, Plus, Check, Ban, Lock, KeyRound } from '@lucide/svelte/icons';
	import { loadingForm } from '$lib/actions/loadingForm';
	import type { PageProps } from './$types';

	const { data, form }: PageProps = $props();

	let searchCompte = $state('');
	let nouvelleAnnee = $state('');

	const demandesEnAttente = $derived(data.demandesReset.filter((d) => !d.done));

	const DEMANDES_PAR_PAGE = 5;
	let demandePage = $state(1);
	const demandesPagesTotales = $derived(
		Math.max(1, Math.ceil(data.demandesReset.length / DEMANDES_PAR_PAGE))
	);
	const demandePageCourante = $derived(Math.min(demandePage, demandesPagesTotales));
	const demandesAffichees = $derived(
		data.demandesReset.slice(
			(demandePageCourante - 1) * DEMANDES_PAR_PAGE,
			demandePageCourante * DEMANDES_PAR_PAGE
		)
	);

	const comptesFiltres = $derived(
		data.comptes.filter(
			(c) =>
				`${c.nom}${c.prenom}${c.email}${c.role}`
					.toLowerCase()
					.includes(searchCompte.toLowerCase())
		)
	);
</script>

<div class="flex min-h-0 flex-1 flex-col bg-background text-foreground">
	<div class="sticky top-0 z-10 bg-background p-4 md:p-6 border-b border-sidebar-border">
		<div class="space-y-4">
			<div class="animate-slide-down flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
					<Settings class="size-5 text-primary" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight">Paramètres</h1>
					<p class="text-xs text-muted-foreground">Gérez votre établissement</p>
				</div>
			</div>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-4 md:p-6">
		<div class="space-y-6">
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
									<Table.Cell class="font-medium">{compte.prenom}</Table.Cell>
									<Table.Cell>{compte.nom}</Table.Cell>
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
											<form method="POST" action="?/validerCompte" class="inline" use:loadingForm>
												<input type="hidden" name="id" value={compte.id} />
												<Button size="sm" variant="default" class="h-7 px-2 text-xs gap-1" type="submit">
													<Check class="size-3" />
													Valider
												</Button>
											</form>
										{:else if compte.statut === 'actif'}
											<form method="POST" action="?/bloquerCompte" class="inline" use:loadingForm>
												<input type="hidden" name="id" value={compte.id} />
												<Button size="sm" variant="destructive" class="h-7 px-2 text-xs gap-1" type="submit">
													<Ban class="size-3" />
													Bloquer
												</Button>
											</form>
										{:else}
											<form method="POST" action="?/debloquerCompte" class="inline" use:loadingForm>
												<input type="hidden" name="id" value={compte.id} />
												<Button size="sm" variant="secondary" class="h-7 px-2 text-xs gap-1" type="submit">
													<Lock class="size-3" />
													Débloquer
												</Button>
											</form>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</Card>

			<Card class="animate-slide-up stagger-2 opacity-0 space-y-4 p-5">
				<div class="flex items-center gap-2">
					<KeyRound class="size-4 text-primary" />
					<h2 class="font-semibold">Demandes de réinitialisation de mot de passe</h2>
					{#if demandesEnAttente.length > 0}
						<Badge variant="secondary" class="text-xs">{demandesEnAttente.length}</Badge>
					{/if}
				</div>
				<p class="text-xs text-muted-foreground">
					Lorsqu'un utilisateur clique sur « Mot de passe oublié » à la connexion, sa demande
					apparaît ici. Cliquez sur « Réinitialiser » pour générer un nouveau mot de passe, puis
					communiquez-le à l'utilisateur.
				</p>

				{#if form?.resetSuccess}
					<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
						<p class="font-medium text-emerald-500">
							Mot de passe réinitialisé pour le compte {form.matricule}
						</p>
						<p class="mt-1">
							Nouveau mot de passe : <span class="font-mono font-bold">{form.nouveauMdp}</span>
						</p>
					</div>
				{:else if form?.error}
					<div class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						{form.error}
					</div>
				{/if}

				{#if data.demandesReset.length === 0}
					<p class="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
						Aucune demande de réinitialisation.
					</p>
				{:else}
					<div class="space-y-2">
						{#each demandesAffichees as demande (demande.id)}
							<div
								class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 {demande.done
									? 'bg-muted/40'
									: 'bg-background'}"
							>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium">Matricule : {demande.matricule || '—'}</p>
									<p class="text-xs text-muted-foreground">{demande.description}</p>
									<p class="mt-1 text-xs text-muted-foreground">{demande.time}</p>
								</div>
								{#if demande.done}
									<Badge variant="outline" class="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-500">
										<Check class="size-3" />
										Traité
									</Badge>
								{:else}
									<form method="POST" action="?/traiterReset" use:loadingForm class="inline">
										<input type="hidden" name="notifId" value={demande.id} />
										<Button size="sm" type="submit" class="h-8 gap-1 text-xs">
											<KeyRound class="size-3" />
											Réinitialiser
										</Button>
									</form>
								{/if}
							</div>
						{/each}
					</div>

					{#if demandesPagesTotales > 1}
						<div class="mt-3 flex items-center justify-center gap-2">
							<Button
								size="sm"
								variant="outline"
								type="button"
								disabled={demandePageCourante === 1}
								onclick={() => (demandePage = Math.max(1, demandePageCourante - 1))}
							>
								Précédent
							</Button>
							{#each Array(demandesPagesTotales) as _, i (i)}
								<button
									type="button"
									class="size-8 rounded-md text-xs font-medium transition-colors {demandePage === i + 1
										? 'bg-primary text-primary-foreground'
										: 'border border-sidebar-border text-muted-foreground hover:bg-muted'}"
									onclick={() => (demandePage = i + 1)}
								>
									{i + 1}
								</button>
							{/each}
							<Button
								size="sm"
								variant="outline"
								type="button"
								disabled={demandePageCourante === demandesPagesTotales}
								onclick={() => (demandePage = Math.min(demandesPagesTotales, demandePageCourante + 1))}
							>
								Suivant
							</Button>
						</div>
					{/if}
				{/if}
			</Card>

			<Card class="animate-slide-up stagger-2 opacity-0 p-5 space-y-4">
				<div class="flex items-center gap-2">
					<CalendarRange class="size-4 text-primary" />
					<h2 class="font-semibold">Gestion des années scolaires</h2>
				</div>

				<div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
					<p class="text-xs">
						Année scolaire actuelle : <strong class="text-primary">{data.listeAnnees.find((a) => a.active)?.nom || 'Aucune'}</strong>
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
							{#each data.listeAnnees as annee (annee.id)}
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
											<form method="POST" action="?/activerAnnee" class="inline" use:loadingForm>
												<input type="hidden" name="id" value={annee.id} />
												<Button size="sm" variant="outline" class="h-7 px-2 text-xs" type="submit">
													Sélectionner
												</Button>
											</form>
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
					<div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
						<div class="flex items-center gap-2">
							<AlertCircleIcon class="size-4 text-blue-500" />
							<span class="text-xs font-medium">Environnement isolé</span>
						</div>
						<p class="mt-1 text-xs text-muted-foreground">
							La nouvelle année est créée à part et reste inactive. Elle démarre sans classes, élèves ni
							matières : seul le personnel et les employés sont conservés. Sélectionnez-la ensuite pour
							l'activer.
						</p>
					</div>
							<div class="mt-4 grid gap-3 w-full">
								<Label>Nom de l'année scolaire</Label>
								<Input class="w-full" placeholder="Ex: 2026-2027" name="nom" bind:value={nouvelleAnnee} form="form-creer-annee" />
							</div>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
							<form id="form-creer-annee" method="POST" action="?/creerAnnee" class="inline" use:loadingForm>
								<input type="hidden" name="nom" value={nouvelleAnnee} />
								<AlertDialog.Action type="submit">Créer</AlertDialog.Action>
							</form>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card>
		</div>
	</div>
</div>