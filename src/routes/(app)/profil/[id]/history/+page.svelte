<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import { ArrowLeft, Search, Filter, User, Clock, Globe } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	let searchQuery = $state('');
	let actionFilter = $state<string>('all');

	const actions = [
		{ value: 'all', label: 'Toutes les actions' },
		{ value: 'connexion', label: 'Connexion' },
		{ value: 'deconnexion', label: 'Déconnexion' },
		{ value: 'creation_incident', label: 'Création incident' },
		{ value: 'modification_eleve', label: 'Modification élève' },
		{ value: 'creation_cours', label: 'Création cours' },
		{ value: 'creation_classe', label: 'Création classe' },
		{ value: 'validation_compte', label: 'Validation compte' }
	];

	const filteredActivities = $derived(
		data.activities.filter((act) => {
			const matchesSearch = !searchQuery
				|| act.description.toLowerCase().includes(searchQuery.toLowerCase())
				|| act.compte.personne.lastname.toLowerCase().includes(searchQuery.toLowerCase())
				|| act.compte.personne.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesAction = actionFilter === 'all' || act.action === actionFilter;
			return matchesSearch && matchesAction;
		})
	);

	const actionLabels: Record<string, string> = {
		connexion: 'Connexion',
		deconnexion: 'Déconnexion',
		creation_incident: 'Création incident',
		modification_eleve: 'Modification élève',
		creation_cours: 'Création cours',
		creation_classe: 'Création classe',
		validation_compte: 'Validation compte'
	};

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<main class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-4xl p-4 md:p-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<Button variant="ghost" class="gap-2" onclick={() => goto(`/profil/${data.activities[0]?.compteId || ''}`)}>
						<ArrowLeft class="size-4" />
						Profil
					</Button>
					<h1 class="text-xl font-bold">Historique des activités</h1>
				</div>
			</div>

			<Card class="mb-4 p-4">
				<div class="flex flex-col gap-3 md:flex-row">
					<div class="flex-1">
						<Label for="search">Rechercher</Label>
						<div class="relative mt-1">
							<Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
							<Input
								id="search"
								type="text"
								placeholder="Rechercher dans l'historique..."
								bind:value={searchQuery}
								class="pl-9"
							/>
						</div>
					</div>
					<div class="w-full md:w-64">
						<Label for="action">Action</Label>
						<Select.Root type="single" bind:value={actionFilter}>
							<Select.Trigger class="mt-1 w-full">
								{actions.find((a) => a.value === actionFilter)?.label || 'Toutes les actions'}
							</Select.Trigger>
							<Select.Content>
								{#each actions as act}
									<Select.Item value={act.value}>{act.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</Card>

			<div class="space-y-2">
				{#if filteredActivities.length === 0}
					<Card class="p-8 text-center text-muted-foreground">
						<Clock class="mx-auto mb-2 size-8" />
						<p>Aucune activité enregistrée</p>
					</Card>
				{:else}
					{#each filteredActivities as act (act.id)}
						<Card class="p-4">
							<div class="flex items-start justify-between">
								<div class="flex items-center gap-3">
									<div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
										<Filter class="size-4 text-primary" />
									</div>
									<div>
										<p class="text-sm font-medium">{actionLabels[act.action] || act.action}</p>
										<p class="text-xs text-muted-foreground">{act.description}</p>
										<div class="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
											<span class="flex items-center gap-1">
												<User class="size-3" />
												{act.compte.personne.name} {act.compte.personne.lastname}
											</span>
											<span class="flex items-center gap-1">
												<Clock class="size-3" />
												{formatDate(act.createdAt)}
											</span>
										</div>
									</div>
								</div>
								{#if act.ipAddress}
									<span class="flex items-center gap-1 text-xs text-muted-foreground">
										<Globe class="size-3" />
										{act.ipAddress}
									</span>
								{/if}
							</div>
						</Card>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</main>
