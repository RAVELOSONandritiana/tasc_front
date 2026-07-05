<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	let matricule = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	function handleSubmit() {
		goto('/signin');
	}

	function switchToSignin() {
		goto('/signin');
	}
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<form class="w-full max-w-sm md:max-w-lg" onsubmit={handleSubmit}>
		<Card class="w-full">
			<CardHeader>
				<CardTitle class="mx-auto my-3 text-center text-2xl font-bold">
					Créer un compte sur Tasc
				</CardTitle>
				<CardDescription class="text-center">
					Veuillez entrer vos informations de compte
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="matricule">Matricule</Label>
					<Input
						id="matricule"
						bind:value={matricule}
						type="number"
						inputmode="numeric"
						placeholder="09567"
						required
						autocomplete="username"
					/>
				</div>

				<div class="space-y-2">
					<Label for="password">Mot de passe</Label>
					<Input
						id="password"
						bind:value={password}
						type="password"
						placeholder="********"
						required
						autocomplete="new-password"
					/>
				</div>

				<div class="space-y-2">
					<Label for="confirm-password">Confirmer le mot de passe</Label>
					<Input
						id="confirm-password"
						bind:value={confirmPassword}
						type="password"
						placeholder="********"
						required
						autocomplete="new-password"
					/>
				</div>

				<Button class="w-full" type="submit">Créer un compte</Button>

				<div class="text-center text-sm">
					Déjà un compte ?
					<Button type="button" variant="link" class="h-auto p-0 text-sm" onclick={switchToSignin}>
						Se connecter
					</Button>
				</div>
			</CardContent>
		</Card>
	</form>
</div>
