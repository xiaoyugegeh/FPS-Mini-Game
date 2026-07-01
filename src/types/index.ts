import { Vector3 } from 'three';

/**
 * 准星状态
 */
export type CrosshairState = 'idle' | 'enemy' | 'target' | 'wall';

/**
 * 武器类型
 */
export type WeaponType = 'none' | 'ak47';

/**
 * 武器皮肤
 */
export interface WeaponSkin {
  id: string;
  name: string;
  color: string;
  emissive: string;
  metalness: number;
  roughness: number;
}

/**
 * 游戏模式
 */
export type GameMode = 'training' | 'deathmatch';

/**
 * 怪物类型
 */
export type MonsterType = 'grunt' | 'runner' | 'tank' | 'ranger';

/**
 * 怪物 AI 状态
 */
export type MonsterAIState = 'patrol' | 'chase' | 'attack' | 'dead';

/**
 * 怪物属性配置
 */
export interface MonsterConfig {
  type: MonsterType;
  name: string;
  maxHealth: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  color: string;
  scale: number;
  score: number;
}

/**
 * 怪物实例
 */
export interface MonsterInstance {
  id: string;
  type: MonsterType;
  position: Vector3;
  rotation: number;
  health: number;
  maxHealth: number;
  aiState: MonsterAIState;
  velocity: Vector3;
  lastAttackTime: number;
  lastHitTime: number;
  patrolTarget: Vector3;
  isAlive: boolean;
  meshUuid?: string;
}

/**
 * 玩家状态
 */
export interface PlayerState {
  position: Vector3;
  velocity: Vector3;
  health: number;
  maxHealth: number;
  ammo: number;
  magazineSize: number;
  totalAmmo: number;
  isReloading: boolean;
  isJumping: boolean;
  isGrounded: boolean;
  isMoving: boolean;
  movementState: 'idle' | 'walk' | 'run';
  lastFireTime: number;
  lastHitTime: number;
  invincibleUntil: number;
  currentWeapon: WeaponType;
}

/**
 * 相机状态
 */
export interface CameraState {
  mode: 'tps' | 'fps';
  distance: number;
  minDistance: number;
  maxDistance: number;
  pitch: number;
  yaw: number;
  targetPosition: Vector3;
}

/**
 * 教学阶段
 */
export interface TutorialStage {
  id: number;
  title: string;
  description: string;
  objective: string;
  completed: boolean;
  hintFrequency: number;
}

/**
 * 引导状态
 */
export interface TutorialState {
  currentStage: number;
  stages: TutorialStage[];
  startTime: number;
  stageStartTime: number;
  idleTime: number;
  failCount: number;
}

/**
 * 战斗状态
 */
export interface CombatState {
  shotsFired: number;
  shotsHit: number;
  totalDamage: number;
  damageNumbers: DamageNumber[];
}

/**
 * 伤害数字
 */
export interface DamageNumber {
  id: string;
  position: Vector3;
  value: number;
  createdAt: number;
  lifetime: number;
}

/**
 * 训练目标
 */
export interface Target {
  id: string;
  type: 'static' | 'moving';
  position: Vector3;
  health: number;
  maxHealth: number;
  path?: Vector3[];
  pathIndex?: number;
  speed?: number;
  lastHitTime?: number;
  isAlive: boolean;
}

/**
 * 目标实例（运行时）
 */
export interface TargetInstance extends Target {
  meshUuid?: string;
  direction?: Vector3;
  pauseEndTime?: number;
}

/**
 * 弹痕
 */
export interface BulletHole {
  id: string;
  position: Vector3;
  normal: Vector3;
  createdAt: number;
  lifetime: number;
  materialType: MaterialType;
}

/**
 * 材质类型
 */
export type MaterialType = 'metal' | 'concrete' | 'plastic' | 'fabric';

/**
 * 粒子
 */
export interface Particle {
  id: string;
  position: Vector3;
  velocity: Vector3;
  color: string;
  size: number;
  createdAt: number;
  lifetime: number;
}

/**
 * 游戏设置
 */
export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  mouseSensitivity: number;
  quality: 'low' | 'medium' | 'high';
  vSync: boolean;
  enableVibration: boolean;
}

/**
 * 性能状态
 */
export interface PerformanceState {
  fps: number;
  avgFps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryMB: number;
  qualityLevel: 'low' | 'medium' | 'high';
}

/**
 * 输入状态
 */
export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean;
  reload: boolean;
  switchView: boolean;
  sprint: boolean;
  selectWeaponNone: boolean;
  selectWeaponPrimary: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
  mouseWheelDelta: number;
}

/**
 * 本地存档数据
 */
export interface SaveData {
  currentStage: number;
  stagesCompleted: boolean[];
  bestScore: number;
  bestTime: number;
  lastPlayedAt: string;
}

/**
 * 碰撞盒
 */
export interface CollisionBox {
  min: Vector3;
  max: Vector3;
}
