import type { EnhancedRouter } from '@/router/EnhancedRouter';

import { get } from './get';

export const browse = (router: EnhancedRouter) => {
	get(router);
};
