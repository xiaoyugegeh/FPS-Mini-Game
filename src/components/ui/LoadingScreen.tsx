import { useGameStore } from '../../stores/gameStore';

/**
 * 加载页
 */
export function LoadingScreen() {
  const progress = useGameStore((state) => state.loadingProgress);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f1117]">
      <div className="mb-8 text-4xl font-black uppercase tracking-[0.3em] text-white">
        <span className="text-violet-500">V</span>ALORANT
      </div>
      <div className="text-sm uppercase tracking-widest text-orange-400">新手训练场</div>

      <div className="mt-12 w-80">
        <div className="mb-2 flex justify-between text-xs text-gray-400">
          <span>加载资源</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-orange-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-500">点击画面进入训练并锁定鼠标</p>
    </div>
  );
}
