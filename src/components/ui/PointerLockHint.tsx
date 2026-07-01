import { useEffect, useState } from 'react';

/**
 * 鼠标锁定提示
 * 当指针未锁定时显示，引导玩家点击画面进入 FPS 控制
 */
export function PointerLockHint() {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const update = () => setIsLocked(document.pointerLockElement !== null);
    update();
    document.addEventListener('pointerlockchange', update);
    return () => document.removeEventListener('pointerlockchange', update);
  }, []);

  if (isLocked) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="border border-violet-500/35 bg-gray-900/90 px-8 py-6 text-center">
        <div className="mb-2 text-xl font-bold uppercase tracking-widest text-white">
          点击画面进入训练
        </div>
        <p className="text-sm text-gray-400">
          左键点击锁定鼠标，获得 1:1 跟手 FPS 瞄准体验
        </p>
        <p className="mt-2 text-xs text-gray-500">
          WASD 移动 · Shift 奔跑 · 空格跳跃 · 鼠标瞄准 · 左键开火
        </p>
        <p className="mt-1 text-xs text-gray-500">
          换弹 R · 切换视角 V · 重置视角 C · 快速转向 Q/E · 灵敏度 [ / ] · ESC 释放鼠标
        </p>
      </div>
    </div>
  );
}
