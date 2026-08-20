import { NextFunction, Request, Response } from 'express';

import { AppError } from '@/errors/AppError';

export const errorHandler = (
	err: Error,
	_req: Request,
	res: Response,
	// Express requires four arguments to recognize this as error middleware.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_next: NextFunction,
): void => {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({ error: err.message });

		return;
	}

	console.error(err);
	res.status(500).json({ error: 'Internal server error' });
};
