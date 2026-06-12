import type { SceneManifest } from '../types';

interface Props {
  scenes: SceneManifest[];
  onSelect: (scene: SceneManifest) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function SceneList({ scenes, onSelect, onCreate, onDelete }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Мои сцены</h1>
        <button onClick={onCreate} style={primaryBtn}>
          + Новая сцена
        </button>
      </div>

      {scenes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>Сцен пока нет</p>
          <p style={{ fontSize: 14 }}>Создайте первую AR-сцену</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {scenes.map((scene) => (
            <div
              key={scene.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#141414',
                borderRadius: 10,
                border: '1px solid #222',
                cursor: 'pointer',
              }}
              onClick={() => onSelect(scene)}
            >
              <div>
                <div style={{ fontWeight: 500, color: '#fff' }}>{scene.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {scene.nodes.length} объектов · {scene.scene.tracking}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(scene.id); }}
                style={{ ...btnStyle, color: '#ff4444' }}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: 10,
  background: '#4488ff',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

const btnStyle: React.CSSProperties = {
  padding: '4px 12px',
  border: '1px solid #444',
  borderRadius: 6,
  background: 'transparent',
  color: '#e0e0e0',
  cursor: 'pointer',
  fontSize: 12,
};
