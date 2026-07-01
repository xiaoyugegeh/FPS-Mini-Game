import { useGameStore } from '../../stores/gameStore';
import { WEAPON_SKINS } from '../../utils/constants';

interface SkinPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 武器皮肤选择面板
 */
export function SkinPanel({ isOpen, onClose }: SkinPanelProps) {
  const currentSkin = useGameStore((state) => state.currentSkin);
  const setCurrentSkin = useGameStore((state) => state.setCurrentSkin);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg border border-gray-700 bg-[#0f1117]/95 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-widest text-white">武器皮肤</h2>
          <button
            onClick={onClose}
            className="text-sm font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
          >
            关闭
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {WEAPON_SKINS.map((skin) => {
            const isSelected = currentSkin === skin.id;
            return (
              <button
                key={skin.id}
                onClick={() => setCurrentSkin(skin.id)}
                className={`relative border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                }`}
              >
                <div
                  className="mb-3 h-16 w-full border border-gray-600"
                  style={{
                    background: `linear-gradient(135deg, ${skin.color}, ${skin.emissive})`,
                  }}
                />
                <div className={`text-sm font-black uppercase tracking-wider ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                  {skin.name}
                </div>
                {isSelected && (
                  <div className="absolute right-2 top-2 text-xs font-bold text-orange-500">已装备</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
