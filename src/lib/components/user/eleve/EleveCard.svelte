<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Calendar } from '@lucide/svelte/icons';
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

<CardUI class="group overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
	<div class="p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<Avatar class="size-11 transition-transform duration-200 group-hover:scale-105">
					<AvatarFallback class="text-sm font-bold text-primary">{eleve.prenom[0]}{eleve.nom[0]}</AvatarFallback>
				</Avatar>
				<div>
					<button
						class="text-sm font-semibold hover:text-primary hover:underline transition-colors"
						onclick={() => goto(`/eleves/${eleve.id}`)}
					>
						{eleve.prenom} {eleve.nom}
					</button>
					<Badge variant="secondary" class="mt-0.5 text-[10px]">{eleve.classe}</Badge>
				</div>
			</div>
		</div>
		<div class="mt-3 flex items-center justify-between border-t border-border pt-3">
			<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Calendar class="size-3" />
				<span>{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR') : '—'}</span>
			</div>
			<Button variant="outline" size="sm" class="h-7 text-xs transition-all hover:bg-primary hover:text-primary-foreground" onclick={() => goto(`/eleves/${eleve.id}`)}>
				Voir profil
			</Button>
		</div>
	</div>
</CardUI>
