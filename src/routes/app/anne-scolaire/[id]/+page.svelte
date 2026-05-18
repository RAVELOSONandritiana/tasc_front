<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Input } from '$lib/components/ui/input';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
</script>

<main class="m-4 min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="flex justify-between">
		<Input type="search" placeholder="Rechercher anne scolaire" class="max-w-md" />
		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'outline' })}>
					Creer
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter un collegue</Dialog.Title>
						<Dialog.Description>Avoir des collaborateurs est essentiel</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4">
						<div class="grid gap-3">
							<Label for="name">Nom</Label>
							<Input id="name" defaultValue="RAKOTO" />
						</div>
						<div class="grid gap-3">
							<Label for="lastname">Prenom</Label>
							<Input id="lastname" defaultValue="Lalasoa" />
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<AlertDialog.Root>
							<AlertDialog.Trigger class={buttonVariants({ variant: 'default' })}>
								Ajouter
							</AlertDialog.Trigger>
							<AlertDialog.Content>
								<AlertDialog.Header>
									<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
									<AlertDialog.Description>
										This action cannot be undone. This will permanently delete your account and
										remove your data from our servers.
									</AlertDialog.Description>
								</AlertDialog.Header>
								<AlertDialog.Footer>
									<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
									<AlertDialog.Action>Continue</AlertDialog.Action>
								</AlertDialog.Footer>
							</AlertDialog.Content>
						</AlertDialog.Root>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>
</main>
