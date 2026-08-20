import { Pool } from 'pg';

import { config } from '@/config/config';

let pool: Pool = null;

export const getPool = (): Pool => {
	if (!pool) {
		pool = new Pool({ connectionString: config.databaseUrl });
	}

	return pool;
};

export const closePool = async (): Promise<void> => {
	if (pool) {
		await pool.end();
		pool = null;
	}
};
