import { useGameStore } from '../../stores/gameStore';
import { CAMERA } from '../../utils/constants';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Valorant 风格设置面板
 * - 鼠标灵敏度
 * - 主音量 / 音效 / 音乐
 * - 画质等级
 * - V-Sync、震动反馈
 * - 键位参考
 */
export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const settings = useGameStore((state) => state.settings);
  const setSettings = useGameStore((state) => state.setSettings);

  if (!isOpen) return null;

  const handleSensitivity = (v: number) => {
    setSettings({ mouseSensitivity: Number(v.toFixed(3)) });
  };

  const handleVolume = (key: 'masterVolume' | 'sfxVolume' | 'musicVolume', v: number) => {
    setSettings({ [key]: Number(v.toFixed(2)) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md border border-gray-700 bg-[#0f1117]/95 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-widest text-white">设置</h2>
          <button
            onClick={onClose}
            className="text-sm font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
          >
            关闭 [ESC]
          </button>
        </div>

        <div className="space-y-5">
          {/* 鼠标灵敏度 */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
              <span>鼠标灵敏度</span>
              <span className="text-white">{settings.mouseSensitivity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={CAMERA.MOUSE_SENSITIVITY_MIN}
              max={CAMERA.MOUSE_SENSITIVITY_MAX}
              step={0.01}
              value={settings.mouseSensitivity}
              onChange={(e) => handleSensitivity(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none bg-gray-700 accent-orange-500"
            />
          </div>

          {/* 音量 */}
          {(
            [
              { key: 'masterVolume', label: '主音量' },
              { key: 'sfxVolume', label: '音效音量' },
              { key: 'musicVolume', label: '音乐音量' },
            ] as { key: 'masterVolume' | 'sfxVolume' | 'musicVolume'; label: string }[]
          ).map(({ key, label }) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                <span>{label}</span>
                <span className="text-white">{Math.round((settings[key] as number) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings[key] as number}
                onChange={(e) => handleVolume(key, Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none bg-gray-700 accent-orange-500"
              />
            </div>
          ))}

          {/* 画质 */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">画质等级</div>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setSettings({ quality: q })}
                  className={`flex-1 border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    settings.quality === q
                      ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {q === 'low' ? '低' : q === 'medium' ? '中' : '高'}
                </button>
              ))}
            </div>
          </div>

          {/* 开关 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">震动反馈</span>
            <button
              onClick={() => setSettings({ enableVibration: !settings.enableVibration })}
              className={`h-5 w-10 border transition-colors ${
                settings.enableVibration ? 'border-orange-500 bg-orange-500' : 'border-gray-600 bg-gray-800'
              }`}
            >
              <span
                className={`block h-full w-1/2 bg-white transition-transform ${
                  settings.enableVibration ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">垂直同步</span>
            <button
              onClick={() => setSettings({ vSync: !settings.vSync })}
              className={`h-5 w-10 border transition-colors ${
                settings.vSync ? 'border-orange-500 bg-orange-500' : 'border-gray-600 bg-gray-800'
              }`}
            >
              <span
                className={`block h-full w-1/2 bg-white transition-transform ${
                  settings.vSync ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 键位参考 */}
          <div className="border-t border-gray-800 pt-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">键位</div>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
              <span>W / A / S / D</span> <span className="text-right text-gray-300">移动</span>
              <span>鼠标</span> <span className="text-right text-gray-300">视角</span>
              <span>左键</span> <span className="text-right text-gray-300">开火</span>
              <span>R</span> <span className="text-right text-gray-300">换弹</span>
              <span>V</span> <span className="text-right text-gray-300">切换视角</span>
              <span>1 / 2</span> <span className="text-right text-gray-300">切换武器</span>
              <span>C</span> <span className="text-right text-gray-300">重置俯仰</span>
              <span>ESC</span> <span className="text-right text-gray-300">设置</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
