import { Vector3 } from 'three';
import { useGameStore } from '../stores/gameStore';
import { ARENA } from '../utils/constants';
import { saveSaveData } from '../utils/localStorage';
import { AudioManager } from './audioManager';

/**
 * 新手引导管理器
 * 处理 7 个教学阶段的进度判定与提示
 */
export class TutorialManager {
  private store = useGameStore;
  private audio = AudioManager.getInstance();
  private aimTimer = 0;
  private lastHintTime = 0;

  /**
   * 初始化教学状态
   */
  init(): void {
    const state = this.store.getState();
    state.setTutorial({
      startTime: performance.now(),
      stageStartTime: performance.now(),
    });
  }

  /**
   * 每帧更新阶段判定
   */
  update(delta: number): void {
    const state = this.store.getState();
    if (state.isPaused || state.isGameOver) return;

    const tutorial = state.tutorial;
    const stage = tutorial.currentStage;

    // 更新空闲时间
    state.setTutorial({ idleTime: tutorial.idleTime + delta * 1000 });

    // 智能提示
    this.handleSmartHints();

    // 阶段判定
    switch (stage) {
      case 0:
        this.checkMovementStage();
        break;
      case 1:
        this.checkAimStage(delta);
        break;
      case 2:
        this.checkShootStage();
        break;
      case 3:
        this.checkReloadStage();
        break;
      case 4:
        this.checkCoverStage();
        break;
      case 5:
        this.checkPrecisionStage();
        break;
      case 6:
        this.checkExamStage(delta);
        break;
    }
  }

  /**
   * 阶段 1：移动至橙色区域
   */
  private checkMovementStage(): void {
    const state = this.store.getState();
    const marker = ARENA.ZONE_MARKERS.find((z) => z.stage === 0);
    if (!marker) return;

    const dist = state.player.position.distanceTo(marker.position);
    if (dist < marker.radius) {
      this.completeStage(0);
    }
  }

  /**
   * 阶段 2：瞄准蓝色目标保持 2 秒
   */
  private checkAimStage(delta: number): void {
    const state = this.store.getState();
    const marker = ARENA.ZONE_MARKERS.find((z) => z.stage === 1);
    if (!marker) return;

    const playerPos = state.player.position;
    const targetPos = marker.position.clone().add(new Vector3(0, 1.5, 0));
    const dirToTarget = targetPos.sub(playerPos).normalize();

    const cameraDir = new Vector3(
      Math.sin(state.camera.yaw) * Math.cos(state.camera.pitch),
      Math.sin(state.camera.pitch),
      Math.cos(state.camera.yaw) * Math.cos(state.camera.pitch)
    ).normalize();

    const dot = cameraDir.dot(dirToTarget);
    if (dot > 0.92) {
      this.aimTimer += delta;
      if (this.aimTimer >= 2) {
        this.completeStage(1);
        this.aimTimer = 0;
      }
    } else {
      this.aimTimer = Math.max(0, this.aimTimer - delta * 0.5);
    }
  }

  /**
   * 阶段 3：击毁 3 个固定靶
   */
  private checkShootStage(): void {
    const state = this.store.getState();
    const destroyed = state.targetsDestroyed;
    if (destroyed >= 3) {
      this.completeStage(2);
    }
  }

  /**
   * 阶段 4：完成 1 次换弹并击毁目标
   */
  private checkReloadStage(): void {
    const state = this.store.getState();
    const reloadedOnce = state.combat.shotsFired > state.player.magazineSize;
    const destroyed = state.targetsDestroyed;
    if (reloadedOnce && destroyed >= 4) {
      this.completeStage(3);
    }
  }

  /**
   * 阶段 5：穿越掩体区域
   */
  private checkCoverStage(): void {
    const state = this.store.getState();
    const marker = ARENA.ZONE_MARKERS.find((z) => z.stage === 4);
    if (!marker) return;

    const dist = state.player.position.distanceTo(marker.position);
    if (dist < marker.radius) {
      this.completeStage(4);
    }
  }

  /**
   * 阶段 6：连续命中移动靶 5 次
   */
  private checkPrecisionStage(): void {
    const state = this.store.getState();
    if (state.consecutiveHits >= 5) {
      this.completeStage(5);
    }
  }

  /**
   * 阶段 7：60 秒内击毁所有考核目标
   */
  private checkExamStage(delta: number): void {
    const state = this.store.getState();
    const nextTime = state.examTimeLeft - delta;
    state.setExamTimeLeft(Math.max(0, nextTime));

    const aliveTargets = state.targets.filter((t) => t.id.startsWith('target-exam') && t.isAlive).length;
    if (aliveTargets === 0) {
      this.completeStage(6);
      state.setGameOver(true);
      return;
    }

    if (nextTime <= 0) {
      state.setGameOver(true);
      state.setTutorial({ failCount: state.tutorial.failCount + 1 });
    }
  }

  /**
   * 完成指定阶段
   */
  private completeStage(stageId: number): void {
    const state = this.store.getState();
    if (state.tutorial.stages[stageId]?.completed) return;

    state.completeStage(stageId);
    this.audio.playStageComplete();
    this.lastHintTime = performance.now();

    // 保存进度
    const completed = state.tutorial.stages.map((s) => s.completed);
    saveSaveData({
      currentStage: state.tutorial.currentStage,
      stagesCompleted: completed,
    });
  }

  /**
   * 智能提示：根据空闲时间动态提示
   */
  private handleSmartHints(): void {
    const state = this.store.getState();
    const stage = state.tutorial.stages[state.tutorial.currentStage];
    if (!stage || stage.completed) return;

    const now = performance.now();
    const freq = Math.max(3000, stage.hintFrequency - state.tutorial.failCount * 1000);
    if (now - this.lastHintTime > freq) {
      // 提示频率通过 UI 读取 idleTime 与 failCount 动态展示
      this.lastHintTime = now;
    }
  }
}
