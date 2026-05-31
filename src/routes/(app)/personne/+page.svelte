<script lang="ts">
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";


</script>

<main class="m-4 min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="flex justify-between sticky top-0 z-50">
		<Input type="search" placeholder="Rechercher une personne" class="max-w-md" />
		<Button onclick={() => goto('personne/new')}>Creer</Button>
		<!-- <Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'outline' })}>
					Creer
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-106.25">
					<Dialog.Header>
						<Dialog.Title>Creer un personnel</Dialog.Title>
						<Dialog.Description>
							Ceci va vous permettre apres de creer de donner des roles a ces personnes
						</Dialog.Description>
					</Dialog.Header>
					
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Cancel
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
		</Dialog.Root> -->
	</div>
</main>
