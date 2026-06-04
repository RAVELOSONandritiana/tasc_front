<script lang="ts">
	import { page } from '$app/stores';

	const id = $page.params.id;
</script>

<main class="flex-1 bg-sidebar p-6 text-sidebar-foreground">
	Je suis dans eleves {id}
</main>
