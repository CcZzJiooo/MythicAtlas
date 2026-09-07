import * as THREE from 'three';
import { DestinationItem } from '../types';

/**
 * 3D 山海经上古神兽真身系统 (Procedural 3D Animated Mythical Guardians)
 * 根据当前地标城市的守护神兽，动态生成具有东方传奇美学与骨骼流体动画的 3D 神兽真身：
 * 1. 鲲鹏 (Kunpeng - 鹏程万里·云海天鹏)
 * 2. 烛龙 (Zhulong - 烛照九阴·太阳金龙)
 * 3. 九尾天狐 (Jiuwei Fox - 青丘灵魅·九尾仙狐)
 * 4. 麒麟 (Qilin - 踏云衔瑞·盛世天麟)
 * 5. 凤凰 (Fenghuang - 百鸟之王·涅槃神凤)
 * 6. 灵鹿 / 夫诸 (Linglu / Fuzhu - 澄泉辟水·通天神鹿)
 */

export class MythicBeast3D {
  public group: THREE.Group;
  private currentBeastType: string = '';
  private animatedParts: {
    object: THREE.Object3D;
    initialPos: THREE.Vector3;
    initialRot: THREE.Euler;
    type: 'wing_left' | 'wing_right' | 'tail' | 'spine_segment' | 'whisker' | 'halo' | 'foxfire' | 'antler_bloom' | 'flame_particle';
    speed: number;
    phase: number;
    amplitude: number;
  }[] = [];

  private auraParticles: THREE.Points | null = null;
  private auraUniforms: { uTime: { value: number }; uColor: { value: THREE.Color } } = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#FFD700') }
  };

  private basePlatform: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false; // Initially hidden until summoned / switched to beast mode

    // 1. 神兽悬浮法阵基台 (Sacred Astrolabe Platform)
    this.basePlatform = this.createSacredPlatform();
    this.group.add(this.basePlatform);
  }

  /**
   * 创建八卦八宝悬浮鎏金法阵
   */
  private createSacredPlatform(): THREE.Group {
    const platform = new THREE.Group();
    platform.position.y = -1.2;

    // 1. 八卦法阵外环
    const ringGeo = new THREE.RingGeometry(1.6, 1.75, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D4AF37'),
      emissive: new THREE.Color('#B7791F'),
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    platform.add(ring);

    // 2. 内部阴阳太极金盘
    const innerRingGeo = new THREE.RingGeometry(0.8, 0.9, 32);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
    platform.add(innerRing);

    // 3. 悬浮四方定星柱
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const colGeo = new THREE.OctahedronGeometry(0.08, 0);
      const colMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FAF089'),
        emissive: new THREE.Color('#D69E2E'),
        emissiveIntensity: 2.0,
        metalness: 0.95,
        roughness: 0.1
      });
      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.position.set(Math.cos(angle) * 1.68, 0.15, Math.sin(angle) * 1.68);
      platform.add(colMesh);
    }

    return platform;
  }

  /**
   * 根据当前城市匹配神兽并动态构建 3D 模型
   */
  public summonBeast(dest: DestinationItem) {
    const beastName = dest.guardian.name;
    const beastType = this.normalizeBeastType(beastName);

    // If same beast already built, just update color theme
    if (this.currentBeastType === beastType && this.group.children.length > 1) {
      this.updateColors(dest.colorTheme.primary, dest.colorTheme.glow);
      return;
    }

    this.currentBeastType = beastType;
    this.clearBeast();

    // Build specific 3D Mythical Beast
    switch (beastType) {
      case 'kunpeng':
        this.buildKunpeng(dest);
        break;
      case 'zhulong':
      case 'dragon':
        this.buildZhulong(dest);
        break;
      case 'fox':
        this.buildJiuweiFox(dest);
        break;
      case 'qilin':
      case 'xiezhi':
        this.buildQilin(dest);
        break;
      case 'fenghuang':
      case 'bifang':
      case 'bird':
        this.buildFenghuang(dest);
        break;
      case 'linglu':
      default:
        this.buildLinglu(dest);
        break;
    }

    // Build Beast Aura Particles
    this.buildAuraParticles(dest);
  }

  private normalizeBeastType(name: string): string {
    if (name.includes('鹏') || name.includes('豚') || name.includes('鲛') || name.includes('鲤')) return 'kunpeng';
    if (name.includes('龙') || name.includes('烛') || name.includes('霸下') || name.includes('鳌') || name.includes('龟') || name.includes('鳄')) return 'zhulong';
    if (name.includes('羊') || name.includes('狐') || name.includes('九尾')) return 'fox';
    if (name.includes('狮') || name.includes('虎') || name.includes('麟') || name.includes('獬') || name.includes('泽') || name.includes('吼')) return 'qilin';
    if (name.includes('凤') || name.includes('毕方') || name.includes('鸾') || name.includes('鹄') || name.includes('帝江') || name.includes('鹅') || name.includes('鹤') || name.includes('雷') || name.includes('鸟')) return 'fenghuang';
    return 'linglu';
  }

  /**
   * 1. 鲲鹏 (Kunpeng) - 展翼三千里，击水化巨鹏
   */
  private buildKunpeng(dest: DestinationItem) {
    const beastGroup = new THREE.Group();
    beastGroup.name = 'beast_mesh';

    const primaryColor = new THREE.Color(dest.colorTheme.primary || '#1A365D');
    const glowColor = new THREE.Color(dest.colorTheme.glow || '#63B3ED');

    // 材质
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.15,
      metalness: 0.85,
      emissive: primaryColor.clone().multiplyScalar(0.4),
      emissiveIntensity: 0.8
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      metalness: 0.6,
      side: THREE.DoubleSide
    });

    // 1. 主鱼身 (Fluid Whale-Bird Fuselage)
    const bodyGeo = new THREE.CylinderGeometry(0.08, 0.48, 2.6, 24, 8);
    bodyGeo.rotateZ(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    beastGroup.add(body);

    // 头部
    const headGeo = new THREE.SphereGeometry(0.46, 24, 24);
    headGeo.scale(1.4, 0.8, 0.9);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(1.2, 0.05, 0);
    beastGroup.add(head);

    // 灵目 (Luminous Eyes)
    for (const side of [-1, 1]) {
      const eyeGeo = new THREE.OctahedronGeometry(0.07, 0);
      const eyeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FAF089'),
        emissive: new THREE.Color('#FAF089'),
        emissiveIntensity: 4.0
      });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(1.6, 0.15, side * 0.32);
      beastGroup.add(eye);
    }

    // 2. 左巨翼 (Left Celestial Wing)
    const wingLeftGroup = new THREE.Group();
    wingLeftGroup.position.set(0.3, 0.2, 0.4);

    const wingGeo = new THREE.ConeGeometry(0.85, 2.4, 8);
    wingGeo.rotateX(Math.PI / 2);
    wingGeo.scale(1.2, 0.08, 1.0);
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(0, 0, 1.1);
    wingLeftGroup.add(leftWing);

    beastGroup.add(wingLeftGroup);
    this.animatedParts.push({
      object: wingLeftGroup,
      initialPos: wingLeftGroup.position.clone(),
      initialRot: wingLeftGroup.rotation.clone(),
      type: 'wing_left',
      speed: 2.2,
      phase: 0,
      amplitude: 0.35
    });

    // 3. 右巨翼 (Right Celestial Wing)
    const wingRightGroup = new THREE.Group();
    wingRightGroup.position.set(0.3, 0.2, -0.4);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0, 0, -1.1);
    wingRightGroup.add(rightWing);

    beastGroup.add(wingRightGroup);
    this.animatedParts.push({
      object: wingRightGroup,
      initialPos: wingRightGroup.position.clone(),
      initialRot: wingRightGroup.rotation.clone(),
      type: 'wing_right',
      speed: 2.2,
      phase: 0,
      amplitude: 0.35
    });

    // 4. 游弋巨尾 (Undulating Tail Flukes)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(-1.3, 0, 0);

    const tailFinGeo = new THREE.BoxGeometry(0.8, 0.04, 1.2);
    const tailFin = new THREE.Mesh(tailFinGeo, wingMat);
    tailFin.position.set(-0.4, 0, 0);
    tailGroup.add(tailFin);

    beastGroup.add(tailGroup);
    this.animatedParts.push({
      object: tailGroup,
      initialPos: tailGroup.position.clone(),
      initialRot: tailGroup.rotation.clone(),
      type: 'tail',
      speed: 2.5,
      phase: 1.2,
      amplitude: 0.4
    });

    this.group.add(beastGroup);
  }

  /**
   * 2. 烛龙 / 苍龙 (Zhulong / Celestial Dragon) - 48段正弦盘旋游龙
   */
  private buildZhulong(dest: DestinationItem) {
    const beastGroup = new THREE.Group();
    beastGroup.name = 'beast_mesh';

    const primaryColor = new THREE.Color(dest.colorTheme.primary || '#9C4221');
    const glowColor = new THREE.Color(dest.colorTheme.glow || '#FAF089');

    const scaleMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.9,
      roughness: 0.18,
      emissive: primaryColor.clone().multiplyScalar(0.35),
      emissiveIntensity: 0.6
    });

    const hornMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 3.5,
      metalness: 0.95,
      roughness: 0.05
    });

    // 龙身 36 节分段联动
    const segmentCount = 36;
    for (let i = 0; i < segmentCount; i++) {
      const t = i / segmentCount;
      const radius = Math.sin(t * Math.PI) * 0.32 + 0.08;
      const segGeo = new THREE.TorusGeometry(radius, 0.06, 12, 16);
      const segMesh = new THREE.Mesh(segGeo, scaleMat);

      const angle = t * Math.PI * 3.0;
      const posX = Math.cos(angle) * (1.2 - t * 0.8);
      const posY = (0.5 - t) * 1.8;
      const posZ = Math.sin(angle) * (1.2 - t * 0.8);

      segMesh.position.set(posX, posY, posZ);
      segMesh.lookAt(posX + Math.sin(angle), posY, posZ - Math.cos(angle));

      beastGroup.add(segMesh);
      this.animatedParts.push({
        object: segMesh,
        initialPos: segMesh.position.clone(),
        initialRot: segMesh.rotation.clone(),
        type: 'spine_segment',
        speed: 1.8,
        phase: i * 0.22,
        amplitude: 0.25
      });
    }

    // 龙头 (Dragon Head & Crown)
    const headGroup = new THREE.Group();
    headGroup.position.set(1.2, 0.8, 0);

    const dragonSkull = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 8), scaleMat);
    dragonSkull.rotation.z = -Math.PI / 2;
    headGroup.add(dragonSkull);

    // 龙角 (Stag Antler Horns)
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.06, 0.6, 8), hornMat);
      horn.position.set(-0.1, 0.35, side * 0.22);
      horn.rotation.z = -0.4;
      horn.rotation.x = side * 0.4;
      headGroup.add(horn);
    }

    // 炽热龙珠 / 太阳神石 (Solar Pearl of Zhulong)
    const pearl = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FFFFFF'),
        emissive: new THREE.Color('#FAF089'),
        emissiveIntensity: 4.5
      })
    );
    pearl.position.set(0.7, 0.1, 0);
    headGroup.add(pearl);

    beastGroup.add(headGroup);
    this.animatedParts.push({
      object: headGroup,
      initialPos: headGroup.position.clone(),
      initialRot: headGroup.rotation.clone(),
      type: 'whisker',
      speed: 1.6,
      phase: 0,
      amplitude: 0.15
    });

    this.group.add(beastGroup);
  }

  /**
   * 3. 九尾天狐 (Nine-Tailed Fox) - 九尾翩跹，狐火环绕
   */
  private buildJiuweiFox(dest: DestinationItem) {
    const beastGroup = new THREE.Group();
    beastGroup.name = 'beast_mesh';

    const primaryColor = new THREE.Color(dest.colorTheme.primary || '#D93829');
    const glowColor = new THREE.Color(dest.colorTheme.glow || '#FAF089');

    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.6,
      roughness: 0.3,
      emissive: primaryColor.clone().multiplyScalar(0.4),
      emissiveIntensity: 0.9
    });

    const tailMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.88,
      roughness: 0.2
    });

    // 狐身
    const bodyGeo = new THREE.ConeGeometry(0.42, 1.4, 16);
    bodyGeo.rotateZ(Math.PI / 2.3);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0);
    beastGroup.add(body);

    // 狐头与尖耳
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 8), bodyMat);
    head.position.set(0.65, 0.35, 0);
    head.rotation.z = -Math.PI / 3;
    beastGroup.add(head);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 4), tailMat);
      ear.position.set(0.6, 0.68, side * 0.18);
      ear.rotation.z = -0.2;
      ear.rotation.x = side * 0.3;
      beastGroup.add(ear);
    }

    // 九束灵动天狐尾 (9 Undulating Celestial Tails)
    const tailAngles = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8];
    tailAngles.forEach((angle, index) => {
      const tailGroup = new THREE.Group();
      tailGroup.position.set(-0.55, 0.1, 0);

      const tailMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.18, 1.6, 12, 4),
        tailMat
      );
      tailMesh.position.set(-0.7, 0.6, 0);
      tailMesh.rotation.z = Math.PI / 2.8 + (index % 3) * 0.15;
      tailMesh.rotation.y = angle * 1.6;
      tailGroup.add(tailMesh);

      beastGroup.add(tailGroup);
      this.animatedParts.push({
        object: tailGroup,
        initialPos: tailGroup.position.clone(),
        initialRot: tailGroup.rotation.clone(),
        type: 'tail',
        speed: 1.8 + index * 0.15,
        phase: index * 0.4,
        amplitude: 0.35
      });
    });

    // 环绕狐火 (Foxfire Orbs)
    for (let i = 0; i < 3; i++) {
      const orbGeo = new THREE.OctahedronGeometry(0.1, 0);
      const orbMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#38EF7D'),
        emissive: new THREE.Color('#38EF7D'),
        emissiveIntensity: 4.0
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      beastGroup.add(orb);

      this.animatedParts.push({
        object: orb,
        initialPos: new THREE.Vector3(0, 0.6, 0),
        initialRot: new THREE.Euler(),
        type: 'foxfire',
        speed: 1.5,
        phase: (i * Math.PI * 2) / 3,
        amplitude: 1.2
      });
    }

    this.group.add(beastGroup);
  }

  /**
   * 4. 麒麟 / 獬豸 (Qilin / Sacred Chimera) - 踏星踩云，圣兽威仪
   */
  private buildQilin(dest: DestinationItem) {
    const beastGroup = new THREE.Group();
    beastGroup.name = 'beast_mesh';

    const primaryColor = new THREE.Color(dest.colorTheme.primary || '#D4AF37');
    const glowColor = new THREE.Color(dest.colorTheme.glow || '#ECC94B');

    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.88,
      roughness: 0.2,
      emissive: primaryColor.clone().multiplyScalar(0.4),
      emissiveIntensity: 1.2
    });

    const hornMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 3.5
    });

    // 兽身
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.8), bodyMat);
    body.position.set(0, 0.3, 0);
    beastGroup.add(body);

    // 四足踏云
    const legOffsets = [
      [0.6, -0.4, 0.35],
      [0.6, -0.4, -0.35],
      [-0.6, -0.4, 0.35],
      [-0.6, -0.4, -0.35]
    ];
    legOffsets.forEach(pos => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 8), bodyMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      beastGroup.add(leg);

      const hoof = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), hornMat);
      hoof.position.set(pos[0], pos[1] - 0.4, pos[2]);
      beastGroup.add(hoof);
    });

    // 独角/双角兽首
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 8), bodyMat);
    head.position.set(0.9, 0.85, 0);
    head.rotation.z = -Math.PI / 4;
    beastGroup.add(head);

    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.08, 0.7, 8), hornMat);
    horn.position.set(0.95, 1.35, 0);
    horn.rotation.z = -0.3;
    beastGroup.add(horn);

    this.group.add(beastGroup);
  }

  /**
   * 5. 凤凰 / 毕方 (Fenghuang / Vermilion Phoenix) - 浴火舒翼，九霄长鸣
   */
  private buildFenghuang(dest: DestinationItem) {
    const beastGroup = new THREE.Group();
    beastGroup.name = 'beast_mesh';

    const primaryColor = new THREE.Color(dest.colorTheme.primary || '#E53E3E');
    const glowColor = new THREE.Color(dest.colorTheme.glow || '#FAF089');

    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.7,
      roughness: 0.25,
      emissive: primaryColor.clone().multiplyScalar(0.6),
      emissiveIntensity: 1.5
    });

    const featherMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 2.8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    // 凤身与凤首
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), bodyMat);
    body.scale.set(1.5, 0.8, 0.8);
    beastGroup.add(body);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 8), bodyMat);
    head.position.set(0.65, 0.45, 0);
    head.rotation.z = -Math.PI / 3;
    beastGroup.add(head);

    // 凤冠 (Sun Crest)
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), featherMat);
    crest.position.set(0.65, 0.8, 0);
    beastGroup.add(crest);

    // 凤翼 (Left & Right Wings)
    for (const side of [-1, 1]) {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(0.1, 0.2, side * 0.3);

      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.0, 6), featherMat);
      wing.position.set(0, 0, side * 1.0);
      wing.rotation.x = (side * Math.PI) / 2;
      wing.scale.set(1.4, 0.08, 1.0);
      wingGroup.add(wing);

      beastGroup.add(wingGroup);
      this.animatedParts.push({
        object: wingGroup,
        initialPos: wingGroup.position.clone(),
        initialRot: wingGroup.rotation.clone(),
        type: side === 1 ? 'wing_left' : 'wing_right',
        speed: 2.4,
        phase: 0,
        amplitude: 0.4
      });
    }

    // 飘逸凤尾 (5 Streaming Tail Ribbons)
    for (let i = -2; i <= 2; i++) {
      const ribbonGroup = new THREE.Group();
      ribbonGroup.position.set(-0.6, -0.1, 0);

      const ribbon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.12, 2.2, 8),
        featherMat
      );
      ribbon.position.set(-1.0, -0.4, i * 0.18);
      ribbon.rotation.z = Math.PI / 2.6;
      ribbonGroup.add(ribbon);

      beastGroup.add(ribbonGroup);
      this.animatedParts.push({
        object: ribbonGroup,
        initialPos: ribbonGroup.position.clone(),
        initialRot: ribbonGroup.rotation.clone(),
        type: 'tail',
        speed: 1.8 + Math.abs(i) * 0.2,
        phase: i * 0.3,
        amplitude: 0.35
      });
    }

    this.group.add(beastGroup);
  }

  /**
   * 6. 灵鹿 / 夫诸 (Linglu / Spirit Stag) - 澄泉辟水，玉角生花
   */
  private buildLinglu(dest: DestinationItem) {
    const beastGroup = new THREE.Group();
    beastGroup.name = 'beast_mesh';

    const primaryColor = new THREE.Color(dest.colorTheme.primary || '#2D7A68');
    const glowColor = new THREE.Color(dest.colorTheme.glow || '#48BB78');

    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.65,
      roughness: 0.3,
      emissive: primaryColor.clone().multiplyScalar(0.4),
      emissiveIntensity: 1.0
    });

    const antlerMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 3.5,
      metalness: 0.95
    });

    // 鹿身
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.4, 16), bodyMat);
    body.rotation.z = Math.PI / 2;
    beastGroup.add(body);

    // 纤细四足
    const legCoords = [
      [0.5, -0.5, 0.25],
      [0.5, -0.5, -0.25],
      [-0.5, -0.5, 0.25],
      [-0.5, -0.5, -0.25]
    ];
    legCoords.forEach(pos => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.0, 8), bodyMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      beastGroup.add(leg);
    });

    // 鹿首
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 8), bodyMat);
    head.position.set(0.7, 0.65, 0);
    head.rotation.z = -Math.PI / 3.5;
    beastGroup.add(head);

    // 晶莹神树鹿角 (Blooming Crystal Antlers)
    for (const side of [-1, 1]) {
      const antler = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 8, 16, Math.PI), antlerMat);
      antler.position.set(0.65, 1.05, side * 0.2);
      antler.rotation.y = side * 0.4;
      antler.rotation.z = 0.5;
      beastGroup.add(antler);
    }

    this.group.add(beastGroup);
  }

  /**
   * 构建神兽专属环绕星尘灵气粒子 (Aura Vortex)
   */
  private buildAuraParticles(dest: DestinationItem) {
    if (this.auraParticles) {
      this.group.remove(this.auraParticles);
      this.auraParticles.geometry.dispose();
    }

    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const randomness = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 1.6;
      const y = (Math.random() - 0.5) * 2.2;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * radius;

      randomness[i * 3] = Math.random();
      randomness[i * 3 + 1] = Math.random();
      randomness[i * 3 + 2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomness, 3));

    const glowColor = new THREE.Color(dest.colorTheme.glow || '#FFD700');
    this.auraUniforms.uColor.value = glowColor;

    const material = new THREE.ShaderMaterial({
      uniforms: this.auraUniforms,
      vertexShader: `
        uniform float uTime;
        attribute vec3 aRandom;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // 涡流旋转
          float angle = uTime * 0.8 + aRandom.x * 6.28;
          float r = length(pos.xz);
          pos.x = cos(angle) * r;
          pos.z = sin(angle) * r;
          pos.y += sin(uTime * 1.2 + aRandom.y * 6.28) * 0.2;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          gl_PointSize = (16.0 * aRandom.z + 6.0) * (1.0 / -mvPos.z);
          vAlpha = sin(uTime * 2.0 + aRandom.x * 3.14) * 0.4 + 0.6;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          float glow = pow(1.0 - dist * 2.0, 2.0);
          gl_FragColor = vec4(uColor, glow * vAlpha * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.auraParticles = new THREE.Points(geometry, material);
    this.group.add(this.auraParticles);
  }

  private updateColors(primaryHex?: string, glowHex?: string) {
    const pColor = new THREE.Color(primaryHex || '#D4AF37');
    const gColor = new THREE.Color(glowHex || '#FAF089');
    this.auraUniforms.uColor.value = gColor;

    this.group.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.material.emissiveIntensity > 1.5) {
          child.material.emissive.copy(gColor);
        } else {
          child.material.color.copy(pColor);
        }
      }
    });
  }

  private clearBeast() {
    this.animatedParts = [];
    const beastMesh = this.group.getObjectByName('beast_mesh');
    if (beastMesh) {
      this.group.remove(beastMesh);
      beastMesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }

  /**
   * 逐帧驱动神兽呼吸、展翼、摆尾与法阵旋转
   */
  public update(time: number, delta: number) {
    if (!this.group.visible) return;

    this.auraUniforms.uTime.value = time;

    // 法阵自转
    this.basePlatform.rotation.y = time * 0.15;

    // 神兽悬浮呼吸
    const beastMesh = this.group.getObjectByName('beast_mesh');
    if (beastMesh) {
      beastMesh.position.y = Math.sin(time * 1.5) * 0.08;
      beastMesh.rotation.y += delta * 0.12;
    }

    // 各骨骼动画
    this.animatedParts.forEach(part => {
      const t = time * part.speed + part.phase;

      if (part.type === 'wing_left') {
        part.object.rotation.z = part.initialRot.z + Math.sin(t) * part.amplitude;
      } else if (part.type === 'wing_right') {
        part.object.rotation.z = part.initialRot.z - Math.sin(t) * part.amplitude;
      } else if (part.type === 'tail') {
        part.object.rotation.y = part.initialRot.y + Math.sin(t) * part.amplitude;
        part.object.rotation.z = part.initialRot.z + Math.cos(t * 0.8) * (part.amplitude * 0.5);
      } else if (part.type === 'spine_segment') {
        part.object.position.x = part.initialPos.x + Math.sin(t) * part.amplitude;
        part.object.position.z = part.initialPos.z + Math.cos(t) * part.amplitude;
      } else if (part.type === 'foxfire') {
        part.object.position.x = Math.cos(t) * part.amplitude;
        part.object.position.z = Math.sin(t) * part.amplitude;
        part.object.position.y = 0.5 + Math.sin(t * 2.0) * 0.3;
      }
    });
  }
}
