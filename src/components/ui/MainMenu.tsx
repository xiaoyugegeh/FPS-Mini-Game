import { useGameStore } from '../../stores/gameStore';
import type { GameMode } from '../../types';

const MODES: { id: GameMode; name: string; desc: string }[] = [
  { id: 'training', name: '训练场', desc: '靶子与怪物波次，熟悉操作与压枪' },
  { id: 'deathmatch', name: '人机 PK', desc: '与 AI 人形 bots 对抗，无限重生' },
];

/**
 * 游戏开始页面 / 主菜单
 */
export function MainMenu() {
  const gameMode = useGameStore((state) => state.gameMode);
  const setGameMode = useGameStore((state) => state.setGameMode);
  const setInMenu = useGameStore((state) => state.setInMenu);
  const resetRuntime = useGameStore((state) => state.resetRuntime);

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    resetRuntime();
    setInMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f1117]">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-orange-500 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-cyan-500 blur-[100px]" />
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-black uppercase tracking-tighter text-white sm:text-8xl">
          AIM<span className="text-orange-500">LAB</span>
        </h1>
        <p className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-gray-400">
          无畏契约风格训练场
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {MODES.map((mode) => {
            const isSelected = gameMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => startGame(mode.id)}
                className={`group relative w-64 border p-6 text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800/70'
                }`}
              >
                <div className="text-xl font-black uppercase tracking-wider text-white">{mode.name}</div>
                <p className="mt-2 text-xs font-medium leading-relaxed text-gray-400">{mode.desc}</p>
                <div className="mt-4 inline-block bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-transform group-hover:scale-105">
                  开始游戏
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 text-[10px] font-bold uppercase tracking-widest text-gray-600">
          WASD 移动 · 鼠标瞄准 · 左键开火 · R 换弹 · ESC 设置
        </div>
      </div>
    </div>
  );
}
