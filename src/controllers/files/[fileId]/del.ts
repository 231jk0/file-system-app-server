import { z } from 'zod';

import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as fileService from '@/services/fileService';
import { parseOr400, uuidSchema } from '@/utils/validation';

export const del = (router: EnhancedRouter) => {
	interface DeleteFileRequest {
		params: {
			fileId: string;
		};
	}

	interface DeleteFileResponse {
		message: string;
	}

	router.delete<DeleteFileRequest, DeleteFileResponse>('/files/:fileId', async (req, res) => {
		const parsed = parseOr400(z.object({ params: z.object({ fileId: uuidSchema }) }), req, res);

		if (!parsed) {
			return;
		}

		const { fileId } = parsed.params;

		await fileService.deleteFile(fileId);

		res.json({ message: 'File deleted' });
	});
};
