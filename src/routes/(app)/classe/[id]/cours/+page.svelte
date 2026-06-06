<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import Cours from '$lib/components/user/classe/Cours.svelte';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { matiere } from '$lib/variables/territoire';
	import { page } from '$app/stores';

	const listCours = [
		{
			id: 1,
			name: 'Mathematique',
			coeff: 6,
			prof: 'Voahangy Soa'
		},
		{
			id: 2,
			name: 'Physique',
			coeff: 6,
			prof: 'Peter kely'
		},
		{
			id: 3,
			name: 'Mathematique',
			coeff: 6,
			prof: 'Voahangy Soa'
		},
		{
			id: 4,
			name: 'Physique',
			coeff: 6,
			prof: 'Peter kely'
		},
		{
			id: 5,
			name: 'Mathematique',
			coeff: 6,
			prof: 'Voahangy Soa'
		},
		{
			id: 6,
			name: 'Physique',
			coeff: 6,
			prof: 'Peter kely'
		},
		{
			id: 7,
			name: 'Mathematique',
			coeff: 6,
			prof: 'Voahangy Soa'
		},
		{
			id: 8,
			name: 'Physique',
			coeff: 6,
			prof: 'Peter kely'
		}
	];
</script>

<main class="min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="sticky top-29 z-50 flex justify-between bg-sidebar p-4">
		<SearchInput placeholder="Rechercher un cours" />

		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					Nouveau
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter un nouveau cours</Dialog.Title>
						<Dialog.Description>N'oublier pas de mettre les coefficients</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4">
						<div class="grid gap-3">
							<Label for="coursname">Nom cours</Label>
							<NativeSelect.Root class="w-full">
								{#each matiere as m (m)}
									<NativeSelect.Option value={m}>{m}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>

						<div class="grid gap-3">
							<Label for="coeff">Coefficient</Label>
							<Input id="coeff" name="coeff" type="number" defaultValue={6} required />
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

	<div class="grid grid-cols-1 gap-8 p-4 md:grid-cols-3">
		{#each listCours as lc (lc.id)}
			<Cours>
				<Label>Cours: {lc.name}</Label>
				<Label>Coefficient: {lc.coeff}</Label>
				<Label>Prof: {lc.prof}</Label>
				<Button class="w-full" onclick={() => goto($page.url.pathname + '/details')}>Enter</Button>
			</Cours>
		{/each}
	</div>
</main>
