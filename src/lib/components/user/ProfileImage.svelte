<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Camera, Loader2 } from '@lucide/svelte/icons';
	import UploadFile from '$lib/components/user/form/UploadFile.svelte';
	import pb, { auth } from '$lib/pocketbase/pocketbase';

	let {
		personneId,
		imageUrl = null,
		initials = '',
		sizeClass = 'size-20',
		ringClass = '',
		onChange
	}: {
		personneId: string;
		imageUrl?: string | null;
		initials?: string;
		sizeClass?: string;
		ringClass?: string;
		onChange?: (url: string) => void;
	} = $props();

	let open = $state(false);
	let files = $state<FileList | null>(null);
	let uploading = $state(false);
	let imageError = $state(false);

	async function handleSubmit() {
		if (!files || files.length === 0) return;
		uploading = true;
		try {
			await auth();
			const formdata = new FormData();
			formdata.append('file', files[0]);
			const record = await pb.collection('tasc_statics').create(formdata);
			if (record && record.file) {
				const url = pb.files.getURL(record, record.file);
				const fd = new FormData();
				fd.append('personneId', personneId);
				fd.append('imageUrl', url);
				const res = await fetch('/personne/image', {
					method: 'POST',
					body: fd,
					credentials: 'same-origin'
				});
				const result = (await res.json().catch(() => null)) as { success?: boolean; url?: string } | null;
				if (result?.success && result.url) {
					const oldImageUrl = imageUrl;
					onChange?.(result.url);
					if (oldImageUrl && oldImageUrl !== url) {
						const segments = oldImageUrl.split('/');
						const recordId = segments[segments.length - 2];
						if (recordId) {
							await pb.collection('tasc_statics').delete(recordId).catch(() => {});
						}
					}
				}
			}
		} catch (e) {
			console.error('Upload failed:', e);
		} finally {
			uploading = false;
			files = null;
		}
	}
</script>

<div class="relative">
	<Avatar.Root class="{sizeClass} {ringClass}">
		{#if imageUrl && !imageError}
			<Avatar.Image src={imageUrl} alt="photo de profil" onerror={() => (imageError = true)} />
		{/if}
		<Avatar.Fallback class="text-lg font-bold">{initials || '?'}</Avatar.Fallback>
	</Avatar.Root>
	<button
		type="button"
		onclick={() => (open = true)}
		class="absolute -bottom-1 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-110"
		title="Changer la photo"
	>
		{#if uploading}
			<Loader2 class="size-3.5 animate-spin" />
		{:else}
			<Camera class="size-3.5" />
		{/if}
	</button>
	<UploadFile bind:open bind:files header="Photo de profil" onSubmit={handleSubmit} />
</div>
