import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { apiRoutes } from './api/routes.js';
import { startScheduler } from './services/scheduler.js';

const app = new Hono();

app.route('/', apiRoutes);

const port = parseInt(process.env.PORT ?? '3100', 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[STACK Price Engine] API running on http://localhost:${info.port}`);
  startScheduler();
});
