import cors from 'cors';
import express from 'express';

import { config } from '@/config/config';
import controllers from '@/controllers/controllers';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';

const app = express();

app.use(cors(config.corsConfig));

app.use('/', controllers);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
