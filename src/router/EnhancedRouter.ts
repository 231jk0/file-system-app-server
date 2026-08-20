import {
	NextFunction,
	RequestHandler,
	Router,
	RouterOptions,
} from 'express';

import { ExpressResponse, RequestTypes, TypedRequest } from './expressResponse';
import withErrorHandling from './withErrorHandling';

export type Handler<Req extends RequestTypes = any, ResBody = any> = (
	req: TypedRequest<Req>,
	res: ExpressResponse<ResBody>,
	next: NextFunction
) => Promise<void> | void;

// We use `any[]` here internally because the public methods strictly enforce
// the types through method overloads.
const wrapHandlers = (handlers: any[]): RequestHandler[] => {
	if (handlers.length === 0) {
		return handlers;
	}

	const lastIndex = handlers.length - 1;

	return handlers.map((handler, index) =>
		index === lastIndex
			? (withErrorHandling(handler) as RequestHandler)
			: handler,
	);
};

export class EnhancedRouter {
	private readonly router: Router;

	constructor(options?: RouterOptions) {
		this.router = Router(options);
	}

	// --- GET ---
	get<Req extends RequestTypes = any, ResBody = any>(path: string, handler: Handler<Req, ResBody>): this;
	get<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, handler: Handler<Req, ResBody>): this;
	get<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, m2: RequestHandler, handler: Handler<Req, ResBody>): this;
	get<Req extends RequestTypes = any, ResBody = any>(path: string, ...handlers: [...RequestHandler[], Handler<Req, ResBody>]): this;
	get(path: string, ...handlers: any[]): this {
		this.router.get(path, ...wrapHandlers(handlers));

		return this;
	}

	// --- POST ---
	post<Req extends RequestTypes = any, ResBody = any>(path: string, handler: Handler<Req, ResBody>): this;
	post<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, handler: Handler<Req, ResBody>): this;
	post<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, m2: RequestHandler, handler: Handler<Req, ResBody>): this;
	post<Req extends RequestTypes = any, ResBody = any>(path: string, ...handlers: [...RequestHandler[], Handler<Req, ResBody>]): this;
	post(path: string, ...handlers: any[]): this {
		this.router.post(path, ...wrapHandlers(handlers));

		return this;
	}

	// --- PUT ---
	put<Req extends RequestTypes = any, ResBody = any>(path: string, handler: Handler<Req, ResBody>): this;
	put<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, handler: Handler<Req, ResBody>): this;
	put<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, m2: RequestHandler, handler: Handler<Req, ResBody>): this;
	put<Req extends RequestTypes = any, ResBody = any>(path: string, ...handlers: [...RequestHandler[], Handler<Req, ResBody>]): this;
	put(path: string, ...handlers: any[]): this {
		this.router.put(path, ...wrapHandlers(handlers));

		return this;
	}

	// --- PATCH ---
	patch<Req extends RequestTypes = any, ResBody = any>(path: string, handler: Handler<Req, ResBody>): this;
	patch<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, handler: Handler<Req, ResBody>): this;
	patch<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, m2: RequestHandler, handler: Handler<Req, ResBody>): this;
	patch<Req extends RequestTypes = any, ResBody = any>(path: string, ...handlers: [...RequestHandler[], Handler<Req, ResBody>]): this;
	patch(path: string, ...handlers: any[]): this {
		this.router.patch(path, ...wrapHandlers(handlers));

		return this;
	}

	// --- DELETE ---
	delete<Req extends RequestTypes = any, ResBody = any>(path: string, handler: Handler<Req, ResBody>): this;
	delete<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, handler: Handler<Req, ResBody>): this;
	delete<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, m2: RequestHandler, handler: Handler<Req, ResBody>): this;
	delete<Req extends RequestTypes = any, ResBody = any>(path: string, ...handlers: [...RequestHandler[], Handler<Req, ResBody>]): this;
	delete(path: string, ...handlers: any[]): this {
		this.router.delete(path, ...wrapHandlers(handlers));

		return this;
	}

	// --- ALL ---
	all<Req extends RequestTypes = any, ResBody = any>(path: string, handler: Handler<Req, ResBody>): this;
	all<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, handler: Handler<Req, ResBody>): this;
	all<Req extends RequestTypes = any, ResBody = any>(path: string, m1: RequestHandler, m2: RequestHandler, handler: Handler<Req, ResBody>): this;
	all<Req extends RequestTypes = any, ResBody = any>(path: string, ...handlers: [...RequestHandler[], Handler<Req, ResBody>]): this;
	all(path: string, ...handlers: any[]): this {
		this.router.all(path, ...wrapHandlers(handlers));

		return this;
	}

	use(...handlers: unknown[]): this {
		(this.router.use as (...args: unknown[]) => Router)(...handlers);

		return this;
	}

	asRouter(): Router {
		return this.router;
	}
}

export const createEnhancedRouter = (options?: RouterOptions): EnhancedRouter =>
	new EnhancedRouter(options);
