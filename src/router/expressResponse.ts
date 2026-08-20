import express from 'express';

export interface RequestTypes {
	body?: unknown;
	params?: unknown;
	query?: unknown;
}

export type TypedRequest<T extends RequestTypes = RequestTypes> = express.Request<
	T['params'] extends undefined ? Record<string, string> : T['params'],
	unknown,
	T['body'] extends undefined ? unknown : T['body'],
	T['query'] extends undefined ? unknown : T['query']
>;

export interface ErrorResponse {
	error: string;
	statusCode?: number;
}

export interface ZodValidationErrorResponse {
	message?: string;
	errors: {
		field: string;
		message: string;
	}[];
}

export type ResponseBody<T> = T | ErrorResponse | ZodValidationErrorResponse;

export interface ExpressResponse<T = unknown, Locals extends Record<string, unknown> = Record<string, unknown>>
	extends Omit<express.Response<ResponseBody<T>, Locals>, 'json' | 'send' | 'jsonp' | 'status'> {
	status(code: number): ExpressResponse<T, Locals>;
	json(body?: ResponseBody<T>): this;
	send(body?: ResponseBody<T>): this;
	jsonp(body?: ResponseBody<T>): this;
}
