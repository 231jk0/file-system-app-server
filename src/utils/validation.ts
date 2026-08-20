import { z } from 'zod';

import type { ExpressResponse, ZodValidationErrorResponse } from '@/router/expressResponse';

export const uuidSchema = z.uuid('Must be a valid UUID');

export const nameSchema = z
	.string('Name must be a string')
	.trim()
	.min(1, 'Name is required')
	.max(255, 'Name must be at most 255 characters')
	.regex(/^[^/\\]+$/, 'Name cannot contain slashes');

export const prefixQuerySchema = z
	.string('Search query must be a string')
	.trim()
	.min(1, 'Search query is required');

export const formatZodErrors = (error: z.ZodError): ZodValidationErrorResponse['errors'] =>
	error.issues.map(issue => ({
		field: issue.path.join('.'),
		message: issue.message,
	}));

export const parseOr400 = <T extends z.ZodType>(
	schema: T,
	data: unknown,
	res: ExpressResponse<any>,
): z.infer<T> => {
	const validation = schema.safeParse(data);

	if (!validation.success) {
		res.status(400).json({ errors: formatZodErrors(validation.error) });

		return null;
	}

	return validation.data;
};
