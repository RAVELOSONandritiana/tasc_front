<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Plus, Play, Trash2, Pencil, UserX, AlertTriangle, CheckCircle2 } from '@lucide/svelte/icons';
	import { invalidateAll } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import type { SeanceEDT } from '$lib/types/Materiel.type';
	import * as Dialog from '$lib/components/ui/dialog';
	import { loadingForm } from '$lib/actions/loadingForm';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { deserialize } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
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
		cours?: {
			id: string;
			matiereNom: string;
			coefficient: number;
			professeur: string;
			professeurId?: string | null;
		}[];
		jours?: string[];
		currentProfesseurId?: string | null;
		userRole?: string | null;
		professeurs?: { id: string; nom: string }[];
		eleves?: EleveEDT[];
		seuilAbsence?: number;
		anneeActive?: boolean;
	} = $props();

	/** Jours de la semaine tels qu'ils sont stockes dans l'emploi du temps. */
	const JOURS_SEMAINE = [
		'Dimanche',
		'Lundi',
		'Mardi',
		'Mercredi',
		'Jeudi',
		'Vendredi',
		'Samedi'
	];

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
		return !!currentProfesseurId && professeurParCours[coursId] === currentProfesseurId;
	}

	// Un surveillant ou un administrateur peut modifier/supprimer l'EDT,
	// mais seul le professeur titulaire du cours peut le démarrer (lancer).
	const peutModifierEDT = $derived(
		userRole === 'SURVEILLANT' ||
			userRole === 'ADMINISTRATEUR' ||
			userRole === 'ENSEIGNANT' ||
			userRole === 'OPERATEUR'
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
		heureDebut: '07:00',
		heureFin: '09:00',
		coursId: '',
		salleId: null as string | null
	});

	// Le créneau doit être cohérent, sinon la séance créée serait inexploitable
	// (horaire vide = emploi du temps cassé et absence impossible à déclarer).
	const nouvelleSeanceValide = $derived(
		!!nouvelleSeance.coursId &&
			!!nouvelleSeance.heureDebut &&
			!!nouvelleSeance.heureFin &&
			nouvelleSeance.heureFin > nouvelleSeance.heureDebut
	);

	function handleClose() {
		dialogOpen = false;
		nouvelleSeance = { heureDebut: '07:00', heureFin: '09:00', coursId: '', salleId: null };
	}

	let editDialogOpen = $state(false);
	let editSeance = $state<SeanceEDT | null>(null);
	let editProfesseurId = $state<string | null>(null);
	let editSalleId = $state<string | null>(null);
	let editHeureDebut = $state('');
	let editHeureFin = $state('');
	let editJour = $state('');

	const editSeanceValide = $derived(!!editHeureDebut && !!editHeureFin && editHeureFin > editHeureDebut);

	function openEditSeance(seance: SeanceEDT) {
		editSeance = seance;
		editProfesseurId = professeurParCours[seance.coursId] ?? null;
		editSalleId = seance.salleId ?? null;
		editHeureDebut = seance.heureDebut || '07:00';
		editHeureFin = seance.heureFin || '09:00';
		editJour = seance.jour || jour;
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
	// seance affichee. Réservé aux roles pouvant declarer une absence
	// d'enseignant (surveillant, opérateur, administrateur).
	const rolePeutDeclarerAbsenceProf = $derived(
		userRole === 'SURVEILLANT' || userRole === 'ADMINISTRATEUR' || userRole === 'OPERATEUR'
	);

	let absenceDialogOpen = $state(false);
	let seanceAbsence = $state<SeanceEDT | null>(null);
	let dateAbsence = $state('');
	let motifAbsenceProf = $state('');
	let submittingAbsence = $state(false);
	let erreurAbsence = $state<string | null>(null);
	let succesAbsence = $state<string | null>(null);

	/** Date du jour au format "AAAA-MM-JJ" (heure locale, pas UTC). */
	function aujourdHui(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	/**
	 * Dernière date passée (ou aujourd'hui) qui tombe le jour de la séance :
	 * une absence se déclare forcément sur un créneau réellement prévu.
	 */
	function derniereOccurrence(jourSeance: string): string {
		const index = JOURS_SEMAINE.indexOf(jourSeance);
		const d = new Date();
		if (index >= 0) d.setDate(d.getDate() - ((d.getDay() - index + 7) % 7));
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	const jourDeLaDateAbsence = $derived(
		/^\d{4}-\d{2}-\d{2}$/.test(dateAbsence)
			? JOURS_SEMAINE[new Date(`${dateAbsence}T00:00:00`).getDay()]
			: ''
	);

	const dateAbsenceCoherente = $derived(
		!!seanceAbsence && !!jourDeLaDateAbsence && jourDeLaDateAbsence === seanceAbsence.jour
	);

	/** Durée (en heures) de la séance : ce sont les heures comptées manquées. */
	function dureeSeance(seance: SeanceEDT | null): number {
		if (!seance?.heureDebut || !seance?.heureFin) return 0;
		const [dh, dm] = seance.heureDebut.split(':').map(Number);
		const [fh, fm] = seance.heureFin.split(':').map(Number);
		if ([dh, dm, fh, fm].some((n) => Number.isNaN(n))) return 0;
		const diff = fh * 60 + fm - (dh * 60 + dm);
		return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
	}

	function ouvrirAbsenceProf(seance: SeanceEDT) {
		seanceAbsence = seance;
		dateAbsence = derniereOccurrence(seance.jour || jour);
		motifAbsenceProf = '';
		erreurAbsence = null;
		succesAbsence = null;
		submittingAbsence = false;
		absenceDialogOpen = true;
	}

	async function declarerAbsenceProf() {
		const seance = seanceAbsence;
		if (!rolePeutDeclarerAbsenceProf || !seance || submittingAbsence) return;
		erreurAbsence = null;
		succesAbsence = null;

		if (!/^\d{4}-\d{2}-\d{2}$/.test(dateAbsence)) {
			erreurAbsence = 'Choisissez la date de la séance manquée.';
			return;
		}
		if (!dateAbsenceCoherente) {
			erreurAbsence = `Le ${dateAbsence} est un ${jourDeLaDateAbsence.toLowerCase()} : cette séance a lieu le ${(seance.jour || jour).toLowerCase()}.`;
			return;
		}
		if (!motifAbsenceProf.trim()) {
			erreurAbsence = 'Le motif est obligatoire.';
			return;
		}

		submittingAbsence = true;
		const fd = new FormData();
		fd.append('seanceId', seance.id);
		fd.append('date', dateAbsence);
		fd.append('motif', motifAbsenceProf.trim());

		try {
			const res = await fetch(`/classe/${classeId}/edt?/absenceProf`, {
				method: 'POST',
				body: fd
			});
			// Une action SvelteKit renvoie un ActionResult sérialisé : sans
			// deserialize(), le message d'erreur du serveur était perdu et la
			// fenêtre affichait toujours « Échec de la déclaration ».
			const result = deserialize(await res.text()) as ActionResult;
			if (result.type === 'success') {
				succesAbsence =
					(result.data?.message as string) || 'Absence du professeur enregistrée.';
				await invalidateAll();
				setTimeout(() => {
					absenceDialogOpen = false;
				}, 1200);
			} else if (result.type === 'failure') {
				erreurAbsence = (result.data?.error as string) || 'Échec de la déclaration';
			} else if (result.type === 'error') {
				erreurAbsence = result.error?.message || 'Échec de la déclaration';
			} else if (result.type === 'redirect') {
				erreurAbsence = 'Votre session a expiré : reconnectez-vous puis réessayez.';
			}
		} catch {
			erreurAbsence = 'Erreur réseau : vérifiez votre connexion puis réessayez.';
		} finally {
			submittingAbsence = false;
		}
	}
</script>

<div class="rounded-xl bg-card/50 p-2 sm:p-3">
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger
			class={buttonVariants({ variant: 'outline', size: 'sm', class: 'mb-3 w-full gap-2' })}
			disabled={!peutModifierEDT}
		>
			<Plus class="size-3.5" />
			Ajouter une séance
		</Dialog.Trigger>
		<Dialog.Content class="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
			<form method="POST" action="?/createSeance" use:loadingForm>
				<Dialog.Header>
					<Dialog.Title>Ajouter une séance pour {jour}</Dialog.Title>
					<Dialog.Description>Planifiez un cours dans l'emploi du temps</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<input type="hidden" name="jour" value={jour} />
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="grid gap-2">
							<Label for="heure-debut-{jour}">Début *</Label>
							<NativeSelect.Root
								id="heure-debut-{jour}"
								bind:value={nouvelleSeance.heureDebut}
								class="w-full"
								name="heureDebut"
								required
							>
								{#each creneaux as h (h)}
									<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid gap-2">
							<Label for="heure-fin-{jour}">Fin *</Label>
							<NativeSelect.Root
								id="heure-fin-{jour}"
								bind:value={nouvelleSeance.heureFin}
								class="w-full"
								name="heureFin"
								required
							>
								{#each creneaux as h (h)}
									<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
					</div>
					<div class="grid gap-2">
						<Label for="cours-{jour}">Matière *</Label>
						<NativeSelect.Root
							id="cours-{jour}"
							bind:value={nouvelleSeance.coursId}
							class="w-full"
							name="coursId"
							required
						>
							<NativeSelect.Option value="" disabled>Sélectionner une matière</NativeSelect.Option>
							{#each cours as c (c.id)}
								<NativeSelect.Option value={c.id}>
									{c.matiereNom}
									{c.professeur ? `(${c.professeur})` : ''}
								</NativeSelect.Option>
							{/each}
						</NativeSelect.Root>
					</div>
					<div class="grid gap-2">
						<Label for="salle-{jour}">Salle</Label>
						<NativeSelect.Root
							id="salle-{jour}"
							bind:value={nouvelleSeance.salleId}
							class="w-full"
							name="salleId"
						>
							<NativeSelect.Option value={null}>Sélectionner</NativeSelect.Option>
							{#each salles as s (s.id)}
								<NativeSelect.Option value={s.id}>{s.name} ({s.place} places)</NativeSelect.Option>
							{/each}
						</NativeSelect.Root>
					</div>
					{#if !nouvelleSeanceValide}
						<p class="text-[11px] text-muted-foreground">
							Choisissez une matière et une heure de fin postérieure à l'heure de début.
						</p>
					{/if}
				</div>
				<Dialog.Footer class="gap-2">
					<Button
						variant="outline"
						size="sm"
						type="button"
						class="w-full sm:w-auto"
						onclick={handleClose}
					>
						Annuler
					</Button>
					<Button
						variant="default"
						size="sm"
						type="submit"
						class="w-full sm:w-auto"
						disabled={!nouvelleSeanceValide}
					>
						Ajouter
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<div class="space-y-2">
		{#if seances.length === 0}
			<p class="text-xs text-muted-foreground italic">Aucune séance</p>
		{:else}
			{#each seancesTriees as seance (seance.id)}
				{@const horaireIncomplet = !seance.heureDebut || !seance.heureFin}
				{@const sansProfesseur = !professeurParCours[seance.coursId]}
				<div class="rounded-md border border-sidebar-border bg-sidebar-accent/30 p-2 text-xs">
					<div class="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
						<div class="min-w-0 flex-1 basis-32">
							<p class="font-medium">
								{#if horaireIncomplet}
									<span class="text-destructive">Horaire à compléter</span>
								{:else}
									{seance.heureDebut} - {seance.heureFin}
								{/if}
							</p>
							<p class="truncate text-muted-foreground" title={seance.coursNom || seance.coursId}>
								{seance.coursNom || seance.coursId}
							</p>
							{#if seance.salleId}
								<p class="truncate text-muted-foreground/70">
									Salle: {salles.find((s: { id: string; name: string }) => s.id === seance.salleId)
										?.name || 'Inconnu'}
								</p>
							{/if}
							{#if sansProfesseur}
								<p class="mt-1 flex items-start gap-1 text-[11px] text-amber-600">
									<AlertTriangle class="mt-0.5 size-3 shrink-0" />
									<span>Aucun professeur affecté</span>
								</p>
							{/if}
						</div>
						<div class="flex flex-wrap items-center justify-end gap-1">
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
								<span class="sr-only">Démarrer le cours</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="h-6 px-2"
								disabled={!peutModifierEDT}
								title={peutModifierEDT
									? 'Modifier le cours'
									: 'Réservé aux surveillants, administrateurs ou au professeur titulaire'}
								onclick={() => openEditSeance(seance)}
							>
								<Pencil class="size-3" />
								<span class="sr-only">Modifier la séance</span>
							</Button>
							<Button
								variant="destructive"
								size="sm"
								class="h-6 px-2"
								disabled={!rolePeutDeclarerAbsenceProf}
								title={!rolePeutDeclarerAbsenceProf
									? 'Réservé aux surveillants, opérateurs et administrateurs'
									: 'Déclarer le professeur absent (cours manqué)'}
								onclick={() => ouvrirAbsenceProf(seance)}
							>
								<UserX class="size-3" />
								<span class="sr-only">Déclarer le professeur absent</span>
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
									<span class="sr-only">Supprimer la séance</span>
								</Button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<Dialog.Root bind:open={editDialogOpen}>
		<Dialog.Content class="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
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
							<Label for="edit-jour-{jour}">Jour *</Label>
							<NativeSelect.Root
								id="edit-jour-{jour}"
								bind:value={editJour}
								class="w-full"
								name="jour"
							>
								{#each jours as j (j)}
									<NativeSelect.Option value={j}>{j}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div class="grid gap-2">
								<Label for="edit-heure-debut-{jour}">Début *</Label>
								<NativeSelect.Root
									id="edit-heure-debut-{jour}"
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
								<Label for="edit-heure-fin-{jour}">Fin *</Label>
								<NativeSelect.Root
									id="edit-heure-fin-{jour}"
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
							<Label for="edit-professeur-{jour}">Professeur</Label>
							<NativeSelect.Root
								id="edit-professeur-{jour}"
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
							<Label for="edit-salle-{jour}">Salle</Label>
							<NativeSelect.Root
								id="edit-salle-{jour}"
								bind:value={editSalleId}
								class="w-full"
								name="salleId"
							>
								<NativeSelect.Option value={null}>Sélectionner</NativeSelect.Option>
								{#each salles as s (s.id)}
									<NativeSelect.Option value={s.id}>{s.name} ({s.place} places)</NativeSelect.Option
									>
								{/each}
							</NativeSelect.Root>
						</div>
						{#if !editSeanceValide}
							<p class="text-[11px] text-destructive">
								L'heure de fin doit être postérieure à l'heure de début.
							</p>
						{/if}
					</div>
					<Dialog.Footer class="gap-2">
						<Button
							variant="outline"
							size="sm"
							type="button"
							class="w-full sm:w-auto"
							onclick={() => (editDialogOpen = false)}
						>
							Annuler
						</Button>
						<Button
							variant="default"
							size="sm"
							type="submit"
							class="w-full sm:w-auto"
							disabled={!editSeanceValide}
						>
							Enregistrer
						</Button>
					</Dialog.Footer>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Root>

	{#if seanceEnCours}
		<StartCoursDialog
			bind:open={startDialogOpen}
			{classeId}
			seanceId={seanceEnCours.id}
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
		<Dialog.Content class="max-h-[92dvh] overflow-y-auto sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2 text-base">
					<UserX class="size-4 shrink-0 text-destructive" /> Professeur absent
				</Dialog.Title>
				<Dialog.Description class="text-xs sm:text-sm">
					Déclarez la séance qui n'a pas été assurée. Sa durée est comptée comme heures manquées
					(profil du professeur et fiche de la classe).
				</Dialog.Description>
			</Dialog.Header>

			{#if seanceAbsence}
				<div class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
					<p class="font-semibold text-destructive">
						{seanceAbsence.coursNom || 'Cours'}
					</p>
					<p class="text-muted-foreground">
						{seanceAbsence.jour || jour} · {seanceAbsence.heureDebut} - {seanceAbsence.heureFin}
						{#if dureeSeance(seanceAbsence) > 0}
							· <span class="font-semibold">{dureeSeance(seanceAbsence)} h manquée(s)</span>
						{/if}
					</p>
				</div>
			{/if}

			{#if !anneeActive}
				<div
					class="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
				>
					<AlertTriangle class="mt-0.5 size-4 shrink-0" />
					<span>Aucune année scolaire active : déclaration impossible.</span>
				</div>
			{/if}

			<div class="grid gap-4">
				<div class="grid gap-2">
					<Label for="date-absence-prof">Date de la séance manquée</Label>
					<Input
						id="date-absence-prof"
						type="date"
						max={aujourdHui()}
						bind:value={dateAbsence}
						disabled={submittingAbsence || !!succesAbsence}
					/>
					{#if jourDeLaDateAbsence && !dateAbsenceCoherente}
						<p class="text-[11px] text-amber-600">
							Le {dateAbsence} est un {jourDeLaDateAbsence.toLowerCase()} : cette séance a lieu le
							{(seanceAbsence?.jour || jour).toLowerCase()}.
						</p>
					{:else if jourDeLaDateAbsence}
						<p class="text-[11px] text-muted-foreground">{jourDeLaDateAbsence}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="motif-absence-prof">Motif *</Label>
					<Textarea
						id="motif-absence-prof"
						rows={2}
						placeholder="Ex: maladie, convocation…"
						bind:value={motifAbsenceProf}
						disabled={submittingAbsence || !!succesAbsence}
					/>
				</div>

				{#if erreurAbsence}
					<div
						class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
					>
						{erreurAbsence}
					</div>
				{/if}
				{#if succesAbsence}
					<div
						class="flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600"
					>
						<CheckCircle2 class="mt-0.5 size-4 shrink-0" />
						<span>{succesAbsence}</span>
					</div>
				{/if}
			</div>

			<Dialog.Footer class="mt-4 gap-2">
				<Button
					variant="outline"
					size="sm"
					type="button"
					class="w-full sm:w-auto"
					onclick={() => (absenceDialogOpen = false)}
				>
					Annuler
				</Button>
				<Button
					variant="destructive"
					size="sm"
					type="button"
					class="w-full sm:w-auto"
					disabled={submittingAbsence ||
						!!succesAbsence ||
						!seanceAbsence ||
						!anneeActive ||
						!rolePeutDeclarerAbsenceProf}
					onclick={declarerAbsenceProf}
				>
					{submittingAbsence ? 'Enregistrement…' : 'Confirmer l’absence'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
