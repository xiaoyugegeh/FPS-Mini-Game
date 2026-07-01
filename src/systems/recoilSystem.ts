import { Vector2 } from 'three';
import { useGameStore } from '../stores/gameStore';
import { CAMERA } from '../utils/constants';

/**
 * Valorant 风格后坐力系统
 *
 * 设计要点：
 * - 首发精准，无偏移
 * - 连射时按固定 pattern 上扬并左右横移
 * - 停火后根据时间恢复（recoil decay）
 * - 移动、跳跃会引入额外 inaccuracy
 */
export class RecoilSystem {
  private store = useGameStore;
  private currentRecoil = new Vector2();
  private shotsInBurst = 0;
  private lastFireTime = 0;

  /**
   * Vandal 风格固定后坐力 pattern（相对屏幕中心偏移，单位：弧度）
   * index 0 = 第 2 发，index 1 = 第 3 发，以此类推
   */
  private readonly sprayPattern: Vector2[] = [
    new Vector2(0, 0.006),
    new Vector2(0, 0.010),
    new Vector2(0.001, 0.014),
    new Vector2(-0.002, 0.018),
    new Vector2(0.003, 0.021),
    new Vector2(-0.004, 0.023),
    new Vector2(0.005, 0.024),
    new Vector2(-0.006, 0.024),
    new Vector2(0.007, 0.023),
    new Vector2(-0.008, 0.021),
    new Vector2(0.008, 0.019),
    new Vector2(-0.007, 0.017),
    new Vector2(0.006, 0.015),
    new Vector2(-0.005, 0.013),
    new Vector2(0.004, 0.011),
    new Vector2(-0.003, 0.009),
    new Vector2(0.002, 0.007),
    new Vector2(-0.001, 0.005),
    new Vector2(0, 0.003),
    new Vector2(0, 0.002),
  ];

  /**
   * 每次开火调用，返回当前这一发的后坐力偏移（pitch/yaw）
   */
  fire(): Vector2 {
    const state = this.store.getState();
    const now = performance.now();
    const timeSinceLast = now - this.lastFireTime;

    // 如果停火时间超过一定阈值，重置连射计数
    if (timeSinceLast > 220) {
      this.shotsInBurst = 0;
      this.currentRecoil.set(0, 0);
    }

    this.shotsInBurst++;
    this.lastFireTime = now;

    // 首发精准
    if (this.shotsInBurst === 1) {
      return new Vector2(0, 0).add(this.getMovementInaccuracy());
    }

    const patternIndex = Math.min(this.shotsInBurst - 2, this.sprayPattern.length - 1);
    const pattern = this.sprayPattern[patternIndex];

    // 累加后坐力，加入随机散布
    this.currentRecoil.x += pattern.x * (0.85 + Math.random() * 0.3);
    this.currentRecoil.y += pattern.y * (0.9 + Math.random() * 0.2);

    // 限制最大后坐力
    this.currentRecoil.x = Math.max(-0.06, Math.min(0.06, this.currentRecoil.x));
    this.currentRecoil.y = Math.max(0, Math.min(0.06, this.currentRecoil.y));

    const result = this.currentRecoil.clone().add(this.getMovementInaccuracy());
    return result;
  }

  /**
   * 获取移动/跳跃带来的额外 inaccuracy
   */
  private getMovementInaccuracy(): Vector2 {
    const state = this.store.getState();
    const player = state.player;
    let inaccuracy = 0;

    if (!player.isGrounded) {
      inaccuracy += 0.025;
    } else if (player.movementState === 'run') {
      inaccuracy += 0.012;
    } else if (player.movementState === 'walk') {
      inaccuracy += 0.005;
    }

    // 蹲伏/静止时更精准（如果未来加入蹲伏）
    if (player.movementState === 'idle') {
      inaccuracy *= 0.2;
    }

    return new Vector2(
      (Math.random() - 0.5) * inaccuracy,
      (Math.random() - 0.5) * inaccuracy
    );
  }

  /**
   * 每帧调用，实现后坐力恢复
   */
  update(delta: number): void {
    const state = this.store.getState();
    if (state.player.isReloading) {
      this.shotsInBurst = 0;
    }

    const now = performance.now();
    const timeSinceFire = now - this.lastFireTime;

    // 停火后按指数衰减恢复
    if (timeSinceFire > 80 && this.currentRecoil.lengthSq() > 0.000001) {
      const decay = Math.min(1, CAMERA.RECOIL_RECOVERY * delta * 0.5);
      this.currentRecoil.lerp(new Vector2(), decay);
    }
  }

  /**
   * 获取当前累计后坐力（用于 viewmodel 动画等）
   */
  getCurrentRecoil(): Vector2 {
    return this.currentRecoil.clone();
  }

  reset(): void {
    this.currentRecoil.set(0, 0);
    this.shotsInBurst = 0;
    this.lastFireTime = 0;
  }
}
