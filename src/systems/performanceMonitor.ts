import { WebGLRenderer } from 'three';
import { useGameStore } from '../stores/gameStore';
import { PERFORMANCE } from '../utils/constants';

/**
 * 性能监控器
 * 计算 FPS、内存，并根据帧率动态调整画质
 */
export class PerformanceMonitor {
  private store = useGameStore;
  private frameCount = 0;
  private lastFpsUpdate = performance.now();
  private fpsHistory: number[] = [];
  private lastQualityAdjust = 0;

  /**
   * 每帧调用
   */
  update(frameTime: number): void {
    const state = this.store.getState();
    const now = performance.now();

    this.frameCount++;

    // 每秒更新 FPS
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 5) this.fpsHistory.shift();

      const avgFps = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);

      // 估算内存（Chrome）
      let memoryMB = 0;
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      if (memory) {
        memoryMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }

      state.setPerformance({
        fps,
        avgFps,
        frameTime: frameTime * 1000,
        memoryMB,
      });

      this.frameCount = 0;
      this.lastFpsUpdate = now;

      // 动态画质调整
      this.adjustQuality(now, avgFps);
    }
  }

  /**
   * 根据平均 FPS 调整画质
   */
  private adjustQuality(now: number, avgFps: number): void {
    if (now - this.lastQualityAdjust < PERFORMANCE.QUALITY_ADJUST_INTERVAL) return;
    this.lastQualityAdjust = now;

    const state = this.store.getState();
    let quality = state.performance.qualityLevel;

    if (avgFps < PERFORMANCE.LOW_FPS_THRESHOLD && quality !== 'low') {
      quality = quality === 'high' ? 'medium' : 'low';
    } else if (avgFps > PERFORMANCE.TARGET_FPS && quality !== 'high') {
      quality = quality === 'low' ? 'medium' : 'high';
    }

    if (quality !== state.performance.qualityLevel) {
      state.setPerformance({ qualityLevel: quality });
      state.setSettings({ quality });
    }
  }

  /**
   * 开发模式：获取 Draw Call 与三角面数统计
   */
  updateRendererStats(renderer: WebGLRenderer): void {
    const state = this.store.getState();
    const info = renderer.info;
    state.setPerformance({
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    });
  }
}
