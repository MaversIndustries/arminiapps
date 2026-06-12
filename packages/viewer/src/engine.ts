import * as THREE from 'three';
import type { IAREngine, EngineCapability, EngineStatus, PerformanceMetrics, EngineEvent, EngineEventType, PlatformEvent, SceneManifest } from '@arminiapps/shared';
import { buildScene } from './scene-builder';

export class ARMiniEngine implements IAREngine {
  id = 'three-webxr';
  capabilities: EngineCapability[] = ['plane', 'world'];

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private session: XRSession | null = null;
  private container: HTMLElement | null = null;
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;
  private currentFps: number = 0;
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  private status: EngineStatus = {
    ready: false,
    tracking: false,
    fps: 0,
  };

  private manifest: SceneManifest | null = null;

  on<T>(event: EngineEventType, handler: (data: T) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off<T>(event: EngineEventType, handler: (data: T) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: EngineEventType, data?: unknown) {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  async loadScene(manifest: SceneManifest): Promise<void> {
    this.manifest = manifest;

    // Init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.xr.enabled = true;

    // Init scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);

    // Build scene graph from manifest
    const root = buildScene(manifest);
    this.scene.add(root);

    // Lights
    if (manifest.scene.lights) {
      for (const l of manifest.scene.lights) {
        const light = this.createLight(l);
        if (light) this.scene.add(light);
      }
    } else {
      // Default lighting
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 1);
      dir.position.set(5, 10, 5);
      this.scene.add(dir);
    }
  }

  mount(container: HTMLElement): void {
    this.container = container;
    const renderer = this.renderer!;

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.insertBefore(renderer.domElement, container.firstChild);

    renderer.setSize(window.innerWidth, window.innerHeight);

    this.startARSession();
  }

  private async startARSession() {
    if (!navigator.xr) {
      // Fallback: render as 3D scene (no AR)
      this.status.ready = true;
      this.status.tracking = false;
      this.emit('ready');
      this.startRenderLoop();
      return;
    }

    try {
      this.session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: this.container ? { root: this.container } : undefined,
      });

      this.renderer!.xr.setSession(this.session);
      this.status.ready = true;
      this.status.tracking = true;
      this.emit('ready');

      this.session.addEventListener('end', () => {
        this.status.tracking = false;
        this.emit('tracking_stop');
      });

      this.emit('tracking_start');
      this.startRenderLoop();
    } catch (err) {
      // AR not supported, render as 3D
      this.status.ready = true;
      this.status.tracking = false;
      this.emit('ready');
      this.startRenderLoop();
    }
  }

  private startRenderLoop() {
    const renderer = this.renderer!;
    const scene = this.scene!;
    const camera = this.camera!;

    const loop = (time: number) => {
      this.animFrameId = requestAnimationFrame(loop);

      // FPS counter
      this.frameCount++;
      if (time - this.fpsTime > 1000) {
        this.currentFps = this.frameCount;
        this.frameCount = 0;
        this.fpsTime = time;
        this.status.fps = this.currentFps;
      }

      renderer.render(scene, camera);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  unmount(): void {
    cancelAnimationFrame(this.animFrameId);
    this.session?.end();
    this.session = null;
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.container = null;
    this.status.ready = false;
  }

  resize(width: number, height: number): void {
    this.renderer?.setSize(width, height);
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  dispatchEvent(event: PlatformEvent): void {
    switch (event.type) {
      case 'pause':
        this.session?.end();
        break;
      case 'resume':
        if (this.container) this.startARSession();
        break;
      case 'resize':
        if (event.payload) {
          const { width, height } = event.payload as { width: number; height: number };
          this.resize(width, height);
        }
        break;
    }
  }

  getStatus(): EngineStatus {
    return { ...this.status };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return {
      fps: this.currentFps,
      drawCalls: this.renderer?.info.render.calls ?? 0,
      triangleCount: this.renderer?.info.render.triangles ?? 0,
      memoryMB: 0,
    };
  }

  private createLight(cfg: { type: string; color?: string; intensity?: number; position?: [number, number, number] }) {
    const color = cfg.color ?? '#ffffff';
    const intensity = cfg.intensity ?? 1;
    switch (cfg.type) {
      case 'ambient':
        return new THREE.AmbientLight(color, intensity);
      case 'directional':
        const d = new THREE.DirectionalLight(color, intensity);
        if (cfg.position) d.position.set(...cfg.position);
        return d;
      case 'point':
        const p = new THREE.PointLight(color, intensity);
        if (cfg.position) p.position.set(...cfg.position);
        return p;
      default:
        return null;
    }
  }
}
