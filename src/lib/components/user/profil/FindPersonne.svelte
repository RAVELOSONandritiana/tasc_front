<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Label } from '$lib/components/ui/label';
	const {
		name,
		lastname
	}: {
		name: string;
		lastname: string;
	} = $props();
</script>

<div
	class="flex cursor-pointer items-center space-x-1 rounded-md border border-l-3 border-l-blue-500 p-2 hover:ring-2 hover:ring-blue-800"
>
	<Avatar.Root>
		<Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
		<Avatar.Fallback>CN</Avatar.Fallback>
	</Avatar.Root>
	<Label class="pl-4">{name} {lastname}</Label>
</div>
