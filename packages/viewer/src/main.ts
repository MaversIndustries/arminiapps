import { ARMiniEngine } from './engine';

const loading = document.getElementById('loading')!;
const errorEl = document.getElementById('error')!;
const btnBack = document.getElementById('btn-back')!;
const btnFs = document.getElementById('btn-fullscreen')!;
const app = document.getElementById('app')!;

async function main() {
  const params = new URLSearchParams(window.location.search);
  const sceneId = params.get('scene');

  if (!sceneId) {
    showError('Не указан ID сцены. Добавьте ?scene=xxx в URL');
    return;
  }

  try {
    const manifest = await loadSceneManifest(sceneId);
    const engine = new ARMiniEngine();

    engine.on('error', (err) => showError(String(err)));
    engine.on('ready', () => {
      loading.classList.add('hidden');
    });

    await engine.loadScene(manifest);
    engine.mount(app);

    // UI controls
    btnBack.addEventListener('click', () => {
      engine.unmount();
      window.history.back();
    });

    btnFs.addEventListener('click', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });

    window.addEventListener('resize', () => {
      engine.resize(window.innerWidth, window.innerHeight);
    });
  } catch (err) {
    showError(`Ошибка загрузки сцены: ${err}`);
  }
}

async function loadSceneManifest(sceneId: string) {
  // For MVP: try loading from JSON file or API
  const res = await fetch(`/api/scenes/${sceneId}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function showError(msg: string) {
  loading.classList.add('hidden');
  errorEl.style.display = 'block';
  errorEl.textContent = msg;
}

main();
