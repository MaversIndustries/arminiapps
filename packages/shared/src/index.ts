// Scene types

export type TrackingMode = 'image' | 'plane' | 'face' | 'world';

export type NodeType = 'model' | 'image' | 'video' | 'text' | 'shape' | 'particle';

export type AnimationTrigger = 'start' | 'tap' | 'proximity' | 'look';

export type AnimationType = 'rotate' | 'scale' | 'translate' | 'fade' | 'spring';

export type InteractionEvent = 'tap' | 'drag' | 'proximity_enter' | 'proximity_leave';

export type InteractionAction = 'open_url' | 'play_sound' | 'toggle_visibility' | 'start_animation';

export interface Animation {
  id: string;
  trigger: AnimationTrigger;
  type: AnimationType;
  duration: number;
  delay?: number;
  repeat?: number;
  from?: number | [number, number, number];
  to?: number | [number, number, number];
  loop?: boolean;
}

export interface Interaction {
  event: InteractionEvent;
  action: InteractionAction;
  payload?: string;
}

export interface Material {
  color?: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  map?: string;
  emissive?: string;
  emissiveIntensity?: number;
}

export interface SceneNode {
  id: string;
  type: NodeType;
  src?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
  animations?: Animation[];
  interactions?: Interaction[];
  materials?: Material;
  label?: string;
}

export interface SceneConfig {
  tracking: TrackingMode;
  anchor?: 'center' | 'world' | 'image';
  targetImage?: string;
  lights?: LightConfig[];
}

export interface LightConfig {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color?: string;
  intensity?: number;
  position?: [number, number, number];
}

export interface BackgroundConfig {
  type: 'color' | 'environment';
  value: string;
  opacity?: number;
}

export interface SceneManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  scene: SceneConfig;
  nodes: SceneNode[];
  background?: BackgroundConfig;
  created_at?: string;
  updated_at?: string;
}

// Engine interface

export type EngineCapability = 'plane' | 'image' | 'face' | 'world' | '6dof' | 'high-fidelity';

export interface EngineStatus {
  ready: boolean;
  tracking: boolean;
  fps: number;
  error?: string;
}

export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangleCount: number;
  memoryMB: number;
}

export type EngineEventType = 'ready' | 'tracking_start' | 'tracking_stop' | 'interaction' | 'error';

export interface EngineEvent<T = unknown> {
  type: EngineEventType;
  data: T;
}

export interface PlatformEvent {
  type: 'resume' | 'pause' | 'resize' | 'navigate';
  payload?: unknown;
}

export interface IAREngine {
  id: string;
  capabilities: EngineCapability[];
  loadScene(manifest: SceneManifest): Promise<void>;
  mount(container: HTMLElement): void;
  unmount(): void;
  resize(width: number, height: number): void;
  dispatchEvent(event: PlatformEvent): void;
  on<T>(event: EngineEventType, handler: (data: T) => void): void;
  off<T>(event: EngineEventType, handler: (data: T) => void): void;
  getStatus(): EngineStatus;
  getPerformanceMetrics(): PerformanceMetrics;
}

// API types

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

export interface PublishConfig {
  scene_id: string;
  slug: string;
  domain?: string;
  password?: string;
  expires_at?: string;
  qr_code_url?: string;
}
