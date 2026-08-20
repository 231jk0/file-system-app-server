import type { EnhancedRouter } from '@/router/EnhancedRouter';

import { post } from './post';
import { search } from './search/search';

export const files = (router: EnhancedRouter) => {
	post(router);
	search(router);
};
