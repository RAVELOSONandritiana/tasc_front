<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { ArrowLeft, Check, X, Save } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { loadingForm } from '$lib/actions/loadingForm';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let absenceNotes = $state<Record<string, 'present' | 'absent' | 'retard' | 'optional'>>({});

	function markPresent(eleveId: string) {
		absenceNotes[eleveId] = 'present';
	}

	function markAbsent(eleveId: string) {
		absenceNotes[eleveId] = 'absent';
	}

	function markRetard(eleveId: string) {
		absenceNotes[eleveId] = 'retard';
	}

	function markOptional(eleveId: string) {
		absenceNotes[eleveId] = 'optional';
	}

	function getEleveStatus(eleveId: string): 'present' | 'absent' | 'retard' | 'optional' {
		return absenceNotes[eleveId] || 'present';
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
	</header>

	<div class="p-4">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-semibold">Présence des élèves</h2>
			<div class="text-sm text-muted-foreground">
				<span class="mr-4">Total: {data.eleves.length}</span>
				<span class="mr-4"
					>Présents: {data.eleves.filter(
						(e) => !absenceNotes[e.id] || absenceNotes[e.id] === 'present'
					).length}</span
				>
				<span class="mr-4 text-red-500"
					>Absents: {data.eleves.filter((e) => absenceNotes[e.id] === 'absent').length}</span
				>
				<span class="text-amber-500"
					>Retards: {data.eleves.filter((e) => absenceNotes[e.id] === 'retard').length}</span
				>
			</div>
		</div>

		<form method="POST" action="?/updatePresence" class="space-y-2" use:loadingForm>
			{#each data.eleves as eleve (eleve.id)}
				<div
					class="flex items-center gap-3 rounded-lg border p-3 {getEleveStatus(eleve.id) ===
					'present'
						? 'bg-emerald-500/10'
						: getEleveStatus(eleve.id) === 'absent'
							? 'bg-red-500/10'
							: getEleveStatus(eleve.id) === 'retard'
								? 'bg-amber-500/10'
								: 'bg-muted/30'}"
				>
					<input type="hidden" name="eleveId[]" value={eleve.id} />
					<input type="hidden" name="status[]" value={absenceNotes[eleve.id] || 'present'} />

					<div class="flex flex-1 items-center gap-3">
						<img
							src={eleve.photoUrl}
							alt={eleve.prenom}
							class="h-10 w-10 rounded-full object-cover"
						/>
						<div>
							<p class="font-medium">{eleve.prenom} {eleve.nom}</p>
							<p class="text-xs text-muted-foreground">
								{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : ''}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button
							type="button"
							class={`rounded px-3 py-1 text-xs ${getEleveStatus(eleve.id) === 'present' ? 'bg-emerald-500 text-white' : 'bg-muted'} transition-all`}
							onclick={() => markPresent(eleve.id)}
						>
							Présent
						</button>
						<button
							type="button"
							class={`rounded px-3 py-1 text-xs ${getEleveStatus(eleve.id) === 'absent' ? 'bg-red-500 text-white' : 'bg-muted'} transition-all`}
							onclick={() => markAbsent(eleve.id)}
						>
							Absent
						</button>
						<button
							type="button"
							class={`rounded px-3 py-1 text-xs ${getEleveStatus(eleve.id) === 'retard' ? 'bg-amber-500 text-white' : 'bg-muted'} transition-all`}
							onclick={() => markRetard(eleve.id)}
						>
							Retard
						</button>
						<button
							type="button"
							class={`rounded px-3 py-1 text-xs ${getEleveStatus(eleve.id) === 'optional' ? 'bg-gray-500 text-white' : 'bg-muted'} transition-all`}
							onclick={() => markOptional(eleve.id)}
						>
							Optionnel
						</button>
					</div>
				</div>
			{/each}

			<div class="flex justify-end pt-4">
				<Button type="submit" variant="default">
					<Save class="mr-2 size-4" />
					Sauvegarder les présences
				</Button>
			</div>
		</form>
	</div>
</div>
