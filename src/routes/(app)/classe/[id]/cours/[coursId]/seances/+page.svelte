<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import {
		ArrowLeft,
		CalendarDays,
		ClipboardList,
		Clock,
		Hourglass,
		Percent,
		TriangleAlert,
		UserCheck,
		UserX,
		Users
	} from '@lucide/svelte/icons';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let recherche = $state('');
	let dateDebut = $state('');
	let dateFin = $state('');
	let seulementIncidents = $state(false);

	const couleur = $derived(data.cours.couleur || '#3b82f6');

	function jour(iso: string): string {
		return iso.slice(0, 10);
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('fr-FR', {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatHeure(iso: string): string {
		const d = new Date(iso);
		// Un pointage saisi au jour (sans heure) est stocke a minuit : inutile
		// d'afficher « 00:00 ».
		if (d.getHours() === 0 && d.getMinutes() === 0) return '';
		return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	}

	function pluriel(valeur: number, singulier: string, pluriel = `${singulier}s`): string {
		return valeur > 1 ? pluriel : singulier;
	}

	function formatHeures(valeur: number | null): string {
		if (valeur === null || valeur === undefined) return '—';
		return `${valeur}h`;
	}

	const termeRecherche = $derived(recherche.trim().toLowerCase());

	const seancesFiltrees = $derived(
		data.seances.filter((s) => {
			if (dateDebut && jour(s.date) < dateDebut) return false;
			if (dateFin && jour(s.date) > dateFin) return false;
			if (seulementIncidents && s.absents.length === 0 && s.retards.length === 0) return false;
			if (!termeRecherche) return true;
			const cible = [
				s.professeur,
				s.causeIncomplet || '',
				...s.absents.map((a) => `${a.numero} ${a.nom} ${a.cause || ''}`),
				...s.retards.map((r) => `${r.numero} ${r.nom} ${r.cause || ''}`)
			]
				.join(' ')
				.toLowerCase();
			return cible.includes(termeRecherche);
		})
	);

	const totauxFiltres = $derived({
		seances: seancesFiltrees.length,
		absences: seancesFiltrees.reduce((s, x) => s + x.absents.length, 0),
		retards: seancesFiltrees.reduce((s, x) => s + x.retards.length, 0),
		heures:
			Math.round(seancesFiltrees.reduce((s, x) => s + (x.heuresEffectuees || 0), 0) * 100) / 100
	});

	const elevesFiltres = $derived(
		data.eleves
			.filter((e) =>
				termeRecherche
					? `${e.numero} ${e.nom} ${e.prenom}`.toLowerCase().includes(termeRecherche)
					: true
			)
			.filter((e) => (seulementIncidents ? e.absences > 0 || e.retards > 0 : true))
	);

	function couleurTaux(taux: number): string {
		if (taux >= 90) return 'text-emerald-500';
		if (taux >= 75) return 'text-amber-500';
		return 'text-red-500';
	}

	function reinitialiser() {
		recherche = '';
		dateDebut = '';
		dateFin = '';
		seulementIncidents = false;
	}
</script>

<div class="flex flex-1 flex-col bg-sidebar text-sidebar-foreground">
	<header
		class="flex flex-wrap items-center justify-between gap-3 border-b border-sidebar-border bg-card/80 px-4 py-3 backdrop-blur-sm"
	>
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="sm" href={`/classe/${data.classeId}/cours`}>
				<ArrowLeft class="size-4" />
			</Button>
			<span class="size-3 shrink-0 rounded-full" style="background-color: {couleur}"></span>
			<div>
				<h1 class="text-lg font-semibold">Séances — {data.cours.nom}</h1>
				<p class="text-xs text-muted-foreground">
					{data.classeNom}{data.classeSerie ? ` · ${data.classeSerie}` : ''} • Prof. {data.cours
						.professeur} • Coef. {data.cours.coefficient} • {data.stats.effectif}
					{pluriel(data.stats.effectif, 'élève')}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				href={`/classe/${data.classeId}/cours/${data.coursId}/presence`}
			>
				<ClipboardList class="mr-2 size-4" />
				Pointer une séance
			</Button>
		</div>
	</header>

	<div class="flex-1 space-y-4 overflow-y-auto p-4">
		<!-- Résumé global de la matière -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			<div class="rounded-2xl border border-sidebar-border bg-card/60 p-3">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<CalendarDays class="size-3.5" /> Séances
				</div>
				<p class="mt-1 text-2xl font-bold">{data.stats.nbSeances}</p>
				<p class="text-[11px] text-muted-foreground">
					{#if data.stats.derniereSeance}
						Dernière : {formatDate(data.stats.derniereSeance)}
					{:else}
						Aucune séance enregistrée
					{/if}
				</p>
			</div>

			<div class="rounded-2xl border border-sidebar-border bg-card/60 p-3">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Hourglass class="size-3.5" /> Heures faites
				</div>
				<p class="mt-1 text-2xl font-bold">{data.stats.heuresEffectuees}h</p>
				<p class="text-[11px] text-muted-foreground">
					{data.stats.heuresPrevues > 0
						? `sur ${data.stats.heuresPrevues}h prévues`
						: 'Prévu non défini'}
				</p>
			</div>

			<div class="rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<UserX class="size-3.5" /> Absences
				</div>
				<p class="mt-1 text-2xl font-bold text-red-500">{data.stats.totalAbsences}</p>
				<p class="text-[11px] text-muted-foreground">
					dont {data.stats.absencesJustifiees}
					{pluriel(data.stats.absencesJustifiees, 'justifiée')}
				</p>
			</div>

			<div class="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Clock class="size-3.5" /> Retards
				</div>
				<p class="mt-1 text-2xl font-bold text-amber-500">{data.stats.totalRetards}</p>
				<p class="text-[11px] text-muted-foreground">
					dont {data.stats.retardsJustifies}
					{pluriel(data.stats.retardsJustifies, 'justifié')}
				</p>
			</div>

			<div class="rounded-2xl border border-sidebar-border bg-card/60 p-3">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Percent class="size-3.5" /> Taux de présence
				</div>
				<p class="mt-1 text-2xl font-bold {couleurTaux(data.stats.tauxPresence)}">
					{data.stats.tauxPresence}%
				</p>
				<p class="text-[11px] text-muted-foreground">Sur l'ensemble des séances</p>
			</div>

			<div class="rounded-2xl border border-sidebar-border bg-card/60 p-3">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<TriangleAlert class="size-3.5" /> Séances à problème
				</div>
				<p class="mt-1 text-2xl font-bold">
					{data.stats.seancesIncompletes + data.stats.coursManques}
				</p>
				<p class="text-[11px] text-muted-foreground">
					{data.stats.coursManques}
					{pluriel(data.stats.coursManques, 'manquée')} · {data.stats.seancesIncompletes}
					{pluriel(data.stats.seancesIncompletes, 'incomplète')}
				</p>
			</div>
		</div>

		{#if data.creneaux.length > 0}
			<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
				<span class="font-medium">Créneaux à l'emploi du temps :</span>
				{#each data.creneaux as c (c.id)}
					<Badge variant="outline">
						{c.jour}
						{c.heureDebut}–{c.heureFin}{c.salle ? ` · ${c.salle}` : ''}
					</Badge>
				{/each}
			</div>
		{/if}

		<!-- Filtres -->
		<div
			class="flex flex-wrap items-end gap-3 rounded-2xl border border-sidebar-border bg-card/60 p-3"
		>
			<div class="min-w-56 flex-1">
				<Label class="mb-1 block text-[11px] font-normal text-muted-foreground">Rechercher</Label>
				<SearchInput placeholder="Élève, numéro, professeur, motif…" bind:value={recherche} />
			</div>
			<div class="grid gap-1">
				<Label for="dateDebut" class="text-[11px] font-normal text-muted-foreground">Du</Label>
				<Input id="dateDebut" type="date" class="w-40" bind:value={dateDebut} />
			</div>
			<div class="grid gap-1">
				<Label for="dateFin" class="text-[11px] font-normal text-muted-foreground">Au</Label>
				<Input id="dateFin" type="date" class="w-40" bind:value={dateFin} />
			</div>
			<label class="flex items-center gap-2 pb-2 text-xs">
				<input type="checkbox" class="size-4 accent-primary" bind:checked={seulementIncidents} />
				Absences / retards uniquement
			</label>
			<Button variant="ghost" size="sm" class="pb-2" onclick={reinitialiser}>Réinitialiser</Button>
		</div>

		<Tabs.Root value="seances">
			<Tabs.List>
				<Tabs.Trigger value="seances">
					<CalendarDays class="size-4" /> Séances ({seancesFiltrees.length})
				</Tabs.Trigger>
				<Tabs.Trigger value="eleves">
					<Users class="size-4" /> Récap par élève ({elevesFiltres.length})
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Liste des séances -->
			<Tabs.Content value="seances" class="space-y-3">
				{#if seancesFiltrees.length === 0}
					<div class="rounded-2xl border border-dashed border-sidebar-border p-10 text-center">
						<CalendarDays class="mx-auto mb-3 size-10 text-muted-foreground" />
						<p class="font-medium text-muted-foreground">
							{data.seances.length === 0
								? 'Aucune séance enregistrée pour cette matière'
								: 'Aucune séance ne correspond aux filtres'}
						</p>
						{#if data.seances.length === 0}
							<p class="mt-1 text-sm text-muted-foreground">
								Les séances apparaissent ici dès qu'un pointage est enregistré.
							</p>
							<Button
								class="mt-4"
								size="sm"
								href={`/classe/${data.classeId}/cours/${data.coursId}/presence`}
							>
								Enregistrer un pointage
							</Button>
						{/if}
					</div>
				{:else}
					<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
						<span>
							{totauxFiltres.seances}
							{pluriel(totauxFiltres.seances, 'séance')}
							{pluriel(totauxFiltres.seances, 'affichée')}
						</span>
						<span class="text-red-500">
							{totauxFiltres.absences}
							{pluriel(totauxFiltres.absences, 'absence')}
						</span>
						<span class="text-amber-500">
							{totauxFiltres.retards}
							{pluriel(totauxFiltres.retards, 'retard')}
						</span>
						<span>{totauxFiltres.heures}h effectuées</span>
					</div>

					{#each seancesFiltrees as seance (seance.id)}
						<div class="overflow-hidden rounded-2xl border border-sidebar-border bg-card/60">
							<div class="flex flex-wrap items-center justify-between gap-3 p-3">
								<div>
									<p class="text-sm font-semibold">
										{formatDate(seance.date)}
										{#if formatHeure(seance.date)}
											<span class="ml-1 text-xs font-normal text-muted-foreground">
												{formatHeure(seance.date)}
											</span>
										{/if}
									</p>
									<p class="text-xs text-muted-foreground">
										Prof. {seance.professeur}
										{#if seance.source === 'DIRECT'}
											<span class="ml-1">· séance en direct</span>
										{/if}
									</p>
								</div>
								<div class="flex flex-wrap items-center gap-2 text-xs">
									<Badge variant="outline">
										<Hourglass class="size-3" />
										{formatHeures(seance.heuresEffectuees)}
										{#if seance.heuresPrevues}
											<span class="text-muted-foreground">/ {seance.heuresPrevues}h</span>
										{/if}
									</Badge>
									<Badge variant="outline" class="text-emerald-600">
										<UserCheck class="size-3" />
										{seance.presents}
										{pluriel(seance.presents, 'présent')}
									</Badge>
									<Badge variant="outline" class="text-amber-600">
										<Clock class="size-3" />
										{seance.retards.length}
										{pluriel(seance.retards.length, 'retard')}
									</Badge>
									<Badge variant="outline" class="text-red-600">
										<UserX class="size-3" />
										{seance.absents.length}
										{pluriel(seance.absents.length, 'absent')}
									</Badge>
									{#if seance.profAbsent}
										<Badge variant="destructive">Cours manqué</Badge>
									{/if}
								</div>
							</div>

							{#if seance.causeIncomplet || seance.motifProfAbsent}
								<p
									class="border-t border-sidebar-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground"
								>
									{#if seance.motifProfAbsent}
										Absence du professeur : {seance.motifProfAbsent}
									{:else}
										Cause : {seance.causeIncomplet}
									{/if}
								</p>
							{/if}

							{#if seance.absents.length > 0 || seance.retards.length > 0}
								<div
									class="grid gap-3 border-t border-sidebar-border bg-muted/20 p-3 sm:grid-cols-2"
								>
									<div>
										<p class="mb-1.5 text-xs font-semibold text-red-500">
											Absents ({seance.absents.length})
										</p>
										{#if seance.absents.length === 0}
											<p class="text-xs text-muted-foreground">Aucun</p>
										{:else}
											<ul class="space-y-1.5">
												{#each seance.absents as a (a.id)}
													<li class="text-xs">
														<div class="flex flex-wrap items-center gap-1.5">
															<span class="font-semibold">{a.numero}</span>
															<span>{a.nom}</span>
															{#if a.justifie}
																<Badge variant="outline" class="text-emerald-600">justifiée</Badge>
															{/if}
														</div>
														{#if a.cause}
															<p class="mt-0.5 text-[11px] text-muted-foreground">
																Cause : <span class="text-foreground/80">{a.cause}</span>
																{#if a.justifiePar}
																	<span class="opacity-70">· {a.justifiePar}</span>
																{/if}
															</p>
														{:else if a.justifie}
															<p class="mt-0.5 text-[11px] text-muted-foreground italic">
																Cause non précisée
															</p>
														{/if}
													</li>
												{/each}
											</ul>
										{/if}
									</div>
									<div>
										<p class="mb-1.5 text-xs font-semibold text-amber-500">
											Retards ({seance.retards.length})
										</p>
										{#if seance.retards.length === 0}
											<p class="text-xs text-muted-foreground">Aucun</p>
										{:else}
											<ul class="space-y-1.5">
												{#each seance.retards as r (r.id)}
													<li class="text-xs">
														<div class="flex flex-wrap items-center gap-1.5">
															<span class="font-semibold">{r.numero}</span>
															<span>{r.nom}</span>
															{#if r.duree && r.duree !== '—'}
																<span class="text-muted-foreground">({r.duree})</span>
															{/if}
															{#if r.justifie}
																<Badge variant="outline" class="text-emerald-600">justifié</Badge>
															{/if}
														</div>
														{#if r.cause}
															<p class="mt-0.5 text-[11px] text-muted-foreground">
																Cause : <span class="text-foreground/80">{r.cause}</span>
																{#if r.justifiePar}
																	<span class="opacity-70">· {r.justifiePar}</span>
																{/if}
															</p>
														{:else if r.justifie}
															<p class="mt-0.5 text-[11px] text-muted-foreground italic">
																Cause non précisée
															</p>
														{/if}
													</li>
												{/each}
											</ul>
										{/if}
									</div>
								</div>
							{:else}
								<p
									class="border-t border-sidebar-border bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-600"
								>
									Classe au complet : aucune absence ni retard.
								</p>
							{/if}
						</div>
					{/each}
				{/if}
			</Tabs.Content>

			<!-- Récapitulatif par élève -->
			<Tabs.Content value="eleves">
				<div class="overflow-hidden rounded-2xl border border-sidebar-border bg-card/60">
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="w-16">N°</Table.Head>
									<Table.Head>Élève</Table.Head>
									<Table.Head class="text-center">Présences</Table.Head>
									<Table.Head class="text-center">Absences</Table.Head>
									<Table.Head class="text-center">Retards</Table.Head>
									<Table.Head class="text-center">Taux</Table.Head>
									<Table.Head>Dernier incident</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each elevesFiltres as eleve (eleve.id)}
									<Table.Row>
										<Table.Cell class="font-semibold">{eleve.numero}</Table.Cell>
										<Table.Cell>
											<a class="font-medium hover:underline" href={`/eleves/${eleve.id}`}>
												{eleve.nom}
												{eleve.prenom}
											</a>
										</Table.Cell>
										<Table.Cell class="text-center"
											>{eleve.presences}/{data.stats.nbSeances}</Table.Cell
										>
										<Table.Cell class="text-center">
											<span class="font-semibold {eleve.absences > 0 ? 'text-red-500' : ''}">
												{eleve.absences}
											</span>
											{#if eleve.absencesJustifiees > 0}
												<span class="text-[11px] text-muted-foreground">
													({eleve.absencesJustifiees} just.)
												</span>
											{/if}
										</Table.Cell>
										<Table.Cell class="text-center">
											<span class="font-semibold {eleve.retards > 0 ? 'text-amber-500' : ''}">
												{eleve.retards}
											</span>
											{#if eleve.retardsJustifies > 0}
												<span class="text-[11px] text-muted-foreground">
													({eleve.retardsJustifies} just.)
												</span>
											{/if}
										</Table.Cell>
										<Table.Cell class="text-center font-semibold {couleurTaux(eleve.tauxPresence)}">
											{eleve.tauxPresence}%
										</Table.Cell>
										<Table.Cell class="text-xs text-muted-foreground">
											{#if eleve.derniereAbsence || eleve.dernierRetard}
												{#if eleve.derniereAbsence}
													<span class="text-red-500">Abs. {formatDate(eleve.derniereAbsence)}</span>
												{/if}
												{#if eleve.derniereAbsence && eleve.dernierRetard}<span> · </span>{/if}
												{#if eleve.dernierRetard}
													<span class="text-amber-500">Ret. {formatDate(eleve.dernierRetard)}</span>
												{/if}
											{:else}
												Aucun
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
								{#if elevesFiltres.length === 0}
									<Table.Row>
										<Table.Cell colspan={7} class="py-8 text-center text-sm text-muted-foreground">
											Aucun élève ne correspond aux filtres.
										</Table.Cell>
									</Table.Row>
								{/if}
							</Table.Body>
						</Table.Root>
					</div>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
