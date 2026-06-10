<script lang="ts">
	import Classe from '$lib/components/user/classe/Classe.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	const { data } = $props();

	// svelte-ignore state_referenced_locally
	const { listClasse } = data;
</script>

<main class="flex-1 bg-sidebar text-sidebar-foreground">
	<div class="flex flex-wrap items-center justify-between gap-4 p-4">
		<SearchInput placeholder="Rechercher un cours" />

		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					Nouveau
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter une classe</Dialog.Title>
						<Dialog.Description>N'oublier pas de mettre les coefficients</Dialog.Description>
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
							<Label for="niveau">Serie</Label>
							<NativeSelect.Root class="w-full">
								<NativeSelect.Option value="ose">OSE</NativeSelect.Option>
								<NativeSelect.Option value="s">S</NativeSelect.Option>
								<NativeSelect.Option value="l">L</NativeSelect.Option>
							</NativeSelect.Root>
						</div>

						<div class="grid gap-3">
							<Label for="niveau">Prof titulaire</Label>
							<NativeSelect.Root class="w-full">
								<NativeSelect.Option value="">Auncun titulaire</NativeSelect.Option>
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
	<div class="grid grid-cols-2 gap-8 p-4 lg:grid-cols-3">
		{#each listClasse as l (l.id)}
			<Classe classe={l} />
		{/each}
	</div>
</main>
