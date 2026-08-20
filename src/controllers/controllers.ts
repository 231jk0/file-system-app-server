import express from 'express';

import { createEnhancedRouter } from '@/router/EnhancedRouter';

import { browse } from './browse/browse';
import { files } from './files/files';
import { folders } from './folders/folders';

const router = createEnhancedRouter();

router.use(express.json({ limit: '32kb' }));

const v1 = createEnhancedRouter();

browse(v1);
folders(v1);
files(v1);

router.use('/api/v1', v1.asRouter());

export default router.asRouter();
