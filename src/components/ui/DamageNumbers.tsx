import { useGameStore } from '../../stores/gameStore';

/**
 * 伤害数字渲染
 */
export function DamageNumbers() {
  const damageNumbers = useGameStore((state) => state.combat.damageNumbers);
  const now = performance.now();

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {damageNumbers.map((dn) => {
        const age = now - dn.createdAt;
        const progress = age / dn.lifetime;
        const opacity = Math.max(0, 1 - progress);
        const yOffset = -progress * 40;

        // 简化为屏幕中心附近，实际应做世界坐标投影
        return (
          <div
            key={dn.id}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-black text-orange-400"
            style={{
              transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
              opacity,
              textShadow: '0 0 8px rgba(255, 87, 34, 0.8)',
            }}
          >
            {dn.value}
          </div>
        );
      })}
    </div>
  );
}
