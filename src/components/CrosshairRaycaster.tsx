import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector2, Vector3, Object3D } from 'three';
import { useGameStore } from '../stores/gameStore';
import type { CrosshairState } from '../types';

const raycaster = new Raycaster();
const center = new Vector2(0, 0);

/**
 * 准星射线检测器
 * 运行在 Canvas 内部，每帧检测准星指向目标并更新 UI 状态
 */
export function CrosshairRaycaster({ colliders }: { colliders?: Object3D[] }) {
  const { camera, scene } = useThree();
  const lastCheck = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (now - lastCheck.current < 100) return; // 10fps 检测足够
    lastCheck.current = now;

    raycaster.setFromCamera(center, camera);

    // 优先检测怪物
    const monsters = useGameStore.getState().monsters;
    let hitEnemy = false;
    for (const monster of monsters) {
      if (!monster.isAlive) continue;
      const centerPos = monster.position.clone().add(new Vector3(0, 0.9, 0));
      const toCenter = centerPos.clone().sub(raycaster.ray.origin);
      const t = toCenter.dot(raycaster.ray.direction);
      if (t < 0) continue;
      const closest = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(t));
      const radius = monster.type === 'tank' ? 0.7 : 0.35;
      if (closest.distanceTo(centerPos) <= radius) {
        hitEnemy = true;
        break;
      }
    }
    if (hitEnemy) {
      setIfChanged('enemy');
      return;
    }

    // 检测场景实体碰撞体（传入的 curated 列表，避免遍历全部装饰网格）
    const objectsToCheck = colliders && colliders.length > 0 ? colliders : scene.children;
    const hits = raycaster.intersectObjects(objectsToCheck, true);
    if (hits.length > 0) {
      const obj = hits[0].object;
      if (obj.name?.includes('target') || obj.parent?.name?.includes('target')) {
        setIfChanged('target');
        return;
      }
      if (obj.name?.includes('monster')) {
        setIfChanged('enemy');
        return;
      }
      setIfChanged('wall');
      return;
    }

    setIfChanged('idle');
  });

  return null;
}

function setIfChanged(next: CrosshairState) {
  const store = useGameStore.getState();
  if (store.crosshairState !== next) {
    store.setCrosshairState(next);
  }
}
