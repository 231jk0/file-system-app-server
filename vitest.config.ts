import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		environment: 'node',
		fileParallelism: false,
		setupFiles: [ './tests/setup.ts' ],
		hookTimeout: 30000,
		testTimeout: 15000,
	},
	resolve: { alias: { '@': path.resolve(root, 'src') } },
});
