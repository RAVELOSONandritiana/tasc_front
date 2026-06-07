<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { Label } from '$lib/components/ui/label';

	let { open = $bindable(false) } = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}>Presence</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title class="mx-auto">Verifier bien les eleves</AlertDialog.Title>
		</AlertDialog.Header>
		<Carousel.Root class="mx-auto w-50">
			<Carousel.Content>
				{#each Array(5), i}
					<Carousel.Item>
						<div class="p-1">
							<Card.Root>
								<Card.Content class="flex aspect-square items-center justify-center p-6">
									<span class="text-4xl font-semibold">{i + 1}</span>
								</Card.Content>
							</Card.Root>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<Carousel.Previous />
			<Carousel.Next />
		</Carousel.Root>
		<div class="flex flex-col items-center justify-center space-y-2">
			<Label class="text-lg font-bold">RAVELOSON</Label>
			<Label class="text-lg">Andritiana Michel</Label>
		</div>

		<AlertDialog.Footer class="flex flex-col items-center justify-center">
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action>Present</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
