import { Vector3, Object3D, Box3, Mesh } from 'three';
import { useGameStore } from '../stores/gameStore';
import { PLAYER, ARENA } from '../utils/constants';
import { resolveCircleBoxCollision, lerp, normalizeAngle } from '../utils/math';
import { AudioManager } from './audioManager';
import { CollisionBox } from '../types';
import { CollisionGrid } from '../utils/spatialGrid';

const tempVec = new Vector3();
const tempCorrection = new Vector3();

/**
 * 角色控制器
 * 处理移动、跳跃、重力与场景碰撞
 */
export class CharacterController {
  private store = useGameStore;
  private audio = AudioManager.getInstance();
  private collisionBoxes: CollisionBox[] = [];
  private grid: CollisionGrid | null = null;
  private characterGroup: Object3D | null = null;
  private yaw = 0;

  /**
   * 注册场景碰撞体
   */
  registerColliders(objects: Object3D[]): void {
    this.collisionBoxes = [];
    objects.forEach((obj) => {
      obj.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) {
          const box = new Box3().setFromObject(mesh);
          // 忽略地面与非常薄的装饰物
          const size = box.getSize(tempVec);
          if (size.y > 0.2 && size.x > 0.2 && size.z > 0.2) {
            this.collisionBoxes.push({ min: box.min.clone(), max: box.max.clone() });
          }
        }
      });
    });
    // 构建空间网格，每帧只检测附近的碰撞盒
    this.grid = new CollisionGrid(this.collisionBoxes, 6);
  }

  /**
   * 绑定角色模型
   */
  bindCharacter(group: Object3D): void {
    this.characterGroup = group;
  }

  /**
   * 每帧更新
   */
  update(delta: number): void {
    const state = this.store.getState();
    if (state.isPaused) return;

    const input = state.input;
    const player = state.player;
    const camera = state.camera;

    // 1. 计算输入方向（基于相机偏航角）
    const forward = new Vector3(Math.sin(camera.yaw), 0, Math.cos(camera.yaw)).normalize();
    const right = new Vector3(Math.cos(camera.yaw), 0, -Math.sin(camera.yaw)).normalize();

    const moveDir = new Vector3();
    if (input.forward) moveDir.add(forward);
    if (input.backward) moveDir.sub(forward);
    // 根据用户设备反馈调整：A 向右，D 向左
    if (input.right) moveDir.sub(right);
    if (input.left) moveDir.add(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    // 2. 根据 Shift 与方向输入决定目标速度与移动状态
    const isInputActive = moveDir.lengthSq() > 0;
    const wantsRun = isInputActive && input.sprint;
    const targetSpeed = isInputActive ? (wantsRun ? PLAYER.RUN_SPEED : PLAYER.WALK_SPEED) : 0;
    const currentHorizontal = new Vector3(player.velocity.x, 0, player.velocity.z);
    const currentSpeed = currentHorizontal.length();

    let nextHorizontal: Vector3;
    if (isInputActive) {
      const targetVelocity = moveDir.multiplyScalar(targetSpeed);
      nextHorizontal = currentHorizontal.lerp(targetVelocity, Math.min(1, PLAYER.ACCELERATION * delta));
    } else {
      nextHorizontal = currentHorizontal.lerp(new Vector3(), Math.min(1, PLAYER.DECELERATION * delta));
    }

    // 3. 计算移动状态（带滞后，避免速度抖动导致状态频繁切换）
    let movementState: 'idle' | 'walk' | 'run' = 'idle';
    if (isInputActive || currentSpeed > PLAYER.WALK_THRESHOLD) {
      const effectiveSpeed = Math.max(currentSpeed, targetSpeed);
      if (effectiveSpeed >= PLAYER.RUN_SPEED * PLAYER.RUN_THRESHOLD_RATIO) {
        movementState = 'run';
      } else if (effectiveSpeed > PLAYER.WALK_THRESHOLD) {
        movementState = 'walk';
      }
    }

    // 4. 跳跃与重力
    let nextY = player.velocity.y;
    if (input.jump && player.isGrounded) {
      nextY = PLAYER.JUMP_FORCE;
      state.setPlayer({ isGrounded: false, isJumping: true });
    }
    nextY -= PLAYER.GRAVITY * delta;

    // 5. 应用速度并碰撞检测
    const nextPosition = player.position.clone();
    // 限制每帧最大水平位移，避免低帧率时穿透薄墙
    let stepX = nextHorizontal.x * delta;
    let stepZ = nextHorizontal.z * delta;
    const stepLen = Math.sqrt(stepX * stepX + stepZ * stepZ);
    const maxStep = PLAYER.RADIUS * 0.5;
    if (stepLen > maxStep) {
      const scale = maxStep / stepLen;
      stepX *= scale;
      stepZ *= scale;
    }
    nextPosition.x += stepX;
    nextPosition.z += stepZ;
    nextPosition.y += nextY * delta;

    // 地面检测
    if (nextPosition.y <= ARENA.FLOOR_Y) {
      nextPosition.y = ARENA.FLOOR_Y;
      nextY = 0;
      state.setPlayer({ isGrounded: true, isJumping: false });
    }

    // 水平碰撞检测与修正（空间网格查询附近碰撞盒）
    const characterPos = new Vector3(nextPosition.x, nextPosition.y, nextPosition.z);
    const candidates = this.grid
      ? this.grid.querySphere(characterPos, PLAYER.RADIUS)
      : this.collisionBoxes;

    for (const box of candidates) {
      // 跳过脚下的地面与过高的物体
      if (box.max.y <= nextPosition.y + 0.1) continue;
      if (box.min.y >= nextPosition.y + PLAYER.HEIGHT) continue;

      if (resolveCircleBoxCollision(characterPos, PLAYER.RADIUS, box, tempCorrection)) {
        nextPosition.add(tempCorrection);
        characterPos.add(tempCorrection);

        // 根据法线修正速度：去掉速度在碰撞法线方向的分量，实现贴墙滑动而不是反弹/卡死
        const correctionLen = Math.sqrt(
          tempCorrection.x * tempCorrection.x + tempCorrection.z * tempCorrection.z
        );
        if (correctionLen > 0.001) {
          const nx = tempCorrection.x / correctionLen;
          const nz = tempCorrection.z / correctionLen;
          const dotN = nextHorizontal.x * nx + nextHorizontal.z * nz;
          if (dotN < 0) {
            nextHorizontal.x -= nx * dotN;
            nextHorizontal.z -= nz * dotN;
          }
        }
      }
    }

    // 6. 更新角色朝向
    if (moveDir.lengthSq() > 0) {
      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      this.yaw = lerp(normalizeAngle(this.yaw - targetYaw), 0, Math.min(1, 10 * delta)) + targetYaw;
      if (this.characterGroup) {
        this.characterGroup.rotation.y = this.yaw;
      }
    }

    // 7. 同步状态
    const finalHorizontalSpeed = Math.sqrt(nextHorizontal.x * nextHorizontal.x + nextHorizontal.z * nextHorizontal.z);
    state.setPlayer({
      position: nextPosition,
      velocity: new Vector3(nextHorizontal.x, nextY, nextHorizontal.z),
      isMoving: finalHorizontalSpeed > PLAYER.WALK_THRESHOLD,
      movementState,
    });

    // 8. 脚步声
    this.audio.playFootstep(player.isGrounded && finalHorizontalSpeed > PLAYER.WALK_THRESHOLD, movementState);
  }
}
