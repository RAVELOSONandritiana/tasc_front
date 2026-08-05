<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ArrowLeft, X, Clock, Users, AlertTriangle, UserX } from '@lucide/svelte/icons';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let heuresSaisie = $state<string>('');
	let minutesSaisie = $state<string>('');
	let heuresEffectuees = $state<string>('');
	let causeIncomplet = $state<string>('');
	let datePointage = $state<string>(new Date().toISOString().split('T')[0]);
	let submitting = $state(false);
	let erreur = $state<string | null>(null);
	let alertes = $state<string[]>([]);
	let success = $state(false);

	type EleveSelectionne = { id: string; numero: string; nom: string; prenom: string };

	let absents = $state<EleveSelectionne[]>([]);
	let retards = $state<EleveSelectionne[]>([]);
	let saisieAbsent = $state<string>('');
	let saisieRetard = $state<string>('');
	let erreurNumero = $state<string | null>(null);
	let profAbsent = $state(false);
	let motifAbsence = $state<string>('');

	const eleveParNumero = $derived(new Map(data.eleves.map((e) => [e.numero.toUpperCase(), e])));

	function majHeures() {
		const h = parseFloat(heuresSaisie) || 0;
		const m = parseFloat(minutesSaisie) || 0;
		heuresEffectuees = (h + m / 60).toFixed(2);
	}

	function resoudre(numero: string) {
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
		// Un élève absent ne peut pas être aussi en retard.
		retards = retards.filter((r) => r.id !== eleve.id);
		absents = [
			...absents,
			{ id: eleve.id, numero: eleve.numero, nom: eleve.nom, prenom: eleve.prenom }
		];
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
		retards = [
			...retards,
			{ id: eleve.id, numero: eleve.numero, nom: eleve.nom, prenom: eleve.prenom }
		];
		saisieRetard = '';
	}

	function supprimerAbsent(id: string) {
		absents = absents.filter((a) => a.id !== id);
	}
	function supprimerRetard(id: string) {
		retards = retards.filter((r) => r.id !== id);
	}

	async function enregistrer() {
		if (!data.canEdit) return;
		submitting = true;
		erreur = null;
		alertes = [];
		success = false;
		const fd = new FormData();
		fd.append('date', datePointage);
		if (profAbsent) heuresEffectuees = '0';
		fd.append('heuresEffectuees', heuresEffectuees);
		fd.append('causeIncomplet', causeIncomplet);
		fd.append('profAbsent', profAbsent ? 'true' : 'false');
		fd.append('motifAbsence', motifAbsence);
		for (const a of absents) fd.append('absentIds', a.id);
		for (const r of retards) fd.append('retardIds', r.id);
		try {
			const res = await fetch(
				`/classe/${data.classeId}/cours/${data.coursId}/presence?/enregistrer`,
				{ method: 'POST', body: fd }
			);
			const result = await res.json().catch(() => null);
			if (!res.ok || result?.error) {
				erreur = result?.error || 'Échec de l’enregistrement';
				return;
			}
			alertes = result?.data?.alertes || [];
			success = true;
			absents = [];
			retards = [];
			profAbsent = false;
			motifAbsence = '';
			await invalidateAll();
		} catch (e) {
			erreur = 'Erreur réseau';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-1 flex-col bg-sidebar text-sidebar-foreground">
	<header
		class="flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-card/80 px-4 backdrop-blur-sm"
	>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" onclick={() => goto(`/classe/${data.classeId}/cours`)}>
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-lg font-semibold">{data.coursNom}</h1>
				<p class="text-xs text-muted-foreground">
					{data.salleNom} • {data.heureDebut} - {data.heureFin}
					{#if data.heuresPrevues}<span class="ml-1">• {data.heuresPrevues}h prévues</span>{/if}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				href={`/classe/${data.classeId}/cours/${data.coursId}/seances`}
			>
				Toutes les séances
			</Button>
		</div>
	</header>

	{#if !data.canEdit}
		<div class="p-4">
			<div
				class="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600"
			>
				<AlertTriangle class="size-4" />
				Réservé au surveillant ou à l’opérateur pour le pointage des cours.
			</div>
		</div>
	{/if}

	<div class="space-y-4 p-4">
		<!-- Bloc pointage : heures + cause -->
		<div class="rounded-2xl border border-sidebar-border bg-card/60 p-4">
			<h2 class="mb-3 flex items-center gap-2 font-semibold">
				<Clock class="size-4 text-primary" /> Pointage du cours
			</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="date">Date</Label>
					<Input id="date" type="date" bind:value={datePointage} disabled={!data.canEdit} />
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
								disabled={!data.canEdit}
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
								disabled={!data.canEdit}
							/>
							<span class="text-[11px] text-muted-foreground">minutes</span>
						</div>
					</div>
					{#if heuresEffectuees}
						<p class="text-[11px] text-muted-foreground">Soit {heuresEffectuees} h</p>
					{/if}
				</div>
			</div>
			<div class="mt-3 grid gap-2">
				<Label for="cause">Cause (si heures incomplètes)</Label>
				<Textarea
					id="cause"
					rows={1}
					placeholder="Ex: panne, grève…"
					bind:value={causeIncomplet}
					disabled={!data.canEdit}
				/>
			</div>
			<div
				class="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
			>
				<input
					type="checkbox"
					id="profAbsent"
					bind:checked={profAbsent}
					disabled={!data.canEdit}
					class="mt-0.5 size-4 accent-amber-500"
				/>
				<div class="grid flex-1 gap-1">
					<Label for="profAbsent" class="text-sm font-medium text-amber-700"
						>Le professeur est absent (cours manqué)</Label
					>
					{#if profAbsent}
						<Textarea
							id="motifAbsence"
							rows={1}
							placeholder="Motif de l'absence du professeur…"
							bind:value={motifAbsence}
							disabled={!data.canEdit}
						/>
					{/if}
				</div>
			</div>
			{#if data.heuresPrevues}
				<p class="mt-2 text-xs text-muted-foreground">
					Heures prévues d’après l’emploi du temps : <span class="font-semibold"
						>{data.heuresPrevues}h</span
					>.
				</p>
			{/if}
		</div>

		<!-- Recherche des absents / retards par numéro de classe -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div class="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
				<h2 class="mb-3 flex items-center gap-2 font-semibold text-red-600">
					<UserX class="size-4" /> Absents
				</h2>
				<div class="flex items-end gap-2">
					<div class="grid flex-1 gap-1">
						<Label for="numAbsent" class="text-[11px] font-normal text-muted-foreground"
							>Numéro de classe (ex: 3F, 12G)</Label
						>
						<Input
							id="numAbsent"
							placeholder="3F"
							bind:value={saisieAbsent}
							disabled={!data.canEdit}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterAbsent())}
						/>
					</div>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						disabled={!data.canEdit}
						onclick={ajouterAbsent}
					>
						Ajouter
					</Button>
				</div>
				{#if absents.length > 0}
					<ul class="mt-3 space-y-1.5">
						{#each absents as a (a.id)}
							<li
								class="flex items-center justify-between gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm"
							>
								<span>
									<span class="font-semibold">{a.numero}</span> — {a.nom}
									{a.prenom}
								</span>
								<button
									type="button"
									class="rounded-full p-1 hover:bg-muted"
									onclick={() => supprimerAbsent(a.id)}
									disabled={!data.canEdit}
								>
									<X class="size-4 text-muted-foreground" />
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-3 text-xs text-muted-foreground italic">Aucun absent ajouté.</p>
				{/if}
			</div>

			<div class="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
				<h2 class="mb-3 flex items-center gap-2 font-semibold text-amber-600">
					<Clock class="size-4" /> Retards
				</h2>
				<div class="flex items-end gap-2">
					<div class="grid flex-1 gap-1">
						<Label for="numRetard" class="text-[11px] font-normal text-muted-foreground"
							>Numéro de classe (ex: 5F, 8G)</Label
						>
						<Input
							id="numRetard"
							placeholder="5F"
							bind:value={saisieRetard}
							disabled={!data.canEdit}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterRetard())}
						/>
					</div>
					<Button
						type="button"
						variant="default"
						size="sm"
						disabled={!data.canEdit}
						onclick={ajouterRetard}
					>
						Ajouter
					</Button>
				</div>
				{#if retards.length > 0}
					<ul class="mt-3 space-y-1.5">
						{#each retards as r (r.id)}
							<li
								class="flex items-center justify-between gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm"
							>
								<span>
									<span class="font-semibold">{r.numero}</span> — {r.nom}
									{r.prenom}
								</span>
								<button
									type="button"
									class="rounded-full p-1 hover:bg-muted"
									onclick={() => supprimerRetard(r.id)}
									disabled={!data.canEdit}
								>
									<X class="size-4 text-muted-foreground" />
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-3 text-xs text-muted-foreground italic">Aucun retard ajouté.</p>
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
				class="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600"
			>
				Pointage enregistré avec succès.
				{#if alertes.length > 0}
					<ul class="mt-1 list-inside list-disc">
						{#each alertes as a (a)}<li>{a}</li>{/each}
					</ul>
				{/if}
			</div>
		{/if}

		{#if data.canEdit}
			<div
				class="sticky bottom-0 flex justify-end border-t border-sidebar-border bg-sidebar/95 py-3 backdrop-blur"
			>
				<Button onclick={enregistrer} disabled={submitting}>
					{submitting ? 'Enregistrement…' : 'Enregistrer le pointage'}
				</Button>
			</div>
		{/if}
	</div>

	<!-- Historique -->
	{#if data.historique.length > 0}
		<div class="border-t border-sidebar-border p-4">
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<h2 class="flex items-center gap-2 font-semibold">
					<Users class="size-4 text-primary" /> Derniers pointages
				</h2>
				<Button
					variant="ghost"
					size="sm"
					href={`/classe/${data.classeId}/cours/${data.coursId}/seances`}
				>
					Voir toutes les séances et le récapitulatif
				</Button>
			</div>
			<div class="space-y-2">
				{#each data.historique as s (s.id)}
					<div class="overflow-hidden rounded-lg border border-sidebar-border">
						<div class="flex flex-wrap items-center justify-between gap-2 p-3">
							<div>
								<p class="text-sm font-medium">
									{new Date(s.date).toLocaleString('fr-FR', {
										day: 'numeric',
										month: 'short',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
								<p class="text-xs text-muted-foreground">Prof. {s.professeur}</p>
							</div>
							<div class="flex items-center gap-3 text-xs">
								<span class="font-semibold">{s.heuresEffectuees}h</span>
								{#if s.heuresPrevues}<span class="text-muted-foreground"
										>/ {s.heuresPrevues}h prévues</span
									>{/if}
								<span class="text-amber-500">{s.retards.length} ret.</span>
								<span class="text-red-500">{s.absents.length} abs.</span>
							</div>
						</div>
						{#if s.causeIncomplet}
							<p
								class="border-t border-sidebar-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground"
							>
								Cause : {s.causeIncomplet}
							</p>
						{/if}
						{#if s.absents.length > 0 || s.retards.length > 0}
							<div class="grid gap-3 border-t border-sidebar-border bg-muted/20 p-3 sm:grid-cols-2">
								<div>
									<p class="mb-1.5 text-xs font-semibold text-red-500">
										Absents ({s.absents.length})
									</p>
									{#if s.absents.length === 0}<p class="text-xs text-muted-foreground">
											Aucun
										</p>{:else}
										<ul class="space-y-0.5">
											{#each s.absents as nom (nom)}<li class="text-xs">{nom}</li>{/each}
										</ul>
									{/if}
								</div>
								<div>
									<p class="mb-1.5 text-xs font-semibold text-amber-500">
										Retards ({s.retards.length})
									</p>
									{#if s.retards.length === 0}<p class="text-xs text-muted-foreground">
											Aucun
										</p>{:else}
										<ul class="space-y-0.5">
											{#each s.retards as nom (nom)}<li class="text-xs">{nom}</li>{/each}
										</ul>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
