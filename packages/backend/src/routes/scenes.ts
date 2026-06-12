import type { FastifyInstance } from 'fastify';
import { getDb, type SceneRow } from '../db.js';
import type { SceneManifest } from '@arminiapps/shared';

export function registerSceneRoutes(app: FastifyInstance) {
  // List all scenes
  app.get('/api/scenes', async () => {
    const db = getDb();
    const rows = db.prepare('SELECT id, name, slug, created_at, updated_at FROM scenes ORDER BY updated_at DESC').all() as SceneRow[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  });

  // Get single scene
  app.get<{ Params: { id: string } }>('/api/scenes/:id', async (req, reply) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id) as SceneRow | undefined;
    if (!row) return reply.status(404).send({ error: 'Scene not found' });
    return {
      ...row,
      manifest: JSON.parse(row.manifest),
    };
  });

  // Create scene
  app.post<{ Body: SceneManifest }>('/api/scenes', async (req, reply) => {
    const db = getDb();
    const scene = req.body;
    const slug = scene.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    db.prepare('INSERT INTO scenes (id, name, manifest, slug) VALUES (?, ?, ?, ?)').run(
      scene.id,
      scene.name,
      JSON.stringify(scene),
      slug
    );
    return reply.status(201).send({ id: scene.id, slug });
  });

  // Update scene
  app.put<{ Params: { id: string }; Body: SceneManifest }>('/api/scenes/:id', async (req, reply) => {
    const db = getDb();
    const scene = req.body;
    const result = db.prepare('UPDATE scenes SET name = ?, manifest = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
      scene.name,
      JSON.stringify(scene),
      req.params.id
    );
    if (result.changes === 0) return reply.status(404).send({ error: 'Scene not found' });
    return { ok: true };
  });

  // Delete scene
  app.delete<{ Params: { id: string } }>('/api/scenes/:id', async (req, reply) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM scenes WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return reply.status(404).send({ error: 'Scene not found' });
    return { ok: true };
  });
}
