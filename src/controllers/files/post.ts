import { z } from 'zod';

import { File } from '@/repositories/fileRepository';
import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as fileService from '@/services/fileService';
import { nameSchema, parseOr400 } from '@/utils/validation';

export const post = (router: EnhancedRouter) => {
	interface CreateFileRequest {
		body: {
			name: string;
			folderId?: string;
		};
	}

	interface CreateFileResponse {
		file: File;
	}

	router.post<CreateFileRequest, CreateFileResponse>('/files', async (req, res) => {
		const parsed = parseOr400(
			z.object({
				body: z.object({
					name: nameSchema,
					folderId: z.uuid('Folder ID must be a valid UUID').nullable().optional(),
				}),
			}),
			req,
			res,
		);

		if (!parsed) {
			return;
		}

		const { name, folderId } = parsed.body;

		const file = await fileService.createFile({
			name,
			folderId,
		});

		res.status(201).json({ file });
	});
};
