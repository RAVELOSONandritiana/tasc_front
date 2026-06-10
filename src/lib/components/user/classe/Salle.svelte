<script lang="ts">
	import type { Salle } from '$lib/types/Materiel.type';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { DoorOpen, Users } from '@lucide/svelte/icons';
	import UploadFile from '$lib/components/user/form/UploadFile.svelte';
	import pb from '$lib/pocketbase/pocketbase';

	const { salle }: { salle: Salle } = $props();
	let sl = $state(salle);
	let open = $state(false);
	let files = $state<FileList | null>(null);

	async function handleSubmit() {
		if (!files || files.length === 0) return;
		const formdata = new FormData();
		formdata.append('file', files[0]);
		const record = await pb.collection('tasc_statics').create(formdata);
		if (record && record.file) {
			sl.url = pb.files.getURL(record, record.file);
		}
		open = false;
	}

	const statutLabel = $derived(sl.used ? 'Occupée' : 'Libre');
	const statutClass = $derived(sl.used ? 'bg-purple-500 text-purple-50' : 'bg-emerald-600 text-emerald-50');
</script>

<CardUI>
	{#if sl.url}
		<img
			src={sl.url}
			alt="image salle"
			class="h-40 w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
		/>
	{:else}
		<div class="relative h-40 w-full bg-gradient-to-br from-sidebar-accent/50 via-sidebar to-sidebar-accent/30">
			<div class="absolute inset-0 flex items-center justify-center">
				<DoorOpen class="size-10 text-sidebar-foreground/40" />
			</div>
		</div>
	{/if}
	<div class="bg-white/5 p-4">
		<div class="mb-3 flex items-center justify-between">
			<div>
				<div class="text-base font-semibold text-foreground">Salle {sl.num}</div>
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Users class="size-3.5" />
					<span>{sl.place} places</span>
				</div>
			</div>
			<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statutClass}">
				{statutLabel}
			</span>
		</div>
		<div class="flex w-full items-center justify-between gap-2">
			<Button variant="outline" size="sm" class="h-8 flex-1 rounded-lg px-3 text-xs"> Modifier salle </Button>
			<div class="flex flex-1 gap-2">
				<Button size="sm" variant="default" class="h-8 flex-1 rounded-lg px-3 text-xs" onclick={() => (open = true)}>
					Modifier image
				</Button>
				<UploadFile bind:open bind:files onSubmit={handleSubmit}>
				</UploadFile>
			</div>
		</div>
	</div>
</CardUI>
