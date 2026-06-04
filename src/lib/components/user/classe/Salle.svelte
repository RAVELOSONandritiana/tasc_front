<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import type { Salle } from '$lib/types/Materiel.type';

	const { salle }: { salle: Salle } = $props();
</script>

<div
	class="rounded-md border border-l-5 p-4 {salle.used == true
		? 'border-l-purple-500'
		: 'border-l-green-600'} hover:cursor-pointer hover:-translate-y-2 transition-all duration-300 hover:shadow-lg shadow-black/50"
>
	<Label class="text-2xl hover:cursor-pointer">Salle - {salle.num}</Label>
	<Label class="hover:cursor-pointer">Nombre de places: {salle.place}</Label>
</div>
