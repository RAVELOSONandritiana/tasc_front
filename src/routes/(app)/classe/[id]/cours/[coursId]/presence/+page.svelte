<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import { ArrowLeft, Check, X } from '@lucide/svelte/icons';
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

	let currentIndex = $state(0);
	let absenceNotes = $state<Record<string, 'present' | 'absent' | 'retard' | 'optional'> >({});

	let currentEleve = $derived(eleves[currentIndex]);

	function markPresent() {
		absenceNotes[currentEleve.id] = 'present';
		if (currentIndex < eleves.length - 1) currentIndex++;
	}

	function markAbsent() {
		absenceNotes[currentEleve.id] = 'absent';
		if (currentIndex < eleves.length - 1) currentIndex++;
	}

	function markRetard() {
		absenceNotes[currentEleve.id] = 'retard';
		if (currentIndex < eleves.length - 1) currentIndex++;
	}

	function markOptional() {
		absenceNotes[currentEleve.id] = 'optional';
		if (currentIndex < eleves.length - 1) currentIndex++;
	}

	function goToEleve(index: number) {
		currentIndex = index;
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
		<div class="text-sm text-muted-foreground">
			{currentIndex + 1} / {eleves.length}
		</div>
	</header>

	<div class="flex-1 flex items-center justify-center p-4">
		{#if currentEleve}
			<div class="w-full max-w-md space-y-6">
				<div class="flex flex-col items-center gap-4">
					<Avatar.Root class="h-24 w-24">
						<Avatar.Image src={currentEleve.url || 'https://github.com/shadcn.png'} alt={`${currentEleve.prenom} ${currentEleve.nom}`} />
						<Avatar.Fallback class="text-2xl font-bold">
							{currentEleve.prenom[0]}{currentEleve.nom[0]}
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="text-center">
						<h2 class="text-xl font-bold">{currentEleve.prenom} {currentEleve.nom}</h2>
						<p class="text-sm text-muted-foreground">
							{currentEleve.dateNaissance ? new Date(currentEleve.dateNaissance).toLocaleDateString() : ''}
						</p>
						<p class="text-xs text-muted-foreground mt-1">
							{currentEleve.actif ? 'Actif' : 'Inactif'}
						</p>
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex gap-2">
						<Button variant="default" class="flex-1" onclick={markPresent}>
							<Check class="mr-1 size-4" /> Présent
						</Button>
						<Button variant="destructive" class="flex-1" onclick={markAbsent}>
							<X class="mr-1 size-4" /> Absent
						</Button>
					</div>
					<Button variant="outline" class="w-full" onclick={markRetard}>
						Retard
					</Button>
					<Button variant="secondary" class="w-full" onclick={markOptional}>
						Non obligatoire
					</Button>
				</div>

				<div class="flex justify-center gap-2">
					{#each eleves as eleve, i (eleve.id)}
						<button
							class="w-2 h-2 rounded-full transition-all {currentIndex === i ? 'bg-primary w-4' : 'bg-muted'}"
							onclick={() => goToEleve(i)}
							aria-label="Aller à l'élève {i + 1}"
						></button>
					{/each}
				</div>
			</div>
		{:else}
			<p class="text-muted-foreground">Aucun élève</p>
		{/if}
	</div>

	<div class="p-4 border-t border-sidebar-border">
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => goto(`/classe/${$page.params.id}/cours/${$page.params.coursId}/presence/edit`)}>
				Modifier la présence
			</Button>
			<Button onclick={() => goto(`/classe/${$page.params.id}/cours`)}>
				Terminer ({eleves.filter(e => absenceNotes[e.id]).length} marqués)
			</Button>
		</div>
	</div>
</div>