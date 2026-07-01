import { useRef, useEffect, useMemo } from 'react';
import { Box, Plane, Cylinder } from '@react-three/drei';
import { Object3D } from 'three';
import { CharacterController } from '../systems/characterController';
import { MonsterSystem } from '../systems/monsterSystem';
import { ARENA } from '../utils/constants';
import {
  createSandTexture,
  createStuccoTexture,
  createTileTexture,
  createTrimTexture,
  createWoodTexture,
  createMetalTexture,
  createStripedAwningTexture,
  createVineTexture,
  createConcreteTexture,
  createSignTexture,
} from '../utils/mirageTextures';

/**
 * CSGO 荒漠迷城（de_mirage）风格训练场环境
 *
 * 参考真实 Mirage 布局：
 * - T Spawn 位于地图后方（z ≈ -30）
 * - CT Spawn 位于地图前方（z ≈ 34）
 * - A Site / Palace 在左侧（x < 0）
 * - B Site / Apartments / Market 在右侧（x > 0）
 * - Mid / Window / Connector / Underpass 在中央
 *
 * 视觉重点：暖黄沙地、米色灰泥墙、蓝绿色瓷砖装饰、红白遮阳篷、棕榈树。
 */
export function MirageEnvironment({
  characterController,
  monsterSystem,
  onCollidersReady,
}: {
  characterController: CharacterController;
  monsterSystem: MonsterSystem;
  onCollidersReady?: (objects: Object3D[]) => void;
}) {
  const collisionObjectsRef = useRef<Object3D[]>([]);

  useEffect(() => {
    characterController.registerColliders(collisionObjectsRef.current);
    monsterSystem.registerColliders(collisionObjectsRef.current);
    onCollidersReady?.(collisionObjectsRef.current);
  }, [characterController, monsterSystem, onCollidersReady]);

  const addCollider = (obj: Object3D | null) => {
    if (obj && !collisionObjectsRef.current.includes(obj)) {
      collisionObjectsRef.current.push(obj);
    }
  };

  const {
    sandTex,
    stuccoTex,
    stuccoDarkTex,
    stuccoWarmTex,
    tileTex,
    trimTex,
    woodTex,
    metalTex,
    awningTex,
    vineTex,
    concreteTex,
    signATex,
    signBTex,
    signMidTex,
    signCTTex,
    signTTex,
  } = useMemo(() => {
    return {
      sandTex: createSandTexture(),
      stuccoTex: createStuccoTexture('#e8d5b0'),
      stuccoDarkTex: createStuccoTexture('#cbb08a'),
      stuccoWarmTex: createStuccoTexture('#f0d9a8'),
      tileTex: createTileTexture(),
      trimTex: createTrimTexture(),
      woodTex: createWoodTexture(),
      metalTex: createMetalTexture(),
      awningTex: createStripedAwningTexture(),
      vineTex: createVineTexture(),
      concreteTex: createConcreteTexture(),
      signATex: createSignTexture('A', '#ffffff', '#c53030'),
      signBTex: createSignTexture('B', '#ffffff', '#2b6cb0'),
      signMidTex: createSignTexture('MID', '#1a202c', '#f6e05e'),
      signCTTex: createSignTexture('CT', '#ffffff', '#38a169'),
      signTTex: createSignTexture('T', '#ffffff', '#dd6b20'),
    };
  }, []);

  const sandMat = <meshStandardMaterial map={sandTex} roughness={0.95} metalness={0} />;
  const stuccoMat = <meshStandardMaterial map={stuccoTex} roughness={0.9} metalness={0} />;
  const stuccoDarkMat = <meshStandardMaterial map={stuccoDarkTex} roughness={0.9} metalness={0} />;
  const stuccoWarmMat = <meshStandardMaterial map={stuccoWarmTex} roughness={0.9} metalness={0} />;
  const tileMat = <meshStandardMaterial map={tileTex} roughness={0.5} metalness={0.1} />;
  const trimMat = <meshStandardMaterial map={trimTex} roughness={0.45} metalness={0.15} />;
  const woodMat = <meshStandardMaterial map={woodTex} roughness={0.8} metalness={0} />;
  const metalMat = <meshStandardMaterial map={metalTex} roughness={0.4} metalness={0.7} />;
  const awningMat = <meshStandardMaterial map={awningTex} roughness={0.85} side={2} />;
  const vineMat = <meshStandardMaterial map={vineTex} transparent alphaTest={0.3} roughness={0.9} side={2} />;
  const concreteMat = <meshStandardMaterial map={concreteTex} roughness={0.9} metalness={0.05} />;
  const darkMat = <meshStandardMaterial color="#1f1c17" roughness={0.95} />;
  const signAMat = <meshStandardMaterial map={signATex} roughness={0.6} metalness={0.1} />;
  const signBMat = <meshStandardMaterial map={signBTex} roughness={0.6} metalness={0.1} />;
  const signMidMat = <meshStandardMaterial map={signMidTex} roughness={0.6} metalness={0.1} />;
  const signCTMat = <meshStandardMaterial map={signCTTex} roughness={0.6} metalness={0.1} />;
  const signTMat = <meshStandardMaterial map={signTTex} roughness={0.6} metalness={0.1} />;
  const palmTrunkMat = <meshStandardMaterial color="#8d6e63" roughness={0.9} />;
  const palmLeafMat = <meshStandardMaterial color="#4a7c59" roughness={0.8} side={2} />;

  // 拱门组件（用多个 Box 拼成半圆）
  const Arch = ({ x, z, width = 4, height = 4, depth = 1, rotY = 0 }: { x: number; z: number; width?: number; height?: number; depth?: number; rotY?: number }) => {
    const segments = 5;
    const r = width / 2;
    const segmentDepth = depth;
    const segmentWidth = (Math.PI * r) / segments * 0.75;
    return (
      <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
        {Array.from({ length: segments }).map((_, i) => {
          const angle = (Math.PI * (i + 0.5)) / segments;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r + height - r;
          return (
            <Box
              key={`arch-seg-${i}`}
              ref={addCollider}
              args={[segmentWidth, segmentWidth, segmentDepth]}
              position={[px, py, 0]}
              rotation={[0, 0, angle - Math.PI / 2]}
              name="arch"
              receiveShadow
            >
              {stuccoDarkMat}
            </Box>
          );
        })}
      </group>
    );
  };

  // 蓝色瓷砖腰线
  const BlueTrim = ({ x, z, w, d, rotY = 0 }: { x: number; z: number; w: number; d: number; rotY?: number }) => (
    <Box args={[w, 0.5, d]} position={[x, 1.4, z]} rotation={[0, rotY, 0]}>
      {trimMat}
    </Box>
  );

  // 区域标识牌
  const Sign = ({ x, y, z, w, h, mat, rotY = 0 }: { x: number; y: number; z: number; w: number; h: number; mat: JSX.Element; rotY?: number }) => (
    <Plane args={[w, h]} position={[x, y, z]} rotation={[0, rotY, 0]}>
      {mat}
    </Plane>
  );

  // 木箱
  const Crate = ({ x, y, z, sx = 1.4, sy = 1.4, sz = 1.4, rotY = 0 }: { x: number; y: number; z: number; sx?: number; sy?: number; sz?: number; rotY?: number }) => (
    <Box ref={addCollider} args={[sx, sy, sz]} position={[x, y, z]} rotation={[0, rotY, 0]} castShadow name="crate">
      {woodMat}
    </Box>
  );

  // 油桶
  const Barrel = ({ x, z }: { x: number; z: number }) => (
    <Cylinder ref={addCollider} args={[0.35, 0.35, 1.2]} position={[x, 0.6, z]} castShadow name="barrel">
      {metalMat}
    </Cylinder>
  );

  // 棕榈树
  const PalmTree = ({ x, z, height = 5.5 }: { x: number; z: number; height?: number }) => (
    <group position={[x, 0, z]}>
      <Cylinder args={[0.18, 0.32, height]} position={[0, height / 2, 0]} receiveShadow>
        {palmTrunkMat}
      </Cylinder>
      <group position={[0, height, 0]}>
        {[0, 90, 180, 270].map((rot, j) => (
          <Plane
            key={`leaf-${j}`}
            args={[1.6, 3.6]}
            position={[Math.sin((rot * Math.PI) / 180) * 1.1, 0.2, Math.cos((rot * Math.PI) / 180) * 1.1]}
            rotation={[Math.PI / 5, (rot * Math.PI) / 180, 0]}
          >
            {palmLeafMat}
          </Plane>
        ))}
      </group>
    </group>
  );

  // 红白条纹遮阳篷
  const Awning = ({ x, y, z, w = 4, d = 1.4, rotY = 0 }: { x: number; y: number; z: number; w?: number; d?: number; rotY?: number }) => (
    <Box args={[w, 0.12, d]} position={[x, y, z]} rotation={[0, rotY, 0]} castShadow>
      {awningMat}
    </Box>
  );

  // 墙面藤蔓装饰
  const Vine = ({ x, y, z, w = 2, h = 3, rotY = 0 }: { x: number; y: number; z: number; w?: number; h?: number; rotY?: number }) => (
    <Plane args={[w, h]} position={[x, y, z]} rotation={[0, rotY, 0]}>
      {vineMat}
    </Plane>
  );

  // 建筑组件：带拱门入口 + 蓝色腰线 + 瓷砖屋顶
  const Building = ({
    x,
    z,
    w,
    h,
    d,
    name,
    archWidth,
    archHeight,
    archZ,
    rotY = 0,
    dark = false,
    awnings,
  }: {
    x: number;
    z: number;
    w: number;
    h: number;
    d: number;
    name: string;
    archWidth?: number;
    archHeight?: number;
    archZ?: number;
    rotY?: number;
    dark?: boolean;
    awnings?: { x: number; z: number; w: number; d: number }[];
  }) => {
    const bodyMat = dark ? stuccoDarkMat : stuccoMat;
    return (
      <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
        <Box ref={addCollider} args={[w, h, d]} position={[0, h / 2, 0]} name={name} receiveShadow>
          {bodyMat}
        </Box>
        <Box args={[w + 0.2, 0.5, d + 0.2]} position={[0, 1.4, 0]}>
          {trimMat}
        </Box>
        <Box args={[w + 0.3, 0.25, d + 0.3]} position={[0, h + 0.125, 0]}>
          {tileMat}
        </Box>
        {archWidth && archHeight !== undefined && archZ !== undefined && (
          <>
            <Plane args={[archWidth, archHeight]} position={[0, archHeight / 2, archZ]}>
              {darkMat}
            </Plane>
            <Arch x={0} z={archZ - 0.2} width={archWidth + 0.8} height={archHeight + 0.4} depth={0.6} />
          </>
        )}
        {awnings?.map((a, i) => (
          <Box key={`awn-${i}`} args={[a.w, 0.12, a.d]} position={[a.x, h - 0.2, a.z]} castShadow>
            {awningMat}
          </Box>
        ))}
      </group>
    );
  };

  return (
    <group>
      {/* 沙土地面 */}
      <Plane ref={addCollider} args={[ARENA.WIDTH, ARENA.LENGTH]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow name="floor">
        {sandMat}
      </Plane>

      {/* ========== 边界围墙（带拱门出口） ========== */}
      {[
        { x: 0, z: -ARENA.LENGTH / 2 - 0.5, w: ARENA.WIDTH + 2, d: 1, gap: 12 },
        { x: 0, z: ARENA.LENGTH / 2 + 0.5, w: ARENA.WIDTH + 2, d: 1, gap: 14 },
        { x: -ARENA.WIDTH / 2 - 0.5, z: 0, w: 1, d: ARENA.LENGTH + 2, gap: 0 },
        { x: ARENA.WIDTH / 2 + 0.5, z: 0, w: 1, d: ARENA.LENGTH + 2, gap: 0 },
      ].map((wall, i) => {
        const w = wall.w as number;
        const d = wall.d as number;
        const halfW = w / 2;
        const halfGap = wall.gap / 2;
        if (wall.gap > 0 && w > d) {
          return (
            <group key={`wall-${i}`}>
              <Box
                ref={addCollider}
                args={[halfW - halfGap, ARENA.WALL_HEIGHT, d]}
                position={[-halfW + (halfW - halfGap) / 2, ARENA.WALL_HEIGHT / 2, wall.z]}
                name={`wall-${i}-l`}
                receiveShadow
              >
                {stuccoMat}
              </Box>
              <Box
                ref={addCollider}
                args={[halfW - halfGap, ARENA.WALL_HEIGHT, d]}
                position={[halfW - (halfW - halfGap) / 2, ARENA.WALL_HEIGHT / 2, wall.z]}
                name={`wall-${i}-r`}
                receiveShadow
              >
                {stuccoMat}
              </Box>
              <Arch x={0} z={wall.z - (d > w ? 0 : 0.2)} width={wall.gap + 1} height={ARENA.WALL_HEIGHT - 0.5} depth={d + 0.4} />
              <Box args={[wall.gap + 1.6, 0.5, d + 0.4]} position={[0, 1.4, wall.z]}>
                {trimMat}
              </Box>
              <Box args={[wall.gap + 1.8, 0.25, d + 0.6]} position={[0, ARENA.WALL_HEIGHT + 0.125, wall.z]}>
                {tileMat}
              </Box>
            </group>
          );
        }
        return (
          <group key={`wall-${i}`}>
            <Box ref={addCollider} args={[w, ARENA.WALL_HEIGHT, d]} position={[wall.x, ARENA.WALL_HEIGHT / 2, wall.z]} name={`wall-${i}`} receiveShadow>
              {stuccoMat}
            </Box>
            <Box args={[w, 0.5, d]} position={[wall.x, 1.4, wall.z]}>
              {trimMat}
            </Box>
            <Box args={[w + 0.2, 0.25, d + 0.2]} position={[wall.x, ARENA.WALL_HEIGHT + 0.125, wall.z]}>
              {tileMat}
            </Box>
          </group>
        );
      })}

      {/* ========== MID：Window + Connector + Underpass ========== */}
      <Sign x={0} y={4.5} z={0} w={3.5} h={1.5} mat={signMidMat} />
      <group position={[0, 0, 0]}>
        {/* Window / VIP 建筑：右侧高处狙击点 */}
        <Building x={12} z={-2} w={10} h={7} d={5} name="window-building" archWidth={3.5} archHeight={3} archZ={2.55} />
        <Box ref={addCollider} args={[3, 0.3, 2.5]} position={[12, 3.2, 0.8]} name="window-sill" receiveShadow>
          {concreteMat}
        </Box>
        <Plane args={[2.8, 1.8]} position={[12, 4.2, 0.55]}>
          {darkMat}
        </Plane>

        {/* Connector 拱门（连接 Mid 到 A） */}
        <group position={[-8, 0, 0]}>
          <Box ref={addCollider} args={[2.5, 5.5, 2.5]} position={[-2.6, 2.75, 0]} name="connector-left">
            {stuccoMat}
          </Box>
          <Box ref={addCollider} args={[2.5, 5.5, 2.5]} position={[2.6, 2.75, 0]} name="connector-right">
            {stuccoMat}
          </Box>
          <Box ref={addCollider} args={[7.8, 1.2, 2.7]} position={[0, 5.1, 0]} name="connector-lintel">
            {stuccoDarkMat}
          </Box>
          <Plane args={[4, 4]} position={[0, 2, 1.4]}>
            {darkMat}
          </Plane>
          <Arch x={0} z={1.2} width={4.8} height={4.2} depth={0.6} />
          <BlueTrim x={0} z={1.4} w={7.8} d={2.8} />
        </group>

        {/* Mid 中央箱子 */}
        <Crate x={0} y={0.75} z={4} sx={2.6} sy={1.5} sz={2.6} />

        {/* Underpass 隧道入口 */}
        <group position={[0, 0, -10]}>
          <Box ref={addCollider} args={[9, 3, 1]} position={[-8.5, 1.5, 0]} name="underpass-left">
            {stuccoDarkMat}
          </Box>
          <Box ref={addCollider} args={[9, 3, 1]} position={[8.5, 1.5, 0]} name="underpass-right">
            {stuccoDarkMat}
          </Box>
          <Box ref={addCollider} args={[8, 0.8, 1]} position={[0, 2.7, 0]} name="underpass-roof">
            {stuccoMat}
          </Box>
          <Plane args={[8, 2.4]} position={[0, 1.2, 0.55]}>
            {darkMat}
          </Plane>
          <Arch x={0} z={0.4} width={8} height={2.8} depth={0.6} />
          <BlueTrim x={0} z={0.55} w={18} d={1.1} />
        </group>
      </group>

      {/* ========== A SITE ========== */}
      <Sign x={-20} y={2.5} z={10} w={3} h={1.5} mat={signAMat} />
      <group position={[-20, 0, 10]}>
        {/* Palace 主体建筑 */}
        <Building x={-4} z={-3} w={16} h={5.5} d={11} name="palace" archWidth={4.5} archHeight={3.8} archZ={5.55} dark />
        {/* Palace 阳台 */}
        <Box ref={addCollider} args={[8, 0.25, 2.2]} position={[-4, 3.6, 6.1]} name="palace-balcony" receiveShadow>
          {concreteMat}
        </Box>
        <Box args={[8.2, 0.15, 2.4]} position={[-4, 3.75, 6.1]}>
          {tileMat}
        </Box>
        <Box args={[0.15, 1.2, 2.2]} position={[-8.1, 4.2, 6.1]}>
          {stuccoDarkMat}
        </Box>
        <Box args={[0.15, 1.2, 2.2]} position={[0.1, 4.2, 6.1]}>
          {stuccoDarkMat}
        </Box>
        <Vine x={-6} y={3.5} z={5.6} w={2.5} h={3} />

        {/* A site 平台 */}
        <Box ref={addCollider} args={[16, 0.6, 14]} position={[3, 0.3, 4]} name="a-site" receiveShadow>
          {concreteMat}
        </Box>
        <Box args={[15.7, 0.05, 13.7]} position={[3, 0.625, 4]}>
          {sandMat}
        </Box>
        <Box args={[16.2, 0.2, 14.2]} position={[3, 0.1, 4]}>
          {tileMat}
        </Box>

        {/* A Ramp */}
        <Box ref={addCollider} args={[4, 0.4, 8]} position={[3, 0.2, -4]} rotation={[-0.1, 0, 0]} name="a-ramp">
          {concreteMat}
        </Box>

        {/* Tetris */}
        <group position={[-1, 0.75, 2]}>
          <Crate x={0} y={0} z={0} sx={1.5} sy={1.5} sz={1.5} />
          <Crate x={1.6} y={0} z={0} sx={1.5} sy={1.5} sz={1.5} />
          <Crate x={0.8} y={1.5} z={0} sx={1.5} sy={1.5} sz={1.5} />
        </group>

        {/* Default box */}
        <Crate x={7} y={0.9} z={6} sx={2.2} sy={1.8} sz={2.2} />

        {/* Triple box */}
        <group position={[3, 0.6, 8]}>
          <Crate x={0} y={0} z={0} sx={1.4} sy={1.2} sz={1.4} />
          <Crate x={0} y={1.2} z={0} sx={1.4} sy={1.2} sz={1.4} />
          <Crate x={0} y={2.4} z={0} sx={1.4} sy={1.2} sz={1.4} />
        </group>

        {/* Firebox / Ninja corner */}
        <Crate x={9} y={0.9} z={0} sx={1.5} sy={1.8} sz={1.5} />
      </group>

      {/* ========== B SITE ========== */}
      <Sign x={20} y={2.5} z={10} w={3} h={1.5} mat={signBMat} />
      <group position={[20, 0, 10]}>
        {/* Apartments 两层楼 */}
        <Building x={4} z={-3} w={14} h={6.5} d={11} name="apartments" archWidth={3.5} archHeight={4} archZ={5.55} dark />
        {/* 二楼窗户 + 阳台 */}
        <Box ref={addCollider} args={[10, 0.25, 1.6]} position={[4, 3.6, 6]} name="apartments-balcony" receiveShadow>
          {concreteMat}
        </Box>
        <Plane args={[2.2, 2.2]} position={[-1, 4.3, 5.6]}>
          {darkMat}
        </Plane>
        <Plane args={[2.2, 2.2]} position={[9, 4.3, 5.6]}>
          {darkMat}
        </Plane>
        <Awning x={-1} y={5.5} z={6.2} w={3} d={1.2} />
        <Awning x={9} y={5.5} z={6.2} w={3} d={1.2} />

        {/* B site 平台 */}
        <Box ref={addCollider} args={[16, 0.6, 14]} position={[-2, 0.3, 4]} name="b-site" receiveShadow>
          {concreteMat}
        </Box>
        <Box args={[15.7, 0.05, 13.7]} position={[-2, 0.625, 4]}>
          {sandMat}
        </Box>
        <Box args={[16.2, 0.2, 14.2]} position={[-2, 0.1, 4]}>
          {tileMat}
        </Box>

        {/* Van */}
        <Box ref={addCollider} args={[3.2, 1.7, 2]} position={[-2, 1.25, 6]} name="b-van" receiveShadow>
          {metalMat}
        </Box>
        <Box args={[3.3, 0.15, 2.1]} position={[-2, 0.075, 6]}>
          {darkMat}
        </Box>

        {/* Default */}
        <Crate x={-6} y={0.9} z={2} sx={2.2} sy={1.8} sz={2.2} />

        {/* Market / Kitchen */}
        <group position={[-2, 0, 16]}>
          <Box ref={addCollider} args={[8, 3, 4]} position={[0, 1.5, 0]} name="market-building">
            {stuccoWarmMat}
          </Box>
          <Plane args={[2.5, 2.4]} position={[0, 1.5, 2.05]}>
            {darkMat}
          </Plane>
          <Arch x={0} z={1.85} width={3} height={2.6} depth={0.6} />
          <Box args={[8.4, 0.2, 4.4]} position={[0, 3.1, 0]}>
            {tileMat}
          </Box>
          <Box args={[8, 0.15, 3]} position={[0, 2.8, 3]} receiveShadow>
            {awningMat}
          </Box>
          <BlueTrim x={0} z={2.05} w={8.4} d={4.2} />
        </group>
      </group>

      {/* ========== CT SPAWN ========== */}
      <Sign x={0} y={3.5} z={34} w={3} h={1.5} mat={signCTMat} />
      <group position={[0, 0, 34]}>
        <Building x={0} z={0} w={30} h={4.5} d={6} name="ct-building" archWidth={4} archHeight={3.2} archZ={3.05} />
        {[-9, 0, 9].map((x, i) => (
          <Box key={`ct-pillar-${i}`} ref={addCollider} args={[1.2, 4.5, 1.2]} position={[x, 2.25, 3.5]} name={`ct-pillar-${i}`} receiveShadow>
            {stuccoDarkMat}
          </Box>
        ))}
        <Vine x={-12} y={2.5} z={3.1} w={2} h={3} />
        <Vine x={12} y={2.5} z={3.1} w={2} h={3} rotY={Math.PI} />
      </group>

      {/* ========== T SPAWN ========== */}
      <Sign x={0} y={3} z={-30} w={3} h={1.5} mat={signTMat} />
      <group position={[0, 0, -30]}>
        <Box ref={addCollider} args={[7, 1.4, 2.2]} position={[-8, 0.7, 6]} name="t-cover-left" receiveShadow>
          {woodMat}
        </Box>
        <Box ref={addCollider} args={[7, 1.4, 2.2]} position={[8, 0.7, 6]} name="t-cover-right" receiveShadow>
          {woodMat}
        </Box>
        <Box ref={addCollider} args={[2.2, 1.4, 6]} position={[0, 0.7, 8]} name="t-cover-center" receiveShadow>
          {woodMat}
        </Box>
        <Crate x={-4} y={0.6} z={10} sx={1.4} sy={1.2} sz={1.4} />
        <Crate x={4} y={0.6} z={10} sx={1.4} sy={1.2} sz={1.4} />
        <Barrel x={0} z={12} />
      </group>

      {/* ========== 装饰柱子 ========== */}
      {[
        [-14, -10], [14, -10], [-10, 25], [10, 25],
      ].map(([x, z], i) => (
        <Box key={`pillar-${i}`} ref={addCollider} args={[1.2, 4.8, 1.2]} position={[x, 2.4, z]} receiveShadow name={`pillar-${i}`}>
          {stuccoDarkMat}
        </Box>
      ))}

      {/* ========== 棕榈树 ========== */}
      {[
        [-26, -25], [26, -25], [-28, 5], [28, 5],
        [-24, 35], [24, 35], [-10, -35], [10, -35],
      ].map(([x, z], i) => (
        <PalmTree key={`palm-${i}`} x={x} z={z} height={5 + Math.random() * 1.5} />
      ))}

      {/* ========== 油桶 ========== */}
      {[
        [-10, -18], [10, -18], [-20, 0], [20, 0],
        [-14, 25], [14, 25], [0, -5],
      ].map(([x, z], i) => (
        <Barrel key={`barrel-${i}`} x={x} z={z} />
      ))}

      {/* ========== 区域标记 ========== */}
      {ARENA.ZONE_MARKERS.map((marker, idx) => (
        <group key={idx} position={[marker.position.x, 0.06, marker.position.z]}>
          <Cylinder args={[marker.radius, marker.radius, 0.02, 32]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={marker.stage === 6 ? '#c53030' : '#2c7a7b'} transparent opacity={0.5} />
          </Cylinder>
        </group>
      ))}

      {/* 暖色点光源：模拟午后阳光反射 */}
      <pointLight position={[-18, 5, 10]} intensity={2.5} distance={22} color="#ffcc80" castShadow={false} />
      <pointLight position={[18, 5, 10]} intensity={2.5} distance={22} color="#ffcc80" castShadow={false} />
      <pointLight position={[0, 4, 34]} intensity={2} distance={20} color="#ffe0b2" castShadow={false} />
      <pointLight position={[12, 5, 0]} intensity={2} distance={18} color="#ffe0b2" castShadow={false} />
      <pointLight position={[-8, 5, 0]} intensity={2} distance={18} color="#ffe0b2" castShadow={false} />
    </group>
  );
}
