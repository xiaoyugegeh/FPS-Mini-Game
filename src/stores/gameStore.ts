import { create } from 'zustand';
import { Vector3 } from 'three';
import {
  PlayerState,
  CameraState,
  TutorialState,
  CombatState,
  GameSettings,
  PerformanceState,
  InputState,
  TargetInstance,
  BulletHole,
  Particle,
  WeaponType,
  MonsterInstance,
  CrosshairState,
  GameMode,
} from '../types';
import { TUTORIAL_STAGES, PLAYER, WEAPON, CAMERA, ARENA } from '../utils/constants';
import { loadSaveData } from '../utils/localStorage';

const savedData = loadSaveData();

const initialPlayerState: PlayerState = {
  position: ARENA.SPAWN_POINT.clone(),
  velocity: new Vector3(),
  health: PLAYER.MAX_HEALTH,
  maxHealth: PLAYER.MAX_HEALTH,
  ammo: WEAPON.MAGAZINE_SIZE,
  magazineSize: WEAPON.MAGAZINE_SIZE,
  totalAmmo: WEAPON.TOTAL_AMMO,
  isReloading: false,
  isJumping: false,
  isGrounded: true,
  isMoving: false,
  movementState: 'idle',
  lastFireTime: 0,
  lastHitTime: 0,
  invincibleUntil: 0,
  currentWeapon: 'ak47',
};

const initialCameraState: CameraState = {
  mode: CAMERA.DEFAULT_MODE,
  distance: CAMERA.MIN_DISTANCE,
  minDistance: CAMERA.MIN_DISTANCE,
  maxDistance: CAMERA.MAX_DISTANCE,
  pitch: 0,
  yaw: 0,
  targetPosition: ARENA.SPAWN_POINT.clone(),
};

const initialTutorialState: TutorialState = {
  currentStage: savedData.currentStage,
  stages: TUTORIAL_STAGES.map((stage, index) => ({
    ...stage,
    completed: savedData.stagesCompleted[index] ?? false,
  })),
  startTime: 0,
  stageStartTime: 0,
  idleTime: 0,
  failCount: 0,
};

const initialCombatState: CombatState = {
  shotsFired: 0,
  shotsHit: 0,
  totalDamage: 0,
  damageNumbers: [],
};

const initialSettings: GameSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  mouseSensitivity: 0.3,
  quality: 'high',
  vSync: true,
  enableVibration: true,
};

const initialPerformanceState: PerformanceState = {
  fps: 0,
  avgFps: 0,
  frameTime: 0,
  drawCalls: 0,
  triangles: 0,
  memoryMB: 0,
  qualityLevel: 'high',
};

const initialInputState: InputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  fire: false,
  reload: false,
  switchView: false,
  sprint: false,
  selectWeaponNone: false,
  selectWeaponPrimary: false,
  mouseDeltaX: 0,
  mouseDeltaY: 0,
  mouseWheelDelta: 0,
};

/**
 * 游戏全局状态
 */
export interface GameStoreState {
  // 核心状态
  player: PlayerState;
  camera: CameraState;
  tutorial: TutorialState;
  combat: CombatState;
  settings: GameSettings;
  performance: PerformanceState;
  input: InputState;

  // 运行时对象
  targets: TargetInstance[];
  monsters: MonsterInstance[];
  bulletHoles: BulletHole[];
  particles: Particle[];

  // 游戏流程
  isLoading: boolean;
  loadingProgress: number;
  isPaused: boolean;
  isGameOver: boolean;
  isInMenu: boolean;
  examTimeLeft: number;
  consecutiveHits: number;
  targetsDestroyed: number;

  // 准星状态
  crosshairState: CrosshairState;

  // 游戏模式与皮肤
  gameMode: GameMode;
  currentSkin: string;

  // 怪物波次 / 人机 PK 计分
  wave: number;
  score: number;
  monstersKilled: number;
  deaths: number;
  botKills: number;
  waveInProgress: boolean;
  waveCooldownEnd: number;
}

export interface GameStoreActions {
  setPlayer: (player: Partial<PlayerState>) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setInput: (input: Partial<InputState>) => void;
  resetInputDeltas: () => void;
  setTutorial: (tutorial: Partial<TutorialState>) => void;
  completeStage: (stageId: number) => void;
  resetTutorial: () => void;
  setCombat: (combat: Partial<CombatState>) => void;
  addDamageNumber: (position: Vector3, value: number) => void;
  removeDamageNumber: (id: string) => void;
  setSettings: (settings: Partial<GameSettings>) => void;
  setPerformance: (performance: Partial<PerformanceState>) => void;
  setLoading: (isLoading: boolean, progress?: number) => void;
  setPaused: (isPaused: boolean) => void;
  setGameOver: (isGameOver: boolean) => void;
  setExamTimeLeft: (time: number) => void;
  setCurrentWeapon: (weapon: WeaponType) => void;
  addTarget: (target: TargetInstance) => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, update: Partial<TargetInstance>) => void;
  addBulletHole: (hole: BulletHole) => void;
  removeBulletHole: (id: string) => void;
  addParticle: (particle: Particle) => void;
  removeParticle: (id: string) => void;
  incrementConsecutiveHits: () => void;
  resetConsecutiveHits: () => void;
  incrementTargetsDestroyed: () => void;

  setCrosshairState: (state: CrosshairState) => void;

  setGameMode: (mode: GameMode) => void;
  setCurrentSkin: (skin: string) => void;
  setInMenu: (value: boolean) => void;

  addMonster: (monster: MonsterInstance) => void;
  removeMonster: (id: string) => void;
  updateMonster: (id: string, update: Partial<MonsterInstance>) => void;
  clearMonsters: () => void;
  nextWave: () => void;
  addScore: (score: number) => void;
  incrementMonstersKilled: () => void;
  incrementDeaths: () => void;
  incrementBotKills: () => void;

  resetRuntime: () => void;
}

export interface GameStore extends GameStoreState, GameStoreActions {}

export const useGameStore = create<GameStore>((set) => ({
  player: initialPlayerState,
  camera: initialCameraState,
  tutorial: initialTutorialState,
  combat: initialCombatState,
  settings: initialSettings,
  performance: initialPerformanceState,
  input: initialInputState,
  targets: [],
  monsters: [],
  bulletHoles: [],
  particles: [],
  isLoading: true,
  loadingProgress: 0,
  isPaused: false,
  isGameOver: false,
  isInMenu: true,
  examTimeLeft: 60,
  consecutiveHits: 0,
  targetsDestroyed: 0,
  crosshairState: 'idle',
  gameMode: 'training' as GameMode,
  currentSkin: 'default',
  wave: 1,
  score: 0,
  monstersKilled: 0,
  deaths: 0,
  botKills: 0,
  waveInProgress: false,
  waveCooldownEnd: 0,

  setPlayer: (player) => set((state) => ({ player: { ...state.player, ...player } })),
  setCamera: (camera) => set((state) => ({ camera: { ...state.camera, ...camera } })),
  setInput: (input) =>
    set((state) => ({
      input: {
        ...state.input,
        ...input,
        // 鼠标增量：未传入时保留原值；显式 0 表示清零（供 cameraController 消费后重置）；非零值累加
        mouseDeltaX:
          input.mouseDeltaX === undefined
            ? state.input.mouseDeltaX
            : input.mouseDeltaX === 0
              ? 0
              : state.input.mouseDeltaX + input.mouseDeltaX,
        mouseDeltaY:
          input.mouseDeltaY === undefined
            ? state.input.mouseDeltaY
            : input.mouseDeltaY === 0
              ? 0
              : state.input.mouseDeltaY + input.mouseDeltaY,
        mouseWheelDelta:
          input.mouseWheelDelta === undefined
            ? state.input.mouseWheelDelta
            : input.mouseWheelDelta === 0
              ? 0
              : state.input.mouseWheelDelta + input.mouseWheelDelta,
      },
    })),
  resetInputDeltas: () =>
    set((state) => ({
      input: {
        ...state.input,
        mouseDeltaX: 0,
        mouseDeltaY: 0,
        mouseWheelDelta: 0,
        switchView: false,
      },
    })),

  setTutorial: (tutorial) =>
    set((state) => ({ tutorial: { ...state.tutorial, ...tutorial } })),

  completeStage: (stageId) =>
    set((state) => {
      const stages = state.tutorial.stages.map((s) =>
        s.id === stageId ? { ...s, completed: true } : s
      );
      const nextStage = Math.min(stageId + 1, stages.length - 1);
      return {
        tutorial: {
          ...state.tutorial,
          currentStage: nextStage,
          stages,
          stageStartTime: performance.now(),
          idleTime: 0,
          failCount: 0,
        },
      };
    }),

  resetTutorial: () =>
    set(() => ({
      tutorial: {
        ...initialTutorialState,
        startTime: performance.now(),
        stageStartTime: performance.now(),
      },
    })),

  setCombat: (combat) => set((state) => ({ combat: { ...state.combat, ...combat } })),

  addDamageNumber: (position, value) =>
    set((state) => ({
      combat: {
        ...state.combat,
        damageNumbers: [
          ...state.combat.damageNumbers,
          {
            id: `${Date.now()}-${Math.random()}`,
            position: position.clone(),
            value,
            createdAt: performance.now(),
            lifetime: 1000,
          },
        ],
      },
    })),

  removeDamageNumber: (id) =>
    set((state) => ({
      combat: {
        ...state.combat,
        damageNumbers: state.combat.damageNumbers.filter((dn) => dn.id !== id),
      },
    })),

  setSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),

  setPerformance: (performance) =>
    set((state) => ({ performance: { ...state.performance, ...performance } })),

  setLoading: (isLoading, progress) =>
    set((state) => ({
      isLoading,
      loadingProgress: progress ?? state.loadingProgress,
    })),

  setPaused: (isPaused) => set({ isPaused }),
  setGameOver: (isGameOver) => set({ isGameOver }),
  setExamTimeLeft: (examTimeLeft) => set({ examTimeLeft }),

  setCurrentWeapon: (weapon) =>
    set((state) => ({ player: { ...state.player, currentWeapon: weapon, isReloading: false } })),

  addTarget: (target) =>
    set((state) => ({ targets: [...state.targets, target] })),

  removeTarget: (id) =>
    set((state) => ({ targets: state.targets.filter((t) => t.id !== id) })),

  updateTarget: (id, update) =>
    set((state) => ({
      targets: state.targets.map((t) => (t.id === id ? { ...t, ...update } : t)),
    })),

  addBulletHole: (hole) =>
    set((state) => ({
      bulletHoles: [...state.bulletHoles, hole],
    })),

  removeBulletHole: (id) =>
    set((state) => ({
      bulletHoles: state.bulletHoles.filter((bh) => bh.id !== id),
    })),

  addParticle: (particle) =>
    set((state) => ({
      particles: [...state.particles, particle],
    })),

  removeParticle: (id) =>
    set((state) => ({
      particles: state.particles.filter((p) => p.id !== id),
    })),

  incrementConsecutiveHits: () =>
    set((state) => ({ consecutiveHits: state.consecutiveHits + 1 })),

  resetConsecutiveHits: () => set({ consecutiveHits: 0 }),
  incrementTargetsDestroyed: () => set((state) => ({ targetsDestroyed: state.targetsDestroyed + 1 })),

  setCrosshairState: (crosshairState) => set({ crosshairState }),

  setGameMode: (gameMode) => set({ gameMode }),
  setCurrentSkin: (currentSkin) => set({ currentSkin }),
  setInMenu: (isInMenu) => set({ isInMenu }),

  addMonster: (monster) =>
    set((state) => ({ monsters: [...state.monsters, monster] })),

  removeMonster: (id) =>
    set((state) => ({ monsters: state.monsters.filter((m) => m.id !== id) })),

  updateMonster: (id, update) =>
    set((state) => ({
      monsters: state.monsters.map((m) => (m.id === id ? { ...m, ...update } : m)),
    })),

  clearMonsters: () => set({ monsters: [] }),

  nextWave: () =>
    set((state) => ({
      wave: state.wave + 1,
      waveInProgress: true,
      waveCooldownEnd: 0,
    })),

  addScore: (score) => set((state) => ({ score: state.score + score })),

  incrementMonstersKilled: () =>
    set((state) => ({ monstersKilled: state.monstersKilled + 1 })),

  incrementDeaths: () => set((state) => ({ deaths: state.deaths + 1 })),

  incrementBotKills: () => set((state) => ({ botKills: state.botKills + 1 })),

  resetRuntime: () =>
    set(() => ({
      player: initialPlayerState,
      camera: initialCameraState,
      combat: initialCombatState,
      targets: [],
      monsters: [],
      bulletHoles: [],
      particles: [],
      isPaused: false,
      isGameOver: false,
      examTimeLeft: 60,
      consecutiveHits: 0,
      targetsDestroyed: 0,
      wave: 1,
      score: 0,
      monstersKilled: 0,
      deaths: 0,
      botKills: 0,
      waveInProgress: false,
      waveCooldownEnd: 0,
    })),
}));
