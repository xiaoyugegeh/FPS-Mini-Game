import { useGameStore } from '../../stores/gameStore';

const STATE_COLORS: Record<string, string> = {
  idle: '#ffffff',
  enemy: '#ef4444',
  target: '#22d3ee',
  wall: '#facc15',
};

/**
 * Valorant 风格极简动态准星
 * - 2px 细线 + 中心点
 * - 根据射线检测结果变色
 * - 换弹时扩散/变淡
 */
export function Crosshair() {
  const isReloading = useGameStore((state) => state.player.isReloading);
  const crosshairState = useGameStore((state) => state.crosshairState);

  const color = STATE_COLORS[crosshairState] ?? '#ffffff';
  const opacity = isReloading ? 0.35 : 1;
  const scale = isReloading ? 1.35 : 1;

  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          position: 'absolute',
          left: '50%',
          top: '50%',
          opacity,
          transition: 'transform 75ms, opacity 75ms',
        }}
      >
        {/* 上线 */}
        <line x1="12" y1="0" x2="12" y2="9" stroke={color} strokeWidth="2" />
        {/* 下线 */}
        <line x1="12" y1="15" x2="12" y2="24" stroke={color} strokeWidth="2" />
        {/* 左线 */}
        <line x1="0" y1="12" x2="9" y2="12" stroke={color} strokeWidth="2" />
        {/* 右线 */}
        <line x1="15" y1="12" x2="24" y2="12" stroke={color} strokeWidth="2" />
        {/* 中心点 */}
        <rect x="11" y="11" width="2" height="2" fill={color} />
      </svg>
    </div>
  );
}
