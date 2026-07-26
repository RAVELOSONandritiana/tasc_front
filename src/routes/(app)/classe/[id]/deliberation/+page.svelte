<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Gavel, AlertTriangle, UserX, Clock } from '@lucide/svelte';
	import type { EleveCours, Note, Cours } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';
	import { formatClasseNom } from '$lib/utils';

	const { data }: PageProps = $props();

	let listeCours = $state<Cours[]>([...data.listeCours]);
	let elevesClasse = $state<EleveCours[]>([...data.elevesClasse]);

	let selectedId = $state<string | null>(elevesClasse[0]?.id ?? null);

	const selected = $derived(
		selectedId ? (elevesClasse.find((e) => e.id === selectedId) ?? null) : null
	);
	const total = $derived(elevesClasse.length);

	function getCoefCours(coursId: string): number {
		return listeCours.find((c) => c.id === coursId)?.coefficient ?? 0;
	}
	function getCoefNote(note: Note): number {
		return note.coefficient || getCoefCours(note.coursId);
	}
	function getNotesMatiere(eleve: EleveCours, coursId: string): Note[] {
		return (eleve.notes ?? []).filter((n) => n.coursId === coursId);
	}
	function calculerMoyenneMatiere(notes: Note[]): number {
		if (notes.length === 0) return 0;
		const totalPts = notes.reduce((s, n) => s + n.valeur * getCoefNote(n), 0);
		const totalCoef = notes.reduce((s, n) => s + getCoefNote(n), 0);
		return totalCoef > 0 ? Math.round((totalPts / totalCoef) * 100) / 100 : 0;
	}
	function calculerMoyenneGenerale(eleve: EleveCours): number {
		const lignes = listeCours
			.map((c) => ({
				coef: c.coefficient || 0,
				moy: calculerMoyenneMatiere(getNotesMatiere(eleve, c.id))
			}))
			.filter((l) => l.coef > 0);
		const totalCoef = lignes.reduce((s, l) => s + l.coef, 0);
		if (totalCoef === 0) return 0;
		const totalPts = lignes.reduce((s, l) => s + l.moy * l.coef, 0);
		return Math.round((totalPts / totalCoef) * 100) / 100;
	}
	function appreciation(m: number): string {
		if (m <= 0) return '';
		if (m >= 18) return 'Excellent';
		if (m >= 16) return 'Très-Bien';
		if (m >= 14) return 'Bien';
		if (m >= 12) return 'Assez-Bien';
		if (m >= 10) return 'Passable';
		if (m >= 6) return 'Faible';
		return 'Blâme';
	}
	function decision(m: number): string {
		if (m >= 10) return 'ADMIS(E)';
		if (m > 0) return 'AJOURNÉ(E)';
		return '—';
	}
	function formatFr(val: number): string {
		return Number.isInteger(val) ? val.toString() : val.toFixed(2).replace('.', ',');
	}
	function initialesEleve(eleve: EleveCours): string {
		return `${(eleve.nom || '')[0] ?? ''}${(eleve.prenom || '')[0] ?? ''}`.toUpperCase();
	}
	function numeroClasse(eleve: EleveCours): string {		const ordre =
			[...elevesClasse]
				.filter((e) => e.sexe === eleve.sexe)
				.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'))
				.findIndex((e) => e.id === eleve.id) + 1;
		const suffix = eleve.sexe === 'F' ? 'F' : 'G';
		return `${ordre}${suffix}`;
	}
</script>

<div class="flex flex-1 flex-col md:flex-row bg-sidebar text-sidebar-foreground">
	<!-- LISTE DES ÉLÈVES (profil de la classe) -->
	<aside
		class="hidden md:block md:sticky md:top-16 w-64 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar p-3"
	>
		<h2 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
			Élèves ({total})
		</h2>
		<div class="space-y-1">
			{#each elevesClasse as e (e.id)}
				<button
					type="button"
					class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors {selectedId ===
					e.id
						? 'bg-primary text-primary-foreground'
						: 'hover:bg-muted'}"
					onclick={() => (selectedId = e.id)}
				>
					<span class="flex min-w-0 items-center gap-2">
						<Avatar.Root class="size-8 shrink-0">
							{#if e.url}
								<Avatar.Image src={e.url} alt="{e.nom} {e.prenom}" />
							{/if}
							<Avatar.Fallback class="text-xs">{initialesEleve(e)}</Avatar.Fallback>
						</Avatar.Root>
						<span class="truncate">
							{e.nom}
							{e.prenom}
						</span>
					</span>
					<span
						class="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-xs font-medium {selectedId ===
						e.id
							? 'bg-primary-foreground/20 text-primary-foreground'
							: 'text-muted-foreground'}"
					>
						{numeroClasse(e)}
					</span>
				</button>
			{/each}
		</div>
	</aside>

	<!-- FICHE DE DÉLIBÉRATION -->
	<div class="flex-1 overflow-y-auto p-4">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<h1 class="text-xl font-bold">
				Délibération — {data.classe
					? formatClasseNom(data.classe.niveau, data.classe.nom)
					: ''}
			</h1>
			<!-- Sélecteur sur mobile -->
			<select
				class="rounded-md border border-input bg-background px-2 py-1 text-sm md:hidden"
				value={selectedId ?? ''}
				onchange={(ev) => (selectedId = (ev.currentTarget as HTMLSelectElement).value)}
			>
				{#each elevesClasse as e (e.id)}
					<option value={e.id}>{numeroClasse(e)} — {e.nom} {e.prenom}</option>
				{/each}
			</select>
		</div>

		{#if !selected}
			<div class="flex items-center justify-center p-10 text-muted-foreground">
				Aucun élève inscrit dans cette classe.
			</div>
		{:else}
			{@const moyenneG = calculerMoyenneGenerale(selected)}
			<div class="space-y-4">
				<!-- PROFIL DE L'ÉLÈVE -->
				<div class="rounded-xl border border-sidebar-border bg-card p-5 shadow-sm">
					<div class="flex flex-wrap items-start justify-between gap-4">
					<div class="flex items-start gap-4">
						<Avatar.Root class="size-16 shrink-0">
							{#if selected.url}
								<Avatar.Image src={selected.url} alt="{selected.nom} {selected.prenom}" />
							{/if}
							<Avatar.Fallback class="text-lg">{initialesEleve(selected)}</Avatar.Fallback>
						</Avatar.Root>
						<div>
							<h2 class="text-xl font-bold">{selected.nom} {selected.prenom}</h2>
							<div
								class="mt-1 grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground sm:grid-cols-3"
							>
								<span
									>N° classe : <span class="font-semibold text-foreground"
										>{numeroClasse(selected)}</span
									></span
								>
								<span
									>IM : <span class="font-semibold text-foreground"
										>{selected.im || '—'}</span
									></span
								>
								<span
									>Sexe : <span class="font-semibold text-foreground"
										>{selected.sexe === 'F' ? 'Fille' : 'Garçon'}</span
									></span
								>
								<span
									>Naissance : <span class="font-semibold text-foreground"
										>{selected.dateNaissance
											? new Date(selected.dateNaissance).toLocaleDateString('fr-FR')
											: '—'}</span
									></span
								>
								<span
									>Situation : <span class="font-semibold text-foreground"
										>{selected.redoublant ? 'Redoublant' : 'Passant'}</span
									></span
								>
								<span
									>Domicile : <span class="font-semibold text-foreground"
										>{selected.domicile || '—'}</span
									></span
								>
							</div>
						</div>
						</div>
						<div
							class="flex flex-col items-center rounded-lg border border-sidebar-border bg-muted/30 px-6 py-3"
						>
							<span class="text-xs tracking-wide text-muted-foreground uppercase">Moyenne</span>
							<span class="text-3xl font-bold text-primary"
								>{moyenneG > 0 ? `${formatFr(moyenneG)}/20` : '—'}</span
							>
						</div>
					</div>

					<!-- DÉCISION DU CONSEIL -->
					<div
						class="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-sidebar-border p-3"
					>
						<div class="flex items-center gap-2 text-sm">
							<Gavel class="size-4 text-primary" />
							<span class="font-semibold">Décision :</span>
							<span
								class="rounded-full px-3 py-0.5 text-sm font-bold {moyenneG >= 10
									? 'bg-emerald-500/15 text-emerald-600'
									: moyenneG > 0
										? 'bg-destructive/15 text-destructive'
										: 'bg-muted text-muted-foreground'}"
							>
								{decision(moyenneG)}
							</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							<span class="font-semibold">Mention :</span>
							<span class="font-semibold text-foreground">{appreciation(moyenneG) || '—'}</span>
						</div>
					</div>
				</div>

				<!-- RELEVÉ DE NOTES -->
				<div class="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm">
					<div class="border-b border-sidebar-border px-4 py-2 text-sm font-semibold">Relevé de notes</div>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-sidebar-border text-left">
									<th class="p-2">Matière</th>
									<th class="p-2 text-center">Note /20</th>
									<th class="p-2 text-center">Coef</th>
									<th class="p-2 text-center">NDef</th>
									<th class="p-2">Appréciation</th>
								</tr>
							</thead>
							<tbody>
								{#each listeCours as cours (cours.id)}
									{@const notesM = getNotesMatiere(selected, cours.id)}
									{@const moyM = calculerMoyenneMatiere(notesM)}
									{@const ndef = moyM * (cours.coefficient || 0)}
									<tr class="border-b border-sidebar-border/60">
										<td class="p-2 font-medium">{cours.nom}</td>
										<td class="p-2 text-center">{notesM.length > 0 ? formatFr(moyM) : '0'}</td>
										<td class="p-2 text-center">{cours.coefficient || 0}</td>
										<td class="p-2 text-center">{notesM.length > 0 ? formatFr(ndef) : '0'}</td>
										<td class="p-2">{appreciation(moyM) || '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- VIE SCOLAIRE : PROFIL DE L'ÉLÈVE -->
				<div class="grid gap-4 md:grid-cols-3">
					<div class="rounded-xl border border-sidebar-border bg-card p-4 shadow-sm">
						<div class="mb-2 flex items-center gap-2 font-semibold">
							<AlertTriangle class="size-4 text-amber-500" />
							Incidents ({selected.incidents?.length || 0})
						</div>
						{#if selected.incidents && selected.incidents.length > 0}
							<ul class="space-y-2">
								{#each selected.incidents as inc (inc.id)}
									<li class="rounded-md border border-sidebar-border/60 p-2 text-sm">
										<div class="text-xs text-muted-foreground">
											{new Date(inc.date).toLocaleDateString('fr-FR')}
										</div>
										<div>{inc.description || '—'}</div>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-muted-foreground italic">Aucun incident.</p>
						{/if}
					</div>

					<div class="rounded-xl border border-sidebar-border bg-card p-4 shadow-sm">
						<div class="mb-2 flex items-center gap-2 font-semibold">
							<UserX class="size-4 text-destructive" />
							Absences ({selected.absences?.length || 0})
						</div>
						{#if selected.absences && selected.absences.length > 0}
							<ul class="space-y-1">
								{#each selected.absences as a (a.id)}
									<li
										class="flex items-center justify-between rounded-md border border-sidebar-border/60 p-2 text-sm"
									>
										<span>{new Date(a.date).toLocaleDateString('fr-FR')}</span>
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {a.justifie
												? 'bg-emerald-500/15 text-emerald-600'
												: 'bg-destructive/15 text-destructive'}"
										>
											{a.justifie ? 'Justifiée' : 'Non justifiée'}
										</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-muted-foreground italic">Aucune absence.</p>
						{/if}
					</div>

					<div class="rounded-xl border border-sidebar-border bg-card p-4 shadow-sm">
						<div class="mb-2 flex items-center gap-2 font-semibold">
							<Clock class="size-4 text-blue-500" />
							Retards ({selected.retards?.length || 0})
						</div>
						{#if selected.retards && selected.retards.length > 0}
							<ul class="space-y-1">
								{#each selected.retards as r (r.id)}
									<li
										class="flex items-center justify-between rounded-md border border-sidebar-border/60 p-2 text-sm"
									>
										<span>{new Date(r.date).toLocaleDateString('fr-FR')}</span>
										<span class="flex items-center gap-2">
											<span class="text-xs text-muted-foreground">{r.duree || '—'}</span>
											<span
												class="rounded-full px-2 py-0.5 text-xs font-medium {r.justifie
													? 'bg-emerald-500/15 text-emerald-600'
													: 'bg-destructive/15 text-destructive'}"
											>
												{r.justifie ? 'Justifié' : 'Non justifié'}
											</span>
										</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-muted-foreground italic">Aucun retard.</p>
						{/if}
					</div>
				</div>

				<!-- NAVIGATION -->
				<div class="flex flex-wrap items-center justify-between gap-3 pt-1">
					<Button
						variant="outline"
						disabled={!selectedId || elevesClasse.findIndex((e) => e.id === selectedId) === 0}
						onclick={() => {
							const i = elevesClasse.findIndex((e) => e.id === selectedId);
							if (i > 0) selectedId = elevesClasse[i - 1].id;
						}}
					>
						Précédent
					</Button>
					<span class="text-sm text-muted-foreground">
						{elevesClasse.findIndex((e) => e.id === selectedId) + 1} / {total}
					</span>
					<Button
						variant="default"
						disabled={
							!selectedId ||
							elevesClasse.findIndex((e) => e.id === selectedId) === elevesClasse.length - 1
						}
						onclick={() => {
							const i = elevesClasse.findIndex((e) => e.id === selectedId);
							if (i < elevesClasse.length - 1) selectedId = elevesClasse[i + 1].id;
						}}
					>
						Suivant
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
