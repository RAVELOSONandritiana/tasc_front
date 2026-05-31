<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	const {
		name,
		lastname,
		domicile,
		fokontany,
		commune,
		phone,
		email,
		connected
	}: {
		name: string;
		lastname: string;
		domicile: string;
		fokontany: string;
		commune: string;
		phone: string;
		email: string;
		connected: boolean;
	} = $props();

	const fallback = name[0].toUpperCase().concat(lastname[0].toUpperCase());
</script>

<Card.Root>
	<Card.Header class="flex items-center justify-between">
		<div class="flex items-center justify-start space-x-4">
			<Avatar.Root>
				<Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
				<Avatar.Fallback>{fallback}</Avatar.Fallback>
			</Avatar.Root>
			<Card.Title>
				{name}<br />
				{lastname}
			</Card.Title>
		</div>
		<Badge class={connected ? 'bg-green-500' : 'bg-gray-800'}></Badge>
	</Card.Header>
	<Card.Description class="space-y-4 px-8">
		{domicile}-{fokontany}-{commune}<br />
		{email}<br />
		{phone}
	</Card.Description>
	<Card.CardFooter class="flex justify-between">
		<div></div>
		<Button>Voir profil</Button>
	</Card.CardFooter>
</Card.Root>
