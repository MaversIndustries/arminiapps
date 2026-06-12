import { ARMiniEngine } from './engine';
import { supabase } from './supabase';
import type { SceneManifest } from './types';

const loading = document.getElementById('loading')!;
const errorEl = document.getElementById('error')!;
const btnBack = document.getElementById('btn-back')!;
const btnFs = document.getElementById('btn-fullscreen')!;
const app = document.getElementById('app')!;

async function main() {
  const params = new URLSearchParams(window.location.search);
  const sceneId = params.get('scene');
  const slug = params.get('slug');

  if (!sceneId && !slug) {
    showError('Укажите ?scene=id или ?slug=название');
    return;
  }

  try {
    const manifest = await loadSceneManifest(sceneId, slug);
    const engine = new ARMiniEngine();

    engine.on('error', (err) => showError(String(err)));
    engine.on('ready', () => {
      loading.classList.add('hidden');
    });

    await engine.loadScene(manifest);
    engine.mount(app);

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

async function loadSceneManifest(sceneId: string | null, slug: string | null): Promise<SceneManifest> {
  const query = supabase
    .from('scenes')
    .select('manifest')
    .eq('is_published', true)
    .limit(1)
    .single();

  if (sceneId) query.eq('id', sceneId);
  if (slug) query.eq('slug', slug);

  const { data, error } = await query;
  if (error || !data) throw new Error(error?.message ?? 'Сцена не найдена');

  // Increment view count
  if (sceneId) {
    supabase.rpc('increment_view_count', { scene_id: sceneId }).catch(() => {});
  }

  return data.manifest as SceneManifest;
}

function showError(msg: string) {
  loading.classList.add('hidden');
  errorEl.style.display = 'block';
  errorEl.textContent = msg;
}

main();
