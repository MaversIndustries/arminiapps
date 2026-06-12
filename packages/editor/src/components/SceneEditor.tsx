import { useState } from 'react';
import type { SceneManifest, SceneNode, TrackingMode, NodeType } from '@arminiapps/shared';

interface Props {
  scene: SceneManifest;
  onSave: (scene: SceneManifest) => void;
  onDelete: (id: string) => void;
}

export default function SceneEditor({ scene, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<SceneManifest>(() => ({
    ...scene,
    nodes: scene.nodes.map((n) => ({ ...n })),
  }));

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  function updateField<K extends keyof SceneManifest>(key: K, value: SceneManifest[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function addNode() {
    const newNode: SceneNode = {
      id: crypto.randomUUID(),
      type: 'model',
      src: '',
      position: [0, 0, -0.5],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
      label: `Object ${draft.nodes.length + 1}`,
    };
    setDraft((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setSelectedNode(newNode.id);
  }

  function removeNode(id: string) {
    setDraft((prev) => ({ ...prev, nodes: prev.nodes.filter((n) => n.id !== id) }));
    if (selectedNode === id) setSelectedNode(null);
  }

  function updateNode(id: string, patch: Partial<SceneNode>) {
    setDraft((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  }

  const current = draft.nodes.find((n) => n.id === selectedNode);

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 70px)' }}>
      {/* Sidebar — node list */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={draft.name}
            onChange={(e) => updateField('name', e.target.value)}
            style={inputStyle}
            placeholder="Название сцены"
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={draft.scene.tracking}
            onChange={(e) => setDraft((prev) => ({ ...prev, scene: { ...prev.scene, tracking: e.target.value as TrackingMode } }))}
            style={selectStyle}
          >
            <option value="plane">Plane Tracking</option>
            <option value="image">Image Tracking</option>
            <option value="world">World Tracking</option>
            <option value="face">Face Tracking</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: 12 }}>
          <button onClick={addNode} style={addBtn}>+ Добавить объект</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {draft.nodes.map((node) => (
            <div
              key={node.id}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: selectedNode === node.id ? '#1e2a3a' : '#141414',
                border: `1px solid ${selectedNode === node.id ? '#4488ff' : '#222'}`,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onClick={() => setSelectedNode(node.id)}
            >
              <div>
                <div style={{ fontSize: 13, color: '#fff' }}>{node.label || node.type}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{node.type}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 16 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #222', paddingTop: 12 }}>
          <button onClick={() => onSave(draft)} style={saveBtn}>Сохранить</button>
          <button onClick={() => onDelete(draft.id)} style={delBtn}>Удалить сцену</button>
        </div>
      </div>

      {/* Properties panel */}
      <div style={{ flex: 1, padding: '0 20px' }}>
        {current ? (
          <div>
            <h3 style={{ marginBottom: 16 }}>Свойства: {current.label}</h3>
            <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
              <label style={labelStyle}>
                Тип
                <select value={current.type} onChange={(e) => updateNode(current.id, { type: e.target.value as NodeType })} style={selectStyle}>
                  <option value="model">3D Модель</option>
                  <option value="shape">Фигура</option>
                  <option value="text">Текст</option>
                  <option value="image">Изображение</option>
                  <option value="video">Видео</option>
                </select>
              </label>

              <label style={labelStyle}>
                Источник (URL)
                <input value={current.src ?? ''} onChange={(e) => updateNode(current.id, { src: e.target.value })} style={inputStyle} placeholder="https://..." />
              </label>

              <label style={labelStyle}>
                Название
                <input value={current.label ?? ''} onChange={(e) => updateNode(current.id, { label: e.target.value })} style={inputStyle} />
              </label>

              <fieldset style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
                <legend style={{ fontSize: 12, color: '#888' }}>Позиция</legend>
                {(['position', 'rotation', 'scale'] as const).map((field) => (
                  <div key={field} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <label style={{ ...labelStyle, fontSize: 11 }}>
                      {field}.x
                      <input type="number" step="0.01" value={current[field][0]} onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateNode(current.id, { [field]: [val, current[field][1], current[field][2]] } as any);
                      }} style={inputStyle} />
                    </label>
                    <label style={{ ...labelStyle, fontSize: 11 }}>
                      {field}.y
                      <input type="number" step="0.01" value={current[field][1]} onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateNode(current.id, { [field]: [current[field][0], val, current[field][2]] } as any);
                      }} style={inputStyle} />
                    </label>
                    <label style={{ ...labelStyle, fontSize: 11 }}>
                      {field}.z
                      <input type="number" step="0.01" value={current[field][2]} onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateNode(current.id, { [field]: [current[field][0], current[field][1], val] } as any);
                      }} style={inputStyle} />
                    </label>
                  </div>
                ))}
              </fieldset>

              <label style={labelStyle}>
                Видимый
                <input type="checkbox" checked={current.visible} onChange={(e) => updateNode(current.id, { visible: e.target.checked })} />
              </label>
            </div>
          </div>
        ) : (
          <div style={{ color: '#666', textAlign: 'center', paddingTop: 60 }}>
            Выберите объект для редактирования
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid #333',
  borderRadius: 6,
  background: '#0a0a0a',
  color: '#e0e0e0',
  fontSize: 13,
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid #333',
  borderRadius: 6,
  background: '#0a0a0a',
  color: '#e0e0e0',
  fontSize: 13,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
  color: '#aaa',
};

const addBtn: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  border: '1px dashed #444',
  borderRadius: 8,
  background: 'transparent',
  color: '#4488ff',
  cursor: 'pointer',
  fontSize: 13,
};

const saveBtn: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  border: 'none',
  borderRadius: 8,
  background: '#4488ff',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const delBtn: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  border: '1px solid #ff4444',
  borderRadius: 8,
  background: 'transparent',
  color: '#ff4444',
  cursor: 'pointer',
};
