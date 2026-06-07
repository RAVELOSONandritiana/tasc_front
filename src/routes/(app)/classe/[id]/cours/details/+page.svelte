<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import Presence from '$lib/components/user/classe/Presence.svelte';
	const student = [
		{
			id: 1,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: false,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 2,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: false,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 3,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: false,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 4,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: false,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 5,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: false,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 6,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: false,
			age: 17,
			absence: 19,
			examen: false
		}
	];
	let coursStart = $state(false);
	let coursEnd = $state(false);

	async function startCourse() {
		if (coursStart == false && coursEnd == false) {
			coursStart = true;
		} else if (coursStart == true && coursEnd == false) {
			coursStart = false;
			coursEnd = true;
		}
	}

	let open = $state(false);
</script>

<main class="p-4">
	<div class="flex items-start justify-between">
		<div class="space-y-4">
			<Label>Prof : RAKOTO BE</Label>
			<Label>Coefficient : 6</Label>
		</div>
		<div class="flex items-center justify-center space-x-4">
			<Button onclick={() => startCourse()} disabled={coursEnd}
				>{coursStart ? 'Terminer Cours' : coursEnd ? 'Cours Termine' : 'Commencer Cours'}</Button
			>
			{#if coursStart == true}
				<Presence bind:open />
			{/if}
		</div>
	</div>

	<div class="pt-4">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>examen</Table.Head>
					<Table.Head>Nom</Table.Head>
					<Table.Head>Prenom</Table.Head>
					<Table.Head>Age</Table.Head>
					<Table.Head>Absence</Table.Head>
					<Table.Head>Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each student as s (s.id)}
					<Table.Row>
						<Table.Cell>
							<Checkbox checked={s.status} />
						</Table.Cell>
						<Table.Cell>{s.name}</Table.Cell>
						<Table.Cell>{s.lastname}</Table.Cell>
						<Table.Cell>{s.age}</Table.Cell>
						<Table.Cell>{s.absence}</Table.Cell>
						<Table.Cell>{s.status}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
