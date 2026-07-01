import { Vector3 } from 'three';
import { useGameStore } from '../stores/gameStore';
import { TargetInstance } from '../types';
import { WEAPON } from '../utils/constants';

/**
 * AI 目标系统
 * 管理训练靶的生成、移动、受击与销毁
 */
export class TargetSystem {
  private store = useGameStore;
  private meshUuids = new Map<string, string>();

  /**
   * 生成初始目标
   */
  spawnInitialTargets(): void {
    this.clearTargets();

    // 阶段 2 视角训练目标（蓝色固定靶）
    this.addTarget({
      id: 'target-aim-1',
      type: 'static',
      position: new Vector3(0, 1.5, 2),
      health: 9999,
      maxHealth: 9999,
      isAlive: true,
    });

    // 阶段 3 射击训练目标（红色固定靶）
    for (let i = 0; i < 3; i++) {
      this.addTarget({
        id: `target-shoot-${i}`,
        type: 'static',
        position: new Vector3(-4 + i * 4, 1.5, 12),
        health: WEAPON.DAMAGE,
        maxHealth: WEAPON.DAMAGE,
        isAlive: true,
      });
    }

    // 阶段 6 移动靶
    this.addTarget({
      id: 'target-moving-1',
      type: 'moving',
      position: new Vector3(-8, 1.5, 25),
      health: WEAPON.DAMAGE * 2,
      maxHealth: WEAPON.DAMAGE * 2,
      path: [new Vector3(-8, 1.5, 25), new Vector3(8, 1.5, 25)],
      pathIndex: 0,
      speed: 3,
      isAlive: true,
    });

    // 阶段 7 综合考核目标
    for (let i = 0; i < 5; i++) {
      this.addTarget({
        id: `target-exam-${i}`,
        type: i % 2 === 0 ? 'static' : 'moving',
        position: new Vector3(-10 + i * 5, 1.5, 38),
        health: WEAPON.DAMAGE,
        maxHealth: WEAPON.DAMAGE,
        path: i % 2 === 0 ? undefined : [new Vector3(-10 + i * 5, 1.5, 38), new Vector3(-10 + i * 5, 1.5, 42)],
        pathIndex: 0,
        speed: 2 + Math.random() * 2,
        isAlive: true,
      });
    }
  }

  /**
   * 添加单个目标
   */
  addTarget(target: TargetInstance): void {
    this.store.getState().addTarget(target);
  }

  /**
   * 注册目标 mesh 的 UUID
   */
  registerMesh(targetId: string, meshUuid: string): void {
    this.meshUuids.set(meshUuid, targetId);
  }

  /**
   * 清除所有目标
   */
  clearTargets(): void {
    this.store.setState({ targets: [] });
    this.meshUuids.clear();
  }

  /**
   * 检查是否命中目标
   */
  checkHit(meshUuid: string): boolean {
    const targetId = this.meshUuids.get(meshUuid);
    if (!targetId) return false;

    const state = this.store.getState();
    const target = state.targets.find((t) => t.id === targetId);
    if (!target || !target.isAlive) return false;

    const newHealth = target.health - WEAPON.DAMAGE;
    if (newHealth <= 0) {
      state.updateTarget(targetId, { health: 0, isAlive: false, lastHitTime: performance.now() });
      state.incrementTargetsDestroyed();
    } else {
      state.updateTarget(targetId, { health: newHealth, lastHitTime: performance.now() });
    }
    return true;
  }

  /**
   * 每帧更新移动靶
   */
  update(delta: number): void {
    const state = this.store.getState();
    const now = performance.now();

    for (const target of state.targets) {
      if (!target.isAlive || target.type !== 'moving' || !target.path?.length) continue;

      // 受击停顿
      if (target.pauseEndTime && now < target.pauseEndTime) continue;
      target.pauseEndTime = undefined;

      const currentIndex = target.pathIndex ?? 0;
      const nextIndex = (currentIndex + 1) % target.path.length;
      const current = target.path[currentIndex];
      const next = target.path[nextIndex];
      const speed = target.speed ?? 2;

      const dir = next.clone().sub(current).normalize();
      const step = dir.multiplyScalar(speed * delta);
      const newPos = target.position.clone().add(step);

      if (newPos.distanceTo(next) < 0.2) {
        target.position.copy(next);
        target.pathIndex = nextIndex;
      } else {
        target.position.copy(newPos);
      }
    }
  }

  /**
   * 获取当前存活目标数
   */
  getAliveCount(): number {
    return this.store.getState().targets.filter((t) => t.isAlive).length;
  }

  /**
   * 按阶段激活/隐藏目标（简化实现：全部生成，由阶段逻辑决定任务目标）
   */
  activateTargetsForStage(): void {
    // 可在此根据阶段动态显示/隐藏目标
  }
}
