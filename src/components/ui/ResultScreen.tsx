import { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { saveSaveData } from '../../utils/localStorage';

/**
 * 结算界面
 */
export function ResultScreen() {
  const store = useGameStore();
  const combat = store.combat;

  useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  const accuracy = combat.shotsFired > 0 ? Math.round((combat.shotsHit / combat.shotsFired) * 100) : 0;
  const survived = store.player.health > 0;
  const finalScore = store.score + combat.totalDamage;

  const handleRestart = () => {
    store.resetRuntime();
    store.resetTutorial();
    saveSaveData({ currentStage: 0, stagesCompleted: new Array(7).fill(false) });
    // 不需要刷新页面，resetRuntime 已重置所有运行时状态
  };

  const handleBackToMenu = () => {
    store.setInMenu(true);
    store.resetRuntime();
    store.resetTutorial();
    saveSaveData({ currentStage: 0, stagesCompleted: new Array(7).fill(false) });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md border border-violet-500/40 bg-gray-900/95 p-8 text-center">
        <h2 className={`text-3xl font-black uppercase tracking-widest ${survived ? 'text-green-400' : 'text-red-400'}`}>
          {survived ? '生存成功' : '生存失败'}
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
          <Stat label="波次" value={store.wave.toString()} />
          <Stat label="击杀" value={store.monstersKilled.toString()} />
          <Stat label="命中率" value={`${accuracy}%`} />
          <Stat label="得分" value={Math.round(finalScore).toString()} />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleRestart}
            className="border border-orange-500 bg-orange-500/10 px-8 py-3 text-sm font-bold uppercase tracking-widest text-orange-400 transition-colors hover:bg-orange-500 hover:text-white"
          >
            重新开始训练
          </button>
          <button
            onClick={handleBackToMenu}
            className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-white"
          >
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-700 bg-gray-800/50 p-3">
      <div className="text-xs uppercase tracking-wider text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}
