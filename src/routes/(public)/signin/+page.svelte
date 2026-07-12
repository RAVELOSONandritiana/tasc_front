<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	let { form } = $props();
	let matricule = $state('');
	let password = $state('');
	let submitting = $state(false);
	let resetSubmitting = $state(false);
	let showReset = $state(form?.reset || false);
	let resetMatricule = $state('');
	let error = $derived(form?.error || '');
	let resetError = $derived(form?.resetError || '');
	let resetSuccess = $derived(form?.resetSuccess || '');
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	{#if showReset}
		<form
			class="w-full max-w-sm md:max-w-lg"
			method="POST"
			action="?/forgotPassword"
			onsubmit={() => (resetSubmitting = true)}
		>
			<Card class="w-full">
				<CardHeader>
					<CardTitle class="mx-auto my-3 text-center text-2xl font-bold">Mot de passe oublié</CardTitle>
					<CardDescription class="text-center">
						Entrez votre matricule. Un administrateur vous contactera directement pour
						réinitialiser votre mot de passe.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if resetSuccess}
						<p class="rounded-md bg-green-500/10 p-3 text-center text-sm text-green-600">
							{resetSuccess}
						</p>
						<Button
							type="button"
							variant="outline"
							class="w-full"
							onclick={() => {
								showReset = false;
								resetSubmitting = false;
							}}
						>
							Retour à la connexion
						</Button>
					{:else}
						<div class="space-y-2">
							<Label for="reset-matricule">Matricule</Label>
							<Input
								id="reset-matricule"
								bind:value={resetMatricule}
								type="text"
								placeholder="Ex: ADM001"
								required
								name="matricule"
							/>
						</div>
						{#if resetError}
							<p class="text-sm text-red-500">{resetError}</p>
						{/if}
						<Button class="w-full" type="submit" disabled={resetSubmitting}>
							{#if resetSubmitting}
								<Spinner class="mr-2 size-4" />
							{/if}
							Envoyer la demande
						</Button>
						<button
							type="button"
							class="w-full text-center text-sm text-muted-foreground hover:underline"
							onclick={() => (showReset = false)}
						>
							Retour à la connexion
						</button>
					{/if}
				</CardContent>
			</Card>
		</form>
	{:else}
		<form
			class="w-full max-w-sm md:max-w-lg"
			method="POST"
			action="?/login"
			onsubmit={() => (submitting = true)}
		>
			<Card class="w-full">
				<CardHeader>
					<CardTitle class="mx-auto my-3 text-center text-2xl font-bold">Connexion à Tasc</CardTitle>
					<CardDescription class="text-center">Veuillez entrer vos informations de compte</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="matricule">Matricule</Label>
						<Input
							id="matricule"
							bind:value={matricule}
							type="text"
							placeholder="Ex: ADM001"
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
					<Button class="w-full" type="submit" disabled={submitting}>
						{#if submitting}
							<Spinner class="mr-2 size-4" />
						{/if}
						Se connecter
					</Button>
					<button
						type="button"
						class="w-full text-center text-sm text-muted-foreground hover:underline"
						onclick={() => (showReset = true)}
					>
						Mot de passe oublié ?
					</button>
				</CardContent>
			</Card>
		</form>
	{/if}
</div>
