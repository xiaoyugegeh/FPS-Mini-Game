import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, MathUtils } from 'three';
import { useGameStore } from '../stores/gameStore';
import { ARENA } from '../utils/constants';

const BLUE_GRAY = '#1e293b';
const DARK = '#0f172a';
const ACCENT = '#6366f1';

/**
 * 重新设计的玩家角色模型
 * 第三人称视角下可见，含行走/奔跑/开火动画
 */
export function CharacterModel() {
  const groupRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const weaponRef = useRef<Group>(null);

  useEffect(() => {
    useGameStore.getState().setPlayer({ position: ARENA.SPAWN_POINT.clone() });
  }, []);

  // 只订阅变化频率极低的当前武器，其余 player 运行时状态在 useFrame 里读取，
  // 避免每帧 setPlayer 触发整个角色模型重渲染。
  const currentWeapon = useGameStore((state) => state.player.currentWeapon);

  // 不在组件顶部订阅 player 状态，避免每帧 setPlayer 触发 React 重渲染。
  // 所有运行时数据都在 useFrame 里通过 getState() 读取。
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const state = useGameStore.getState();
    const { position, velocity, movementState, currentWeapon, lastFireTime } = state.player;
    const cameraMode = state.camera.mode;

    const isMoving = movementState !== 'idle';
    const isRunning = movementState === 'run';
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    const t = performance.now() * 0.001;

    // FPS 模式下完全隐藏角色模型，避免遮挡第一人称视角
    const isFps = cameraMode === 'fps';
    groupRef.current.visible = !isFps;
    const targetScale = isFps ? 0.001 : 1;
    groupRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.2);

    // 角色朝向速度方向（第三人称）
    if (speed > 0.1) {
      const targetYaw = Math.atan2(velocity.x, velocity.z);
      const currentYaw = groupRef.current.rotation.y;
      let diff = targetYaw - currentYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y = MathUtils.lerp(currentYaw, currentYaw + diff, MathUtils.clamp(delta * 12, 0, 1));
    }

    // 整体位置
    groupRef.current.position.copy(position);

    // 行走/奔跑步态动画
    const freq = isRunning ? 12 : 8;
    const amp = isRunning ? 0.55 : 0.4;
    const legSwing = isMoving ? Math.sin(t * freq) * amp : 0;
    const bobY = isMoving ? Math.abs(Math.sin(t * freq)) * (isRunning ? 0.08 : 0.05) : 0;

    if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
    if (torsoRef.current) {
      torsoRef.current.position.y = MathUtils.lerp(torsoRef.current.position.y, bobY, MathUtils.clamp(delta * 15, 0, 1));
    }

    // 开火武器后坐力（第三人称）
    if (weaponRef.current && currentWeapon === 'ak47') {
      const timeSinceFire = performance.now() - lastFireTime;
      const recoilKick = timeSinceFire < 120 ? Math.exp(-timeSinceFire * 0.04) * 0.15 : 0;
      weaponRef.current.rotation.x = MathUtils.lerp(weaponRef.current.rotation.x, -recoilKick, MathUtils.clamp(delta * 20, 0, 1));
    }
  });

  return (
    <group ref={groupRef}>
      {/* 根节点位置为脚底，角色总高约 1.75 */}

      {/* 躯干组（用于上下晃动） */}
      <group ref={torsoRef}>
        {/* 腿部 */}
        <group ref={leftLegRef} position={[-0.14, 0.375, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
            <meshStandardMaterial color={DARK} roughness={0.8} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.14, 0.375, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
            <meshStandardMaterial color={DARK} roughness={0.8} />
          </mesh>
        </group>

        {/* 躯干 */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <capsuleGeometry args={[0.22, 0.55, 4, 12]} />
          <meshStandardMaterial color={BLUE_GRAY} roughness={0.6} metalness={0.3} />
        </mesh>

        {/* 装甲高光条 */}
        <mesh position={[0, 1.1, 0.16]} castShadow>
          <boxGeometry args={[0.28, 0.08, 0.04]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.3} roughness={0.4} />
        </mesh>

        {/* 头部 */}
        <group position={[0, 1.55, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={BLUE_GRAY} roughness={0.5} metalness={0.2} />
          </mesh>
          {/* visor */}
          <mesh position={[0, 0.02, 0.12]}>
            <boxGeometry args={[0.2, 0.08, 0.05]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
          </mesh>
        </group>

        {/* 左臂 */}
        <mesh position={[-0.32, 1.05, 0.12]} rotation={[0.2, 0, 0.15]} castShadow>
          <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
          <meshStandardMaterial color={BLUE_GRAY} roughness={0.7} />
        </mesh>

        {/* 右臂 + 武器 */}
        <group position={[0.32, 1.05, 0.12]} rotation={[0.2, 0, -0.15]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
            <meshStandardMaterial color={BLUE_GRAY} roughness={0.7} />
          </mesh>
          {currentWeapon === 'ak47' && (
            <group ref={weaponRef} position={[0, -0.25, 0.2]} rotation={[0, Math.PI / 2, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.1, 0.14, 0.65]} />
                <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
              </mesh>
              {/* 弹匣 */}
              <mesh position={[0, -0.12, 0.12]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[0.08, 0.2, 0.12]} />
                <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.5} />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  );
}
