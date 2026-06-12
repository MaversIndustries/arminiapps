import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { SceneManifest, SceneNode } from './types';

export function buildScene(manifest: SceneManifest): THREE.Group {
  const root = new THREE.Group();
  root.name = manifest.id;

  for (const node of manifest.nodes) {
    const obj = buildNode(node);
    if (obj) root.add(obj);
  }

  return root;
}

function buildNode(node: SceneNode): THREE.Object3D | null {
  let obj: THREE.Object3D | null = null;

  switch (node.type) {
    case 'model':
      obj = createModelPlaceholder(node);
      break;
    case 'shape':
      obj = createShape(node);
      break;
    case 'text':
      obj = createTextPlaceholder(node);
      break;
    default:
      obj = new THREE.Group();
  }

  if (!obj) return null;

  obj.position.set(...node.position);
  obj.rotation.set(...node.rotation);
  obj.scale.set(...node.scale);
  obj.visible = node.visible;
  obj.name = node.id;

  return obj;
}

function createModelPlaceholder(node: SceneNode): THREE.Object3D {
  // For MVP: placeholder box with grid helper
  // In production: GLTFLoader loads from node.src
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshStandardMaterial({
      color: node.materials?.color ?? '#4488ff',
      metalness: node.materials?.metalness ?? 0.3,
      roughness: node.materials?.roughness ?? 0.7,
      transparent: (node.materials?.opacity ?? 1) < 1,
      opacity: node.materials?.opacity ?? 1,
    })
  );

  const group = new THREE.Group();
  group.add(box);

  // Grid helper for alignment
  const grid = new THREE.GridHelper(0.3, 6, 0x888888, 0x444444);
  grid.position.y = -0.05;
  group.add(grid);

  // Try loading real model if src provided
  if (node.src) {
    const loader = new GLTFLoader();
    loader.load(node.src, (gltf) => {
      group.remove(box);
      group.remove(grid);
      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      group.add(model);
    }, undefined, () => {
      // Keep placeholder on error
    });
  }

  return group;
}

function createShape(node: SceneNode): THREE.Mesh {
  // Use src as shape type: 'box' | 'sphere' | 'cylinder' | 'plane'
  const shapeType = node.src ?? 'box';
  const mat = new THREE.MeshStandardMaterial({
    color: node.materials?.color ?? '#ffffff',
    metalness: node.materials?.metalness ?? 0,
    roughness: node.materials?.roughness ?? 0.5,
    transparent: (node.materials?.opacity ?? 1) < 1,
    opacity: node.materials?.opacity ?? 1,
  });

  switch (shapeType) {
    case 'sphere':
      return new THREE.Mesh(new THREE.SphereGeometry(0.05, 32, 32), mat);
    case 'cylinder':
      return new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 32), mat);
    case 'plane':
      return new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), mat);
    default:
      return new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
  }
}

function createTextPlaceholder(node: SceneNode): THREE.Object3D {
  // For MVP: simple text using canvas texture
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = node.materials?.color ?? '#ffffff';
  ctx.font = '32px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(node.label ?? 'Text', 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.2, 0.05, 1);
  return sprite;
}
