import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDb } from './db.js';
import { registerSceneRoutes } from './routes/scenes.js';
import { registerViewRoutes } from './routes/view.js';

const PORT = parseInt(process.env.PORT ?? '3002', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  initDb();
  registerSceneRoutes(app);
  registerViewRoutes(app);

  app.get('/health', async () => ({ status: 'ok', version: '0.1.0' }));

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
