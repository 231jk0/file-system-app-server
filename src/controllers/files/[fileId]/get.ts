import { z } from 'zod';

import { File } from '@/repositories/fileRepository';
import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as fileService from '@/services/fileService';
import { parseOr400, uuidSchema } from '@/utils/validation';

export const get = (router: EnhancedRouter) => {
	interface GetFileRequest {
		params: {
			fileId: string;
		};
	}

	interface GetFileResponse {
		file: File;
	}

	router.get<GetFileRequest, GetFileResponse>('/files/:fileId', async (req, res) => {
		const parsed = parseOr400(z.object({ params: z.object({ fileId: uuidSchema }) }), req, res);

		if (!parsed) {
			return;
		}

		const { fileId } = parsed.params;

		const file = await fileService.getFileById(fileId);

		res.json({ file });
	});
};
