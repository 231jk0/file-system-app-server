import { z } from 'zod';

import { File } from '@/repositories/fileRepository';
import { Folder } from '@/repositories/folderRepository';
import type { EnhancedRouter } from '@/router/EnhancedRouter';
import * as folderService from '@/services/folderService';
import { parseOr400 } from '@/utils/validation';

export const get = (router: EnhancedRouter) => {
	interface BrowseRequest {
		query: {
			path?: string;
		};
	}

	interface BrowseResponse {
		path: string;
		folder: Folder | null;
		subfolders: Folder[];
		files: File[];
	}

	router.get<BrowseRequest, BrowseResponse>('/browse', async (req, res) => {
		const parsed = parseOr400(
			z.object({ query: z.object({ path: z.string().optional() }) }),
			req,
			res,
		);

		if (!parsed) {
			return;
		}

		const contents = await folderService.getContentsByPath(parsed.query.path);

		res.json(contents);
	});
};
