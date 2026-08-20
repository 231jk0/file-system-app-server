import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { closePool } from '@/database';

import { api, createFile, createFolder, truncateTables } from './helpers';

beforeEach(truncateTables);

afterAll(closePool);

describe('search', () => {
	it('finds files by exact name in a folder and globally', async () => {
		const folder = await createFolder('inbox');
		const inFolder = await createFile('report.pdf', folder.id);
		await createFile('report.pdf');

		const inFolderSearch = await api()
			.get(`/api/v1/folders/${folder.id}/files/search`)
			.query({ name: 'report.pdf' });
		const globalSearch = await api().get('/api/v1/files/search').query({ name: 'report.pdf' });

		expect(inFolderSearch.status).toBe(200);
		expect(inFolderSearch.body.files).toHaveLength(1);
		expect(inFolderSearch.body.files[0].id).toBe(inFolder.id);

		expect(globalSearch.status).toBe(200);
		expect(globalSearch.body.files).toHaveLength(2);
	});

	it('returns the top 10 prefix matches and a total count', async () => {
		for (let i = 0; i < 12; i += 1) {
			await createFile(`log-${String(i).padStart(2, '0')}`);
		}

		const res = await api().get('/api/v1/files/search/prefix').query({ q: 'log-' });

		expect(res.status).toBe(200);
		expect(res.body.files).toHaveLength(10);
		expect(res.body.totalCount).toBe(12);
	});

	it('includes the nested folder path on global prefix matches', async () => {
		const parent = await createFolder('c');
		const nested = await createFolder('d', parent.id);
		await createFile('e', nested.id);

		const res = await api().get('/api/v1/files/search/prefix').query({ q: 'e' });

		expect(res.status).toBe(200);
		expect(res.body.files).toEqual([
			expect.objectContaining({
				name: 'e',
				folderPath: 'c/d',
			}),
		]);
	});

	it('scopes prefix search to a folder or to root', async () => {
		const folder = await createFolder('proj');
		await createFile('alpha.txt', folder.id);
		await createFile('alpha-root.txt');
		await createFile('beta.txt', folder.id);

		const inFolder = await api()
			.get(`/api/v1/folders/${folder.id}/files/search/prefix`)
			.query({ q: 'a' });
		const atRoot = await api().get('/api/v1/files/search/prefix').query({
			q: 'a',
			root: 'true',
		});

		expect(inFolder.body.files.map((file: { name: string }) => file.name)).toEqual([ 'alpha.txt' ]);
		expect(atRoot.body.files.map((file: { name: string }) => file.name)).toEqual([ 'alpha-root.txt' ]);
	});

	it('treats LIKE metacharacters as literals', async () => {
		await createFile('abc');
		await createFile('a%c');
		await createFile('a_c');

		const percent = await api().get('/api/v1/files/search/prefix').query({ q: 'a%' });
		const underscore = await api().get('/api/v1/files/search/prefix').query({ q: 'a_' });

		expect(percent.body.files.map((file: { name: string }) => file.name)).toEqual([ 'a%c' ]);
		expect(underscore.body.files.map((file: { name: string }) => file.name)).toEqual([ 'a_c' ]);
	});
});
