import { z } from 'zod';

import { File, FileSearchResult } from '@/repositories/fileRepository';
import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as fileService from '@/services/fileService';
import { nameSchema, parseOr400, prefixQuerySchema } from '@/utils/validation';

export const get = (router: EnhancedRouter) => {
	interface SearchFilesExactRequest {
		query: {
			name: string;
		};
	}

	interface SearchFilesExactResponse {
		files: File[];
	}

	router.get<SearchFilesExactRequest, SearchFilesExactResponse>(
		'/files/search',
		async (req, res) => {
			const parsed = parseOr400(z.object({ query: z.object({ name: nameSchema }) }), req, res);

			if (!parsed) {
				return;
			}

			const { name } = parsed.query;

			const files = await fileService.searchByExactNameGlobal(name);

			res.json({ files });
		},
	);

	interface SearchFilesPrefixRequest {
		query: {
			q: string;
			root?: string;
		};
	}

	interface SearchFilesPrefixResponse {
		files: FileSearchResult[];
		totalCount: number;
	}

	router.get<SearchFilesPrefixRequest, SearchFilesPrefixResponse>(
		'/files/search/prefix',
		async (req, res) => {
			const parsed = parseOr400(
				z.object({
					query: z.object({
						q: prefixQuerySchema,
						root: z.literal('true').optional(),
					}),
				}),
				req,
				res,
			);

			if (!parsed) {
				return;
			}

			const { q, root } = parsed.query;

			const searchResult = root === 'true'
				? await fileService.searchByPrefixInFolder(null, q)
				: await fileService.searchByPrefix(q);

			res.json(searchResult);
		},
	);
};
