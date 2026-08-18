<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Play, X, Clock, UserX, Timer, CheckCircle2, AlertTriangle } from '@lucide/svelte/icons';
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	type Eleve = { id: string; nom: string; prenom: string; numero: string };

	let {
		open = $bindable(false),
		classeId,
		coursId,
		coursNom,
		seanceId = '',
		salleNom = '',
		heureDebut = '',
		heureFin = '',
		eleves = [] as Eleve[],
		seuilAbsence = 3,
		canEdit = false,
		anneeActive = true
	}: {
		open?: boolean;
		classeId: string;
		coursId: string;
		coursNom: string;
		seanceId?: string;
		salleNom?: string;
		heureDebut?: string;
		heureFin?: string;
		eleves?: Eleve[];
		seuilAbsence?: number;
		canEdit?: boolean;
		anneeActive?: boolean;
	} = $props();

	/** Date du jour au format "AAAA-MM-JJ" (heure locale, pas UTC). */
	function aujourdHui(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	/** Duree prevue de la seance, pre-remplie dans les champs heures/minutes. */
	function dureePrevue(): { heures: string; minutes: string } {
		const m1 = /^(\d{1,2}):(\d{2})$/.exec(heureDebut || '');
		const m2 = /^(\d{1,2}):(\d{2})$/.exec(heureFin || '');
		if (!m1 || !m2) return { heures: '', minutes: '' };
		const diff = (Number(m2[1]) * 60 + Number(m2[2])) - (Number(m1[1]) * 60 + Number(m1[2]));
		if (diff <= 0) return { heures: '', minutes: '' };
		return { heures: String(Math.floor(diff / 60)), minutes: String(diff % 60) };
	}

	let datePointage = $state(aujourdHui());
	let heuresSaisie = $state('');
	let minutesSaisie = $state('');
	let causeIncomplet = $state('');

	let absents = $state<Eleve[]>([]);
	let retards = $state<Eleve[]>([]);
	let saisieAbsent = $state('');
	let saisieRetard = $state('');
	let erreurNumero = $state<string | null>(null);

	let submitting = $state(false);
	let erreur = $state<string | null>(null);
	let alertes = $state<string[]>([]);
	let success = $state(false);

	const editable = $derived(canEdit && anneeActive && !submitting && !success);

	/** Total en heures decimales (2 h 30 -> 2.5) envoye au serveur. */
	const heuresEffectuees = $derived(
		Math.round(((Number(heuresSaisie) || 0) + (Number(minutesSaisie) || 0) / 60) * 100) / 100
	);

	function reinitialiser() {
		const prevue = dureePrevue();
		datePointage = aujourdHui();
		heuresSaisie = prevue.heures;
		minutesSaisie = prevue.minutes;
		causeIncomplet = '';
		absents = [];
		retards = [];
		saisieAbsent = '';
		saisieRetard = '';
		erreurNumero = null;
		erreur = null;
		alertes = [];
		success = false;
		submitting = false;
	}

	const eleveParNumero = $derived(
		new Map(eleves.map((e) => [e.numero.trim().toUpperCase(), e]))
	);

	function resoudre(numero: string): Eleve | undefined {
		const cle = numero.trim().toUpperCase();
		if (!cle) return undefined;
		return (
			eleveParNumero.get(cle) ??
			// Tolere la saisie du nom complet ou d'une partie du nom.
			eleves.find((e) => `${e.nom} ${e.prenom}`.toUpperCase().includes(cle))
		);
	}

	function ajouterAbsent() {
		erreurNumero = null;
		const eleve = resoudre(saisieAbsent);
		if (!eleve) {
			erreurNumero = `Numéro « ${saisieAbsent.trim() || '—'} » introuvable dans la classe`;
			return;
		}
		if (absents.some((a) => a.id === eleve.id)) {
			erreurNumero = 'Élève déjà ajouté aux absents';
			return;
		}
		retards = retards.filter((r) => r.id !== eleve.id);
		absents = [...absents, eleve];
		saisieAbsent = '';
	}

	function ajouterRetard() {
		erreurNumero = null;
		const eleve = resoudre(saisieRetard);
		if (!eleve) {
			erreurNumero = `Numéro « ${saisieRetard.trim() || '—'} » introuvable dans la classe`;
			return;
		}
		if (retards.some((r) => r.id === eleve.id)) {
			erreurNumero = 'Élève déjà ajouté aux retards';
			return;
		}
		absents = absents.filter((a) => a.id !== eleve.id);
		retards = [...retards, eleve];
		saisieRetard = '';
	}

	function supprimerAbsent(id: string) {
		absents = absents.filter((a) => a.id !== id);
	}
	function supprimerRetard(id: string) {
		retards = retards.filter((r) => r.id !== id);
	}

	async function enregistrer() {
		if (!canEdit || !anneeActive || submitting) return;
		erreur = null;
		alertes = [];
		success = false;

		if (!/^\d{4}-\d{2}-\d{2}$/.test(datePointage)) {
			erreur = 'Choisissez une date valide.';
			return;
		}
		if (heuresEffectuees <= 0) {
			erreur = 'Indiquez les heures effectuées par le professeur.';
			return;
		}

		submitting = true;
		const fd = new FormData();
		fd.append('coursId', coursId);
		if (seanceId) fd.append('seanceId', seanceId);
		fd.append('date', datePointage);
		fd.append('heuresEffectuees', String(heuresEffectuees));
		fd.append('causeIncomplet', causeIncomplet.trim());
		fd.append('profAbsent', 'false');
		for (const a of absents) fd.append('absentIds', a.id);
		for (const r of retards) fd.append('retardIds', r.id);

		try {
			const res = await fetch(`/classe/${classeId}/edt?/enregistrer`, {
				method: 'POST',
				body: fd
			});
			// Les actions SvelteKit renvoient un ActionResult serialise : il faut
			// le deserialiser pour recuperer le message d'erreur du serveur.
			const result = deserialize(await res.text()) as ActionResult;
			if (result.type === 'success') {
				alertes = (result.data?.alertes as string[]) || [];
				success = true;
				await invalidateAll();
				// On laisse le temps de lire les alertes de convocation.
				setTimeout(
					() => {
						open = false;
					},
					alertes.length > 0 ? 2500 : 900
				);
			} else if (result.type === 'failure') {
				erreur = (result.data?.error as string) || 'Échec de l’enregistrement';
			} else if (result.type === 'error') {
				erreur = result.error?.message || 'Échec de l’enregistrement';
			} else if (result.type === 'redirect') {
				erreur = 'Votre session a expiré : reconnectez-vous puis réessayez.';
			}
		} catch {
			erreur = 'Erreur réseau : vérifiez votre connexion puis réessayez.';
		} finally {
			submitting = false;
		}
	}

	// La fenetre est reutilisee pour chaque seance : on repart d'un formulaire
	// vierge a chaque ouverture (bits-ui n'appelle pas onOpenChange quand
	// l'ouverture est pilotee par le parent).
	let etaitOuvert = false;
	$effect(() => {
		if (open && !etaitOuvert) reinitialiser();
		etaitOuvert = open;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
		<Dialog.Header class="border-b border-border/60 px-4 py-4 pr-12 sm:px-6">
			<Dialog.Title class="flex items-center gap-2 text-base">
				<Play class="size-4 shrink-0 text-primary" />
				<span class="truncate">Démarrer le cours</span>
			</Dialog.Title>
			<Dialog.Description class="text-xs sm:text-sm">
				<span class="font-medium text-foreground">{coursNom}</span>
				{#if salleNom}<span> · Salle {salleNom}</span>{/if}
				{#if heureDebut}<span> · {heureDebut}{heureFin ? ` - ${heureFin}` : ''}</span>{/if}
			</Dialog.Description>
		</Dialog.Header>

		<!-- Corps defilant : le formulaire reste utilisable sur petit ecran. -->
		<div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
			{#if !anneeActive}
				<div
					class="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
				>
					<AlertTriangle class="mt-0.5 size-4 shrink-0" />
					<span>Aucune année scolaire active : le pointage est impossible.</span>
				</div>
			{:else if !canEdit}
				<div
					class="flex items-start gap-2 rounded-lg border border-sidebar-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
				>
					<AlertTriangle class="mt-0.5 size-4 shrink-0" />
					<span>
						Réservé au surveillant, à l’opérateur ou au professeur titulaire pour le pointage des
						cours.
					</span>
				</div>
			{/if}

			<div class="grid gap-3 sm:grid-cols-3">
				<div class="grid gap-2">
					<Label for="date-pointage">Date</Label>
					<Input
						id="date-pointage"
						type="date"
						max={aujourdHui()}
						bind:value={datePointage}
						disabled={!editable}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="heures-pointage">Heures</Label>
					<Input
						id="heures-pointage"
						type="number"
						min="0"
						max="12"
						inputmode="numeric"
						placeholder="2"
						bind:value={heuresSaisie}
						disabled={!editable}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="minutes-pointage">Minutes</Label>
					<Input
						id="minutes-pointage"
						type="number"
						min="0"
						max="59"
						step="5"
						inputmode="numeric"
						placeholder="30"
						bind:value={minutesSaisie}
						disabled={!editable}
					/>
				</div>
			</div>
			{#if heuresEffectuees > 0}
				<p class="-mt-1 text-[11px] text-muted-foreground">
					Heures effectuées par le professeur : {heuresEffectuees} h
				</p>
			{/if}

			<div class="grid gap-2">
				<Label for="cause-pointage">Cause (si heures incomplètes)</Label>
				<Textarea
					id="cause-pointage"
					rows={2}
					placeholder="Ex: panne, grève…"
					bind:value={causeIncomplet}
					disabled={!editable}
				/>
			</div>

			<datalist id="numeros-eleves-{coursId}">
				{#each eleves as e (e.id)}
					<option value={e.numero}>{e.nom} {e.prenom}</option>
				{/each}
			</datalist>

			<div class="grid gap-3 sm:grid-cols-2">
				<div class="min-w-0 rounded-xl border border-sidebar-border bg-card/60 p-3">
					<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold">
						<UserX class="size-4 shrink-0" /> Absents ({absents.length})
					</h3>
					<div class="flex items-center gap-2">
						<Input
							aria-label="Numéro de l’élève absent"
							placeholder="N° (ex: 3F)"
							list="numeros-eleves-{coursId}"
							bind:value={saisieAbsent}
							disabled={!editable}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterAbsent())}
						/>
						<Button
							type="button"
							variant="default"
							size="sm"
							class="shrink-0"
							disabled={!editable}
							onclick={ajouterAbsent}
						>
							+
						</Button>
					</div>
					{#if absents.length > 0}
						<ul class="mt-2 space-y-1">
							{#each absents as a (a.id)}
								<li
									class="flex items-center justify-between gap-2 rounded-md bg-card/70 px-2 py-1 text-xs"
								>
									<span class="min-w-0 truncate">
										<span class="font-semibold">{a.numero}</span> — {a.nom}
										{a.prenom}
									</span>
									<button
										type="button"
										aria-label="Retirer {a.nom} des absents"
										class="shrink-0 rounded-full p-1 hover:bg-muted"
										onclick={() => supprimerAbsent(a.id)}
										disabled={!editable}
									>
										<X class="size-3.5 text-muted-foreground" />
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-2 text-xs text-muted-foreground italic">Aucun absent.</p>
					{/if}
					<p class="mt-2 text-[11px] text-muted-foreground">
						Convocation des parents à {seuilAbsence} absences.
					</p>
				</div>

				<div class="min-w-0 rounded-xl border border-sidebar-border bg-card/60 p-3">
					<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold">
						<Timer class="size-4 shrink-0" /> Retards ({retards.length})
					</h3>
					<div class="flex items-center gap-2">
						<Input
							aria-label="Numéro de l’élève en retard"
							placeholder="N° (ex: 5F)"
							list="numeros-eleves-{coursId}"
							bind:value={saisieRetard}
							disabled={!editable}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterRetard())}
						/>
						<Button
							type="button"
							variant="default"
							size="sm"
							class="shrink-0"
							disabled={!editable}
							onclick={ajouterRetard}
						>
							+
						</Button>
					</div>
					{#if retards.length > 0}
						<ul class="mt-2 space-y-1">
							{#each retards as r (r.id)}
								<li
									class="flex items-center justify-between gap-2 rounded-md bg-card/70 px-2 py-1 text-xs"
								>
									<span class="min-w-0 truncate">
										<span class="font-semibold">{r.numero}</span> — {r.nom}
										{r.prenom}
									</span>
									<button
										type="button"
										aria-label="Retirer {r.nom} des retards"
										class="shrink-0 rounded-full p-1 hover:bg-muted"
										onclick={() => supprimerRetard(r.id)}
										disabled={!editable}
									>
										<X class="size-3.5 text-muted-foreground" />
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-2 text-xs text-muted-foreground italic">Aucun retard.</p>
					{/if}
				</div>
			</div>

			{#if erreurNumero}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
				>
					{erreurNumero}
				</div>
			{/if}
			{#if erreur}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
				>
					{erreur}
				</div>
			{/if}
			{#if success}
				<div
					class="rounded-lg border border-sidebar-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
				>
					<div class="flex items-center gap-2">
						<CheckCircle2 class="size-4 shrink-0" />
						Pointage enregistré avec succès.
					</div>
					{#if alertes.length > 0}
						<ul class="mt-1 list-inside list-disc">
							{#each alertes as a (a)}<li>{a}</li>{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>

		<Dialog.Footer
			class="flex-wrap gap-2 border-t border-border/60 px-4 py-3 sm:justify-between sm:px-6"
		>
			<Button
				variant="outline"
				size="sm"
				type="button"
				class="order-2 w-full sm:order-1 sm:w-auto"
				onclick={() => (open = false)}
			>
				Fermer
			</Button>
			<Button
				size="sm"
				type="button"
				class="order-1 w-full sm:order-2 sm:w-auto"
				onclick={enregistrer}
				disabled={!canEdit || !anneeActive || submitting || success}
			>
				<Clock class="mr-2 size-4" />
				{submitting ? 'Enregistrement…' : 'Enregistrer le pointage'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
