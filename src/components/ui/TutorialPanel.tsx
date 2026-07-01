import { useGameStore } from '../../stores/gameStore';

/**
 * 教学引导覆盖层
 * 显示当前阶段任务、操作提示与动态引导
 */
export function TutorialPanel() {
  // 只订阅当前阶段对象，避免 tutorial 对象每帧更新触发重渲染
  const currentStage = useGameStore(
    (state) => state.tutorial.stages[state.tutorial.currentStage]
  );

  if (!currentStage) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 -translate-x-1/2">
      <div className="border border-orange-500/30 bg-gray-900/90 px-8 py-4 text-center backdrop-blur-sm">
        <h3 className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
          当前任务
        </h3>
        <p className="text-lg font-semibold text-white">{currentStage.objective}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
          <KeyHint keyName="WASD" label="移动" />
          <KeyHint keyName="Shift" label="奔跑" />
          <KeyHint keyName="空格" label="跳跃" />
          <KeyHint keyName="鼠标" label="瞄准" />
          <KeyHint keyName="左键" label="开火" />
          <KeyHint keyName="R" label="换弹" />
          <KeyHint keyName="C" label="重置视角" />
          <KeyHint keyName="Q/E" label="快速转向" />
          <KeyHint keyName="V" label="切换视角" />
        </div>
      </div>
    </div>
  );
}

function KeyHint({ keyName, label }: { keyName: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="rounded border border-gray-600 bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-gray-200">
        {keyName}
      </span>
      <span>{label}</span>
    </div>
  );
}
