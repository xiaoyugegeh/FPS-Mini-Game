import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Vector3, Quaternion, Euler, MathUtils, Mesh, MeshStandardMaterial, Color } from 'three';
import { useGameStore } from '../stores/gameStore';
import { WEAPON_MODEL, WEAPON_SKINS } from '../utils/constants';

const basePosition = WEAPON_MODEL.POSITION;
const baseRotation = WEAPON_MODEL.ROTATION;
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempEuler = new Euler();

/**
 * AK-47 第一人称武器模型（Valorant 风格 viewmodel）
 * 固定在相机前方，含 idle 轻微摆动、移动晃动、左右平移倾斜、开火后坐力
 */
export function WeaponView() {
  const groupRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const { camera } = useThree();

  // 皮肤变化较少，可安全订阅；其余高频状态在 useFrame 里读取，避免重渲染
  const currentSkin = useGameStore((state) => state.currentSkin);

  const { scene } = useGLTF(WEAPON_MODEL.PATH);
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    const skin = WEAPON_SKINS.find((s) => s.id === currentSkin) ?? WEAPON_SKINS[0];

    clone.traverse((child) => {
      const mesh = child as Mesh;
      if (mesh.isMesh && mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mesh.material = materials.map((mat) => {
          if (mat instanceof MeshStandardMaterial) {
            const newMat = mat.clone();
            newMat.color.set(new Color(skin.color));
            newMat.emissive.set(new Color(skin.emissive));
            newMat.metalness = skin.metalness;
            newMat.roughness = skin.roughness;
            return newMat;
          }
          return mat;
        });
      }
    });

    return clone;
  }, [scene, currentSkin]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const state = useGameStore.getState();
    const { player, camera: camState, input } = state;
    const { currentWeapon, movementState, lastFireTime } = player;

    const visible = camState.mode === 'fps' && currentWeapon === 'ak47';
    groupRef.current.visible = visible;
    if (!visible) return;

    // 武器根节点严格跟随相机
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);

    if (!modelRef.current) return;

    const now = performance.now();
    const timeSinceFire = now - lastFireTime;
    const isMoving = movementState !== 'idle';
    const isRunning = movementState === 'run';
    const t = now * 0.001;

    // 移动晃动
    const bobFreq = isRunning ? WEAPON_MODEL.BOB_FREQUENCY_RUN : WEAPON_MODEL.BOB_FREQUENCY_WALK;
    const bobAmp = isMoving ? WEAPON_MODEL.BOB_AMPLITUDE : 0;
    const bobY = Math.abs(Math.sin(t * bobFreq)) * bobAmp;
    const bobX = Math.sin(t * bobFreq * 0.5) * bobAmp * 0.5;

    // 奔跑时明显降低武器，更接近 Valorant 持枪跑动姿态
    const runLower = isRunning ? 0.08 : 0;

    // 左右平移倾斜（A/D 时武器向移动方向倾斜）
    const strafeDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const strafeTiltZ = -strafeDir * WEAPON_MODEL.STRAFE_TILT;

    // Idle 呼吸微摆
    const idleSwayX = Math.sin(t * 0.9) * WEAPON_MODEL.IDLE_SWAY;
    const idleSwayY = Math.cos(t * 1.1) * WEAPON_MODEL.IDLE_SWAY;

    // 开火后坐力：枪身向后、上扬、带一点横向随机感
    let recoilZ = 0;
    let recoilRotX = 0;
    let recoilRotZ = 0;
    if (timeSinceFire < 180) {
      const recoilProgress = timeSinceFire / 180;
      const recoilCurve = Math.exp(-recoilProgress * WEAPON_MODEL.RECOIL_RECOVERY);
      recoilZ = -WEAPON_MODEL.RECOIL_KICK * recoilCurve;
      recoilRotX = -0.08 * recoilCurve;
      recoilRotZ = 0.02 * recoilCurve;
    }

    tempPosition.set(
      basePosition.x + bobX + idleSwayX,
      basePosition.y - bobY - runLower + idleSwayY,
      basePosition.z + recoilZ
    );

    modelRef.current.position.lerp(tempPosition, MathUtils.clamp(delta * 18, 0, 1));

    tempEuler.set(
      baseRotation.x + recoilRotX,
      baseRotation.y,
      baseRotation.z + strafeTiltZ + recoilRotZ
    );
    tempQuaternion.setFromEuler(tempEuler);
    modelRef.current.quaternion.slerp(tempQuaternion, MathUtils.clamp(delta * 18, 0, 1));
  });

  return (
    <group ref={groupRef}>
      <primitive
        ref={modelRef}
        object={clonedScene}
        scale={WEAPON_MODEL.SCALE}
        position={basePosition.toArray()}
        rotation={baseRotation.toArray()}
      />
    </group>
  );
}

// 预加载武器模型
useGLTF.preload(WEAPON_MODEL.PATH);
