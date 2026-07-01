import { Vector3, Raycaster, Camera, Object3D, Vector2 } from 'three';
import { useGameStore } from '../stores/gameStore';
import { WEAPON } from '../utils/constants';
import { AudioManager } from './audioManager';
import { EffectsSystem } from './effectsSystem';
import { TargetSystem } from './targetSystem';
import { MonsterSystem } from './monsterSystem';
import { RecoilSystem } from './recoilSystem';


const raycaster = new Raycaster();

/**
 * 武器系统
 * 处理射击、换弹、弹药与命中判定
 */
export class WeaponSystem {
  private store = useGameStore;
  private audio = AudioManager.getInstance();
  private effects: EffectsSystem | null = null;
  private targetSystem: TargetSystem | null = null;
  private monsterSystem: MonsterSystem | null = null;
  private reloadStartTime = 0;
  private reloadHandled = false;
  private sceneObjects: Object3D[] = [];
  private recoilSystem = new RecoilSystem();

  setEffectsSystem(effects: EffectsSystem): void {
    this.effects = effects;
  }

  setTargetSystem(targetSystem: TargetSystem): void {
    this.targetSystem = targetSystem;
  }

  setMonsterSystem(monsterSystem: MonsterSystem): void {
    this.monsterSystem = monsterSystem;
  }

  registerSceneObjects(objects: Object3D[]): void {
    this.sceneObjects = objects;
  }

  /**
   * 每帧更新
   */
  update(delta: number, camera: Camera): void {
    const state = this.store.getState();
    if (state.isPaused) return;

    this.recoilSystem.update(delta);
    this.handleReload();

    if (state.input.fire) {
      this.tryFire(camera);
    }
  }

  /**
   * 尝试开火
   */
  private tryFire(camera: Camera): void {
    const state = this.store.getState();
    const now = performance.now();

    if (state.player.currentWeapon === 'none') return;
    if (state.player.isReloading) return;
    if (now - state.player.lastFireTime < WEAPON.FIRE_RATE) return;
    if (state.player.ammo <= 0) {
      this.startReload();
      return;
    }

    // 无限弹药：不减少当前弹匣与备弹
    state.setPlayer({
      lastFireTime: now,
    });
    state.setCombat({ shotsFired: state.combat.shotsFired + 1 });

    // 音效与震动
    this.audio.playFire();
    this.audio.vibrate(15);

    // 计算后坐力偏移并应用到相机视角
    const recoil = this.recoilSystem.fire();
    const store = this.store.getState();
    store.setCamera({
      pitch: store.camera.pitch - recoil.y,
      yaw: store.camera.yaw - recoil.x,
    });

    // 从屏幕中心 + 后坐力偏移处发射射线
    raycaster.setFromCamera(new Vector2(-recoil.x * 12, recoil.y * 12), camera);
    raycaster.far = WEAPON.RANGE;

    const sceneHits = raycaster.intersectObjects(this.sceneObjects, true);
    const monsterHit = this.checkMonsterHit(raycaster.ray);

    // 选择最近的命中点
    const sceneDistance = sceneHits.length > 0 ? sceneHits[0].distance : Infinity;
    const monsterDistance = monsterHit ? monsterHit.distance : Infinity;

    if (monsterHit && monsterDistance <= sceneDistance) {
      // 命中怪物：爆头一枪死，身体 40
      const damage = monsterHit.isHeadshot ? 1000 : 40;
      this.monsterSystem?.takeDamage(monsterHit.monsterId, damage, monsterHit.point);
      state.setCombat({
        shotsHit: state.combat.shotsHit + 1,
        totalDamage: state.combat.totalDamage + damage,
      });
      state.incrementConsecutiveHits();
      state.addDamageNumber(monsterHit.point, damage);
      this.audio.playHitPlastic();
      return;
    }

    if (sceneHits.length > 0) {
      const hit = sceneHits[0];
      const materialType = this.detectMaterial(hit.object);
      this.effects?.spawnBulletImpact(hit.point, hit.face?.normal ?? new Vector3(0, 1, 0), materialType);

      // 命中训练目标判定
      const targetHit = this.targetSystem?.checkHit(hit.object.uuid);
      if (targetHit) {
        state.setCombat({
          shotsHit: state.combat.shotsHit + 1,
          totalDamage: state.combat.totalDamage + WEAPON.DAMAGE,
        });
        state.incrementConsecutiveHits();
        state.addDamageNumber(hit.point, WEAPON.DAMAGE);
        this.audio.playHitPlastic();
      } else {
        state.resetConsecutiveHits();
        // 根据材质播放不同命中音效
        switch (materialType) {
          case 'metal':
            this.audio.playHitMetal();
            break;
          case 'concrete':
            this.audio.playHitConcrete();
            break;
          default:
            this.audio.playHitConcrete();
        }
      }
    }
  }

  /**
   * 检查射线是否命中怪物
   */
  private checkMonsterHit(ray: Raycaster['ray']): { monsterId: string; point: Vector3; distance: number; isHeadshot: boolean } | null {
    if (!this.monsterSystem) return null;

    const state = this.store.getState();
    let bestHit: { monsterId: string; point: Vector3; distance: number; isHeadshot: boolean } | null = null;

    for (const monster of state.monsters) {
      if (!monster.isAlive) continue;

      const center = monster.position.clone().add(new Vector3(0, 0.9, 0));
      const toCenter = center.clone().sub(ray.origin);
      const t = toCenter.dot(ray.direction);
      if (t < 0) continue;

      const closestPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
      const distToRay = closestPoint.distanceTo(center);

      // 根据怪物体型设定命中半径
      const radius = monster.type === 'tank' ? 0.7 : 0.35;
      if (distToRay > radius) continue;

      // 爆头判定：命中高度在头部区域（脚底 +1.45m 以上）
      const headHeight = monster.position.y + 1.45;
      const isHeadshot = closestPoint.y >= headHeight;

      const hitPoint = closestPoint.clone();
      if (!bestHit || t < bestHit.distance) {
        bestHit = { monsterId: monster.id, point: hitPoint, distance: t, isHeadshot };
      }
    }

    return bestHit;
  }

  /**
   * 开始换弹
   */
  startReload(): void {
    const state = this.store.getState();
    if (state.player.isReloading) return;
    if (state.player.ammo >= state.player.magazineSize) return;
    if (state.player.totalAmmo <= 0) return;

    state.setPlayer({ isReloading: true });
    this.reloadStartTime = performance.now();
    this.reloadHandled = false;
    this.audio.playReload();
  }

  /**
   * 处理换弹计时
   */
  private handleReload(): void {
    const state = this.store.getState();
    if (!state.player.isReloading) {
      if (state.input.reload) {
        this.startReload();
      }
      return;
    }

    if (this.reloadHandled) return;

    if (performance.now() - this.reloadStartTime >= WEAPON.RELOAD_TIME) {
      const needed = state.player.magazineSize - state.player.ammo;
      const taken = Math.min(needed, state.player.totalAmmo);
      state.setPlayer({
        ammo: state.player.ammo + taken,
        totalAmmo: state.player.totalAmmo - taken,
        isReloading: false,
      });
      this.reloadHandled = true;
    }
  }

  /**
   * 根据对象名或材质判断材质类型
   */
  private detectMaterial(object: Object3D): import('../types').MaterialType {
    const name = object.name.toLowerCase();
    if (name.includes('metal') || name.includes('weapon') || name.includes('barrel')) return 'metal';
    if (name.includes('target') || name.includes('plastic') || name.includes('dummy')) return 'plastic';
    if (name.includes('fabric') || name.includes('cloth')) return 'fabric';
    return 'concrete';
  }

  /**
   * 获取枪口闪光位置（简化：从相机前方）
   */
  getMuzzlePosition(camera: Camera): Vector3 {
    const dir = new Vector3();
    camera.getWorldDirection(dir);
    return camera.position.clone().add(dir.multiplyScalar(0.8));
  }
}
