<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { ArrowLeft, Check, X, Save } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { EleveCours } from '$lib/types/Materiel.type';

	let eleves = $state<EleveCours[]>([
		{
			id: '1',
			nom: 'RANDRIANANTENAINA',
			prenom: 'Tsitoarimanjakely',
			dateNaissance: '2008-05-15',
			actif: true,
			notes: [],
			incidents: [],
			absences: [],
			retards: [],
			url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
		},
		{
			id: '2',
			nom: 'RAKOTO',
			prenom: 'Fanomezamasy',
			dateNaissance: '2008-03-22',
			actif: true,
			notes: [],
			incidents: [],
			absences: [],
			retards: [],
			url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
		},
		{
			id: '3',
			nom: 'ANDRIANTENAINA',
			prenom: 'Bako',
			dateNaissance: '2008-07-10',
			actif: false,
			notes: [],
			incidents: [],
			absences: [],
			retards: [],
			url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
		}
	]);

	let coursNom = 'Mathématiques';
	let salleNom = 'Salle 1';
	let heureDebut = '08:00';
	let heureFin = '10:00';

	let absenceNotes = $state<Record<string, 'present' | 'absent' | 'retard' | 'optional'> >({});

	let currentEleve = $derived(eleves[0]);

	function markPresent() {
		absenceNotes[currentEleve.id] = 'present';
	}

	function markAbsent() {
		absenceNotes[currentEleve.id] = 'absent';
	}

	function markRetard() {
		absenceNotes[currentEleve.id] = 'retard';
	}

	function markOptional() {
		absenceNotes[currentEleve.id] = 'optional';
	}

	function getEleveStatus(eleveId: string): 'present' | 'absent' | 'retard' | 'optional' {
		return (absenceNotes[eleveId] as 'present' | 'absent' | 'retard' | 'optional') || 'present';
	}

	function sauvegarder() {
		console.log('Sauvegarder les présences:', absenceNotes);
	}
</script>

<div class="min-h-screen bg-sidebar text-sidebar-foreground">
	<header class="flex items-center justify-between gap-4 border-b border-sidebar-border bg-card/80 backdrop-blur-sm px-4 h-16">
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" onclick={() => goto(`/classe/${$page.params.id}/cours`)}>
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-lg font-semibold">{coursNom}</h1>
				<p class="text-xs text-muted-foreground">{salleNom} • {heureDebut} - {heureFin}</p>
			</div>
		</div>
		<Button variant="default" size="sm" onclick={sauvegarder}>
			<Save class="size-4" />
		</Button>
	</header>

	<div class="p-4">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-semibold">Présence des élèves</h2>
			<div class="text-sm text-muted-foreground">
				<span class="mr-4">Total: {eleves.length}</span>
				<span class="mr-4">Présents: {eleves.filter(e => !absenceNotes[e.id] || absenceNotes[e.id] === 'present').length}</span>
				<span class="mr-4 text-red-500">Absents: {eleves.filter(e => absenceNotes[e.id] === 'absent').length}</span>
				<span class="text-amber-500">Retards: {eleves.filter(e => absenceNotes[e.id] === 'retard').length}</span>
			</div>
		</div>

		<div class="space-y-2">
			{#each eleves as eleve (eleve.id)}
				<div class="flex items-center gap-3 rounded-lg border p-3 {getEleveStatus(eleve.id) === 'present' ? 'bg-emerald-500/10' : getEleveStatus(eleve.id) === 'absent' ? 'bg-red-500/10' : getEleveStatus(eleve.id) === 'retard' ? 'bg-amber-500/10' : 'bg-muted/30'}">
					<div class="flex items-center gap-3 flex-1">
						<img src={eleve.url} alt={eleve.prenom} class="h-10 w-10 rounded-full object-cover" />
						<div>
							<p class="font-medium">{eleve.prenom} {eleve.nom}</p>
							<p class="text-xs text-muted-foreground">{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : ''}</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button
							class={`px-3 py-1 text-xs rounded ${getEleveStatus(eleve.id) === 'present' ? 'bg-emerald-500 text-white' : 'bg-muted'} transition-all`}
							onclick={() => absenceNotes[eleve.id] = 'present'}
						>
							Présent
						</button>
						<button
							class={`px-3 py-1 text-xs rounded ${getEleveStatus(eleve.id) === 'absent' ? 'bg-red-500 text-white' : 'bg-muted'} transition-all`}
							onclick={() => absenceNotes[eleve.id] = 'absent'}
						>
							Absent
						</button>
						<button
							class={`px-3 py-1 text-xs rounded ${getEleveStatus(eleve.id) === 'retard' ? 'bg-amber-500 text-white' : 'bg-muted'} transition-all`}
							onclick={() => absenceNotes[eleve.id] = 'retard'}
						>
							Retard
						</button>
						<button
							class={`px-3 py-1 text-xs rounded ${getEleveStatus(eleve.id) === 'optional' ? 'bg-gray-500 text-white' : 'bg-muted'} transition-all`}
							onclick={() => absenceNotes[eleve.id] = 'optional'}
						>
							Optionnel
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>