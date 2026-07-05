<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import { ArrowLeft, Check, X } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let currentIndex = $state(0);
	let absenceNotes = $state<Record<string, 'present' | 'absent' | 'retard' | 'optional'>>({});

	let currentEleve = $derived(data.eleves[currentIndex]);

	function markPresent() {
		absenceNotes[currentEleve.id] = 'present';
		if (currentIndex < data.eleves.length - 1) currentIndex++;
	}

	function markAbsent() {
		absenceNotes[currentEleve.id] = 'absent';
		if (currentIndex < data.eleves.length - 1) currentIndex++;
	}

	function markRetard() {
		absenceNotes[currentEleve.id] = 'retard';
		if (currentIndex < data.eleves.length - 1) currentIndex++;
	}

	function markOptional() {
		absenceNotes[currentEleve.id] = 'optional';
		if (currentIndex < data.eleves.length - 1) currentIndex++;
	}

	function goToEleve(index: number) {
		currentIndex = index;
	}
</script>

<div class="min-h-screen bg-sidebar text-sidebar-foreground">
	<header
		class="flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-card/80 px-4 backdrop-blur-sm"
	>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" onclick={() => goto(`/classe/${$page.params.id}/cours`)}>
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-lg font-semibold">{data.coursNom}</h1>
				<p class="text-xs text-muted-foreground">
					{data.salleNom} • {data.heureDebut} - {data.heureFin}
				</p>
			</div>
		</div>
		<div class="text-sm text-muted-foreground">
			{currentIndex + 1} / {data.eleves.length}
		</div>
	</header>

	<div class="flex flex-1 items-center justify-center p-4">
		{#if currentEleve}
			<div class="w-full max-w-md space-y-6">
				<div class="flex flex-col items-center gap-4">
					<Avatar.Root class="h-24 w-24">
						<Avatar.Image
							src={currentEleve.photoUrl || 'https://github.com/shadcn.png'}
							alt={`${currentEleve.prenom} ${currentEleve.nom}`}
						/>
						<Avatar.Fallback class="text-2xl font-bold">
							{currentEleve.prenom[0]}{currentEleve.nom[0]}
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="text-center">
						<h2 class="text-xl font-bold">{currentEleve.prenom} {currentEleve.nom}</h2>
						<p class="text-sm text-muted-foreground">
							{currentEleve.dateNaissance
								? new Date(currentEleve.dateNaissance).toLocaleDateString()
								: ''}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{currentEleve.actif ? 'Actif' : 'Inactif'}
						</p>
					</div>
				</div>

				<form method="POST" action="?/markPresence" class="space-y-3">
					<input type="hidden" name="eleveId" value={currentEleve.id} />
					<input type="hidden" name="status" value="present" />
					<Button
						variant="default"
						class="w-full flex-1"
						type="submit"
						onclick={() => (absenceNotes[currentEleve.id] = 'present')}
					>
						<Check class="mr-1 size-4" /> Présent
					</Button>
				</form>

				<form method="POST" action="?/markPresence">
					<input type="hidden" name="eleveId" value={currentEleve.id} />
					<input type="hidden" name="status" value="absent" />
					<Button
						variant="destructive"
						class="w-full flex-1"
						type="submit"
						onclick={() => (absenceNotes[currentEleve.id] = 'absent')}
					>
						<X class="mr-1 size-4" /> Absent
					</Button>
				</form>

				<Button variant="outline" class="w-full" onclick={markRetard}>Retard</Button>
				<Button variant="secondary" class="w-full" onclick={markOptional}>Non obligatoire</Button>

				<div class="flex justify-center gap-2">
					{#each data.eleves as eleve, i (eleve.id)}
						<button
							type="button"
							class="h-2 w-2 rounded-full transition-all {currentIndex === i
								? 'w-4 bg-primary'
								: 'bg-muted'}"
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

	<div class="border-t border-sidebar-border p-4">
		<div class="flex justify-end gap-2">
			<Button
				variant="outline"
				onclick={() =>
					goto(`/classe/${$page.params.id}/cours/${$page.params.coursId}/presence/edit`)}
			>
				Modifier la présence
			</Button>
			<Button onclick={() => goto(`/classe/${$page.params.id}/cours`)}>
				Terminer ({data.eleves.filter((e) => absenceNotes[e.id]).length} marqués)
			</Button>
		</div>
	</div>
</div>
