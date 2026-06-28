<script lang="ts">
	import Classe from '$lib/components/user/classe/Classe.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Card } from '$lib/components/ui/card';
	import { ClipboardList, Plus } from '@lucide/svelte/icons';
	import { Button } from '$lib/components/ui/button';
	const { data } = $props();

	const { listClasse } = data;
	let dialogOpen = $state(false);

	let niveau = $state('0');
	let serie = $state('ose');
	let prof = $state('');

	function soumettre() {
		console.log('Classe créée:', { niveau, serie, prof });
		dialogOpen = false;
	}
</script>

<main class="bg-background text-foreground h-screen flex flex-col">
	<div class="sticky top-0 z-10 bg-background p-4 md:p-6 border-b border-sidebar-border">
		<div class="mx-auto max-w-7xl space-y-4">
			<!-- Header -->
			<div class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-3">
					<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
						<ClipboardList class="size-5 text-primary" />
					</div>
					<div>
						<h1 class="text-xl font-bold tracking-tight">Classes</h1>
						<p class="text-xs text-muted-foreground">{listClasse.length} classe{listClasse.length > 1 ? 's' : ''} enregistrée{listClasse.length > 1 ? 's' : ''}</p>
					</div>
				</div>
				<Dialog.Root bind:open={dialogOpen}>
					<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
						<Plus class="size-4" />
						Nouvelle classe
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title>Ajouter une classe</Dialog.Title>
							<Dialog.Description>Remplissez les informations de la classe</Dialog.Description>
						</Dialog.Header>
						<form class="grid gap-4 py-4">
							<div class="grid gap-3">
								<Label for="niveau">Niveau</Label>
								<NativeSelect.Root required class="w-full" bind:value={niveau}>
									<NativeSelect.Option value="0">2nd</NativeSelect.Option>
									<NativeSelect.Option value="1">1ere</NativeSelect.Option>
									<NativeSelect.Option value="2">Terminale</NativeSelect.Option>
								</NativeSelect.Root>
							</div>

							<div class="grid gap-3">
								<Label for="serie">Série</Label>
								<NativeSelect.Root class="w-full" bind:value={serie}>
									<NativeSelect.Option value="ose">OSE</NativeSelect.Option>
									<NativeSelect.Option value="s">S</NativeSelect.Option>
									<NativeSelect.Option value="l">L</NativeSelect.Option>
								</NativeSelect.Root>
							</div>

							<div class="grid gap-3">
								<Label for="prof">Prof titulaire</Label>
								<NativeSelect.Root class="w-full" bind:value={prof}>
									<NativeSelect.Option value="">Aucun titulaire</NativeSelect.Option>
									<NativeSelect.Option value="ose">OSE</NativeSelect.Option>
									<NativeSelect.Option value="s">S</NativeSelect.Option>
									<NativeSelect.Option value="l">L</NativeSelect.Option>
								</NativeSelect.Root>
							</div>
						</form>
						<Dialog.Footer>
							<Button variant="outline" size="sm" onclick={() => dialogOpen = false}>
								Annuler
							</Button>
							<Button variant="default" size="sm" onclick={soumettre}>Confirmer</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</div>

			<!-- Search -->
			<Card class="animate-slide-up stagger-1 opacity-0 p-4">
				<SearchInput placeholder="Rechercher une classe..." />
			</Card>
		</div>
	</div>

	<!-- Classes Grid - scrollable -->
	<div class="flex-1 overflow-y-auto p-4 md:p-6">
		<div class="mx-auto max-w-7xl">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each listClasse as l, i (l.id)}
					<div class="animate-slide-up opacity-0" style="animation-delay: {Math.min(i * 50, 400)}ms">
						<Classe classe={l} />
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>
