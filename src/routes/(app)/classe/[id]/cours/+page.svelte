<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Label } from '$lib/components/ui/label';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between sticky top-33 z-50">
		<InputGroup.Root class="max-w-md">
			<InputGroup.Input type="search" placeholder="Rechercher un eleve" />
			<InputGroup.Addon>
				<SearchIcon />
			</InputGroup.Addon>
		</InputGroup.Root>

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
							<Input
								id="coursname"
								name="coursname"
								type="text"
								placeholder="Mathematique..."
								required
							/>
						</div>

						<div class="grid gap-3">
							<Label for="coeff">Coefficient</Label>
							<Input
								id="coeff"
								name="coeff"
								type="number"
								defaultValue={6}
								required
							/>
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
</main>
