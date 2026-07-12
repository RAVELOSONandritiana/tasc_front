<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import * as Pagination from '$lib/components/ui/pagination';
	import { ArrowLeft, Search, Clock, Globe } from '@lucide/svelte/icons';
	import { goto, afterNavigate } from '$app/navigation';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	const { data }: PageProps = $props();
	let searchQuery = $state(data.searchQuery || '');
	let actionFilter = $state(data.actionFilter || 'all');
	let page = $state(data.page || 1);
	let mounted = $state(false);
	let initialLoad = $state(true);

	onMount(() => {
		mounted = true;
		setTimeout(() => {
			initialLoad = false;
		}, 0);
	});

	afterNavigate(() => {
		const params = new URLSearchParams(window.location.search);
		const newPage = Math.max(1, Number(params.get('page') || '1'));
		if (newPage !== page) {
			page = newPage;
		}
	});

	const actions = [
		{ value: 'all', label: 'Toutes les actions' },
		{ value: 'connexion', label: 'Connexion' },
		{ value: 'deconnexion', label: 'Déconnexion' },
		{ value: 'creation_incident', label: 'Création incident' },
		{ value: 'suppression_incident', label: 'Suppression incident' },
		{ value: 'modification_eleve', label: 'Modification élève' },
		{ value: 'creation_cours', label: 'Création cours' },
		{ value: 'creation_classe', label: 'Création classe' },
		{ value: 'validation_compte', label: 'Validation compte' }
	];

	const actionLabels: Record<string, string> = {
		connexion: 'Connexion',
		deconnexion: 'Déconnexion',
		creation_incident: 'Création incident',
		suppression_incident: 'Suppression incident',
		modification_eleve: 'Modification élève',
		creation_cours: 'Création cours',
		creation_classe: 'Création classe',
		validation_compte: 'Validation compte'
	};

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));

	// Génère une liste compacte de pages avec des ellipses pour éviter
	// d'afficher des centaines de boutons quand il y a beaucoup de pages.
	// Ex: 1 … 4 5 6 … 1000
	function getPageItems(current: number, total: number): (number | 'ellipsis')[] {
		const delta = 1; // pages autour de la page courante
		const range: number[] = [];
		const left = Math.max(2, current - delta);
		const right = Math.min(total - 1, current + delta);

		range.push(1);
		if (left > 2) range.push(-1); // marqueur ellipsis gauche
		for (let i = left; i <= right; i++) range.push(i);
		if (right < total - 1) range.push(-2); // marqueur ellipsis droite
		if (total > 1) range.push(total);

		return range.map((n) => (n < 0 ? 'ellipsis' : n));
	}

	const pageItems = $derived(getPageItems(page, totalPages));

	function getUrlParam(key: string, fallback: string) {
		return new URLSearchParams(window.location.search).get(key) || fallback;
	}

	function navigateToPage(p: number) {
		const urlParams = new URLSearchParams(window.location.search);
		urlParams.set('page', String(p));
		goto(`?${urlParams.toString()}`, { invalidateAll: true, noScroll: true });
	}

	function applyFilters() {
		const urlParams = new URLSearchParams();
		if (searchQuery) urlParams.set('search', searchQuery);
		if (actionFilter !== 'all') urlParams.set('action', actionFilter);
		urlParams.set('page', '1');
		goto(`?${urlParams.toString()}`, { invalidateAll: true, noScroll: true });
	}

	$effect(() => {
		if (!mounted || initialLoad) return;
		const currentAction = getUrlParam('action', 'all');
		if (currentAction !== actionFilter) {
			applyFilters();
		}
	});

	$effect(() => {
		if (!mounted || initialLoad) return;
		const timer = setTimeout(() => {
			const currentSearch = getUrlParam('search', '');
			if (currentSearch !== searchQuery) {
				applyFilters();
			}
		}, 300);
		return () => clearTimeout(timer);
	});

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

	const profileId = data.activities[0]?.compteId || '';
</script>

<main class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="p-4 md:p-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<Button variant="ghost" class="gap-2" onclick={() => goto(`/profil/${profileId}`)}>
						<ArrowLeft class="size-4" />
						Profil
					</Button>
					<div>
						<h1 class="text-xl font-bold">Historique des activités</h1>
						<p class="text-xs text-muted-foreground">{data.total} activité{data.total > 1 ? 's' : ''} au total</p>
					</div>
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
								onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } }}
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

			<Card>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Action</Table.Head>
							<Table.Head>Description</Table.Head>
							<Table.Head>Utilisateur</Table.Head>
							<Table.Head>Date</Table.Head>
							<Table.Head class="text-right">IP</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if data.activities.length === 0}
							<Table.Row>
								<Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">
									Aucune activité enregistrée
								</Table.Cell>
							</Table.Row>
						{:else}
							{#each data.activities as act (act.id)}
								<Table.Row class="transition-colors hover:bg-muted/50">
									<Table.Cell>
										<span class="text-sm font-medium">{actionLabels[act.action] || act.action}</span>
									</Table.Cell>
									<Table.Cell>
										<span class="text-sm text-muted-foreground">{act.description}</span>
									</Table.Cell>
									<Table.Cell>
										<span class="text-sm">{act.compte.personne.name} {act.compte.personne.lastname}</span>
									</Table.Cell>
									<Table.Cell>
										<span class="text-sm text-muted-foreground">{formatDate(act.createdAt)}</span>
									</Table.Cell>
									<Table.Cell class="text-right">
										{#if act.ipAddress}
											<span class="flex items-center justify-end gap-1 text-xs text-muted-foreground">
												<Globe class="size-3" />
												{act.ipAddress}
											</span>
										{:else}
											<span class="text-xs text-muted-foreground">—</span>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>

				{#if data.total > data.pageSize}
					<div class="flex items-center justify-between border-t px-4 py-3">
						<p class="text-sm text-muted-foreground">
							Page {data.page} sur {totalPages}
						</p>
						<Pagination.Root count={data.total} perPage={data.pageSize} bind:page={page}>
							<Pagination.Content>
								<Pagination.Item>
									<Pagination.Previous
										onclick={() => navigateToPage(Math.max(1, page - 1))}
										aria-disabled={page <= 1}
									/>
								</Pagination.Item>
							{#each pageItems as p}
								<Pagination.Item>
									{#if p === 'ellipsis'}
										<Pagination.Ellipsis />
									{:else}
										<Button
											variant={p === page ? 'outline' : 'ghost'}
											size="icon"
											class="size-9"
											onclick={() => navigateToPage(p)}
										>
											{p}
										</Button>
									{/if}
								</Pagination.Item>
							{/each}
								<Pagination.Item>
									<Pagination.Next
										onclick={() => navigateToPage(Math.min(totalPages, page + 1))}
										aria-disabled={page >= totalPages}
									/>
								</Pagination.Item>
							</Pagination.Content>
						</Pagination.Root>
					</div>
				{/if}
			</Card>
		</div>
	</div>
</main>
