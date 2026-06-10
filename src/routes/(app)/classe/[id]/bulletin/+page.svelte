<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Download, Calendar, Plus, FileText, Printer, User, School } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';
	import { page } from '$app/stores';

	let listeCours = $state<Cours[]>([
		{ id: '1', nom: 'Mathématiques', coefficient: 6, professeur: 'RANDRIANANTENAINA Tsitoarimanjakely' },
		{ id: '2', nom: 'Physique', coefficient: 4, professeur: 'ANDRIANTENAINA Bako' },
		{ id: '3', nom: 'Français', coefficient: 5, professeur: 'RAKOTO Fanomezamasy' }
	]);

	let listeExamens = $state<Examen[]>([
		{ id: 'e1', nom: 'Examen de mi-semestre', date: '2026-02-15', classeId: '1' },
		{ id: 'e2', nom: 'Examen de fin de semestre', date: '2026-03-20', classeId: '1' }
	]);

	let elevesClasse = $state<EleveCours[]>([
		{
			id: '1',
			nom: 'RANDRIANANTENAINA',
			prenom: 'Tsitoarimanjakely',
			dateNaissance: '2008-05-15',
			actif: true,
			notes: [
				{ id: 'n1', valeur: 14, coefficient: 6, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '1', examenId: 'e1' },
				{ id: 'n2', valeur: 12, coefficient: 4, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '2', examenId: 'e1' },
				{ id: 'n3', valeur: 16, coefficient: 5, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '3', examenId: 'e1' }
			]
		},
		{
			id: '2',
			nom: 'RAKOTO',
			prenom: 'Fanomezamasy',
			dateNaissance: '2008-03-22',
			actif: true,
			notes: [
				{ id: 'n4', valeur: 16, coefficient: 6, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '1', examenId: 'e1' },
				{ id: 'n5', valeur: 14, coefficient: 4, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '2', examenId: 'e1' },
				{ id: 'n6', valeur: 11, coefficient: 5, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '3', examenId: 'e1' }
			]
		},
		{
			id: '3',
			nom: 'ANDRIANTENAINA',
			prenom: 'Bako',
			dateNaissance: '2008-07-10',
			actif: true,
			notes: [
				{ id: 'n7', valeur: 11, coefficient: 6, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '1', examenId: 'e1' },
				{ id: 'n8', valeur: 9, coefficient: 4, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '2', examenId: 'e1' },
				{ id: 'n9', valeur: 13, coefficient: 5, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '3', examenId: 'e1' }
			]
		}
	]);

	let nouvelExamen = $state({
		nom: '',
		date: '',
		periode: ''
	});

	let bulletinEleve = $state<EleveCours | null>(null);

	function ajouterExamen() {
		if (!nouvelExamen.nom || !nouvelExamen.date) return;
		const examen: Examen = {
			id: Date.now().toString(),
			nom: nouvelExamen.nom,
			date: nouvelExamen.date,
			classeId: '1',
			periode: nouvelExamen.periode
		};
		listeExamens = [...listeExamens, examen];
		nouvelExamen = { nom: '', date: '', periode: '' };
	}

	function calculerMoyenneExament(eleve: EleveCours, examenId: string): number {
		const notesExamen = eleve.notes?.filter((n) => n.examenId === examenId) || [];
		if (notesExamen.length === 0) return 0;
		const totalPoints = notesExamen.reduce((sum, n) => sum + n.valeur * n.coefficient, 0);
		const totalCoef = notesExamen.reduce((sum, n) => sum + n.coefficient, 0);
		return totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0;
	}

	function calculerRang(eleveId: string, examenId: string): number {
		const notes = elevesClasse.map((e) => ({
			id: e.id,
			moy: calculerMoyenneExament(e, examenId)
		})).sort((a, b) => b.moy - a.moy);
		return notes.findIndex((n) => n.id === eleveId) + 1;
	}

	function getNoteEleve(e: EleveCours, coursId: string, examenId: string): number | undefined {
		return e.notes?.find((n) => n.coursId === coursId && n.examenId === examenId)?.valeur;
	}

	function ouvrirBulletin(e: EleveCours) {
		bulletinEleve = e;
		setTimeout(() => {
			imprimerBulletin();
		}, 100);
	}

	function imprimerBulletin() {
		window.print();
		bulletinEleve = null;
	}
</script>

{#if !bulletinEleve}
	<div class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold">Bulletins de la classe</h1>
			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
					<Plus class="mr-1 size-4" />
					Nouvel examen
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Créer un examen global</Dialog.Title>
						<Dialog.Description>
							Toutes les matières pourront saisir les notes pour cet examen
						</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="examen_nom">Nom de l'examen *</Label>
							<Input
								id="examen_nom"
								bind:value={nouvelExamen.nom}
								placeholder="Examen de mi-semestre"
							/>
						</div>
						<div class="grid gap-2">
							<Label for="examen_date">Date *</Label>
							<Input
								id="examen_date"
								type="date"
								bind:value={nouvelExamen.date}
							/>
						</div>
						<div class="grid gap-2">
							<Label for="examen_periode">Période</Label>
							<Input
								id="examen_periode"
								bind:value={nouvelExamen.periode}
								placeholder="Semestre 1"
							/>
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Dialog.Close class={buttonVariants({ variant: 'default' })} onclick={ajouterExamen}>
							Créer
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>

		<div class="mb-6 rounded-md border p-4">
			<h2 class="mb-4 font-semibold">Examens disponibles</h2>
			{#if listeExamens.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each listeExamens as examen (examen.id)}
						<span class="rounded-md bg-sidebar-accent/30 px-3 py-2 text-sm">
							{examen.nom} ({examen.date})
						</span>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">Aucun examen créé</p>
			{/if}
		</div>

		{#if listeExamens.length > 0}
			{#each listeExamens as examen (examen.id)}
				<div class="mb-6 rounded-md border bg-background/50 p-4">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold">{examen.nom}</h2>
						<span class="text-sm text-muted-foreground">{examen.date}</span>
					</div>

					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Élève</Table.Head>
									{#each listeCours as cours (cours.id)}
										<Table.Head class="text-center">{cours.nom}</Table.Head>
									{/each}
									<Table.Head class="text-center">Moyenne</Table.Head>
									<Table.Head class="text-center">Rang</Table.Head>
									<Table.Head class="w-20"></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each elevesClasse.filter((e) => e.actif) as eleve (eleve.id)}
									<Table.Row>
										<Table.Cell>
											<div class="font-medium">{eleve.nom} {eleve.prenom}</div>
											<div class="text-xs text-muted-foreground">
												Né(e) : {eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}
											</div>
										</Table.Cell>
										{#each listeCours as cours (cours.id)}
											<Table.Cell class="text-center">
												{getNoteEleve(eleve, cours.id, examen.id) ?? '—'}
											</Table.Cell>
										{/each}
										<Table.Cell class="text-center font-medium">
											{calculerMoyenneExament(eleve, examen.id)}
										</Table.Cell>
										<Table.Cell class="text-center">
											{calculerRang(eleve.id, examen.id)}/{elevesClasse.filter(e => e.actif).length}
										</Table.Cell>
										<Table.Cell>
											<Button size="sm" variant="ghost" onclick={() => ouvrirBulletin(eleve)}>
												<Printer class="size-4" />
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</div>
			{/each}
		{/if}
	</div>
{:else}
	<div class="print-section bg-background p-8">
		<div class="max-w-3xl mx-auto">
			<div class="mb-6 border-b pb-4">
				<div class="flex items-center gap-3 mb-4">
					<School class="size-8" />
					<h1 class="text-2xl font-bold">LYCÉE TASC - BULLETIN SCOLAIRE</h1>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p><span class="font-semibold">Élève:</span> {bulletinEleve.prenom} {bulletinEleve.nom}</p>
						<p><span class="font-semibold">Né(e):</span> {bulletinEleve.dateNaissance ? new Date(bulletinEleve.dateNaissance).toLocaleDateString() : '—'}</p>
						<p><span class="font-semibold">Classe:</span> 1ère L</p>
					</div>
					<div class="text-right">
						<p class="text-sm">Année scolaire: 2025-2026</p>
					</div>
				</div>
			</div>

			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Matière</Table.Head>
						<Table.Head class="text-center">Note</Table.Head>
						<Table.Head class="text-center">Coefficient</Table.Head>
						<Table.Head class="text-center">Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each listeCours as cours (cours.id)}
						{@const note = bulletinEleve.notes?.find((n) => n.coursId === cours.id)}
						<Table.Row>
							<Table.Cell>{cours.nom}</Table.Cell>
							<Table.Cell class="text-center">{note?.valeur ?? '—'}</Table.Cell>
							<Table.Cell class="text-center">{note?.coefficient ?? cours.coefficient}</Table.Cell>
							<Table.Cell class="text-center">
								{note ? (note.valeur * note.coefficient) : '—'}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>

			<div class="mt-6 rounded-md border bg-sidebar-accent/20 p-4">
				<div class="flex justify-between">
					<span class="font-semibold">Moyenne générale:</span>
					<span class="font-bold text-lg">
						{bulletinEleve.notes && bulletinEleve.notes.length > 0
							? (() => {
									const notes = bulletinEleve.notes;
									const total = notes.reduce((s, n) => s + n.valeur * n.coefficient, 0);
									const coef = notes.reduce((s, n) => s + n.coefficient, 0);
									return coef > 0 ? Math.round((total / coef) * 100) / 100 : 0;
								})()
							: 0}
					</span>
				</div>
				<div class="flex justify-between mt-2">
					<span class="font-semibold">Rang:</span>
					<span class="font-bold">-</span>
				</div>
			</div>
			<Button class="mt-6" onclick={imprimerBulletin}>Imprimer</Button>
		</div>
	</div>
{/if}

<style>
	@media print {
		.print-section {
			padding: 20px !important;
			background: white !important;
			color: black !important;
		}
	}
</style>