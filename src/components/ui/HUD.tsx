import { useGameStore } from '../../stores/gameStore';
import { Crosshair } from './Crosshair';

/**
 * Valorant 风格战术 HUD
 * - 简洁、高对比度、大字号关键信息
 * - 血量左下、弹药右下、波次顶部中央
 *
 * 注意：这里只订阅真正会变化的标量/对象，避免 player 对象每帧变化导致整个 HUD 重渲染。
 */
export function HUD() {
  const health = useGameStore((state) => state.player.health);
  const maxHealth = useGameStore((state) => state.player.maxHealth);
  const ammo = useGameStore((state) => state.player.ammo);
  const isReloading = useGameStore((state) => state.player.isReloading);
  const lastHitTime = useGameStore((state) => state.player.lastHitTime);
  const currentWeapon = useGameStore((state) => state.player.currentWeapon);

  const currentStage = useGameStore((state) => state.tutorial.stages[state.tutorial.currentStage]);
  const examTimeLeft = useGameStore((state) => state.examTimeLeft);

  const gameMode = useGameStore((state) => state.gameMode);
  const wave = useGameStore((state) => state.wave);
  const score = useGameStore((state) => state.score);
  const monstersKilled = useGameStore((state) => state.monstersKilled);
  const botKills = useGameStore((state) => state.botKills);
  const deaths = useGameStore((state) => state.deaths);
  const aliveMonsters = useGameStore((state) => state.monsters.filter((m) => m.isAlive).length);
  const waveInProgress = useGameStore((state) => state.waveInProgress);
  const waveCooldownEnd = useGameStore((state) => state.waveCooldownEnd);

  const cooldownLeft = Math.max(0, (waveCooldownEnd - performance.now()) / 1000);

  const healthPercent = Math.max(0, (health / maxHealth) * 100);
  const ammoText = `${ammo.toString().padStart(2, '0')} / ∞`;

  const weaponName = currentWeapon === 'ak47' ? 'VANDAL' : '无武器';
  const isLowHealth = health <= 30;
  const timeSinceHit = performance.now() - lastHitTime;
  const damageOpacity = lastHitTime > 0 ? Math.max(0, 1 - timeSinceHit / 350) * 0.45 : 0;
  const lowHealthPulse = isLowHealth ? 0.15 + Math.sin(performance.now() / 200) * 0.1 : 0;

  return (
    <>
      {/* 受伤屏幕泛红 + 低血量脉冲 */}
      <div
        className="pointer-events-none fixed inset-0 z-30 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at center, transparent 30%, rgba(220, 38, 38, ${Math.max(
            damageOpacity,
            lowHealthPulse
          )}) 100%)`,
          transition: 'background 50ms',
        }}
      />

      <Crosshair />

      {/* 顶部中央：波次与分数 / 人机 PK 计分 */}
      <div className="pointer-events-none fixed left-1/2 top-5 -translate-x-1/2 text-center">
        {gameMode === 'training' ? (
          <>
            <div className="text-xl font-black tracking-[0.2em] text-white drop-shadow-md">WAVE {wave}</div>
            <div className="mt-0.5 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-300">
              <span className="text-orange-400">存活 {aliveMonsters}</span>
              <span className="text-cyan-400">击杀 {monstersKilled}</span>
              <span className="text-green-400">得分 {score}</span>
            </div>
            {!waveInProgress && cooldownLeft > 0 && (
              <div className="mt-1 text-xs font-black uppercase tracking-widest text-orange-400">
                下一波 {cooldownLeft.toFixed(1)}s
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-xl font-black tracking-[0.2em] text-orange-400 drop-shadow-md">人机 PK</div>
            <div className="mt-0.5 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-300">
              <span className="text-cyan-400">击杀 {botKills}</span>
              <span className="text-red-400">死亡 {deaths}</span>
              <span className="text-green-400">得分 {score}</span>
            </div>
          </>
        )}
      </div>

      {/* 左上角：任务指引 */}
      <div className="pointer-events-none fixed left-5 top-5 max-w-xs">
        <div className="border-l-4 border-orange-500 bg-gray-900/85 pl-3 pr-4 py-3 backdrop-blur-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
            {currentStage?.title ?? '训练准备中'}
          </div>
          <p className="mt-0.5 text-sm font-medium leading-tight text-gray-100">{currentStage?.objective ?? ''}</p>
          <p className="mt-0.5 text-[10px] leading-tight text-gray-400">{currentStage?.description ?? ''}</p>
        </div>
      </div>

      {/* 左下角：血量 */}
      <div className="pointer-events-none fixed bottom-5 left-5">
        <div className="flex items-end gap-3">
          <div className={`text-5xl font-black tabular-nums leading-none ${isLowHealth ? 'text-red-500' : 'text-white'}`}>
            {Math.ceil(health)}
          </div>
          <div className="mb-1 w-44">
            <div className="h-2.5 w-full bg-gray-800/80">
              <div
                className={`h-full transition-all duration-150 ${
                  isLowHealth ? 'bg-red-500' : 'bg-gradient-to-r from-red-600 to-orange-500'
                }`}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">HP</span>
          </div>
        </div>
      </div>

      {/* 右下角：弹药与武器 */}
      <div className="pointer-events-none fixed bottom-5 right-5 text-right">
        <div className="text-lg font-bold tracking-widest text-cyan-400">{weaponName}</div>
        <div className="text-6xl font-black text-white tabular-nums leading-none">{ammoText}</div>
        <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
          1 无武器 · 2 AK-47 · R 换弹
        </div>
        {isReloading && (
          <div className="mt-1 text-sm font-black uppercase tracking-widest text-orange-400">换弹中</div>
        )}
        {currentStage?.id === 6 && (
          <div className="mt-1 text-2xl font-black tabular-nums text-red-500">{examTimeLeft.toFixed(1)}s</div>
        )}
      </div>
    </>
  );
}
