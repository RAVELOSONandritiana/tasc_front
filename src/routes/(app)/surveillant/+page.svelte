<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
</script>

<div class="flex justify-between p-4">
	<Input type="search" placeholder="Rechercher un serverillant" class="max-w-md" />
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
<main class="m-4 min-h-full rounded-md bg-sidebar text-sidebar-foreground"></main>
