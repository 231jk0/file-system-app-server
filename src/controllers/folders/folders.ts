import type { EnhancedRouter } from '@/router/EnhancedRouter';

import { parameterFolderId } from './[folderId]/[folderId]';
import { post } from './post';

export const folders = (router: EnhancedRouter) => {
	post(router);
	parameterFolderId(router);
};
