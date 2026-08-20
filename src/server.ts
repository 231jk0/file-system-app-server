import app from '@/app';
import { config } from '@/config/config';
import { closePool } from '@/database';

const start = async (): Promise<void> => {
	const server = app.listen(config.port, () => {
		console.log(`Server listening on port ${config.port}`);
	});

	server.on('error', (err: Error) => {
		console.error('Failed to start server:', err);
		process.exit(1);
	});

	const shutdown = (): void => {
		server.close(async () => {
			try {
				await closePool();
			} finally {
				process.exit(0);
			}
		});
	};

	process.once('SIGTERM', shutdown);
	process.once('SIGINT', shutdown);
};

start().catch(err => {
	console.error('Failed to start server:', err);
	process.exit(1);
});
