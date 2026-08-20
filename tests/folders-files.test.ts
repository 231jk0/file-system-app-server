import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { closePool } from '@/database';

import { api, createFile, createFolder, missingUuid, truncateTables } from './helpers';

beforeEach(truncateTables);

afterAll(closePool);

describe('folders and files', () => {
	it('creates folders and files and browses nested paths', async () => {
		const docs = await createFolder('docs');
		const reports = await createFolder('reports', docs.id);
		const file = await createFile('readme.txt', reports.id);

		const root = await api().get('/api/v1/browse');

		expect(root.status).toBe(200);
		expect(root.body.path).toBe('/');
		expect(root.body.folder).toBeNull();
		expect(root.body.subfolders.map((folder: { name: string }) => folder.name)).toEqual([ 'docs' ]);

		const nested = await api().get('/api/v1/browse').query({ path: '/docs/reports' });

		expect(nested.status).toBe(200);
		expect(nested.body.folder.id).toBe(reports.id);
		expect(nested.body.files.map((entry: { id: string }) => entry.id)).toEqual([ file.id ]);
	});

	it('deletes a folder and cascades to children', async () => {
		const parent = await createFolder('parent');
		const child = await createFolder('child', parent.id);
		const file = await createFile('notes', child.id);

		const deleted = await api().delete(`/api/v1/folders/${parent.id}`);

		expect(deleted.status).toBe(200);

		expect((await api().get('/api/v1/browse').query({ path: '/parent/child' })).status).toBe(404);
		expect((await api().get(`/api/v1/files/${file.id}`)).status).toBe(404);
	});

	it('returns 409 for duplicate names at root', async () => {
		await createFile('dup');
		await createFolder('dup-folder');

		const fileDup = await api().post('/api/v1/files').send({ name: 'dup' });
		const folderDup = await api().post('/api/v1/folders').send({ name: 'dup-folder' });

		expect(fileDup.status).toBe(409);
		expect(folderDup.status).toBe(409);
	});

	it('returns 404 for a missing parent folder', async () => {
		const folder = await api().post('/api/v1/folders').send({
			name: 'orphan',
			parentId: missingUuid,
		});
		const file = await api().post('/api/v1/files').send({
			name: 'orphan.txt',
			folderId: missingUuid,
		});

		expect(folder.status).toBe(404);
		expect(file.status).toBe(404);
	});

	it('returns 404 for missing resources', async () => {
		expect((await api().get(`/api/v1/files/${missingUuid}`)).status).toBe(404);
		expect((await api().delete(`/api/v1/files/${missingUuid}`)).status).toBe(404);
		expect((await api().delete(`/api/v1/folders/${missingUuid}`)).status).toBe(404);
		expect((await api().get('/api/v1/browse').query({ path: '/nope' })).status).toBe(404);
	});

	it('returns JSON 404 for unknown routes', async () => {
		const res = await api().get('/api/v1/does-not-exist');

		expect(res.status).toBe(404);
		expect(res.body).toEqual({ error: 'Not found' });
	});
});
