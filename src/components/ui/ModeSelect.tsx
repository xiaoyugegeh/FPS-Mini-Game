import { useGameStore } from '../../stores/gameStore';
import type { GameMode } from '../../types';

const MODES: { id: GameMode; name: string }[] = [
  { id: 'training', name: '训练场' },
  { id: 'deathmatch', name: '人机 PK' },
];

/**
 * 游戏模式切换器
 * 放在屏幕顶部显眼位置，便于快速切换
 */
export function ModeSelect() {
  const gameMode = useGameStore((state) => state.gameMode);
  const setGameMode = useGameStore((state) => state.setGameMode);
  const resetRuntime = useGameStore((state) => state.resetRuntime);

  const handleChange = (mode: GameMode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    resetRuntime();
  };

  return (
    <div className="pointer-events-auto fixed left-1/2 top-24 z-40 -translate-x-1/2">
      <div className="flex items-center gap-1 border border-gray-700 bg-gray-900/90 p-1 backdrop-blur-sm">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleChange(mode.id)}
            className={`min-w-[90px] px-4 py-2 text-sm font-black uppercase tracking-wider transition-all ${
              gameMode === mode.id
                ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {mode.name}
          </button>
        ))}
      </div>
    </div>
  );
}
