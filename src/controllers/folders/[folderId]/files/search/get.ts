import { z } from 'zod';

import { File, FileSearchResult } from '@/repositories/fileRepository';
import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as fileService from '@/services/fileService';
import { nameSchema, parseOr400, prefixQuerySchema, uuidSchema } from '@/utils/validation';

export const get = (router: EnhancedRouter) => {
	interface SearchFilesInFolderRequest {
		params: {
			folderId: string;
		};
		query: {
			name: string;
		};
	}

	interface SearchFilesInFolderResponse {
		files: File[];
	}

	router.get<SearchFilesInFolderRequest, SearchFilesInFolderResponse>(
		'/folders/:folderId/files/search',
		async (req, res) => {
			const parsed = parseOr400(
				z.object({
					params: z.object({ folderId: uuidSchema }),
					query: z.object({ name: nameSchema }),
				}),
				req,
				res,
			);

			if (!parsed) {
				return;
			}

			const { folderId } = parsed.params;
			const { name } = parsed.query;

			const files = await fileService.searchByExactNameInFolder(folderId, name);

			res.json({ files });
		},
	);

	interface SearchFilesPrefixInFolderRequest {
		params: {
			folderId: string;
		};
		query: {
			q: string;
		};
	}

	interface SearchFilesPrefixInFolderResponse {
		files: FileSearchResult[];
		totalCount: number;
	}

	router.get<SearchFilesPrefixInFolderRequest, SearchFilesPrefixInFolderResponse>(
		'/folders/:folderId/files/search/prefix',
		async (req, res) => {
			const parsed = parseOr400(
				z.object({
					params: z.object({ folderId: uuidSchema }),
					query: z.object({ q: prefixQuerySchema }),
				}),
				req,
				res,
			);

			if (!parsed) {
				return;
			}

			const { folderId } = parsed.params;
			const { q } = parsed.query;

			const searchResult = await fileService.searchByPrefixInFolder(folderId, q);

			res.json(searchResult);
		},
	);
};
