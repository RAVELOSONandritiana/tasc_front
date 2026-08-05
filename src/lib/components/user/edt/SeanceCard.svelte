<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Plus, Play, Trash2, Pencil, UserCog, UserX } from '@lucide/svelte/icons';
	import { invalidateAll } from '$app/navigation';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import type { SeanceEDT } from '$lib/types/Materiel.type';
	import * as Dialog from '$lib/components/ui/dialog';
	import { loadingForm } from '$lib/actions/loadingForm';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import StartCoursDialog from './StartCoursDialog.svelte';

	type EleveEDT = { id: string; nom: string; prenom: string; numero: string };

	const {
		jour,
		seances,
		salles,
		heures,
		classeId,
		cours = [],
		jours = [],
		currentProfesseurId = null,
		userRole = null,
		professeurs = [],
		eleves = [],
		seuilAbsence = 3,
		anneeActive = true
	}: {
		jour: string;
		seances: SeanceEDT[];
		salles: { id: string; num: number; name: string; place: number }[];
		heures: string[];
		classeId: string;
		cours?: { id: string; matiereNom: string; coefficient: number; professeur: string; professeurId?: string | null }[];
		jours?: string[];
		currentProfesseurId?: string | null;
		userRole?: string | null;
		professeurs?: { id: string; nom: string }[];
		eleves?: EleveEDT[];
		seuilAbsence?: number;
		anneeActive?: boolean;
	} = $props();

	const professeurParCours = $derived(
		(cours ?? []).reduce(
			(acc, c) => {
				acc[c.id] = c.professeurId ?? null;
				return acc;
			},
			{} as Record<string, string | null>
		)
	);

	function estTitulaire(coursId: string): boolean {
		return (
			!!currentProfesseurId && professeurParCours[coursId] === currentProfesseurId
		);
	}

	// Un surveillant ou un administrateur peut modifier/supprimer l'EDT,
	// mais seul le professeur titulaire du cours peut le démarrer (lancer).
	const peutModifierEDT = $derived(
		userRole === 'SURVEILLANT' || userRole === 'ADMINISTRATEUR' || userRole === 'ENSEIGNANT' || userRole === 'OPERATEUR'
	);

	// Grille horaire dynamique (pas de 15 min) pour gérer les créneaux non
	// ronds (:15, :30, :45...). On complète avec les heures déjà utilisées
	// par les séances afin de ne jamais perdre une valeur existante.
	function genererCreneaux(debut = '07:00', fin = '18:00', pas = 15): string[] {
		const [dh, dm] = debut.split(':').map(Number);
		const [fh, fm] = fin.split(':').map(Number);
		const debutMin = dh * 60 + dm;
		const finMin = fh * 60 + fm;
		const set = new Set<string>();
		for (let t = debutMin; t <= finMin; t += pas) {
			const h = Math.floor(t / 60);
			const m = t % 60;
			set.add(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
		}
		for (const s of seances ?? []) {
			if (s.heureDebut) set.add(s.heureDebut);
			if (s.heureFin) set.add(s.heureFin);
		}
		return [...set].sort();
	}

	const creneaux = $derived(genererCreneaux());

	let dialogOpen = $state(false);
	let nouvelleSeance = $state({
		heureDebut: '',
		heureFin: '',
		coursId: '',
		salleId: null as string | null
	});

	function handleClose() {
		dialogOpen = false;
		nouvelleSeance = { heureDebut: '', heureFin: '', coursId: '', salleId: null };
	}

	let editDialogOpen = $state(false);
	let editSeance = $state<SeanceEDT | null>(null);
	let editProfesseurId = $state<string | null>(null);
	let editSalleId = $state<string | null>(null);
	let editHeureDebut = $state('');
	let editHeureFin = $state('');
	let editJour = $state('');

	function openEditSeance(seance: SeanceEDT) {
		editSeance = seance;
		editProfesseurId = professeurParCours[seance.coursId] ?? null;
		editSalleId = seance.salleId ?? null;
		editHeureDebut = seance.heureDebut || '';
		editHeureFin = seance.heureFin || '';
		editJour = seance.jour || '';
		editDialogOpen = true;
	}

	// Les séances d'une journée sont triées par heure de début (matin -> soir).
	const seancesTriees = $derived(
		[...(seances ?? [])].sort((a, b) => (a.heureDebut || '').localeCompare(b.heureDebut || ''))
	);

	// Fenêtre "Démarrer le cours" (pointage) ouverte depuis l'emploi du temps.
	let startDialogOpen = $state(false);
	let seanceEnCours = $state<SeanceEDT | null>(null);

	function ouvrirStartCours(seance: SeanceEDT) {
		seanceEnCours = seance;
		startDialogOpen = true;
	}

	// Un enseignant ne peut démarrer que les cours dont il est titulaire ; les
	// autres rôles (surveillant, opérateur, admin) peuvent tous les démarrer.
	function peutDemarrerCours(coursId: string): boolean {
		if (!peutModifierEDT) return false;
		if (userRole === 'ENSEIGNANT') return estTitulaire(coursId);
		return true;
	}

	// Quatrieme bouton : declarer l'absence du professeur (cours manque) pour la
	// seance affichee. Réservé aux roles pouvant declare une absence d'enseignant
	// (surveillant, opérateur, administrateur).
	const rolePeutDeclarerAbsenceProf = $derived(
		userRole === 'SURVEILLANT' || userRole === 'ADMINISTRATEUR' || userRole === 'OPERATEUR'
	);

	let absenceDialogOpen = $state(false);
	let motifAbsenceProf = $state('');
	let submittingAbsence = $state(false);
	let erreurAbsence = $state<string | null>(null);
	let succesAbsence = $state(false);

	async function declarerAbsenceProf(seance: SeanceEDT) {
		if (!rolePeutDeclarerAbsenceProf) return;
		submittingAbsence = true;
		erreurAbsence = null;
		succesAbsence = false;
		const aujourdhui = new Date();
		const dateRaw = `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, '0')}-${String(aujourdhui.getDate()).padStart(2, '0')}`;
		const fd = new FormData();
		fd.append('seanceId', seance.id);
		fd.append('date', dateRaw);
		if (motifAbsenceProf.trim()) fd.append('motif', motifAbsenceProf.trim());
		try {
			const res = await fetch(`/classe/${classeId}/analyse?/absenceProf`, {
				method: 'POST',
				body: fd
			});
			const result = await res.json().catch(() => null);
			if (res.ok && result?.type === 'success') {
				succesAbsence = true;
				await invalidateAll();
				absenceDialogOpen = false;
				motifAbsenceProf = '';
			} else {
				erreurAbsence =
					result?.data?.error ||
					(result && 'error' in result ? result.error : null) ||
					'Échec de la déclaration';
			}
		} catch {
			erreurAbsence = 'Erreur réseau';
		} finally {
			submittingAbsence = false;
		}
	}

</script>

<div class="rounded-xl bg-card/50 p-4">
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm', class: 'mb-3 w-full gap-2' })} disabled={!peutModifierEDT}>
			<Plus class="size-3.5" />
			Ajouter une séance
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-100">
			<form method="POST" action="?/createSeance" use:loadingForm>
				<Dialog.Header>
					<Dialog.Title>Ajouter une séance pour {jour}</Dialog.Title>
					<Dialog.Description>Planifiez un cours dans l'emploi du temps</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<input type="hidden" name="jour" value={jour} />
					<div class="grid grid-cols-2 gap-3">
						<div class="grid gap-2">
							<Label for="heure_debut">Début *</Label>
							<NativeSelect.Root
								bind:value={nouvelleSeance.heureDebut}
								class="w-full"
								name="heureDebut"
							>
								{#each creneaux as h (h)}
									<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid gap-2">
							<Label for="heure_fin">Fin *</Label>
							<NativeSelect.Root
								bind:value={nouvelleSeance.heureFin}
								class="w-full"
								name="heureFin"
							>
								{#each creneaux as h (h)}
									<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
					</div>
					<div class="grid gap-2">
						<Label for="cours">Matière *</Label>
						<NativeSelect.Root bind:value={nouvelleSeance.coursId} class="w-full" name="coursId">
							<NativeSelect.Option value="" disabled>Sélectionner une matière</NativeSelect.Option>
							{#each cours as c (c.id)}
								<NativeSelect.Option value={c.id}>{c.matiereNom} {c.professeur ? `(${c.professeur})` : ''}</NativeSelect.Option>
							{/each}
						</NativeSelect.Root>
					</div>
					<div class="grid gap-2">
						<Label for="salle">Salle</Label>
						<NativeSelect.Root bind:value={nouvelleSeance.salleId} class="w-full" name="salleId">
							<NativeSelect.Option value={null}>Sélectionner</NativeSelect.Option>
							{#each salles as s (s.id)}
								<NativeSelect.Option value={s.id}>{s.name} ({s.place} places)</NativeSelect.Option>
							{/each}
						</NativeSelect.Root>
					</div>
				</div>
				<Dialog.Footer>
					<Button variant="outline" size="sm" type="button" onclick={handleClose}>Annuler</Button>
					<Button variant="default" size="sm" type="submit">Ajouter</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<div class="space-y-2">
		{#if seances.length === 0}
			<p class="text-xs text-muted-foreground italic">Aucune séance</p>
		{:else}
			{#each seancesTriees as seance (seance.id)}
				<div class="rounded-md border border-sidebar-border bg-sidebar-accent/30 p-2 text-xs">
					<div class="flex items-start justify-between">
						<div>
							<p class="font-medium">{seance.heureDebut} - {seance.heureFin}</p>
							<p class="text-muted-foreground">{seance.coursNom || seance.coursId}</p>
							{#if seance.salleId}
								<p class="text-muted-foreground/70">
									Salle: {salles.find((s: { id: string; name: string }) => s.id === seance.salleId)
										?.name || 'Inconnu'}
								</p>
							{/if}
						</div>
						<div class="flex items-center gap-1">
						<Button
							variant="default"
							size="sm"
							class="h-6 px-2"
							disabled={!peutDemarrerCours(seance.coursId)}
							title={peutDemarrerCours(seance.coursId)
								? 'Démarrer le cours'
								: 'Réservé au professeur titulaire du cours'}
							onclick={() => ouvrirStartCours(seance)}
						>
							<Play class="size-3" />
						</Button>
							<Button
								variant="outline"
								size="sm"
								class="h-6 px-2"
								disabled={!peutModifierEDT}
								title={peutModifierEDT ? 'Modifier le cours' : 'Réservé aux surveillants, administrateurs ou au professeur titulaire'}
								onclick={() => openEditSeance(seance)}
							>
								<Pencil class="size-3" />
							</Button>
							<Button
								variant="destructive"
								size="sm"
								class="h-6 px-2"
								disabled={!rolePeutDeclarerAbsenceProf}
								title={!rolePeutDeclarerAbsenceProf
									? 'Réservé aux surveillants, opérateurs et administrateurs'
									: 'Déclarer le professeur absent (cours manqué)'}
								onclick={() => {
									seanceEnCours = seance;
									absenceDialogOpen = true;
								}}
							>
								<UserX class="size-3" />
							</Button>
							<form method="POST" action="?/deleteSeance" use:loadingForm>
								<input type="hidden" name="id" value={seance.id} />
								<Button
									type="submit"
									variant="destructive"
									size="sm"
									class="h-6 px-2"
									disabled={!peutModifierEDT}
									title={peutModifierEDT
										? 'Retirer de l’emploi du temps (le cours et les notes sont conservés)'
										: 'Réservé aux surveillants, administrateurs ou au professeur titulaire'}
								>
									<Trash2 class="size-3" />
								</Button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<Dialog.Root bind:open={editDialogOpen}>
		<Dialog.Content class="sm:max-w-100">
			<Dialog.Header>
				<Dialog.Title>Modifier le cours</Dialog.Title>
				<Dialog.Description>
					Modifier le jour, le professeur ou la salle de « {editSeance?.coursNom} ». Pour déplacer
					la séance vers un autre jour, changez le champ « Jour ». Le cours, les notes et les
					retards existants sont conservés.
				</Dialog.Description>
			</Dialog.Header>
			{#if editSeance}
				<form method="POST" action="?/updateCoursProfesseur" use:loadingForm>
					<input type="hidden" name="coursId" value={editSeance.coursId} />
					<input type="hidden" name="seanceId" value={editSeance.id} />
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="edit-jour">Jour *</Label>
							<NativeSelect.Root bind:value={editJour} class="w-full" name="jour">
								{#each jours as j (j)}
									<NativeSelect.Option value={j}>{j}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="grid gap-2">
								<Label for="edit-heure-debut">Début *</Label>
								<NativeSelect.Root
									bind:value={editHeureDebut}
									class="w-full"
									name="heureDebut"
								>
									{#each creneaux as h (h)}
										<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
							<div class="grid gap-2">
								<Label for="edit-heure-fin">Fin *</Label>
								<NativeSelect.Root
									bind:value={editHeureFin}
									class="w-full"
									name="heureFin"
								>
									{#each creneaux as h (h)}
										<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
						</div>
						<div class="grid gap-2">
							<Label for="edit-professeur">Professeur</Label>
							<NativeSelect.Root
								bind:value={editProfesseurId}
								class="w-full"
								name="professeurId"
							>
								<NativeSelect.Option value="">Aucun</NativeSelect.Option>
								{#each professeurs as p (p.id)}
									<NativeSelect.Option value={p.id}>{p.nom}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid gap-2">
							<Label for="edit-salle">Salle</Label>
							<NativeSelect.Root
								bind:value={editSalleId}
								class="w-full"
								name="salleId"
							>
								<NativeSelect.Option value={null}>Sélectionner</NativeSelect.Option>
								{#each salles as s (s.id)}
									<NativeSelect.Option value={s.id}>{s.name} ({s.place} places)</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
					</div>
					<Dialog.Footer>
						<Button variant="outline" size="sm" type="button" onclick={() => (editDialogOpen = false)}
							>Annuler</Button
						>
						<Button variant="default" size="sm" type="submit">Enregistrer</Button>
					</Dialog.Footer>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Root>

	{#if seanceEnCours}
		<StartCoursDialog
			bind:open={startDialogOpen}
			{classeId}
			coursId={seanceEnCours.coursId}
			coursNom={seanceEnCours.coursNom || seanceEnCours.coursId}
			salleNom={seanceEnCours.salleNom}
			heureDebut={seanceEnCours.heureDebut}
			heureFin={seanceEnCours.heureFin}
			{eleves}
			{seuilAbsence}
			{anneeActive}
			canEdit={peutDemarrerCours(seanceEnCours.coursId)}
		/>
	{/if}

	<Dialog.Root bind:open={absenceDialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2">
					<UserX class="size-4 text-destructive" /> Professeur absent
				</Dialog.Title>
				<Dialog.Description>
					Déclarer le cours manqué pour {seanceEnCours?.coursNom || 'ce cours'}{seanceEnCours
						?.jour
						? ` · ${seanceEnCours.jour}`
						: ''}{seanceEnCours?.heureDebut
						? ` · ${seanceEnCours.heureDebut} - ${seanceEnCours.heureFin}`
						: ''}.
					<br />
					L’heure prévue de la séance est comptée comme heure manquée (profil du professeur et
					classe).
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-2">
				<Label for="motif-absence-prof">Motif (optionnel)</Label>
				<Textarea
					id="motif-absence-prof"
					rows={2}
					placeholder="Ex: maladie, convocation…"
					bind:value={motifAbsenceProf}
				/>
			</div>
			{#if erreurAbsence}
				<div
					class="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
				>
					{erreurAbsence}
				</div>
			{/if}
			{#if succesAbsence}
				<div
					class="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600"
				>
					Absence du professeur enregistrée.
				</div>
			{/if}
			<Dialog.Footer class="mt-4">
				<Button variant="outline" size="sm" type="button" onclick={() => (absenceDialogOpen = false)}
					>Annuler</Button
				>
				<Button
					variant="destructive"
					size="sm"
					type="button"
					disabled={submittingAbsence || !seanceEnCours}
					onclick={() => seanceEnCours && declarerAbsenceProf(seanceEnCours)}
				>
					{submittingAbsence ? 'Enregistrement…' : 'Confirmer l’absence'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
