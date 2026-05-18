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

    function gotoApp(event: Event){
        event.preventDefault();
        goto('/app');
    }
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<form class="w-full max-w-sm md:max-w-lg" onsubmit={gotoApp}>
		<Card class="w-full">
			<CardHeader>
				<CardTitle class="mx-auto font-bold my-3">Connexion à Tasc</CardTitle>
				<CardDescription>
					Veuillez entrer vos informations de compte
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="exemple@email.com"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label for="password">Mot de passe</Label>
					<Input
						id="password"
						type="password"
						placeholder="********"
						required
					/>
				</div>
                <Button class="w-full" type="submit">Se connecter</Button>
			</CardContent>
		</Card>
	</form>
</div>