<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Play, X, Clock, UserX, Timer, CheckCircle2, AlertTriangle } from '@lucide/svelte/icons';
	import { invalidateAll } from '$app/navigation';

	type Eleve = { id: string; nom: string; prenom: string; numero: string };

	let {
		open = $bindable(false),
		classeId,
		coursId,
		coursNom,
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
		salleNom?: string;
		heureDebut?: string;
		heureFin?: string;
		eleves?: Eleve[];
		seuilAbsence?: number;
		canEdit?: boolean;
		anneeActive?: boolean;
	} = $props();

	let datePointage = $state(new Date().toISOString().split('T')[0]);
	let heuresSaisie = $state('');
	let minutesSaisie = $state('');
	let heuresEffectuees = $state('');
	let causeIncomplet = $state('');
	let profAbsent = $state(false);
	let motifProfAbsent = $state('');

	let absents = $state<Eleve[]>([]);
	let retards = $state<Eleve[]>([]);
	let saisieAbsent = $state('');
	let saisieRetard = $state('');
	let erreurNumero = $state<string | null>(null);

	let submitting = $state(false);
	let erreur = $state<string | null>(null);
	let alertes = $state<string[]>([]);
	let success = $state(false);

	const editable = $derived(canEdit && anneeActive);

	function reinitialiser() {
		heuresSaisie = '';
		minutesSaisie = '';
		heuresEffectuees = '';
		causeIncomplet = '';
		profAbsent = false;
		motifProfAbsent = '';
		absents = [];
		retards = [];
		erreurNumero = null;
		erreur = null;
		alertes = [];
		success = false;
	}

	const eleveParNumero = $derived(new Map(eleves.map((e) => [e.numero.toUpperCase(), e])));

	function majHeures() {
		const h = parseFloat(heuresSaisie) || 0;
		const m = parseFloat(minutesSaisie) || 0;
		heuresEffectuees = (h + m / 60).toFixed(2);
	}

	function resoudre(numero: string): Eleve | undefined {
		return eleveParNumero.get(numero.trim().toUpperCase());
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
		if (!editable) return;
		submitting = true;
		erreur = null;
		alertes = [];
		success = false;
		const fd = new FormData();
		fd.append('coursId', coursId);
		fd.append('date', datePointage);
		if (profAbsent) heuresEffectuees = '0';
		fd.append('heuresEffectuees', heuresEffectuees || '0');
		fd.append('causeIncomplet', causeIncomplet);
		fd.append('profAbsent', profAbsent ? 'true' : 'false');
		fd.append('motifProfAbsent', profAbsent ? motifProfAbsent : '');
		for (const a of absents) fd.append('absentIds', a.id);
		for (const r of retards) fd.append('retardIds', r.id);

		try {
			const res = await fetch(`/classe/${classeId}/edt?/enregistrer`, {
				method: 'POST',
				body: fd
			});
			const result = await res.json().catch(() => null);
			if (res.ok && result?.type === 'success') {
				alertes = result?.data?.alertes || [];
				success = true;
				await invalidateAll();
				// Fermeture automatique du formulaire apres un enregistrement reussi.
				open = false;
				reinitialiser();
			} else {
				const msg =
					result?.data?.error ||
					(result && 'error' in result ? result.error : null) ||
					'Échec de l’enregistrement';
				erreur = msg ?? 'Échec de l’enregistrement';
			}
		} catch {
			erreur = 'Erreur réseau';
		} finally {
			submitting = false;
		}
	}

	// Quatrieme bouton : declarer directement le professeur absent (cours manqué).
	async function declareProfAbsent() {
		profAbsent = true;
		motifProfAbsent = motifProfAbsent.trim();
		await enregistrer();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Play class="size-4 text-primary" /> Démarrer le cours
			</Dialog.Title>
			<Dialog.Description>
				{coursNom}{salleNom ? ` • Salle ${salleNom}` : ''}
				{#if heureDebut}{heureFin ? ` • ${heureDebut} - ${heureFin}` : ` • ${heureDebut}`}{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if !anneeActive}
			<div
				class="mb-3 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
			>
				<AlertTriangle class="size-4" /> Aucune année scolaire active : le pointage est impossible.
			</div>
		{:else if !canEdit}
			<div
				class="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600"
			>
				<AlertTriangle class="size-4" /> Réservé au surveillant, à l’opérateur ou au professeur
				titulaire pour le pointage des cours.
			</div>
		{/if}

		<div class="space-y-4">
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="date-pointage">Date</Label>
					<Input id="date-pointage" type="date" bind:value={datePointage} disabled={!editable} />
				</div>
				<div class="grid gap-2">
					<Label>Heures effectuées par le professeur</Label>
					<div class="flex items-end gap-2">
						<div class="grid gap-1">
							<Input
								id="heures"
								type="number"
								min="0"
								placeholder="2"
								bind:value={heuresSaisie}
								oninput={majHeures}
								disabled={!editable}
							/>
							<span class="text-[11px] text-muted-foreground">heures</span>
						</div>
						<div class="grid gap-1">
							<Input
								id="minutes"
								type="number"
								min="0"
								placeholder="30"
								bind:value={minutesSaisie}
								oninput={majHeures}
								disabled={!editable}
							/>
							<span class="text-[11px] text-muted-foreground">minutes</span>
						</div>
					</div>
					{#if heuresEffectuees}
						<p class="text-[11px] text-muted-foreground">Soit {heuresEffectuees} h</p>
					{/if}
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="cause-pointage">Cause (si heures incomplètes)</Label>
				<Textarea
					id="cause-pointage"
					rows={1}
					placeholder="Ex: panne, grève…"
					bind:value={causeIncomplet}
					disabled={!editable}
				/>
			</div>

			<div
				class="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
			>
				<input
					type="checkbox"
					id="profAbsent"
					bind:checked={profAbsent}
					disabled={!editable}
					class="mt-0.5 size-4 accent-amber-500"
				/>
				<div class="grid flex-1 gap-1">
					<Label for="profAbsent" class="text-sm font-medium text-amber-700"
						>Le professeur est absent (cours manqué)</Label
					>
					{#if profAbsent}
						<Textarea
							id="motifProfAbsent"
							rows={1}
							placeholder="Motif de l'absence du professeur…"
							bind:value={motifProfAbsent}
							disabled={!editable}
						/>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
					<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600">
						<UserX class="size-4" /> Absents ({absents.length})
					</h3>
					<div class="flex items-end gap-2">
						<Input
							placeholder="N° (ex: 3F)"
							bind:value={saisieAbsent}
							disabled={!editable}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterAbsent())}
						/>
						<Button type="button" variant="destructive" size="sm" disabled={!editable} onclick={ajouterAbsent}>
							+
						</Button>
					</div>
					{#if absents.length > 0}
						<ul class="mt-2 space-y-1">
							{#each absents as a (a.id)}
								<li class="flex items-center justify-between gap-2 rounded-md bg-card/70 px-2 py-1 text-xs">
									<span><span class="font-semibold">{a.numero}</span> — {a.nom} {a.prenom}</span>
									<button
										type="button"
										class="rounded-full p-1 hover:bg-muted"
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

				<div class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
					<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-600">
						<Timer class="size-4" /> Retards ({retards.length})
					</h3>
					<div class="flex items-end gap-2">
						<Input
							placeholder="N° (ex: 5F)"
							bind:value={saisieRetard}
							disabled={!editable}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterRetard())}
						/>
						<Button type="button" variant="default" size="sm" disabled={!editable} onclick={ajouterRetard}>
							+
						</Button>
					</div>
					{#if retards.length > 0}
						<ul class="mt-2 space-y-1">
							{#each retards as r (r.id)}
								<li class="flex items-center justify-between gap-2 rounded-md bg-card/70 px-2 py-1 text-xs">
									<span><span class="font-semibold">{r.numero}</span> — {r.nom} {r.prenom}</span>
									<button
										type="button"
										class="rounded-full p-1 hover:bg-muted"
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
				<div class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
					{erreurNumero}
				</div>
			{/if}
			{#if erreur}
				<div class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
					{erreur}
				</div>
			{/if}
			{#if success}
				<div class="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
					<div class="flex items-center gap-2">
						<CheckCircle2 class="size-4" /> Pointage enregistré avec succès.
					</div>
					{#if alertes.length > 0}
						<ul class="mt-1 list-inside list-disc">
							{#each alertes as a (a)}<li>{a}</li>{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>

		<Dialog.Footer class="mt-4">
			<Button variant="outline" size="sm" type="button" onclick={() => (open = false)}>Fermer</Button>
			<Button
				variant="destructive"
				size="sm"
				type="button"
				onclick={declareProfAbsent}
				disabled={submitting || !canEdit}
				title="Déclarer le professeur absent (cours manqué)"
			>
				<UserX class="mr-2 size-4" />
				{submitting && profAbsent ? 'Enregistrement…' : 'Professeur absent'}
			</Button>
			<Button
				size="sm"
				type="button"
				onclick={enregistrer}
				disabled={submitting || !canEdit}
			>
				<Clock class="mr-2 size-4" />
				{submitting && !profAbsent ? 'Enregistrement…' : 'Enregistrer le pointage'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
