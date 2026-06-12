import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SceneManifest } from './types';
import SceneList from './components/SceneList';
import SceneEditor from './components/SceneEditor';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? 'https://oltqzvjyqlcnwkmnlufp.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHF6dmp5cWxjbndrbW5sdWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzk4MzQsImV4cCI6MjA5Njg1NTgzNH0.pRS7UB0b2AxhZvaugrc4luzWzpOOjWzcKaoTXDBLz2U'
);

export default function App() {
  const [scenes, setScenes] = useState<SceneManifest[]>([]);
  const [activeScene, setActiveScene] = useState<SceneManifest | null>(null);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenes();
  }, []);

  async function loadScenes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('scenes')
      .select('id, name, manifest, slug, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setScenes(data.map((r: any) => ({ ...r.manifest, id: r.id, name: r.name })));
    }
    setLoading(false);
  }

  async function handleCreate() {
    const newScene: SceneManifest = {
      id: crypto.randomUUID(),
      version: '1.0',
      name: 'Новая сцена',
      scene: { tracking: 'plane' },
      nodes: [],
    };
    const slug = `scene-${Date.now().toString(36)}`;
    const { error } = await supabase.from('scenes').insert({
      id: newScene.id,
      name: newScene.name,
      manifest: newScene,
      slug,
    });
    if (!error) {
      await loadScenes();
      setActiveScene(newScene);
      setView('editor');
    }
  }

  function handleSelect(scene: SceneManifest) {
    setActiveScene(scene);
    setView('editor');
  }

  async function handleSave(scene: SceneManifest) {
    const { error } = await supabase
      .from('scenes')
      .update({ name: scene.name, manifest: scene, updated_at: new Date().toISOString() })
      .eq('id', scene.id);
    if (!error) {
      await loadScenes();
      setActiveScene(scene);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('scenes').delete().eq('id', id);
    if (!error) {
      await loadScenes();
      if (activeScene?.id === id) {
        setActiveScene(null);
        setView('list');
      }
    }
  }

  function handleBack() {
    setView('list');
    setActiveScene(null);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 20px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>AR Mini Apps</span>
        {view === 'editor' && (
          <button onClick={handleBack} style={btnStyle}>← Назад</button>
        )}
      </header>
      <main style={{ flex: 1, padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>Загрузка...</div>
        ) : view === 'list' ? (
          <SceneList scenes={scenes} onSelect={handleSelect} onCreate={handleCreate} onDelete={handleDelete} />
        ) : activeScene ? (
          <SceneEditor scene={activeScene} onSave={handleSave} onDelete={handleDelete} />
        ) : null}
      </main>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  border: '1px solid #444',
  borderRadius: 8,
  background: '#1a1a1a',
  color: '#e0e0e0',
  cursor: 'pointer',
  fontSize: 14,
};
