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
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { onMount } from 'svelte';

	let { form } = $props();
	let matricule = $state('');
	let password = $state('');
	let remember = $state(false);
	let error = $derived(form?.error || '');
	let formRef = $state<HTMLFormElement | null>(null);

	onMount(() => {
		const stored = localStorage.getItem('rememberedAccount');
		if (stored) {
			try {
				const account = JSON.parse(stored);
				matricule = account.matricule || '';
				password = account.password || '';
				remember = true;
				if (formRef) {
					formRef.requestSubmit();
				}
			} catch {
				localStorage.removeItem('rememberedAccount');
			}
		}
	});

	$effect(() => {
		if (form?.success && remember) {
			localStorage.setItem('rememberedAccount', JSON.stringify({ matricule, password }));
		}
		if (!remember) {
			localStorage.removeItem('rememberedAccount');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<form class="w-full max-w-sm md:max-w-lg" method="POST" action="?/login" bind:this={formRef}>
		<Card class="w-full">
			<CardHeader>
				<CardTitle class="mx-auto my-3 text-center text-2xl font-bold">Connexion à Tasc</CardTitle>
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
						type="text"
						inputmode="numeric"
						placeholder="059875"
						required
						autocomplete="username"
						name="matricule"
					/>
				</div>

				{#if error}
					<p class="text-sm text-red-500">{error}</p>
				{/if}

				<div class="space-y-2">
					<Label for="password">Mot de passe</Label>
					<Input
						id="password"
						bind:value={password}
						type="password"
						placeholder="********"
						required
						autocomplete="current-password"
						name="password"
					/>
				</div>

		<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Checkbox id="remember" bind:checked={remember} />
					<Label for="remember" class="text-sm">Se souvenir de moi</Label>
				</div>
					<Button type="button" variant="link" class="h-auto p-0 text-sm">
						Mot de passe oublié ?
					</Button>
				</div>

		<Button class="w-full" type="submit">
			Se connecter
		</Button>

				<div class="text-center text-sm">
					Pas encore de compte ?
					<Button type="button" variant="link" class="h-auto p-0 text-sm" onclick={() => goto('/signup')}>
						Créer un compte
					</Button>
				</div>
			</CardContent>
		</Card>
	</form>
</div>
