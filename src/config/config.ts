import dotenv from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
	dotenv.config({ path: '.env.test' });
} else {
	dotenv.config();
}

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3000),
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
	CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	const details = parsed.error.issues
		.map(issue => `${issue.path.join('.')}: ${issue.message}`)
		.join('; ');

	throw new Error(`Invalid environment: ${details}`);
}

export const config = {
	port: parsed.data.PORT,
	databaseUrl: parsed.data.DATABASE_URL,
	clientUrl: parsed.data.CLIENT_URL,
	corsConfig: {
		origin: [ parsed.data.CLIENT_URL ],
		methods: [ 'GET', 'POST', 'DELETE' ],
		allowedHeaders: [ 'Content-Type' ],
		credentials: true,
	},
};
