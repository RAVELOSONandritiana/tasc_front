<script lang="ts">
	import Classe from '$lib/components/user/classe/Classe.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Card } from '$lib/components/ui/card';
	import { ClipboardList, Plus } from '@lucide/svelte/icons';
	const { data } = $props();

	const { listClasse } = data;
</script>

<main class="bg-background text-foreground">
	<div class="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
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
			<Dialog.Root>
				<form>
					<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
						<Plus class="size-4" />
						Nouvelle classe
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title>Ajouter une classe</Dialog.Title>
							<Dialog.Description>Remplissez les informations de la classe</Dialog.Description>
						</Dialog.Header>
						<div class="grid gap-4">
							<div class="grid gap-3">
								<Label for="niveau">Niveau</Label>
								<NativeSelect.Root required class="w-full">
									<NativeSelect.Option value=0>2nd</NativeSelect.Option>
									<NativeSelect.Option value=1>1ere</NativeSelect.Option>
									<NativeSelect.Option value=2>Terminale</NativeSelect.Option>
								</NativeSelect.Root>
							</div>

							<div class="grid gap-3">
								<Label for="niveau">Série</Label>
								<NativeSelect.Root class="w-full">
									<NativeSelect.Option value="ose">OSE</NativeSelect.Option>
									<NativeSelect.Option value="s">S</NativeSelect.Option>
									<NativeSelect.Option value="l">L</NativeSelect.Option>
								</NativeSelect.Root>
							</div>

							<div class="grid gap-3">
								<Label for="niveau">Prof titulaire</Label>
								<NativeSelect.Root class="w-full">
									<NativeSelect.Option value="">Aucun titulaire</NativeSelect.Option>
									<NativeSelect.Option value="ose">OSE</NativeSelect.Option>
									<NativeSelect.Option value="s">S</NativeSelect.Option>
									<NativeSelect.Option value="l">L</NativeSelect.Option>
								</NativeSelect.Root>
							</div>
						</div>
						<Dialog.Footer>
							<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
								Annuler
							</Dialog.Close>
							<Dialog.Close class={buttonVariants({ variant: 'default' })}>Confirmer</Dialog.Close>
						</Dialog.Footer>
					</Dialog.Content>
				</form>
			</Dialog.Root>
		</div>

		<!-- Search -->
		<Card class="animate-slide-up stagger-1 opacity-0 p-4">
			<SearchInput placeholder="Rechercher une classe..." />
		</Card>

		<!-- Classes Grid -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each listClasse as l, i (l.id)}
				<div class="animate-slide-up opacity-0" style="animation-delay: {Math.min(i * 50, 400)}ms">
					<Classe classe={l} />
				</div>
			{/each}
		</div>
	</div>
</main>
