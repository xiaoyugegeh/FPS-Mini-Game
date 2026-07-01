import { Vector3, Object3D, Raycaster, Box3, Mesh } from 'three';
import { useGameStore } from '../stores/gameStore';
import {
  MONSTER_CONFIGS,
  MONSTER_SYSTEM,
  ARENA,
} from '../utils/constants';
import { AudioManager } from './audioManager';
import type { MonsterInstance, MonsterType, MonsterConfig, CollisionBox } from '../types';
import { CollisionGrid } from '../utils/spatialGrid';

const raycaster = new Raycaster();
const tempVec = new Vector3();

/**
 * 怪物系统
 * 负责怪物生成、AI 行为状态机、移动、攻击与受击
 */
export class MonsterSystem {
  private store = useGameStore;
  private audio = AudioManager.getInstance();
  private collisionObjects: Object3D[] = [];
  private collisionBoxes: CollisionBox[] = [];
  private grid: CollisionGrid | null = null;
  private spawnQueue: { type: MonsterType; delay: number }[] = [];
  private lastSpawnTime = 0;

  registerColliders(objects: Object3D[]): void {
    this.collisionObjects = objects;
    this.collisionBoxes = [];
    objects.forEach((obj) => {
      obj.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) {
          const box = new Box3().setFromObject(mesh);
          const size = box.getSize(tempVec);
          if (size.y > 0.2 && size.x > 0.2 && size.z > 0.2) {
            this.collisionBoxes.push({ min: box.min.clone(), max: box.max.clone() });
          }
        }
      });
    });
    this.grid = new CollisionGrid(this.collisionBoxes, 6);
  }

  /**
   * 每帧更新
   */
  update(delta: number, playerPos: Vector3): void {
    const state = this.store.getState();
    if (state.isPaused || state.isGameOver) return;

    this.updateWaveLogic();
    this.processSpawnQueue();

    const monsters = state.monsters;
    for (const monster of monsters) {
      if (!monster.isAlive) continue;
      this.updateMonster(monster, delta, playerPos);
    }

    // 清理死亡怪物（延迟 3 秒后移除，保留死亡动画时间）
    this.cleanupDeadMonsters();
  }

  /**
   * 清理死亡怪物，防止数组无限膨胀
   */
  private cleanupDeadMonsters(): void {
    const state = this.store.getState();
    const now = performance.now();
    const toRemove: string[] = [];

    for (const monster of state.monsters) {
      if (!monster.isAlive && now - monster.lastHitTime > 3000) {
        toRemove.push(monster.id);
      }
    }

    if (toRemove.length > 0) {
      this.store.setState({
        monsters: state.monsters.filter((m) => !toRemove.includes(m.id)),
      });
    }
  }

  /**
   * 波次逻辑
   */
  private updateWaveLogic(): void {
    const state = this.store.getState();
    const now = performance.now();

    if (!state.waveInProgress) {
      // 首次进入游戏给予 10 秒准备时间，避免开局被秒杀
      if (state.waveCooldownEnd === 0) {
        this.store.setState({ waveCooldownEnd: now + 10000 });
        return;
      }
      if (now >= state.waveCooldownEnd) {
        const nextWave = state.wave + (state.waveCooldownEnd > 0 ? 1 : 0);
        this.store.setState({ wave: nextWave });
        this.startWave(nextWave);
      }
      return;
    }

    const aliveMonsters = state.monsters.filter((m) => m.isAlive).length;
    const pendingSpawns = this.spawnQueue.length;

    if (aliveMonsters === 0 && pendingSpawns === 0) {
      // 本波清完，进入间隔
      this.store.setState({
        waveInProgress: false,
        waveCooldownEnd: now + MONSTER_SYSTEM.WAVE_COOLDOWN,
      });
    }
  }

  /**
   * 开始新波次
   */
  private startWave(wave: number): void {
    const count =
      MONSTER_SYSTEM.BASE_MONSTERS_PER_WAVE +
      (wave - 1) * MONSTER_SYSTEM.EXTRA_MONSTERS_PER_WAVE;

    this.spawnQueue = [];
    for (let i = 0; i < count; i++) {
      const type = this.pickMonsterType(wave, i);
      this.spawnQueue.push({ type, delay: i * 600 });
    }

    this.store.setState({ waveInProgress: true });
  }

  /**
   * 根据波次挑选怪物类型
   */
  private pickMonsterType(wave: number, index: number): MonsterType {
    if (wave === 1) return 'grunt';
    if (wave === 2) return index % 3 === 0 ? 'runner' : 'grunt';
    if (wave <= 4) {
      const roll = Math.random();
      if (roll < 0.5) return 'grunt';
      if (roll < 0.8) return 'runner';
      return 'ranger';
    }
    const roll = Math.random();
    if (roll < 0.35) return 'grunt';
    if (roll < 0.6) return 'runner';
    if (roll < 0.85) return 'ranger';
    return 'tank';
  }

  /**
   * 处理刷新队列
   */
  private processSpawnQueue(): void {
    const now = performance.now();
    while (this.spawnQueue.length > 0) {
      const next = this.spawnQueue[0];
      if (now < this.lastSpawnTime + next.delay) break;

      const state = this.store.getState();
      if (state.monsters.filter((m) => m.isAlive).length >= MONSTER_SYSTEM.MAX_MONSTERS) {
        break;
      }

      this.spawnMonster(next.type);
      this.lastSpawnTime = now;
      this.spawnQueue.shift();
    }
  }

  /**
   * 刷新单个怪物
   */
  private spawnMonster(type: MonsterType): void {
    const config = MONSTER_CONFIGS[type] as unknown as MonsterConfig;
    const state = this.store.getState();
    const playerPos = state.player.position;

    const spawnPos = this.findSpawnPosition(playerPos);
    if (!spawnPos) return;

    const monster: MonsterInstance = {
      id: `monster-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      position: spawnPos,
      rotation: 0,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      aiState: 'patrol',
      velocity: new Vector3(),
      lastAttackTime: 0,
      lastHitTime: 0,
      patrolTarget: this.randomPatrolPoint(spawnPos),
      isAlive: true,
    };

    state.addMonster(monster);
  }

  /**
   * 寻找合适的刷新位置
   * 在玩家周围 SPAWN_MIN_DISTANCE ~ SPAWN_RADIUS 的环形区域内随机取点，
   * 只要在地形边界内即视为可用，避免 raycaster 误判导致怪物刷在玩家身边。
   */
  private findSpawnPosition(playerPos: Vector3): Vector3 | null {
    for (let attempt = 0; attempt < 16; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance =
        MONSTER_SYSTEM.SPAWN_MIN_DISTANCE +
        Math.random() * (MONSTER_SYSTEM.SPAWN_RADIUS - MONSTER_SYSTEM.SPAWN_MIN_DISTANCE);
      const x = playerPos.x + Math.cos(angle) * distance;
      const z = playerPos.z + Math.sin(angle) * distance;

      const pos = new Vector3(x, 0, z);
      if (this.isInsideArena(pos)) {
        return pos;
      }
    }
    return null;
  }

  private isInsideArena(pos: Vector3): boolean {
    return (
      Math.abs(pos.x) < ARENA.WIDTH / 2 - 2 &&
      Math.abs(pos.z) < ARENA.LENGTH / 2 - 2
    );
  }

  private randomPatrolPoint(center: Vector3): Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 10;
    return new Vector3(
      MathUtils.clamp(center.x + Math.cos(angle) * distance, -ARENA.WIDTH / 2 + 2, ARENA.WIDTH / 2 - 2),
      0,
      MathUtils.clamp(center.z + Math.sin(angle) * distance, -ARENA.LENGTH / 2 + 2, ARENA.LENGTH / 2 - 2)
    );
  }

  /**
   * 更新单个怪物
   */
  private updateMonster(monster: MonsterInstance, delta: number, playerPos: Vector3): void {
    const config = MONSTER_CONFIGS[monster.type] as unknown as MonsterConfig;
    const distToPlayer = monster.position.distanceTo(playerPos);

    // 状态机
    this.updateAIState(monster, distToPlayer, config);

    // 移动
    if (monster.aiState === 'chase' || monster.aiState === 'patrol') {
      this.updateMovement(monster, delta, playerPos, config);
    }

    // 攻击
    if (monster.aiState === 'attack') {
      this.tryAttack(monster, config);
    }

    // 朝向
    const lookTarget = monster.aiState === 'patrol' ? monster.patrolTarget : playerPos;
    const targetRotation = Math.atan2(lookTarget.x - monster.position.x, lookTarget.z - monster.position.z);
    let rotDiff = targetRotation - monster.rotation;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    monster.rotation += rotDiff * Math.min(1, delta * 8);
  }

  /**
   * AI 状态机
   */
  private updateAIState(monster: MonsterInstance, distToPlayer: number, config: MonsterConfig): void {
    if (monster.aiState === 'dead') return;

    if (distToPlayer <= config.attackRange) {
      monster.aiState = 'attack';
      return;
    }

    if (distToPlayer <= MONSTER_SYSTEM.ACTIVATION_RANGE) {
      monster.aiState = 'chase';
      return;
    }

    if (distToPlayer > MONSTER_SYSTEM.LOSE_INTEREST_RANGE) {
      monster.aiState = 'patrol';
    }
  }

  /**
   * 移动逻辑（含简单避障）
   */
  private updateMovement(
    monster: MonsterInstance,
    delta: number,
    playerPos: Vector3,
    config: MonsterConfig
  ): void {
    const target = monster.aiState === 'chase' ? playerPos : monster.patrolTarget;
    const dir = tempVec.copy(target).sub(monster.position);
    dir.y = 0;
    const dist = dir.length();

    if (monster.aiState === 'patrol' && dist < MONSTER_SYSTEM.PATROL_REACHED_DISTANCE) {
      monster.patrolTarget = this.randomPatrolPoint(monster.position);
      return;
    }

    dir.normalize();

    // 简单避障：如果正前方有碰撞体，略微偏移
    const avoidance = this.calculateAvoidance(monster, dir);
    dir.add(avoidance).normalize();

    const moveSpeed = config.speed * (monster.aiState === 'chase' ? 1.0 : 0.5);
    const moveStep = dir.multiplyScalar(moveSpeed * delta);

    const newPos = monster.position.clone().add(moveStep);
    if (this.isInsideArena(newPos) && !this.isPositionBlockedByGrid(newPos, 0.35)) {
      monster.position.copy(newPos);
    }
  }

  private calculateAvoidance(monster: MonsterInstance, desiredDir: Vector3): Vector3 {
    if (!this.grid) return new Vector3();

    // 用空间网格检测附近障碍物，生成排斥力，避免每帧对所有碰撞体做射线检测
    const nearby = this.grid.querySphere(monster.position, 2.0);
    const avoid = new Vector3();
    const pos = monster.position;

    for (const box of nearby) {
      if (box.max.y <= 0.3 || box.min.y >= 1.8) continue;

      const closestX = Math.max(box.min.x, Math.min(pos.x, box.max.x));
      const closestZ = Math.max(box.min.z, Math.min(pos.z, box.max.z));
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq > 0 && distSq < 4.0) {
        const dist = Math.sqrt(distSq);
        const force = (2.0 - dist) / dist;
        avoid.x += dx * force;
        avoid.z += dz * force;
      }
    }

    return avoid;
  }

  /**
   * 基于空间网格的怪物水平碰撞检测
   */
  private isPositionBlockedByGrid(pos: Vector3, radius: number): boolean {
    if (!this.grid) return false;

    const nearby = this.grid.querySphere(pos, radius);
    for (const box of nearby) {
      if (box.max.y <= pos.y + 0.1) continue;
      if (box.min.y >= pos.y + 1.6) continue;

      const closestX = Math.max(box.min.x, Math.min(pos.x, box.max.x));
      const closestZ = Math.max(box.min.z, Math.min(pos.z, box.max.z));
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;

      if (dx * dx + dz * dz < radius * radius) return true;
    }
    return false;
  }

  /**
   * 尝试攻击玩家
   */
  private tryAttack(monster: MonsterInstance, config: MonsterConfig): void {
    const now = performance.now();
    if (now - monster.lastAttackTime < config.attackCooldown) return;

    const state = this.store.getState();
    if (performance.now() < state.player.invincibleUntil) return;

    const playerPos = state.player.position;
    const dist = monster.position.distanceTo(playerPos);
    const isDeathmatch = state.gameMode === 'deathmatch';
    const effectiveRange = isDeathmatch ? config.attackRange * 2.5 : config.attackRange;

    if (dist > effectiveRange) {
      monster.aiState = 'chase';
      return;
    }

    monster.lastAttackTime = now;

    // 远程怪 / 人机 PK 模式下所有 bot 都需要视线
    if (monster.type === 'ranger' || isDeathmatch) {
      raycaster.set(monster.position.clone().add(new Vector3(0, 1, 0)), tempVec.copy(playerPos).sub(monster.position).normalize());
      raycaster.far = config.attackRange;
      const hits = raycaster.intersectObjects(this.collisionObjects, false);
      if (hits.length > 0 && hits[0].distance < dist - 0.5) {
        return; // 被遮挡
      }
    }

    // 人机 PK 模式：发射可见子弹并造成伤害
    if (isDeathmatch) {
      this.spawnBotBullet(monster.position.clone().add(new Vector3(0, 1.2, 0)), playerPos.clone().add(new Vector3(0, 1.4, 0)));
    }

    // 应用伤害
    const newHealth = Math.max(0, state.player.health - config.damage);
    state.setPlayer({ health: newHealth });

    // 受伤反馈：音效、震动、屏幕泛红
    this.audio.playPlayerHit();
    this.audio.vibrate(80);
    state.setPlayer({ lastHitTime: performance.now() });

    if (newHealth <= 0) {
      if (isDeathmatch) {
        this.respawnPlayer();
      } else {
        this.store.setState({ isGameOver: true });
      }
    }
  }

  /**
   * 人机 PK 模式：bot 发射可见子弹（简化激光弹道）
   */
  private spawnBotBullet(start: Vector3, end: Vector3): void {
    const state = this.store.getState();
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    state.addParticle({
      id: `botbullet-${performance.now()}-${Math.random()}`,
      position: midpoint,
      velocity: new Vector3(),
      color: '#f97316',
      size: 0.08,
      lifetime: 120,
      createdAt: performance.now(),
    });
  }

  /**
   * 人机 PK 模式：玩家死亡后立即重生
   */
  private respawnPlayer(): void {
    const state = this.store.getState();
    state.incrementDeaths();
    state.setPlayer({
      health: state.player.maxHealth,
      position: ARENA.SPAWN_POINT.clone(),
      lastHitTime: performance.now(),
      invincibleUntil: performance.now() + 1500,
    });
    state.setCamera({ yaw: 0, pitch: 0 });
  }

  /**
   * 怪物受击
   */
  takeDamage(monsterId: string, damage: number, hitPoint: Vector3): boolean {
    const state = this.store.getState();
    const monster = state.monsters.find((m) => m.id === monsterId && m.isAlive);
    if (!monster) return false;

    const newHealth = monster.health - damage;
    const isDead = newHealth <= 0;

    state.updateMonster(monsterId, {
      health: Math.max(0, newHealth),
      lastHitTime: performance.now(),
      isAlive: !isDead,
      aiState: isDead ? 'dead' : monster.aiState,
    });

    if (isDead) {
      const config = MONSTER_CONFIGS[monster.type] as unknown as MonsterConfig;
      state.addScore(config.score);
      state.incrementMonstersKilled();
      if (state.gameMode === 'deathmatch') {
        state.incrementBotKills();
      }
      state.addDamageNumber(hitPoint, damage);
    }

    return isDead;
  }

  /**
   * 获取存活怪物数量
   */
  getAliveCount(): number {
    return this.store.getState().monsters.filter((m) => m.isAlive).length;
  }
}

// 简单 MathUtils 内联
const MathUtils = {
  clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
};
