import * as THREE from 'three';
import type { FamousMountainDef } from '../GuangdongTerrain3D';

/**
 * ============================================================================
 * 华夏名山极巅 · 奠基天石台座与伴生碎石群 (Mythic Pedestal Rock & Scree Field)
 * ============================================================================
 * 为神兵定岳提供实体花岗岩/赤壁玄石基座，剑尖精准刺入玄石中央凹槽，
 * 消除凭空悬插与突兀漂浮感，并产生真实伴生自然崩解碎石环。
 */
export function buildMythicPedestalGroup(m: FamousMountainDef): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MythicMountainPedestalGroup';

  // 根据名山类别选定天石岩质
  let rockColor = 0x3E3C38; // 花岗岩苍黛
  let emissiveColor = 0x1A1510;
  if (m.id === 'danxia' || m.geology.includes('丹霞') || m.geology.includes('砂砾岩')) {
    rockColor = 0x6E2C22; // 赤壁红砂岩
    emissiveColor = 0x220A05;
  } else if (m.id === 'yingxi' || m.geology.includes('喀斯特')) {
    rockColor = 0x565A5C; // 灰白喀斯特灰岩
    emissiveColor = 0x141618;
  }

  const rockMat = new THREE.MeshStandardMaterial({
    color: rockColor,
    roughness: 0.86,
    metalness: 0.08,
    emissive: new THREE.Color(emissiveColor),
    emissiveIntensity: 0.30,
    envMapIntensity: 1.2,
    flatShading: true,
    side: THREE.DoubleSide
  });

  // 1. 主奠基天石：具有多面体自然切角的花岗岩巨石 (中心带有神兵插入裂槽)
  const mainRockGeom = new THREE.DodecahedronGeometry(0.0092, 1);
  const posAttr = mainRockGeom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i++) {
    let px = posAttr.getX(i);
    let py = posAttr.getY(i);
    let pz = posAttr.getZ(i);

    // 展平底盘，拔高顶峰与雕琢凹凸
    if (py < 0) {
      py *= 0.35; // 平整底座稳固贴地
    } else {
      py *= 1.15; // 顶部雄浑微耸
    }

    // 凹陷中央槽位 (神兵入石槽口)
    const distXZ = Math.hypot(px, pz);
    if (distXZ < 0.0028 && py > 0.005) {
      py -= 0.0024; // 凹槽让神兵刺入
    }

    // 微量风化裂纹扰动
    px += Math.sin(py * 200.0) * 0.0004;
    pz += Math.cos(py * 200.0) * 0.0004;

    posAttr.setXYZ(i, px, py, pz);
  }
  mainRockGeom.computeVertexNormals();

  const mainRockMesh = new THREE.Mesh(mainRockGeom, rockMat);
  mainRockMesh.name = 'PedestalMainRock';
  mainRockMesh.position.set(0, 0.0035, 0);
  mainRockMesh.castShadow = true;
  mainRockMesh.receiveShadow = true;
  group.add(mainRockMesh);

  // 2. 伴生崩解碎石群 (模拟神兵天降刺石产生的碎石环)
  const debrisCoords = [
    { x: 0.011, z: 0.007, scale: 0.0026, rot: 0.4 },
    { x: -0.010, z: 0.008, scale: 0.0022, rot: 1.2 },
    { x: 0.006, z: -0.011, scale: 0.0028, rot: 2.1 },
    { x: -0.008, z: -0.009, scale: 0.0019, rot: 3.0 },
    { x: 0.014, z: -0.003, scale: 0.0020, rot: 0.8 }
  ];

  const debrisGeom = new THREE.DodecahedronGeometry(1.0, 0);
  debrisCoords.forEach((d, idx) => {
    const dMesh = new THREE.Mesh(debrisGeom, rockMat);
    dMesh.name = `DebrisRock_${idx}`;
    dMesh.scale.set(d.scale, d.scale * 0.75, d.scale);
    dMesh.position.set(d.x, 0.0015, d.z);
    dMesh.rotation.set(d.rot, d.rot * 1.5, d.rot * 0.7);
    dMesh.castShadow = true;
    dMesh.receiveShadow = true;
    group.add(dMesh);
  });

  return group;
}
