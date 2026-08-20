import type { EnhancedRouter } from '@/router/EnhancedRouter';

import { del } from './del';
import { files } from './files/files';

export const parameterFolderId = (router: EnhancedRouter) => {
	del(router);
	files(router);
};
