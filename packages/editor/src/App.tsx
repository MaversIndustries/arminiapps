import { useState } from 'react';
import type { SceneManifest, SceneNode } from '@arminiapps/shared';
import SceneList from './components/SceneList';
import SceneEditor from './components/SceneEditor';

export default function App() {
  const [scenes, setScenes] = useState<SceneManifest[]>([]);
  const [activeScene, setActiveScene] = useState<SceneManifest | null>(null);
  const [view, setView] = useState<'list' | 'editor'>('list');

  function handleCreate() {
    const newScene: SceneManifest = {
      id: crypto.randomUUID(),
      version: '1.0',
      name: 'Новая сцена',
      scene: { tracking: 'plane' },
      nodes: [],
    };
    setScenes((prev) => [...prev, newScene]);
    setActiveScene(newScene);
    setView('editor');
  }

  function handleSelect(scene: SceneManifest) {
    setActiveScene(scene);
    setView('editor');
  }

  function handleSave(scene: SceneManifest) {
    setScenes((prev) => prev.map((s) => (s.id === scene.id ? scene : s)));
    setActiveScene(scene);
  }

  function handleDelete(id: string) {
    setScenes((prev) => prev.filter((s) => s.id !== id));
    if (activeScene?.id === id) {
      setActiveScene(null);
      setView('list');
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
        {view === 'list' ? (
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
