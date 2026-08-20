import type { EnhancedRouter } from '@/router/EnhancedRouter';

import { get } from './get';

export const search = (router: EnhancedRouter) => {
	get(router);
};
