import { Vector3 } from 'three';
import { useGameStore } from '../stores/gameStore';
import { MaterialType, Particle } from '../types';
import { PARTICLE_COLORS } from '../utils/constants';
import { generateId } from '../utils/math';

/**
 * 视觉效果系统
 * 管理弹痕、粒子与开火闪光
 */
export class EffectsSystem {
  private store = useGameStore;

  /**
   * 生成弹痕与命中粒子
   */
  spawnBulletImpact(point: Vector3, normal: Vector3, materialType: MaterialType): void {
    const state = this.store.getState();
    const now = performance.now();

    // 弹痕
    state.addBulletHole({
      id: generateId(),
      position: point.clone().add(normal.clone().multiplyScalar(0.02)),
      normal: normal.clone(),
      createdAt: now,
      lifetime: 8000,
      materialType,
    });

    // 命中粒子
    const color = PARTICLE_COLORS[materialType];
    const count = state.settings.quality === 'low' ? 4 : state.settings.quality === 'medium' ? 7 : 10;
    for (let i = 0; i < count; i++) {
      const velocity = normal
        .clone()
        .add(new Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5))
        .normalize()
        .multiplyScalar(2 + Math.random() * 3);
      state.addParticle({
        id: generateId(),
        position: point.clone(),
        velocity,
        color,
        size: 0.03 + Math.random() * 0.04,
        createdAt: now,
        lifetime: 250 + Math.random() * 300,
      });
    }
  }

  /**
   * 生成枪口闪光粒子
   */
  spawnMuzzleFlash(position: Vector3): void {
    const state = this.store.getState();
    const now = performance.now();
    const count = state.settings.quality === 'low' ? 3 : 6;
    for (let i = 0; i < count; i++) {
      state.addParticle({
        id: generateId(),
        position: position.clone(),
        velocity: new Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4),
        color: PARTICLE_COLORS.muzzle,
        size: 0.05 + Math.random() * 0.05,
        createdAt: now,
        lifetime: 40 + Math.random() * 40,
      });
    }
  }

  /**
   * 每帧清理过期效果
   */
  update(delta: number): void {
    const state = this.store.getState();
    const now = performance.now();

    // 清理过期弹痕
    const activeHoles = state.bulletHoles.filter((h) => now - h.createdAt < h.lifetime);
    if (activeHoles.length !== state.bulletHoles.length) {
      this.store.setState({ bulletHoles: activeHoles });
    }

    // 更新粒子位置并清理过期粒子
    const activeParticles: Particle[] = [];
    for (const p of state.particles) {
      const age = now - p.createdAt;
      if (age >= p.lifetime) continue;
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= 9.8 * delta;
      activeParticles.push(p);
    }
    if (activeParticles.length !== state.particles.length) {
      this.store.setState({ particles: activeParticles });
    }
  }
}
