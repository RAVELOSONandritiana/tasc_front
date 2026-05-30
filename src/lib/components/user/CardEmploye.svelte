<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { cn } from '$lib/utils';
	import { Badge } from "$lib/components/ui/badge/index.js";
	let {
		name,
		lastname,
		image,
        poste,
		header,
		children,
		footer,
		class: className,
		connected
	}: {
		name: string;
		lastname: string;
        poste: string;
		image?: string;
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		class?: string;
		connected?: boolean
	} = $props();
</script>

<Card.Root
	class={cn('w-full max-w-sm overflow-hidden transition-shadow hover:shadow-lg', className)}
>
	{#if header}
		{@render header()}
	{:else}
		<Card.Header class="flex flex-row items-center gap-4 pb-4">
			<Avatar.Root class="h-16 w-16 border cursor-pointer">
				{#if image}
					<Avatar.Image src={image} alt={name} class="object-cover" />
				{/if}
				<Avatar.Fallback class="bg-muted font-bold text-muted-foreground">
					{name.charAt(0)}{lastname.charAt(0)}
				</Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-1 flex-col gap-1">
				<div class="flex items-start justify-between">
					<Card.Title class="text-xl leading-none font-bold">
						{name}
						{lastname}
					</Card.Title>
					<Badge class={connected?'bg-green-400':'bg-red-400'}></Badge>
				</div>
				<Card.Description class="text-sm text-muted-foreground">
					{poste}
				</Card.Description>
			</div>
		</Card.Header>
	{/if}
	{#if children}
		<Card.Content class="pt-0">
			{@render children()}
		</Card.Content>
	{/if}

	{#if footer}
		{@render footer()}
	{:else}
		<Card.Footer class="flex justify-between border-t">
			<Button class="w-full"> Voir le profil</Button>
		</Card.Footer>
	{/if}
</Card.Root>
