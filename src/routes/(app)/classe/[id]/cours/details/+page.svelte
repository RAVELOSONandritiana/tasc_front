<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label';
	const student = [
		{
			id: 1,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 2,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 3,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 4,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 5,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19,
			examen: true
		},
		{
			id: 6,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19,
			examen: false
		}
	];
</script>

<main class="p-4">
	<div class="space-y-4">
		<Label>Prof Titulaire: RAKOTO BE</Label>
		<Label>Coefficient: 6</Label>
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
							<Checkbox />
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
