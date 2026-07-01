import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import { useGameStore } from '../stores/gameStore';
import { MONSTER_CONFIGS } from '../utils/constants';
import type { MonsterInstance, MonsterConfig } from '../types';

function HumanoidMesh({ monster, config }: { monster: MonsterInstance; config: MonsterConfig }) {
  const groupRef = useRef<Group>(null);
  const lastFlashRef = useRef(0);

  const baseColor = config.color;
  const isTank = monster.type === 'tank';
  const scale = config.scale * (isTank ? 1.15 : 1.0);

  // 共享材质：每个 bot 只有一份身体材质，大幅减少材质数量与每帧更新开销
  const bodyMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.1,
        roughness: 0.6,
        metalness: 0.2,
      }),
    [baseColor]
  );
  const weaponMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#334155',
        roughness: 0.4,
        metalness: 0.8,
      }),
    []
  );
  const healthBgMaterial = useMemo(
    () => new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.6 }),
    []
  );
  const healthFgMaterial = useMemo(() => new MeshBasicMaterial({ color: '#22c55e' }), []);

  useEffect(() => {
    return () => {
      bodyMaterial.dispose();
      weaponMaterial.dispose();
      healthBgMaterial.dispose();
      healthFgMaterial.dispose();
    };
  }, [bodyMaterial, weaponMaterial, healthBgMaterial, healthFgMaterial]);

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.position.copy(monster.position);
    groupRef.current.position.y = scale * 0.05;
    groupRef.current.rotation.y = monster.rotation;
    groupRef.current.scale.setScalar(scale);

    // 受击闪烁：只在闪烁期间更新材质，避免每帧遍历所有子网格
    const timeSinceHit = performance.now() - monster.lastHitTime;
    const flash = timeSinceHit < 120 ? 1 - timeSinceHit / 120 : 0;
    if ((flash > 0 || lastFlashRef.current > 0) && bodyMaterial) {
      bodyMaterial.emissiveIntensity = 0.1 + flash * 2;
      lastFlashRef.current = flash;
    }
  });

  return (
    <group ref={groupRef} name={`monster-${monster.id}`}>
      {/* 头部 */}
      <mesh position={[0, 1.65, 0]} material={bodyMaterial} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
      </mesh>

      {/* 躯干 */}
      <mesh position={[0, 1.05, 0]} material={bodyMaterial} castShadow>
        <boxGeometry args={[0.45, 0.7, 0.25]} />
      </mesh>

      {/* 左臂 */}
      <mesh position={[-0.32, 1.05, 0]} material={bodyMaterial} castShadow>
        <boxGeometry args={[0.12, 0.65, 0.12]} />
      </mesh>

      {/* 右臂 */}
      <mesh position={[0.32, 1.05, 0.1]} material={bodyMaterial} castShadow>
        <boxGeometry args={[0.12, 0.65, 0.12]} />
      </mesh>

      {/* 武器 */}
      <mesh position={[0.32, 0.85, 0.35]} rotation={[0, 0, -0.1]} material={weaponMaterial} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.55]} />
      </mesh>

      {/* 左腿 */}
      <mesh position={[-0.14, 0.35, 0]} material={bodyMaterial} castShadow>
        <boxGeometry args={[0.16, 0.7, 0.16]} />
      </mesh>

      {/* 右腿 */}
      <mesh position={[0.14, 0.35, 0]} material={bodyMaterial} castShadow>
        <boxGeometry args={[0.16, 0.7, 0.16]} />
      </mesh>

      {/* 血条背景 */}
      <mesh position={[0, 2.05 * scale, 0]} material={healthBgMaterial}>
        <planeGeometry args={[0.8, 0.1]} />
      </mesh>
      {/* 血条前景 */}
      <mesh
        position={[
          -0.4 * (1 - monster.health / monster.maxHealth),
          2.05 * scale,
          0.01,
        ]}
        material={healthFgMaterial}
      >
        <planeGeometry args={[0.8 * (monster.health / monster.maxHealth), 0.08]} />
      </mesh>
    </group>
  );
}

/**
 * 怪物渲染组件（人形 bot）
 */
export function MonsterView() {
  const monsters = useGameStore((state) => state.monsters);

  return (
    <>
      {monsters.map((monster) => {
        const config = MONSTER_CONFIGS[monster.type] as unknown as MonsterConfig;
        return <HumanoidMesh key={monster.id} monster={monster} config={config} />;
      })}
    </>
  );
}
