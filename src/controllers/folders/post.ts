import { z } from 'zod';

import { Folder } from '@/repositories/folderRepository';
import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as folderService from '@/services/folderService';
import { nameSchema, parseOr400 } from '@/utils/validation';

export const post = (router: EnhancedRouter) => {
	interface CreateFolderRequest {
		body: {
			name: string;
			parentId?: string;
		};
	}

	interface CreateFolderResponse {
		folder: Folder;
	}

	router.post<CreateFolderRequest, CreateFolderResponse>('/folders', async (req, res) => {
		const parsed = parseOr400(
			z.object({
				body: z.object({
					name: nameSchema,
					parentId: z.uuid('Parent ID must be a valid UUID').nullable().optional(),
				}),
			}),
			req,
			res,
		);

		if (!parsed) {
			return;
		}

		const { name, parentId } = parsed.body;

		const folder = await folderService.createFolder({
			name,
			parentId,
		});

		res.status(201).json({ folder });
	});
};
