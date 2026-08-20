import { z } from 'zod';

import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as folderService from '@/services/folderService';
import { parseOr400, uuidSchema } from '@/utils/validation';

export const del = (router: EnhancedRouter) => {
	interface DeleteFolderRequest {
		params: {
			folderId: string;
		};
	}

	interface DeleteFolderResponse {
		message: string;
	}

	router.delete<DeleteFolderRequest, DeleteFolderResponse>(
		'/folders/:folderId',
		async (req, res) => {
			const parsed = parseOr400(z.object({ params: z.object({ folderId: uuidSchema }) }), req, res);

			if (!parsed) {
				return;
			}

			const { folderId } = parsed.params;

			await folderService.deleteFolder(folderId);

			res.json({ message: 'Folder deleted' });
		},
	);
};
