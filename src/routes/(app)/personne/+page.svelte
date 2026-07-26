<script lang="ts">
	import PersonCard from '$lib/components/user/PersonCard.svelte';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Users, Plus } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	let personnes = $state([...data.personnes]);

	let searchText = $state('');

	const filteredPersonnel = $derived(
		personnes.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.domicile}${p.fokontany}${p.commune}${p.phone}`
				.toLowerCase()
				.includes(searchText.toLowerCase())
		)
	);

	function supprimerPersonne(id: string) {
		personnes = personnes.filter((p) => p.id !== id);
	}

	function goNew() {
		goto('/personne/new');
	}
</script>

<main class="flex min-h-[100dvh] flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="space-y-4">
				<!-- Header -->
				<div
					class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
							<Users class="size-5 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight">Personnels</h1>
							<p class="text-xs text-muted-foreground">
								{filteredPersonnel.length} membre{filteredPersonnel.length > 1 ? 's' : ''}
							</p>
						</div>
					</div>
					<Button class="h-9 gap-2 rounded-lg px-5 text-sm font-medium" onclick={goNew}>
						<Plus class="size-3.5" />
						Nouveau
					</Button>
				</div>

				<!-- Search -->
				<Card class="animate-slide-up stagger-1 p-4 opacity-0">
					<SearchInput bind:value={searchText} placeholder="Rechercher une personne" />
				</Card>
			</div>
		</div>

		<!-- List -->
		<div class="p-4 md:p-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredPersonnel as p, i (p.phone)}
					<div
						class="animate-slide-up opacity-0"
						style="animation-delay: {Math.min(i * 50, 400)}ms"
					>
					<PersonCard
						personne={p}
						role={p.compte?.role || 'PERSONNEL'}
						detail={p.commune ? `Commune - ${p.commune}` : p.domicile ? `Domicile - ${p.domicile}` : ''}
						hrefProfil={`/profil/${p.compte?.id || p.id}`}
						onDelete={supprimerPersonne}
					/>
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>
