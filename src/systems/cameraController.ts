import { Vector3, Raycaster, Object3D, PerspectiveCamera, Euler } from 'three';
import { useGameStore } from '../stores/gameStore';
import { CAMERA } from '../utils/constants';
import { lerp } from '../utils/math';

const raycaster = new Raycaster();
const tempEuler = new Euler(0, 0, 0, 'YXZ');

/**
 * 相机控制器
 *
 * FPS 模式核心设计（参考 Valorant / CSGO）：
 * 1. 鼠标增量 → yaw/pitch 直接映射，无平滑、无加速、无插值
 * 2. 相机位置直接设为玩家眼部，不做 lerp 跟随
 * 3. 鼠标增量在消费后立即清零，避免下一帧重复使用
 * 4. 仅保留极轻微的呼吸/晃动效果，不干扰瞄准
 *
 * TPS 模式保留平滑插值与碰撞规避。
 */
export class CameraController {
  private store = useGameStore;
  private currentPos = new Vector3();
  private currentLookAt = new Vector3();
  private collisionObjects: Object3D[] = [];
  private effectTime = 0;
  private shakeSeed = Math.random() * 100;

  constructor() {
    const state = this.store.getState();
    this.currentPos.copy(state.camera.targetPosition);
    this.currentLookAt.copy(state.player.position);
  }

  registerCollisionObjects(objects: Object3D[]): void {
    this.collisionObjects = objects;
  }

  /**
   * 每帧更新相机
   */
  update(camera: PerspectiveCamera, delta: number): void {
    const state = this.store.getState();
    if (state.isPaused) return;

    const camState = state.camera;
    const playerPos = state.player.position.clone();
    const eyeHeight = new Vector3(0, 1.6, 0);
    const eyePos = playerPos.add(eyeHeight);

    // ── 1. 读取鼠标增量并立即清零 ──────────────────────────
    // 关键：在消费 mouseDelta 后立即清零，确保一帧的移动不会被下一帧重复使用
    const rawDeltaX = state.input.mouseDeltaX;
    const rawDeltaY = state.input.mouseDeltaY;
    state.setInput({ mouseDeltaX: 0, mouseDeltaY: 0 });

    const sens = state.settings.mouseSensitivity;
    const sensScale = CAMERA.ROTATION_SENSITIVITY * sens;

    // 鼠标水平方向：鼠标右移 -> yaw 减小 -> 视角右转（匹配用户实际设备反馈）
    let yaw = camState.yaw - rawDeltaX * sensScale;
    let pitch = camState.pitch - rawDeltaY * sensScale;

    // ── 2. 视角限制 ──────────────────────────────────────
    // FPS 模式：水平转向不再限制，支持 360° 自由旋转；仅保留俯仰角限制防止翻跟头
    pitch = Math.max(CAMERA.PITCH_MIN, Math.min(CAMERA.PITCH_MAX, pitch));

    // ── 3. 开火后坐力 ────────────────────────────────────
    // 后坐力由 WeaponSystem/RecoilSystem 统一处理并写入 camera yaw/pitch，
    // 这里不再额外叠加，避免重复上扬。

    state.setCamera({ yaw, pitch });

    // ── 4. 计算相机位置 ──────────────────────────────────
    if (camState.mode === 'fps') {
      // FPS：相机直接放在眼部，1:1 跟随，无 lerp
      this.currentPos.copy(eyePos);
      this.currentLookAt.copy(eyePos);
    } else {
      // TPS：保留平滑插值与碰撞规避
      let distance = camState.distance;
      const sinPitch = Math.sin(pitch);
      const cosPitch = Math.cos(pitch);
      const sinYaw = Math.sin(yaw);
      const cosYaw = Math.cos(yaw);

      // TPS 下相机绕角色旋转方向需与 FPS 一致：yaw 增加 -> 视角右转
      const idealOffset = new Vector3(
        sinYaw * cosPitch * distance,
        sinPitch * distance + 1.0,
        -cosYaw * cosPitch * distance
      );
      const idealPos = eyePos.clone().add(idealOffset);

      // 碰撞规避
      raycaster.set(eyePos, idealOffset.clone().normalize());
      raycaster.far = distance;
      const hits = raycaster.intersectObjects(this.collisionObjects, false);
      if (hits.length > 0) {
        const hitDistance = Math.max(CAMERA.MIN_DISTANCE, hits[0].distance - 0.3);
        if (hitDistance < distance) {
          distance = hitDistance;
          idealOffset.set(
            sinYaw * cosPitch * distance,
            sinPitch * distance + 1.0,
            -cosYaw * cosPitch * distance
          );
          idealPos.copy(eyePos).add(idealOffset);
        }
      }

      const smoothFactor = Math.min(1, CAMERA.SMOOTH_FACTOR * 15 * delta);
      this.currentPos.lerp(idealPos, smoothFactor);
      this.currentLookAt.lerp(eyePos, smoothFactor);
    }

    // ── 5. 呼吸与移动晃动（FPS 下极轻微）──────────────────
    this.effectTime += delta;
    const movementState = state.player.movementState;
    let breathY = 0;
    let shakeX = 0;
    let shakeY = 0;

    if (camState.mode === 'fps') {
      // FPS 模式下晃动幅度极小，避免干扰瞄准（Valorant 风格：干净稳定）
      if (movementState === 'idle') {
        breathY = Math.sin(this.effectTime * CAMERA.BREATH_FREQUENCY * Math.PI * 2) * CAMERA.BREATH_AMPLITUDE * 0.3;
      } else {
        const isRunning = movementState === 'run';
        const amp = isRunning ? CAMERA.RUN_SHAKE_AMPLITUDE * 0.25 : CAMERA.WALK_SHAKE_AMPLITUDE * 0.3;
        const freq = isRunning ? CAMERA.RUN_SHAKE_FREQUENCY : CAMERA.WALK_SHAKE_FREQUENCY;
        const t = this.effectTime * freq + this.shakeSeed;
        shakeX = Math.sin(t) * amp * 0.2;
        shakeY = Math.abs(Math.sin(t)) * amp * 0.35;
      }
    } else {
      if (movementState === 'idle') {
        breathY = Math.sin(this.effectTime * CAMERA.BREATH_FREQUENCY * Math.PI * 2) * CAMERA.BREATH_AMPLITUDE;
      } else {
        const isRunning = movementState === 'run';
        const amp = isRunning ? CAMERA.RUN_SHAKE_AMPLITUDE : CAMERA.WALK_SHAKE_AMPLITUDE;
        const freq = isRunning ? CAMERA.RUN_SHAKE_FREQUENCY : CAMERA.WALK_SHAKE_FREQUENCY;
        const t = this.effectTime * freq + this.shakeSeed;
        shakeX = Math.sin(t) * amp * 0.35;
        shakeY = Math.abs(Math.sin(t)) * amp * 0.7;
      }
    }

    // ── 6. 应用相机变换 ──────────────────────────────────
    // FPS 模式：直接用 yaw/pitch 设置相机旋转，确保 1:1 跟手
    if (camState.mode === 'fps') {
      camera.position.set(
        this.currentPos.x + shakeX,
        this.currentPos.y + breathY + shakeY,
        this.currentPos.z
      );
      // 使用欧拉角直接设置相机朝向。
      // Three.js 相机默认 local -Z 朝前，因此 yaw 需要 +π，
      // 使得 yaw=0 时相机朝向 world +Z（与角色移动方向一致）。
      tempEuler.set(pitch, yaw + Math.PI, 0, 'YXZ');
      camera.quaternion.setFromEuler(tempEuler);
    } else {
      camera.position.copy(this.currentPos);
      camera.lookAt(this.currentLookAt);
    }

    // ── 7. FOV ──────────────────────────────────────────
    // Valorant 风格：FOV 切换干脆，避免渐变带来的眩晕感
    const targetFov = camState.mode === 'fps' ? CAMERA.FOV_FPS : CAMERA.FOV_TPS;
    camera.fov = lerp(camera.fov, targetFov, Math.min(1, 24 * delta));
    camera.updateProjectionMatrix();
  }

  toggleMode(): void {
    const state = this.store.getState();
    const nextMode = state.camera.mode === 'tps' ? 'fps' : 'tps';
    state.setCamera({
      mode: nextMode,
      distance: nextMode === 'tps' ? CAMERA.DEFAULT_DISTANCE : CAMERA.MIN_DISTANCE,
    });
  }
}
