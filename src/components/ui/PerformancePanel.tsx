import { useGameStore } from '../../stores/gameStore';

/**
 * 性能监控面板（开发模式）
 */
export function PerformancePanel() {
  const performance = useGameStore((state) => state.performance);
  const settings = useGameStore((state) => state.settings);

  return (
    <div className="pointer-events-none fixed left-6 top-36 rounded border border-gray-700 bg-black/60 p-3 font-mono text-[10px] text-green-400 backdrop-blur-sm">
      <div className="mb-1 text-xs font-bold text-gray-300">PERFORMANCE</div>
      <div>FPS: {performance.fps}</div>
      <div>AVG: {performance.avgFps}</div>
      <div>Frame: {performance.frameTime.toFixed(1)}ms</div>
      <div>Draw Calls: {performance.drawCalls}</div>
      <div>Triangles: {performance.triangles}</div>
      <div>Memory: {performance.memoryMB}MB</div>
      <div>Quality: {settings.quality.toUpperCase()}</div>
      <div className="mt-1 text-orange-400">鼠标灵敏度: {settings.mouseSensitivity.toFixed(2)}</div>
      <div className="text-[9px] text-gray-500">按 [ 降低 · ] 提高 · C 重置 · Q/E 转向</div>
    </div>
  );
}
