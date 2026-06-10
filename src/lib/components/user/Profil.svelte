<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Sun, Moon } from '@lucide/svelte/icons';

	let checked = $state(true);

	$effect(() => {
		document.documentElement.classList.toggle('dark', checked);
	});
</script>

<div class="flex items-center gap-3">
	<Switch {checked} onCheckedChange={(details) => (checked = details.checked)}>
		<Switch.Label class="sr-only">Toggle theme</Switch.Label>
		<Switch.Control>
			<Switch.Thumb class="transition-transform duration-200">
				{#if checked}
					<Moon class="size-3" />
				{:else}
					<Sun class="size-3" />
				{/if}
			</Switch.Thumb>
		</Switch.Control>
		<Switch.HiddenInput />
	</Switch>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Avatar.Root>
				<Avatar.Image src="https://github.com/vanessa.png" alt="Vanessa" />
				<Avatar.Fallback>VA</Avatar.Fallback>
			</Avatar.Root>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Label>Mon Compte</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a href="/profil" {...props}>Profil</a>
				{/snippet}
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a href="/parametre" {...props}>Parametres</a>
				{/snippet}
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a href="/" {...props}>Deconnexion</a>
				{/snippet}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>