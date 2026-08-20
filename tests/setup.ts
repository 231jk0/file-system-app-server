import { execSync } from 'node:child_process';
import path from 'node:path';

import dotenv from 'dotenv';
import { Client } from 'pg';
import { beforeAll } from 'vitest';

const serverRoot = process.cwd();

dotenv.config({ path: path.join(serverRoot, '.env.test') });

if (!process.env.CLIENT_URL) {
	process.env.CLIENT_URL = 'http://localhost:5173';
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL must be set to run tests. Add it to .env.test.');
}

const databaseNameFromUrl = (url: string) => {
	const name = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));

	if (!name) {
		throw new Error('DATABASE_URL must include a database name.');
	}

	return name;
};

const ensureTestDatabase = async (url: string) => {
	const databaseName = databaseNameFromUrl(url);

	if (!databaseName.endsWith('_test')) {
		throw new Error(
			`Refusing to run tests against database "${databaseName}". DATABASE_URL in .env.test must point to a database whose name ends with _test.`,
		);
	}

	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseName)) {
		throw new Error(`Invalid test database name "${databaseName}".`);
	}

	const adminUrl = new URL(url);
	adminUrl.pathname = '/postgres';

	const client = new Client({ connectionString: adminUrl.toString() });

	await client.connect();

	try {
		const existing = await client.query(
			'SELECT 1 FROM pg_database WHERE datname = $1',
			[ databaseName ],
		);

		if (existing.rows.length === 0) {
			await client.query(`CREATE DATABASE "${databaseName}"`);
		}
	} finally {
		await client.end();
	}
};

beforeAll(async () => {
	await ensureTestDatabase(databaseUrl);
	execSync('npx node-pg-migrate -f ./src/database/node-pg-migrate-config-file.json --envPath .env.test up', {
		cwd: serverRoot,
		env: process.env,
		stdio: 'inherit',
	});
});
