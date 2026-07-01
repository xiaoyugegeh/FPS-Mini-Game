import { Vector3 } from 'three';
import { MaterialType, TutorialStage, WeaponSkin } from '../types';

/**
 * 玩家移动与物理参数
 */
export const PLAYER = {
  // Valorant 风格移动参数：奔跑略快于行走，加减速锐利，跳跃低且落地快
  WALK_SPEED: 4.5,
  RUN_SPEED: 5.4,
  ACCELERATION: 32.0,
  DECELERATION: 36.0,
  JUMP_FORCE: 7.2,
  GRAVITY: 34.0,
  HEIGHT: 1.75,
  RADIUS: 0.35,
  MAX_HEALTH: 100,
  /** 进入 walk 状态的最低速度阈值 */
  WALK_THRESHOLD: 0.3,
  /** 进入 run 状态的最低速度阈值（相对于 RUN_SPEED 的比例） */
  RUN_THRESHOLD_RATIO: 0.65,
} as const;

/**
 * 相机参数
 */
export const CAMERA = {
  DEFAULT_MODE: 'fps' as const,
  DEFAULT_DISTANCE: 4.5,
  MIN_DISTANCE: 0.1,
  MAX_DISTANCE: 8.0,
  PITCH_MIN: -Math.PI / 2.5,
  PITCH_MAX: Math.PI / 4.5,
  /** FPS 模式下最大水平偏航角（±165°），保留正后方 30° 盲区 */
  YAW_LIMIT: (Math.PI * 11) / 12,
  SMOOTH_FACTOR: 0.12,
  /**
   * 基准旋转灵敏度。
   * 默认 sensitivity=0.3 时，800 DPI 下约 33cm/360，贴近 Valorant 0.3 sens 手感。
   */
  ROTATION_SENSITIVITY: 0.002,
  ZOOM_SENSITIVITY: 0.001,
  FOV_TPS: 70,
  /** FPS 垂直 FOV 73°，等效 16:9 水平 FOV ~103°，与 Valorant 默认一致 */
  FOV_FPS: 73,
  /** 鼠标灵敏度倍率（默认 0.3，Valorant 风格） */
  MOUSE_SENSITIVITY_BASE: 0.3,
  /** 最小/最大灵敏度 */
  MOUSE_SENSITIVITY_MIN: 0.05,
  MOUSE_SENSITIVITY_MAX: 5.0,
  /** 开火时视角上扬幅度（Valorant 风格：微小、可控） */
  RECOIL_PITCH: 0.0035,
  /** 开火后视角恢复速度 */
  RECOIL_RECOVERY: 3.5,
  /** 静止时呼吸幅度 */
  BREATH_AMPLITUDE: 0.004,
  /** 静止时呼吸频率 */
  BREATH_FREQUENCY: 1.0,
  /** 行走时相机晃动幅度 */
  WALK_SHAKE_AMPLITUDE: 0.012,
  /** 行走时相机晃动频率 */
  WALK_SHAKE_FREQUENCY: 8.0,
  /** 奔跑时相机晃动幅度 */
  RUN_SHAKE_AMPLITUDE: 0.024,
  /** 奔跑时相机晃动频率 */
  RUN_SHAKE_FREQUENCY: 12.0,
} as const;

/**
 * 武器参数
 */
export const WEAPON = {
  // Valorant 风格 AK（Vandal 类似）：射速适中、单发伤害高、后坐力模式固定
  MAGAZINE_SIZE: 25,
  TOTAL_AMMO: 100,
  FIRE_RATE: 95,
  DAMAGE: 35,
  RELOAD_TIME: 1800,
  RANGE: 200,
  RECOIL_RECOVERY: 2.5,
  MAX_RECOIL: 0.08,
} as const;

/**
 * 武器模型配置（AK-47 在 FPS 视角下的显示参数）
 */
export const WEAPON_MODEL = {
  PATH: '/models/ak47.glb',
  SCALE: 0.26,
  // Valorant 风格 viewmodel：枪身更靠右下，不遮挡准星与视野中心
  POSITION: new Vector3(0.58, -0.62, -0.88),
  ROTATION: new Vector3(0, Math.PI / 2, -0.02),
  BOB_AMPLITUDE: 0.008,
  BOB_FREQUENCY_WALK: 8,
  BOB_FREQUENCY_RUN: 14,
  RECOIL_KICK: 0.045,
  RECOIL_RECOVERY: 7,
  STRAFE_TILT: 0.04,
  IDLE_SWAY: 0.0025,
} as const;

/**
 * 武器皮肤配置
 */
export const WEAPON_SKINS: WeaponSkin[] = [
  { id: 'default', name: '默认', color: '#5c5c5c', emissive: '#000000', metalness: 0.6, roughness: 0.4 },
  { id: 'crimson', name: '猩红', color: '#991b1b', emissive: '#450a0a', metalness: 0.5, roughness: 0.35 },
  { id: 'cyber', name: '赛博', color: '#0891b2', emissive: '#164e63', metalness: 0.7, roughness: 0.25 },
  { id: 'gold', name: '鎏金', color: '#f59e0b', emissive: '#78350f', metalness: 0.9, roughness: 0.2 },
  { id: 'void', name: '虚空', color: '#4c1d95', emissive: '#2e1065', metalness: 0.6, roughness: 0.3 },
];

/**
 * 教学阶段定义
 */
export const TUTORIAL_STAGES: TutorialStage[] = [
  {
    id: 0,
    title: '阶段 1：角色移动',
    description: '使用 WASD 键控制角色前后左右移动。',
    objective: '移动至前方橙色标记区域',
    completed: false,
    hintFrequency: 8000,
  },
  {
    id: 1,
    title: '阶段 2：视角控制',
    description: '移动鼠标控制视角，滚轮调整视角距离。',
    objective: '将准星对准蓝色目标并保持 2 秒',
    completed: false,
    hintFrequency: 8000,
  },
  {
    id: 2,
    title: '阶段 3：基础射击',
    description: '点击鼠标左键开火，摧毁前方红色训练靶。',
    objective: '击毁 3 个训练靶',
    completed: false,
    hintFrequency: 10000,
  },
  {
    id: 3,
    title: '阶段 4：换弹操作',
    description: '弹药耗尽时按 R 键换弹，保持火力持续。',
    objective: '完成 1 次换弹并击毁目标',
    completed: false,
    hintFrequency: 10000,
  },
  {
    id: 4,
    title: '阶段 5：掩体利用',
    description: '利用掩体躲避，按住 W 贴近并越过掩体。',
    objective: '穿越掩体区域到达终点',
    completed: false,
    hintFrequency: 12000,
  },
  {
    id: 5,
    title: '阶段 6：精准射击',
    description: '瞄准移动靶头部，练习跟枪与预瞄。',
    objective: '连续命中移动靶 5 次',
    completed: false,
    hintFrequency: 12000,
  },
  {
    id: 6,
    title: '阶段 7：综合考核',
    description: '综合运用所有技能，在限定时间内完成考核。',
    objective: '60 秒内击毁所有目标',
    completed: false,
    hintFrequency: 15000,
  },
];

/**
 * 训练场尺寸与布局
 */
export const ARENA = {
  WIDTH: 60,
  LENGTH: 80,
  WALL_HEIGHT: 6,
  FLOOR_Y: 0,
  SPAWN_POINT: new Vector3(0, 0, -30),
  ZONE_MARKERS: [
    { position: new Vector3(0, 0.1, -15), radius: 3, stage: 0 },
    { position: new Vector3(0, 0.1, 0), radius: 3, stage: 1 },
    { position: new Vector3(0, 0.1, 15), radius: 5, stage: 4 },
    { position: new Vector3(0, 0.1, 35), radius: 4, stage: 6 },
  ],
} as const;

/**
 * 材质颜色配置
 */
export const MATERIAL_COLORS: Record<MaterialType, { base: number; emissive?: number }> = {
  metal: { base: 0x94a3b8, emissive: 0x000000 },
  concrete: { base: 0x64748b, emissive: 0x000000 },
  plastic: { base: 0x8b5cf6, emissive: 0x1a0f2e },
  fabric: { base: 0x475569, emissive: 0x000000 },
};

/**
 * 视觉主题
 */
export const THEME = {
  background: '#0f1117',
  panelBg: 'rgba(17, 24, 39, 0.85)',
  panelBorder: 'rgba(124, 58, 237, 0.35)',
  accentPurple: '#7c3aed',
  accentBlue: '#4f46e5',
  accentOrange: '#ff5722',
  accentOrangeLight: '#ff9100',
  textPrimary: '#f3f4f6',
  textSecondary: '#9ca3af',
  danger: '#ef4444',
  success: '#22c55e',
} as const;

/**
 * 性能目标
 */
export const PERFORMANCE = {
  TARGET_FPS: 60,
  LOW_FPS_THRESHOLD: 45,
  MEMORY_LIMIT_MB: 512,
  QUALITY_ADJUST_INTERVAL: 3000,
} as const;

/**
 * 音效 URL（使用程序化生成，无需外部资源）
 */
export const AUDIO = {
  FIRE_FREQ: 180,
  RELOAD_FREQ: 220,
  HIT_METAL_FREQ: 800,
  HIT_CONCRETE_FREQ: 400,
  /** 行走时脚步间隔（毫秒） */
  FOOTSTEP_INTERVAL_WALK: 520,
  /** 奔跑时脚步间隔（毫秒） */
  FOOTSTEP_INTERVAL_RUN: 320,
  /** 脚步声基础频率 */
  FOOTSTEP_BASE_FREQ: 220,
  /** 奔跑脚步声频率偏移 */
  FOOTSTEP_RUN_PITCH_OFFSET: 60,
} as const;

/**
 * 粒子颜色
 */
export const PARTICLE_COLORS = {
  metal: '#ffeb3b',
  concrete: '#9ca3af',
  plastic: '#7c3aed',
  fabric: '#f3f4f6',
  muzzle: '#ff9100',
} as const;

/**
 * 怪物类型配置
 */
export const MONSTER_CONFIGS = {
  grunt: {
    type: 'grunt',
    name: '游魂',
    maxHealth: 80,
    speed: 3.2,
    damage: 10,
    attackRange: 1.6,
    attackCooldown: 1200,
    color: '#ef4444',
    scale: 1.0,
    score: 100,
  },
  runner: {
    type: 'runner',
    name: '疾行者',
    maxHealth: 50,
    speed: 5.5,
    damage: 8,
    attackRange: 1.4,
    attackCooldown: 900,
    color: '#f59e0b',
    scale: 0.85,
    score: 150,
  },
  tank: {
    type: 'tank',
    name: '巨像',
    maxHealth: 220,
    speed: 2.0,
    damage: 20,
    attackRange: 2.0,
    attackCooldown: 1800,
    color: '#8b5cf6',
    scale: 1.4,
    score: 300,
  },
  ranger: {
    type: 'ranger',
    name: '狙击者',
    maxHealth: 60,
    speed: 2.8,
    damage: 15,
    attackRange: 12.0,
    attackCooldown: 2500,
    color: '#06b6d4',
    scale: 0.95,
    score: 250,
  },
} as const;

/**
 * 怪物系统参数
 */
export const MONSTER_SYSTEM = {
  /** 激活怪物的最大距离 */
  ACTIVATION_RANGE: 40,
  /** 追击放弃距离 */
  LOSE_INTEREST_RANGE: 50,
  /** 巡逻点切换距离 */
  PATROL_REACHED_DISTANCE: 1.5,
  /** 巡逻停留最短时间 */
  PATROL_MIN_WAIT: 1000,
  /** 巡逻停留最长时间 */
  PATROL_MAX_WAIT: 4000,
  /** 波次间隔（毫秒） */
  WAVE_COOLDOWN: 8000,
  /** 每波基础怪物数 */
  BASE_MONSTERS_PER_WAVE: 2,
  /** 每波额外怪物数 */
  EXTRA_MONSTERS_PER_WAVE: 1,
  /** 最大同时存在怪物数 */
  MAX_MONSTERS: 16,
  /** 怪物刷新半径 */
  SPAWN_RADIUS: 28,
  /** 最小刷新距离（避免贴脸） */
  SPAWN_MIN_DISTANCE: 14,
} as const;
