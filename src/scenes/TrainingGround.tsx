import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Box,
  Plane,
  Sphere,
} from '@react-three/drei';
import { Object3D, Mesh, Group, PerspectiveCamera, Color, PCFSoftShadowMap, DirectionalLight } from 'three';
import { useGameStore } from '../stores/gameStore';
import { WeaponView } from '../components/WeaponView';
import { CharacterModel } from '../components/CharacterModel';
import { MonsterView } from '../components/MonsterView';
import { CrosshairRaycaster } from '../components/CrosshairRaycaster';
import { CharacterController } from '../systems/characterController';
import { CameraController } from '../systems/cameraController';
import { WeaponSystem } from '../systems/weaponSystem';
import { TargetSystem } from '../systems/targetSystem';
import { EffectsSystem } from '../systems/effectsSystem';
import { MonsterSystem } from '../systems/monsterSystem';
import { TutorialManager } from '../systems/tutorialManager';
import { PerformanceMonitor } from '../systems/performanceMonitor';
import { InputManager } from '../systems/inputManager';
import { AudioManager } from '../systems/audioManager';
import { CAMERA } from '../utils/constants';
import { MirageEnvironment } from './MirageEnvironment';

/**
 * 训练目标组件
 */
function TargetModels({ targetSystem }: { targetSystem: TargetSystem }) {
  const targets = useGameStore((state) => state.targets);
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {targets.map((target) => {
        const isHitRecently = target.lastHitTime && performance.now() - target.lastHitTime < 100;
        const color = isHitRecently ? '#ffffff' : target.type === 'static' ? '#ef4444' : '#ff9100';
        return (
          <group key={target.id} position={target.position.toArray()}>
            <Box
              args={[0.6, 1.0, 0.2]}
              name={`target-${target.id}`}
              castShadow
              receiveShadow
              onUpdate={(self: Object3D) => {
                if (target.isAlive) {
                  targetSystem.registerMesh(target.id, self.uuid);
                }
              }}
              visible={target.isAlive}
            >
              <meshStandardMaterial
                color={color}
                emissive={target.type === 'static' ? '#7f1d1d' : '#7c2d12'}
                roughness={0.4}
                metalness={0.1}
              />
            </Box>
            {!target.isAlive && (
              <Box args={[0.6, 0.1, 0.6]} position={[0, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                <meshStandardMaterial color="#374151" />
              </Box>
            )}
          </group>
        );
      })}
    </group>
  );
}

/**
 * 弹痕渲染
 */
/**
 * 根据用户/性能监控选择的画质等级动态调整渲染参数
 */
function QualitySettings() {
  const quality = useGameStore((state) => state.settings.quality);
  const { gl } = useThree();
  const lightRef = useRef<DirectionalLight>(null);

  useEffect(() => {
    gl.shadowMap.enabled = quality !== 'low';
    gl.shadowMap.needsUpdate = true;
  }, [quality, gl]);

  const shadowMapSize = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512;
  const lightIntensity = quality === 'high' ? 3.2 : quality === 'medium' ? 2.8 : 2.4;

  return (
    <directionalLight
      ref={lightRef}
      position={[40, 50, 20]}
      intensity={lightIntensity}
      color="#fff8e7"
      castShadow={quality !== 'low'}
      shadow-mapSize={[shadowMapSize, shadowMapSize]}
      shadow-camera-near={0.5}
      shadow-camera-far={180}
      shadow-camera-left={-60}
      shadow-camera-right={60}
      shadow-camera-top={60}
      shadow-camera-bottom={-60}
    />
  );
}

function BulletHoles() {
  const holes = useGameStore((state) => state.bulletHoles);
  const now = performance.now();

  return (
    <group>
      {holes.map((hole) => {
        const age = now - hole.createdAt;
        const opacity = Math.max(0, 1 - age / hole.lifetime);
        return (
          <Plane
            key={hole.id}
            position={hole.position.toArray()}
            rotation={[
              hole.normal.x > 0.9 ? 0 : Math.PI / 2,
              Math.atan2(hole.normal.x, hole.normal.z),
              0,
            ]}
            args={[0.12, 0.12]}
          >
            <meshBasicMaterial color="#111827" transparent opacity={opacity} depthWrite={false} />
          </Plane>
        );
      })}
    </group>
  );
}

/**
 * 粒子渲染
 */
function Particles() {
  const particles = useGameStore((state) => state.particles);

  return (
    <group>
      {particles.map((p) => (
        <Sphere key={p.id} position={p.position.toArray()} args={[p.size]}>
          <meshBasicMaterial color={p.color} transparent opacity={0.9} />
        </Sphere>
      ))}
    </group>
  );
}

/**
 * 游戏逻辑主循环
 */
function GameLoop({
  characterController,
  cameraController,
  weaponSystem,
  targetSystem,
  effectsSystem,
  tutorialManager,
  performanceMonitor,
  monsterSystem,
}: {
  characterController: CharacterController;
  cameraController: CameraController;
  weaponSystem: WeaponSystem;
  targetSystem: TargetSystem;
  effectsSystem: EffectsSystem;
  tutorialManager: TutorialManager;
  performanceMonitor: PerformanceMonitor;
  monsterSystem: MonsterSystem;
}) {
  const { camera, gl, scene } = useThree();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 绑定输入
    const input = InputManager.getInstance();
    input.attach(gl.domElement);

    // 初始化音频
    const audio = AudioManager.getInstance();
    audio.init();

    // 注册场景物体（仅用于武器命中与 TPS 相机避障；角色与怪物碰撞体由 MirageEnvironment 单独注册，避免遍历全部装饰网格）
    const sceneObjects: Object3D[] = [];
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        sceneObjects.push(child);
      }
    });
    weaponSystem.registerSceneObjects(sceneObjects);
    cameraController.registerCollisionObjects(sceneObjects);

    // 生成目标
    targetSystem.spawnInitialTargets();
    weaponSystem.setEffectsSystem(effectsSystem);
    weaponSystem.setTargetSystem(targetSystem);
    weaponSystem.setMonsterSystem(monsterSystem);

    // 启动教学
    tutorialManager.init();

    // 结束加载
    useGameStore.getState().setLoading(false, 100);

    // cleanup：组件卸载时解绑输入
    return () => {
      InputManager.getInstance().detach();
    };
  }, [gl, scene, cameraController, weaponSystem, targetSystem, characterController, tutorialManager, monsterSystem, effectsSystem]);

  useFrame((state, delta) => {
    const store = useGameStore.getState();

    // 游戏结束时暂停核心逻辑，避免结算界面持续消耗性能
    if (store.isGameOver) return;

    // 处理视角切换
    if (store.input.switchView) {
      cameraController.toggleMode();
      store.resetInputDeltas();
    }

    // 处理武器切换
    if (store.input.selectWeaponNone) {
      store.setCurrentWeapon('none');
      store.setInput({ selectWeaponNone: false });
    }
    if (store.input.selectWeaponPrimary) {
      store.setCurrentWeapon('ak47');
      store.setInput({ selectWeaponPrimary: false });
    }

    characterController.update(delta);
    cameraController.update(camera as PerspectiveCamera, delta);
    weaponSystem.update(delta, camera);
    targetSystem.update(delta);
    monsterSystem.update(delta, store.player.position);
    effectsSystem.update(delta);
    tutorialManager.update(delta);
    performanceMonitor.update(delta);

    // 鼠标增量已在 cameraController.update 中清零，此处仅重置其他增量
    useGameStore.getState().resetInputDeltas();
  });

  return null;
}

/**
 * 主场景组件
 */
export function TrainingGround() {
  const [colliders, setColliders] = useState<Object3D[]>([]);
  const systems = useMemo(() => {
    return {
      characterController: new CharacterController(),
      cameraController: new CameraController(),
      weaponSystem: new WeaponSystem(),
      targetSystem: new TargetSystem(),
      effectsSystem: new EffectsSystem(),
      monsterSystem: new MonsterSystem(),
      tutorialManager: new TutorialManager(),
      performanceMonitor: new PerformanceMonitor(),
    };
  }, []);

  useEffect(() => {
    // 兜底：确保加载状态在 1.5 秒内结束，避免卡住
    const timer = setTimeout(() => {
      useGameStore.getState().setLoading(false, 100);
    }, 1500);

    return () => {
      clearTimeout(timer);
      InputManager.getInstance().detach();
    };
  }, []);

  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%' }}
      camera={{ fov: CAMERA.FOV_TPS, near: 0.1, far: 300, position: [0, 3, -5] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(new Color('#d8c9a8'));
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = PCFSoftShadowMap;
      }}
    >
      {/* Valorant 风格明亮环境光 */}
      <ambientLight intensity={0.65} color="#fff8f0" />

      {/* 动态画质定向太阳光 */}
      <QualitySettings />

      {/* 半球光：天空暖色，地面沙色反光 */}
      <hemisphereLight args={['#fff8f0', '#c4a67a', 0.75]} />

      {/* 极淡的远景雾效，保持 Valorant 风格的高清晰度 */}
      <fog attach="fog" args={['#d8c9a8', 60, 180]} />

      <MirageEnvironment
        characterController={systems.characterController}
        monsterSystem={systems.monsterSystem}
        onCollidersReady={setColliders}
      />
      <CharacterModel />
      <WeaponView />
      <MonsterView />
      <CrosshairRaycaster colliders={colliders} />
      <TargetModels targetSystem={systems.targetSystem} />
      <BulletHoles />
      <Particles />

      <GameLoop {...systems} />
    </Canvas>
  );
}
