<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Plus, Play, Trash2, Pencil, UserCog } from '@lucide/svelte/icons';
	import type { SeanceEDT } from '$lib/types/Materiel.type';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { loadingForm } from '$lib/actions/loadingForm';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { goto } from '$app/navigation';

	const { jour, seances, salles, heures, classeId, cours = [], currentProfesseurId = null, userRole = null, professeurs = [] }: {
		jour: string;
		seances: SeanceEDT[];
		salles: { id: string; num: number; name: string; place: number }[];
		heures: string[];
		classeId: string;
		cours?: { id: string; matiereNom: string; coefficient: number; professeur: string; professeurId?: string | null }[];
		currentProfesseurId?: string | null;
		userRole?: string | null;
		professeurs?: { id: string; nom: string }[];
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
	function genererCreneaux(debut = '06:00', fin = '22:00', pas = 15): string[] {
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

	function openEditSeance(seance: SeanceEDT) {
		editSeance = seance;
		editProfesseurId = professeurParCours[seance.coursId] ?? null;
		editSalleId = seance.salleId ?? null;
		editHeureDebut = seance.heureDebut || '';
		editHeureFin = seance.heureFin || '';
		editDialogOpen = true;
	}

	// Les séances d'une journée sont triées par heure de début (matin -> soir).
	const seancesTriees = $derived(
		[...(seances ?? [])].sort((a, b) => (a.heureDebut || '').localeCompare(b.heureDebut || ''))
	);
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
								disabled={!estTitulaire(seance.coursId)}
								title={estTitulaire(seance.coursId)
									? undefined
									: 'Réservé au professeur titulaire du cours'}
								onclick={() => {
									if (estTitulaire(seance.coursId)) {
										goto(`/classe/${classeId}/cours/${seance.coursId}/presence`);
									}
								}}
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
							<form method="POST" action="?/deleteSeance" use:loadingForm>
								<input type="hidden" name="id" value={seance.id} />
								<Button
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
					Changer le professeur ou la salle de « {editSeance?.coursNom} ». Le cours, les notes et
					les retards existants sont conservés ; seules la liaison professeur et la salle sont
					mises à jour.
				</Dialog.Description>
			</Dialog.Header>
			{#if editSeance}
				<form method="POST" action="?/updateCoursProfesseur" use:loadingForm>
					<input type="hidden" name="coursId" value={editSeance.coursId} />
					<input type="hidden" name="seanceId" value={editSeance.id} />
					<div class="grid gap-4 py-4">
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
</div>
