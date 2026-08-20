import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { closePool, getPool } from '@/database';

import { api, createFolder, truncateTables } from './helpers';

beforeEach(truncateTables);

afterAll(closePool);

type BurstStats = {
	concurrency: number;
	created: number;
	failed: number;
	elapsedMs: number;
	requestsPerSecond: number;
	p50Ms: number;
	p95Ms: number;
};

const ALWAYS_ON_BURST = 50;
const STRESS_LEVELS = [ 10, 50, 100, 200, 400, 800, 1600 ];
const runStressRamp = process.env.STRESS === '1';

const percentile = (values: number[], p: number): number => {
	if (values.length === 0) {
		return 0;
	}

	const sorted = [ ...values ].sort((a, b) => a - b);
	const index = Math.min(sorted.length - 1, Math.ceil(p / 100 * sorted.length) - 1);

	return sorted[index];
};

const createFoldersBurst = async (count: number, parentId?: string): Promise<BurstStats> => {
	const burstId = `${count}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	const startedAt = Date.now();
	const results = await Promise.all(Array.from({ length: count }, async (_, index) => {
		const requestStartedAt = Date.now();
		const res = await api().post('/api/v1/folders').send({
			name: `user-${burstId}-${index}`,
			parentId,
		});

		return {
			status: res.status,
			latencyMs: Date.now() - requestStartedAt,
		};
	}));
	const elapsedMs = Math.max(Date.now() - startedAt, 1);
	const latencies = results.map(result => result.latencyMs);
	const created = results.filter(result => result.status === 201).length;

	return {
		concurrency: count,
		created,
		failed: count - created,
		elapsedMs,
		requestsPerSecond: Math.round(count / elapsedMs * 1000),
		p50Ms: percentile(latencies, 50),
		p95Ms: percentile(latencies, 95),
	};
};

const folderCount = async (): Promise<number> => {
	const result = await getPool().query<{ n: number }>('SELECT COUNT(*)::int AS n FROM folders');

	return result.rows[0]?.n ?? 0;
};

const formatBurstStats = (stats: BurstStats): string =>
	`${String(stats.concurrency).padStart(4)} in-flight  `
	+ `${stats.created}/${stats.concurrency} created  `
	+ `${stats.failed} failed  `
	+ `${stats.elapsedMs}ms  `
	+ `${stats.requestsPerSecond}/s  `
	+ `p50 ${stats.p50Ms}ms  p95 ${stats.p95Ms}ms`
;

describe('concurrency', () => {
	it('lets the unique index decide duplicate inserts', async () => {
		const [ firstFile, secondFile ] = await Promise.all([
			api().post('/api/v1/files').send({ name: 'race.txt' }),
			api().post('/api/v1/files').send({ name: 'race.txt' }),
		]);
		const [ firstFolder, secondFolder ] = await Promise.all([
			api().post('/api/v1/folders').send({ name: 'race-dir' }),
			api().post('/api/v1/folders').send({ name: 'race-dir' }),
		]);

		expect([ firstFile.status, secondFile.status ].sort()).toEqual([ 201, 409 ]);
		expect([ firstFolder.status, secondFolder.status ].sort()).toEqual([ 201, 409 ]);
	});

	it('creates many unique folders at the same time', async () => {
		const stats = await createFoldersBurst(ALWAYS_ON_BURST);

		expect(stats.failed).toBe(0);
		expect(stats.created).toBe(ALWAYS_ON_BURST);
		expect(await folderCount()).toBe(ALWAYS_ON_BURST);
	});

	it('creates many unique folders under the same parent at the same time', async () => {
		const parent = await createFolder('shared');
		const stats = await createFoldersBurst(ALWAYS_ON_BURST, parent.id);

		expect(stats.failed).toBe(0);
		expect(stats.created).toBe(ALWAYS_ON_BURST);
		expect(await folderCount()).toBe(ALWAYS_ON_BURST + 1);
	});

	it.skipIf(!runStressRamp)(
		'ramps concurrent folder creates and reports capacity',
		async () => {
			const rows: BurstStats[] = [];

			for (const concurrency of STRESS_LEVELS) {
				await truncateTables();

				const stats = await createFoldersBurst(concurrency);

				rows.push(stats);
				console.info(formatBurstStats(stats));

				expect(stats.failed, `burst of ${concurrency} had failed creates`).toBe(0);
				expect(await folderCount()).toBe(concurrency);
			}

			const largest = rows[rows.length - 1];

			console.info(
				`Largest burst: ${largest.concurrency} in-flight folder creates completed `
				+ `(${largest.requestsPerSecond}/s, p95 ${largest.p95Ms}ms). `
				+ 'This is one Node process + the default pg Pool (max 10), not a multi-host load test.',
			);
		},
		120_000,
	);
});
