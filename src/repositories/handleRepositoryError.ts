import { AppError } from '@/errors/AppError';

const isPgError = (err: unknown): err is { code: string } =>
	typeof err === 'object'
	&& err !== null
	&& 'code' in err
	&& typeof (err as { code: unknown }).code === 'string';

export const handleRepositoryError = (
	err: unknown,
	messages: { duplicate: string; missingParent: string },
): never => {
	if (isPgError(err)) {
		if (err.code === '23505') {
			throw new AppError(409, messages.duplicate);
		}

		if (err.code === '23503') {
			throw new AppError(404, messages.missingParent);
		}

		if (err.code === '23514') {
			throw new AppError(400, 'Invalid name');
		}
	}

	throw err;
};
