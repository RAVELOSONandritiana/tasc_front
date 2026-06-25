<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import { User, Calendar } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';

	interface Eleve {
		id: string;
		nom: string;
		prenom: string;
		dateNaissance: string;
		classe: string;
	}

	const { eleve }: { eleve: Eleve } = $props();
</script>

<CardUI>
	<div class="p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
					<User class="size-5 text-primary" />
				</div>
				<div>
					<button
						class="text-sm font-semibold hover:underline"
						onclick={() => goto(`/eleves/${eleve.id}`)}
					>
						{eleve.prenom} {eleve.nom}
					</button>
					<p class="text-xs text-muted-foreground">{eleve.classe}</p>
				</div>
			</div>
			<Calendar class="size-4 text-muted-foreground" />
		</div>
		<div class="mt-3 flex items-center justify-between">
			<span class="text-xs text-muted-foreground">
				{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR') : '—'}
			</span>
			<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => goto(`/eleves/${eleve.id}`)}>
				Voir profil
			</Button>
		</div>
	</div>
</CardUI>
