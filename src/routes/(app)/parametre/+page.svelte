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
	import { Settings, Shield, CalendarRange, Plus, Check, Ban, Lock, KeyRound, Trash2 } from '@lucide/svelte/icons';
	import { loadingForm } from '$lib/actions/loadingForm';
	import type { PageProps } from './$types';

	const { data, form }: PageProps = $props();

	let searchCompte = $state('');
	let nouvelleAnnee = $state('');
	let nouveauSeuil = $state('3');

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

	let confirmTerminer = $state(false);

	// Règles d'affectation de série (élèves de 2nde admis) saisies lors de la clôture.
	type Condition = { matiereId: string; op: string; valeur: string };
	let conditionsParSerie = $state<Record<string, Condition[]>>(
		Object.fromEntries((data.series ?? []).map((s) => [s, []]))
	);

	// Sélection des examens prise en compte (globale à toutes les séries).
	let tousLesExamens = $state(false);
	let examensSelectionnes = $state<string[]>([]);

	function ajouterCondition(serie: string) {
		conditionsParSerie[serie] = [
			...(conditionsParSerie[serie] ?? []),
			{ matiereId: '', op: '>=', valeur: '' }
		];
	}
	function supprimerCondition(serie: string, idx: number) {
		conditionsParSerie[serie] = (conditionsParSerie[serie] ?? []).filter((_, i) => i !== idx);
	}

	// Sérialise les règles (séries ayant au moins une condition complète) pour l'envoi.
	const reglesJSON = $derived(
		JSON.stringify({
			examens: { tous: tousLesExamens, ids: tousLesExamens ? [] : examensSelectionnes },
			series: (data.series ?? [])
				.map((s) => ({
					serie: s,
					conditions: (conditionsParSerie[s] ?? [])
						.filter((c) => c.matiereId && c.valeur !== '')
						.map((c) => ({ matiereId: c.matiereId, op: c.op, valeur: Number(c.valeur) }))
				}))
				.filter((r) => r.conditions.length > 0)
		})
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

				<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
					<div>
						<p class="text-sm font-medium">Clôturer l'année scolaire</p>
						<p class="mt-1 text-xs text-muted-foreground">
							Recalcule automatiquement la situation de tous les élèves de l'année active :
							moyenne ≥ 10 → Passant, sinon → Redoublant.
						</p>
					</div>
					<AlertDialog.Root bind:open={confirmTerminer}>
						<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive', size: 'sm' })}>
							Terminer l'année scolaire
						</AlertDialog.Trigger>
						<AlertDialog.Content class="max-w-2xl">
							<AlertDialog.Header>
								<AlertDialog.Title>Terminer l'année scolaire ?</AlertDialog.Title>
								<AlertDialog.Description>
									Tous les élèves de l'année active seront recalculés : ceux dont la moyenne
									générale est inférieure à 10 passeront en <strong>Redoublant</strong>, les
									autres en <strong>Passant</strong>. Les élèves sans note ne sont pas modifiés.
								</AlertDialog.Description>
							</AlertDialog.Header>

							<div class="max-h-[55vh] space-y-3 overflow-y-auto rounded-lg border border-sidebar-border p-3">
								<p class="text-xs text-muted-foreground">
									<strong>Règles d'affectation des séries</strong> (élèves de 2nde admis).
									Pour chaque série, définissez des conditions sur la moyenne d'une matière
									(issues des examens choisis) : un élève est affecté à la
									<strong>première série</strong> dont <strong>toutes</strong> les conditions
									sont vraies. Si aucune règle ne correspond, la série reste à renseigner
									manuellement en délibération.
								</p>

								<!-- Sélection des examens : globale à toutes les séries -->
								<div class="rounded-lg border border-primary/30 bg-primary/5 p-3">
									<p class="text-xs font-medium">Périodes prises en compte (global à toutes les séries)</p>
									<label class="mt-2 flex w-fit items-center gap-2 text-sm">
										<input type="checkbox" bind:checked={tousLesExamens} class="size-4" />
										Inclure tous les examens
									</label>
									{#if !tousLesExamens}
										<div class="mt-2 flex flex-wrap gap-2">
											{#each (data.examens ?? []) as ex (ex.id)}
												<label
													class="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs"
												>
													<input type="checkbox" value={ex.id} bind:group={examensSelectionnes} class="size-3.5" />
													<span class="font-medium">{ex.nom}</span>
													{#if ex.periode}<span class="text-muted-foreground">· {ex.periode}</span>{/if}
													<span class="text-muted-foreground"
														>{new Date(ex.date).toLocaleDateString('fr-FR')}</span
													>
												</label>
											{/each}
										</div>
										{#if (data.examens ?? []).length === 0}
											<p class="mt-2 text-xs italic text-muted-foreground">Aucun examen disponible.</p>
										{/if}
									{/if}
								</div>

								{#if (data.series ?? []).length === 0}
									<p class="text-xs italic text-muted-foreground">Aucune série disponible dans l'établissement.</p>
								{/if}

								{#each (data.series ?? []) as serie (serie)}
									<div class="rounded-lg border border-sidebar-border p-3">
										<div class="flex items-center justify-between gap-2">
											<span class="text-sm font-semibold">Série {serie.toUpperCase()}</span>
											<Button
												type="button"
												size="sm"
												variant="outline"
												class="h-7 gap-1 text-xs"
												onclick={() => ajouterCondition(serie)}
											>
												<Plus class="size-3" /> Condition
											</Button>
										</div>

										{#each (conditionsParSerie[serie] ?? []) as cond, i (i)}
											<div class="mt-2 flex flex-wrap items-center gap-2">
												<select
													class="h-8 min-w-[10rem] rounded-md border border-input bg-background px-3 text-sm"
													bind:value={cond.matiereId}
												>
													<option value="">Matière…</option>
													{#each (data.matieres ?? []) as mat (mat.id)}
														<option value={mat.id}>{mat.nom}</option>
													{/each}
												</select>
												<select
													class="h-8 w-16 rounded-md border border-input bg-background px-3 text-sm"
													bind:value={cond.op}
												>
													<option value=">=">≥</option>
													<option value=">">&gt;</option>
													<option value="<=">≤</option>
													<option value="<">&lt;</option>
													<option value="==">=</option>
												</select>
												<Input
													type="number"
													step="0.5"
													min="0"
													max="20"
													placeholder="Moyenne"
													class="h-8 w-28 px-3"
													bind:value={cond.valeur}
												/>
												<Button
													type="button"
													size="sm"
													variant="ghost"
													class="h-7 px-2 text-destructive"
													onclick={() => supprimerCondition(serie, i)}
												>
													<Trash2 class="size-3.5" />
												</Button>
											</div>
										{/each}

										{#if (conditionsParSerie[serie] ?? []).length === 0}
											<p class="mt-2 text-xs italic text-muted-foreground">
												Aucune condition : cette série ne sera pas attribuée automatiquement.
											</p>
										{/if}
									</div>
								{/each}

								<input type="hidden" name="regles" value={reglesJSON} form="form-terminer" />
							</div>

							<AlertDialog.Footer>
								<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
								<form id="form-terminer" method="POST" action="?/terminerAnnee" use:loadingForm>
									<AlertDialog.Action type="submit">Terminer l'année</AlertDialog.Action>
								</form>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
				</div>

				{#if form?.termine}
					<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
						<p class="font-medium text-emerald-600">Année clôturée.</p>
						<p class="mt-1">
							{form.majeres} élève(s) recalculé(s), dont {form.redoublants} en redoublant.
							{#if form.seriesAttribuees}
								{form.seriesAttribuees} élève(s) de 2nde ont été affecté(s) automatiquement à une série.
							{/if}
						</p>
					</div>
				{/if}

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
							<Label class="mt-1">Seuil d'absences pour convocation des parents</Label>
							<Input
								class="w-full"
								type="number"
								min="1"
								placeholder="Ex: 3"
								name="seuil"
								bind:value={nouveauSeuil}
								form="form-creer-annee"
							/>
							<p class="text-xs text-muted-foreground">
								Une alerte de convocation des parents est envoyée à chaque multiple de ce nombre
								d'absences (ex : 3, 6, 9…).
							</p>
						</div>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
						<form id="form-creer-annee" method="POST" action="?/creerAnnee" class="inline" use:loadingForm>
							<input type="hidden" name="nom" value={nouvelleAnnee} />
							<input type="hidden" name="seuil" value={nouveauSeuil} />
							<AlertDialog.Action type="submit">Créer</AlertDialog.Action>
						</form>
					</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card>
		</div>
	</div>
</div>