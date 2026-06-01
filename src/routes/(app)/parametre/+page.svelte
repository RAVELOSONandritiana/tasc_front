<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	let checked = $state(true);

	$effect(() => {
		document.documentElement.classList.toggle('dark', checked);
	});
</script>

<div class="bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-bold text-foreground">Gerer la plateforme</h2>
		<Switch {checked} onCheckedChange={(details) => (checked = details.checked)}>
			<Switch.Label><h3 class="text-md">Toogle theme</h3></Switch.Label>
			<Switch.Control>
				<Switch.Thumb />
			</Switch.Control>
			<Switch.HiddenInput />
		</Switch>
	</div>
</div>
