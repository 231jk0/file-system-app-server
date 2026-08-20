import { z } from 'zod';

import { File } from '@/repositories/fileRepository';
import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as fileService from '@/services/fileService';
import { nameSchema, parseOr400, uuidSchema } from '@/utils/validation';

export const post = (router: EnhancedRouter) => {
	interface CreateFileRequest {
		params: {
			folderId: string;
		};
		body: {
			name: string;
		};
	}

	interface CreateFileResponse {
		file: File;
	}

	router.post<CreateFileRequest, CreateFileResponse>(
		'/folders/:folderId/files',
		async (req, res) => {
			const parsed = parseOr400(
				z.object({
					params: z.object({ folderId: uuidSchema }),
					body: z.object({ name: nameSchema }),
				}),
				req,
				res,
			);

			if (!parsed) {
				return;
			}

			const { folderId } = parsed.params;
			const { name } = parsed.body;

			const file = await fileService.createFile({
				name,
				folderId,
			});

			res.status(201).json({ file });
		},
	);
};
