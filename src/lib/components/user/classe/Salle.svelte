<script lang="ts">
	import type { Salle } from '$lib/types/Materiel.type';
	import ImageSalle from '$lib/assets/images/1342060.jpeg';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';

	const { salle }: { salle: Salle } = $props();
</script>

<Card.Root class="transition-duration m-0 gap-y-0 p-0 transition-all duration-300">
	<Card.Content class="m-0 p-0">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img src={ImageSalle} alt="image salle" class="h-full w-full object-cover" />
	</Card.Content>
	<Card.Footer class="m-0 flex flex-col items-start justify-center gap-5 bg-white/10 p-4">
		<div class="flex w-full items-center justify-between">
			<Label>Salle - {salle.num}</Label><span
				class="h-4 w-4 rounded-full {salle.used ? 'bg-purple-500' : 'bg-green-600'}"
			>
			</span>
		</div>
		<Label>Place - {salle.place}</Label>
		<div class="flex w-full flex-row items-center justify-between">
			<Button variant="outline">Modifier Salle</Button>
			<Button>Modifier image</Button>
		</div>
	</Card.Footer>
</Card.Root>
