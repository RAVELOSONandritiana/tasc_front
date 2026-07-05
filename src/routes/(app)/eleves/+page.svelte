<script lang="ts">
	import EleveCard from '$lib/components/user/eleve/EleveCard.svelte';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { GraduationCap, UserPlus } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let listEleve = $state([...data.list_eleve]);
	let searchText = $state('');
	let selectedClasse = $state('全部');

	const classes = $derived([...new Set(data.list_eleve.map((e) => e.classe))]);

	const elevesFiltres = $derived(
		listEleve.filter((e) => {
			const matchSearch = `${e.nom}${e.prenom}`.toLowerCase().includes(searchText.toLowerCase());
			const matchClasse = selectedClasse === '全部' || e.classe === selectedClasse;
			return matchSearch && matchClasse;
		})
	);
</script>

<main class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="mx-auto max-w-7xl space-y-4">
				<!-- Header -->
				<div
					class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
							<GraduationCap class="size-5 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight">Élèves</h1>
							<p class="text-xs text-muted-foreground">
								{elevesFiltres.length} élève{elevesFiltres.length > 1 ? 's' : ''} inscrit{elevesFiltres.length >
								1
									? 's'
									: ''}
							</p>
						</div>
					</div>
					<Button size="sm" onclick={() => goto('/eleves/new')} class="gap-2">
						<UserPlus class="size-3.5" />
						Nouvel élève
					</Button>
				</div>

				<!-- Filters -->
				<Card class="animate-slide-up stagger-1 p-4 opacity-0">
					<div class="flex flex-wrap items-center gap-3">
						<div class="min-w-48 flex-1">
							<SearchInput placeholder="Rechercher un élève..." bind:value={searchText} />
						</div>
						<div class="flex items-center gap-2">
							<Badge
								variant={selectedClasse === '全部' ? 'default' : 'outline'}
								class="cursor-pointer transition-all hover:shadow-sm"
								onclick={() => (selectedClasse = '全部')}
							>
								Toutes les classes
							</Badge>
							{#each classes as c (c)}
								<Badge
									variant={selectedClasse === c ? 'default' : 'outline'}
									class="cursor-pointer transition-all hover:shadow-sm"
									onclick={() => (selectedClasse = c)}
								>
									{c}
								</Badge>
							{/each}
						</div>
					</div>
				</Card>
			</div>
		</div>

		<!-- Content -->
		<div class="mx-auto max-w-7xl p-4 md:p-6">
			{#if elevesFiltres.length === 0}
				<div
					class="animate-fade-in flex flex-col items-center justify-center py-16 text-muted-foreground"
				>
					<GraduationCap class="size-12 text-muted-foreground/30" />
					<p class="mt-4 text-sm font-medium">Aucun élève trouvé</p>
					<p class="mt-1 text-xs">Essayez de modifier vos critères de recherche.</p>
					<Button class="mt-4" variant="outline" onclick={() => goto('/eleves/new')}
						>Ajouter un élève</Button
					>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each elevesFiltres as eleve, i (eleve.id)}
						<div
							class="animate-slide-up opacity-0"
							style="animation-delay: {Math.min(i * 50, 400)}ms"
						>
							<EleveCard {eleve} />
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</main>
