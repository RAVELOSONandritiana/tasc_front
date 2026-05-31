<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SurveillantProfil from '$lib/components/user/profil/SurveillantProfil.svelte';

	const listSurveillant = $state([
		{
			name: 'RAKOTO',
			lastname: 'Soa Beva',
			domicile: 'Lot C125',
			fokontany: 'Ambtatomalaza',
			commune: 'Alasora',
			phone: '0337329206',
			email: 'hgbmichel@gmail.com',
			connected: true
		},
		{
			name: 'RAKOTO',
			lastname: 'Soa Beva',
			domicile: 'Lot C125',
			fokontany: 'Ambtatomalaza',
			commune: 'Alasora',
			phone: '0337329207',
			email: 'hgbmichel@gmail.com',
			connected: true
		}
	]);

	let searchText = $state('');

	const listFiltered = $derived(
		listSurveillant.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.domicile}${p.fokontany}${p.commune}${p.phone}`
				.toLowerCase()
				.includes(searchText.toLowerCase())
		)
	);
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<Input
			type="search"
			placeholder="Rechercher un serverillant"
			class="max-w-md"
			bind:value={searchText}
		/>
		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					Nouveau
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter un nouveau surveillant</Dialog.Title>
						<Dialog.Description>Plus de surveillant ameliorera l'etabilssement.</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4">
						<div class="grid gap-3">
							<Label for="cin">Name</Label>
							<Input
								id="cin"
								type="number"
								name="cin"
								placeholder="entrer votre cin ici"
								minlength={10}
								maxlength={10}
								required
							/>
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Button type="submit">Confirmer</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>

	<div class="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
		{#each listFiltered as p (p.phone)}
			<SurveillantProfil
				name={p.name}
				lastname={p.lastname}
				domicile={p.domicile}
				fokontany={p.fokontany}
				commune={p.commune}
				phone={p.phone}
				email={p.email}
				connected={p.connected}
			/>
		{/each}
	</div>
</main>
