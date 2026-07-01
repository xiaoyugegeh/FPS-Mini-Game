import { Vector3, Vector4, Box3, Matrix4, Quaternion } from 'three';
import { CollisionBox } from '../types';

/**
 * 将角度限制在 [-PI, PI] 范围内
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

/**
 * 球形插值，用于平滑相机跟随
 */
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

/**
 * 向量平滑插值
 */
export function lerpVector(current: Vector3, target: Vector3, factor: number, out: Vector3): Vector3 {
  out.set(
    lerp(current.x, target.x, factor),
    lerp(current.y, target.y, factor),
    lerp(current.z, target.z, factor)
  );
  return out;
}

/**
 * 阻尼平滑，用于相机移动
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/**
 * AABB 与点碰撞检测
 */
export function pointInBox(point: Vector3, box: CollisionBox): boolean {
  return (
    point.x >= box.min.x && point.x <= box.max.x &&
    point.y >= box.min.y && point.y <= box.max.y &&
    point.z >= box.min.z && point.z <= box.max.z
  );
}

/**
 * 圆柱体与 AABB 碰撞检测（用于角色）
 */
export function cylinderBoxCollision(
  pos: Vector3,
  radius: number,
  height: number,
  box: CollisionBox
): boolean {
  const closestX = Math.max(box.min.x, Math.min(pos.x, box.max.x));
  const closestZ = Math.max(box.min.z, Math.min(pos.z, box.max.z));
  const dx = pos.x - closestX;
  const dz = pos.z - closestZ;
  const horizontalDist = Math.sqrt(dx * dx + dz * dz);

  if (horizontalDist > radius) return false;

  const minY = pos.y;
  const maxY = pos.y + height;
  return maxY > box.min.y && minY < box.max.y;
}

/**
 * 计算角色与 AABB 碰撞后的修正位移
 */
export function resolveCircleBoxCollision(
  pos: Vector3,
  radius: number,
  box: CollisionBox,
  out: Vector3
): boolean {
  const closestX = Math.max(box.min.x, Math.min(pos.x, box.max.x));
  const closestZ = Math.max(box.min.z, Math.min(pos.z, box.max.z));
  const dx = pos.x - closestX;
  const dz = pos.z - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq === 0 || distSq > radius * radius) return false;

  const dist = Math.sqrt(distSq);
  const overlap = radius - dist;
  const nx = dx / dist;
  const nz = dz / dist;

  out.set(nx * overlap, 0, nz * overlap);
  return true;
}

/**
 * 创建从 Box3 导出的碰撞盒
 */
export function box3ToCollisionBox(box3: Box3): CollisionBox {
  return { min: box3.min.clone(), max: box3.max.clone() };
}

/**
 * 从变换矩阵提取位置、旋转、缩放
 */
export function decomposeMatrix(
  matrix: Matrix4,
  position: Vector3,
  quaternion: Quaternion,
  scale: Vector3
): void {
  matrix.decompose(position, quaternion, scale);
}

/**
 * 生成随机 ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 将世界坐标转换为屏幕坐标（用于伤害数字）
 */
export function worldToScreen(
  worldPos: Vector3,
  viewMatrix: Matrix4,
  projectionMatrix: Matrix4,
  width: number,
  height: number
): { x: number; y: number; visible: boolean } {
  const pos = new Vector4(worldPos.x, worldPos.y, worldPos.z, 1.0);
  pos.applyMatrix4(viewMatrix).applyMatrix4(projectionMatrix);
  const w = pos.w;
  if (w === 0) return { x: 0, y: 0, visible: false };
  return {
    x: ((pos.x / w + 1) / 2) * width,
    y: ((-pos.y / w + 1) / 2) * height,
    visible: pos.z / w >= -1 && pos.z / w <= 1,
  };
}
