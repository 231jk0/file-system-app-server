import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { closePool, getPool } from '@/database';

import { api, truncateTables } from './helpers';

beforeEach(truncateTables);

afterAll(closePool);

describe('validation', () => {
	it('rejects empty, whitespace, oversized, and slash names', async () => {
		const cases = [
			{ name: '' },
			{ name: '   ' },
			{ name: 'a'.repeat(256) },
			{ name: 'foo/bar' },
			{ name: 'foo\\bar' },
		];

		for (const body of cases) {
			const res = await api().post('/api/v1/files').send(body);

			expect(res.status, JSON.stringify(body)).toBe(400);
			expect(res.body.errors).toBeDefined();
		}
	});

	it('rejects invalid UUIDs', async () => {
		const res = await api().get('/api/v1/files/not-a-uuid');

		expect(res.status).toBe(400);
	});

	it('trims names before insert', async () => {
		const res = await api().post('/api/v1/files').send({ name: '  notes.txt  ' });

		expect(res.status).toBe(201);
		expect(res.body.file.name).toBe('notes.txt');
	});

	it('rejects a browse path with a slash in a segment', async () => {
		const res = await api().get('/api/v1/browse').query({ path: 'docs/foo\\bar' });

		expect(res.status).toBe(400);
	});

	it('rejects empty and slash names at the database, not only in Zod', async () => {
		const pool = getPool();

		await expect(pool.query('INSERT INTO files (name) VALUES ($1)', [ '' ]))
			.rejects.toMatchObject({ code: '23514' });
		await expect(pool.query('INSERT INTO files (name) VALUES ($1)', [ 'foo/bar' ]))
			.rejects.toMatchObject({ code: '23514' });
		await expect(pool.query('INSERT INTO folders (name) VALUES ($1)', [ 'foo\\bar' ]))
			.rejects.toMatchObject({ code: '23514' });
	});
});
