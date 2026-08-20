import { NextFunction, Request, Response } from 'express';

function withErrorHandling<R = unknown>(
	handler: (
		req: Request<R>,
		res: Response,
		next?: NextFunction,
	) => Promise<void> | void,
) {
	return async (req: Request<R>, res: Response, next: NextFunction) => {
		try {
			await handler(req, res, next);
		} catch (err) {
			next(err);
		}
	};
}

export default withErrorHandling;
