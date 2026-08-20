import type { EnhancedRouter } from '@/router/EnhancedRouter';

import { del } from './del';
import { get } from './get';

export const parameterFileId = (router: EnhancedRouter) => {
	get(router);
	del(router);
};
