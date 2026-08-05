<script lang="ts" module>
	export type SeanceAbsence = {
		id: string;
		coursId: string;
		coursNom: string;
		professeurId: string | null;
		professeurNom: string;
		jour: string;
		heureDebut: string;
		heureFin: string;
		duree: number;
	};
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { UserX, CheckCircle2, AlertTriangle, CalendarX } from '@lucide/svelte/icons';
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	let {
		open = $bindable(false),
		classeId,
		seances = [] as SeanceAbsence[],
		canEdit = false,
		anneeActive = true
	}: {
		open?: boolean;
		classeId: string;
		seances?: SeanceAbsence[];
		canEdit?: boolean;
		anneeActive?: boolean;
	} = $props();

	// Jours tels qu'ils sont enregistrés dans l'emploi du temps.
	const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

	function aujourdHui(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	let date = $state(aujourdHui());
	let seanceId = $state('');
	let motif = $state('');
	let justifie = $state(false);

	let submitting = $state(false);
	let erreur = $state<string | null>(null);
	let success = $state(false);

	const editable = $derived(canEdit && anneeActive);

	// Le jour de la semaine de la date choisie détermine les séances possibles :
	// un enseignant n'est "absent" que sur une séance prévue à l'emploi du temps.
	const jourChoisi = $derived(
		/^\d{4}-\d{2}-\d{2}$/.test(date) ? JOURS[new Date(`${date}T00:00:00`).getDay()] : ''
	);

	const seancesDuJour = $derived(
		seances
			.filter((s) => s.jour === jourChoisi && s.professeurId)
			.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
	);

	const seanceChoisie = $derived(seancesDuJour.find((s) => s.id === seanceId) || null);

	// La date change : on abandonne la séance sélectionnée si elle n'existe plus.
	$effect(() => {
		if (seanceId && !seancesDuJour.some((s) => s.id === seanceId)) {
			seanceId = '';
		}
	});

	function reset() {
		date = aujourdHui();
		seanceId = '';
		motif = '';
		justifie = false;
		erreur = null;
		success = false;
	}

	async function enregistrer() {
		if (!editable || !seanceChoisie) return;
		submitting = true;
		erreur = null;
		success = false;

		const fd = new FormData();
		fd.append('seanceId', seanceChoisie.id);
		fd.append('date', date);
		fd.append('motif', motif);
		fd.append('justifie', justifie ? 'true' : 'false');

		try {
			const res = await fetch(`/classe/${classeId}/analyse?/absenceProf`, {
				method: 'POST',
				body: fd
			});
			const result = deserialize(await res.text()) as ActionResult;
			if (result.type === 'success') {
				success = true;
				await invalidateAll();
				setTimeout(() => {
					open = false;
					reset();
				}, 900);
			} else if (result.type === 'failure') {
				erreur = (result.data?.error as string) || 'Échec de l’enregistrement';
			} else if (result.type === 'error') {
				erreur = result.error?.message || 'Échec de l’enregistrement';
			} else {
				erreur = 'Échec de l’enregistrement';
			}
		} catch {
			erreur = 'Erreur réseau';
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(v) => {
		if (v) reset();
	}}
>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<UserX class="size-4 text-destructive" /> Absence d’un enseignant
			</Dialog.Title>
			<Dialog.Description>
				Sélectionnez la séance de l’emploi du temps qui n’a pas été assurée. Les heures manquées
				correspondent à la durée de cette séance.
			</Dialog.Description>
		</Dialog.Header>

		{#if !anneeActive}
			<div
				class="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
			>
				<AlertTriangle class="size-4" /> Aucune année scolaire active : déclaration impossible.
			</div>
		{:else if !canEdit}
			<div
				class="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600"
			>
				<AlertTriangle class="size-4" /> Réservé à l’administrateur, au surveillant ou à l’opérateur.
			</div>
		{/if}

		<div class="space-y-4">
			<div class="grid gap-2">
				<Label for="absence-prof-date">Date de la séance manquée</Label>
				<Input
					id="absence-prof-date"
					type="date"
					max={aujourdHui()}
					bind:value={date}
					disabled={!editable}
				/>
				{#if jourChoisi}
					<p class="text-[11px] text-muted-foreground">{jourChoisi}</p>
				{/if}
			</div>

			<div class="grid gap-2">
				<Label for="absence-prof-seance">Séance (emploi du temps)</Label>
				{#if seancesDuJour.length > 0}
					<NativeSelect.Root
						id="absence-prof-seance"
						class="w-full"
						bind:value={seanceId}
						disabled={!editable}
					>
						<NativeSelect.Option value="">Choisir une séance…</NativeSelect.Option>
						{#each seancesDuJour as s (s.id)}
							<NativeSelect.Option value={s.id}>
								{s.heureDebut} - {s.heureFin} · {s.coursNom} · {s.professeurNom}
							</NativeSelect.Option>
						{/each}
					</NativeSelect.Root>
				{:else}
					<div
						class="flex items-center gap-2 rounded-lg border border-sidebar-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
					>
						<CalendarX class="size-4" />
						Aucune séance n’est prévue {jourChoisi ? `le ${jourChoisi.toLowerCase()}` : 'ce jour'} dans
						l’emploi du temps de la classe.
					</div>
				{/if}
			</div>

			{#if seanceChoisie}
				<div class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
					<p class="font-semibold text-destructive">
						{seanceChoisie.professeurNom} — {seanceChoisie.coursNom}
					</p>
					<p class="text-muted-foreground">
						{jourChoisi} {date} · {seanceChoisie.heureDebut} - {seanceChoisie.heureFin} ·
						<span class="font-semibold">{seanceChoisie.duree} h manquée(s)</span>
					</p>
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="absence-prof-motif">Motif (facultatif)</Label>
				<Textarea
					id="absence-prof-motif"
					rows={2}
					placeholder="Ex: maladie, mission, convocation…"
					bind:value={motif}
					disabled={!editable}
				/>
			</div>

			<div class="flex items-center gap-2">
				<Checkbox id="absence-prof-justifie" bind:checked={justifie} disabled={!editable} />
				<Label for="absence-prof-justifie" class="text-sm font-normal">Absence justifiée</Label>
			</div>

			{#if erreur}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
				>
					{erreur}
				</div>
			{/if}
			{#if success}
				<div
					class="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600"
				>
					<CheckCircle2 class="size-4" /> Absence enregistrée.
				</div>
			{/if}
		</div>

		<Dialog.Footer class="mt-4 gap-2 sm:justify-end">
			<Button variant="outline" size="sm" type="button" onclick={() => (open = false)}>
				Annuler
			</Button>
			<Button
				variant="destructive"
				size="sm"
				type="button"
				onclick={enregistrer}
				disabled={submitting || success || !editable || !seanceChoisie}
			>
				<UserX class="mr-2 size-4" />
				{submitting ? 'Enregistrement…' : 'Déclarer l’absence'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
