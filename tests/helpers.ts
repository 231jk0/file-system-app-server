import request from 'supertest';
import { expect } from 'vitest';

import app from '@/app';
import { getPool } from '@/database';

export const api = () => request(app);

export const missingUuid = '00000000-0000-4000-8000-000000000000';

export type TestFolder = {
	id: string;
	name: string;
	path: string;
	parentId: string | null;
};

export type TestFile = {
	id: string;
	name: string;
	folderId: string | null;
};

export const truncateTables = async () => {
	await getPool().query('TRUNCATE folders, files RESTART IDENTITY CASCADE');
};

export const createFolder = async (name: string, parentId?: string) => {
	const res = await api().post('/api/v1/folders').send({
		name,
		parentId,
	});

	expect(res.status).toBe(201);

	return res.body.folder as TestFolder;
};

export const createFile = async (name: string, folderId?: string) => {
	const res = folderId
		? await api().post(`/api/v1/folders/${folderId}/files`).send({ name })
		: await api().post('/api/v1/files').send({ name });

	expect(res.status).toBe(201);

	return res.body.file as TestFile;
};
