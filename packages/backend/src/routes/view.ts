import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';

export function registerViewRoutes(app: FastifyInstance) {
  // Get scene manifest by slug (for AR viewer)
  app.get<{ Params: { slug: string } }>('/api/scenes/slug/:slug', async (req, reply) => {
    const db = getDb();
    const row = db.prepare('SELECT manifest FROM scenes WHERE slug = ?').get(req.params.slug) as { manifest: string } | undefined;
    if (!row) return reply.status(404).send({ error: 'Scene not found' });
    return JSON.parse(row.manifest);
  });

  // Redirect short URL to viewer
  app.get<{ Params: { slug: string } }>('/s/:slug', async (req, reply) => {
    const db = getDb();
    const row = db.prepare('SELECT id, slug FROM scenes WHERE slug = ?').get(req.params.slug) as { id: string } | undefined;
    if (!row) return reply.status(404).send({ error: 'Scene not found' });
    return reply.redirect(302, `/view/?scene=${row.id}`);
  });
}
