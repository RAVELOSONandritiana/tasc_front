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

	function gotoSignin(event: Event) {
		event.preventDefault();
		goto('/');
	}
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<form class="w-full max-w-sm md:max-w-lg" onsubmit={gotoSignin}>
		<Card class="w-full">
			<CardHeader>
				<CardTitle class="mx-auto my-3 font-bold">Cree un compte sur Tasc</CardTitle>
				<CardDescription>Veuillez entrer vos informations de compte</CardDescription>
			</CardHeader>

			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="exemple@email.com" required />
				</div>

				<div class="space-y-2">
					<Label for="password">Mot de passe</Label>
					<Input id="password" type="password" placeholder="********" required />
				</div>

				<div class="space-y-2">
					<Label for="password">Confirmer mot de passe</Label>
					<Input id="password" type="password" placeholder="********" required />
				</div>

				<div class="relative h-10 py-2">
					<a href="/" class="absolute right-0">Aller vers connexion</a>
				</div>
				<Button class="w-full" type="submit">Creer compte</Button>
			</CardContent>
		</Card>
	</form>
</div>
