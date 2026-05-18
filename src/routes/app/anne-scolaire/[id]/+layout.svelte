<script>
	import { page } from '$app/stores';
	import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
	import Link from '$lib/components/user/Link.svelte';

	let { children } = $props();

	const id = $page.params.id;

	const links = [
		{ path: `/app/anne-scolaire/${id}`, label: 'Surveillant' ,comment: 'faire regner la loi'},
		{ path: `/app/anne-scolaire/${id}/prof`, label: 'Professeur' ,comment: 'espace professeur'},
		{ path: `/app/anne-scolaire/${id}/classe`, label: 'Classe' ,comment: 'gerer les classes'},
	];
</script>

<header class="border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
	<nav class="py-3">
		<ul class="mx-4 flex items-center gap-2">
			{#each links as link (link.label)}

			<Tooltip>
				<Tooltip.Trigger>
					<Link label={link.label} href={link.path} />
				</Tooltip.Trigger>
				<Portal>
					<Tooltip.Positioner>
						<Tooltip.Content class="card bg-surface-100-900 p-2 shadow-xl">
							<span>{link.comment}</span>
							<Tooltip.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-100-900)]">
								<Tooltip.ArrowTip />
							</Tooltip.Arrow>
						</Tooltip.Content>
					</Tooltip.Positioner>
				</Portal>
			</Tooltip>
			{/each}
		</ul>
	</nav>
</header>

{@render children()}
