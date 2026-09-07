import * as THREE from 'three';
import { LUNAR_MANSIONS_DATA, LunarMansionItem } from '../data/lunarMansions';
import { SOLAR_TERMS_DATA, SolarTermItem } from '../data/solarTerms';
import { EARTHLY_BRANCHES_DATA, EarthlyBranchItem } from '../data/earthlyBranches';

/**
 * 东方美学殿堂级 · 华夏古天文重器体系 周天浑象仪 (Chinese Universal Armillary Astrolabe)
 * 三环彻底打破同质化，结构、材质、几何与光效全维异构：
 * 
 * 1. 外层【六合仪 · 子午双规重器】（$R = 2.45$）：
 *    - 结构：古青铜鎏金双轨环（Dual Concentric Bronze Rails）+ 12 组青铜榫卯连接支柱；
 *    - 节点：八面鎏金铜钉 + 琉璃光核；
 *    - 徽章：【外方】古青铜雷云回纹方印（四季节气色系：春绿/夏赤/秋金/冬冰蓝）。
 * 
 * 2. 中层【三辰仪 · 黄道二十八宿星象仪】（$R = 2.32$）：
 *    - 结构：黄赤交角 23.44° 鎏金黄道环 + 四象 28 宿发光星象连线织锦；
 *    - 节点：四象双锥多面反射水晶宝石（青龙青碧、玄武玄冰、白虎琥珀、朱雀赤焰）；
 *    - 徽章：【浑圆】琉璃星宿星官天印。
 * 
 * 3. 内层【四游仪 · 十二时辰生肖赤道日晷盘】（$R = 2.18$）：
 *    - 结构：古法日晷齿轮盘规（12 组日晷齿轮刻度与太极云纹榫）；
 *    - 节点：日晷青铜凸齿与祥云浮雕；
 *    - 徽章：【正六边形】金石晷铭印章，当前时辰自动泛出金色日晷神芒。
 */
export class ArmillarySphere {
  public group: THREE.Group;

  // 三层立体异构天规
  private outerLiuheGroup: THREE.Group;
  public middleSanchenGroup: THREE.Group;
  private innerSiyouGroup: THREE.Group;

  // 3D 万向自由旋转姿态 (Full 3D Pitch/Yaw/Roll Universal Gimbal)
  public orientationQuat = new THREE.Quaternion();
  public angularVelocity3D = new THREE.Vector2(0, 0); // (pitchVel, yawVel)
  public spinVelocity = 0; // axial spin
  private readonly MOMENTUM_DAMPING = 0.945;

  // 3D 鼠标全息空间微感应与防漂移减震锁定
  public mouseParallax = { x: 0, y: 0 };
  private currentParallax = { x: 0, y: 0 };
  public isHoveringInteractable = false;

  // 物理角位置累积
  private outerAngle = 0;
  private middleAngle = 0;
  private innerAngle = 0;

  // 材质与交互网格
  private materials: (THREE.Material & { opacity?: number })[] = [];
  public interactableMeshes: THREE.Mesh[] = [];
  public starHitMeshes: THREE.Mesh[] = [];

  private starNodes: {
    mesh: THREE.Mesh;
    sprite: THREE.Sprite;
    hitMesh: THREE.Mesh;
    mansion: LunarMansionItem;
    baseScale: number;
  }[] = [];

  private termNodes: {
    mesh: THREE.Mesh;
    sprite: THREE.Sprite;
    hitMesh: THREE.Mesh;
    term: SolarTermItem;
  }[] = [];

  private branchNodes: {
    mesh: THREE.Mesh;
    sprite: THREE.Sprite;
    hitMesh: THREE.Mesh;
    branch: EarthlyBranchItem;
    isCurrent: boolean;
  }[] = [];

  constructor(baseRadius = 2.0) {
    this.group = new THREE.Group();

    this.outerLiuheGroup = new THREE.Group();
    this.middleSanchenGroup = new THREE.Group();
    this.innerSiyouGroup = new THREE.Group();

    this.group.add(this.outerLiuheGroup);
    this.group.add(this.middleSanchenGroup);
    this.group.add(this.innerSiyouGroup);

    // 梯次广阔宇宙布局（黄金等比阶梯间距：内环 2.22、中环 2.54、外环 2.88）
    const rOuter = baseRadius * 1.440;  // ~2.88 (六合子午规)
    const rMiddle = baseRadius * 1.270; // ~2.54 (三辰星宿仪)
    const rInner = baseRadius * 1.110;  // ~2.22 (四游赤道规)

    this.buildOuterLiuhe(rOuter);
    this.buildMiddleSanchen(rMiddle);
    this.buildInnerSiyou(rInner);
  }

  /**
   * 1. 外层【六合仪 · 子午双规重器】：古青铜鎏金双轨 + 12 组榫卯支撑柱 + 二十四节气方形回纹印
   */
  private buildOuterLiuhe(radius: number) {
    this.outerLiuheGroup.rotation.set(0.42, 0.35, 0.15);

    // 双规同心青铜环（内轨与外轨形成青铜重器立体骨架）
    const r1 = radius * 0.988;
    const r2 = radius * 1.012;

    const ringGeom1 = new THREE.TorusGeometry(r1, 0.0032, 12, 160);
    const ringGeom2 = new THREE.TorusGeometry(r2, 0.0032, 12, 160);

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x9a7b38,
      metalness: 0.92,
      roughness: 0.28,
      emissive: 0x241804,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.88
    });
    this.materials.push(bronzeMat);

    this.outerLiuheGroup.add(new THREE.Mesh(ringGeom1, bronzeMat));
    this.outerLiuheGroup.add(new THREE.Mesh(ringGeom2, bronzeMat));

    // 12 组青铜榫卯径向连接支柱 (Structural Struts between dual rails)
    const strutGeom = new THREE.CylinderGeometry(0.0024, 0.0024, r2 - r1, 8);
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const strut = new THREE.Mesh(strutGeom, bronzeMat);
      const midR = (r1 + r2) / 2;
      strut.position.set(Math.cos(angle) * midR, Math.sin(angle) * midR, 0);
      strut.rotation.z = angle + Math.PI / 2;
      this.outerLiuheGroup.add(strut);
    }

    // 24 节气八面鎏金铜钉
    const termGeom = new THREE.OctahedronGeometry(0.020, 0);
    const hitGeom = new THREE.SphereGeometry(0.13, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false });

    SOLAR_TERMS_DATA.forEach(term => {
      const rad = (term.angle * Math.PI) / 180;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      const z = 0;

      const seasonColor = {
        spring: '#38EF7D',
        summer: '#FF5252',
        autumn: '#FFE066',
        winter: '#4FC3F7'
      }[term.season] || '#FFE28A';

      const termMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(seasonColor),
        emissive: new THREE.Color(seasonColor),
        emissiveIntensity: 2.2,
        metalness: 0.85,
        roughness: 0.15,
        transparent: true,
        opacity: 0.95
      });
      this.materials.push(termMat);

      const notch = new THREE.Mesh(termGeom, termMat);
      notch.position.set(x, y, z);
      notch.rotation.set(0.5, 0.5, rad);
      this.outerLiuheGroup.add(notch);

      // 【外方】古青铜雷云回纹方印 Sprite
      const spriteTexture = this.createSquareBadgeTexture(term.name, seasonColor);
      const spriteMat = new THREE.SpriteMaterial({
        map: spriteTexture,
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      });
      this.materials.push(spriteMat);
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(x * 1.052, y * 1.052, 0);
      sprite.scale.set(0.09, 0.09, 1);
      this.outerLiuheGroup.add(sprite);

      // 交互判定
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.set(x, y, z);
      hitMesh.userData = { isSolarTerm: true, term };
      this.outerLiuheGroup.add(hitMesh);
      this.interactableMeshes.push(hitMesh);

      this.termNodes.push({ mesh: notch, sprite, hitMesh, term });
    });
  }

  /**
   * 2. 中层【三辰仪 · 黄道二十八宿星象仪】：黄道流光星带 + 28 宿四象宝石晶体 + 圆形琉璃天官印 + 星宿连线
   */
  private buildMiddleSanchen(radius: number) {
    this.middleSanchenGroup.rotation.set(0.38, 0.1, 0.41);

    // 鎏金细轨
    const trackGeom = new THREE.TorusGeometry(radius, 0.0035, 12, 160);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.96,
      roughness: 0.12,
      emissive: 0x6a4a0a,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.materials.push(trackMat);
    this.middleSanchenGroup.add(new THREE.Mesh(trackGeom, trackMat));

    // 四象宝石材质
    const matDragon = new THREE.MeshStandardMaterial({
      color: 0x38ef7d,
      emissive: 0x145a32,
      emissiveIntensity: 3.2,
      metalness: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.98
    });
    const matTortoise = new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      emissive: 0x0e4b6e,
      emissiveIntensity: 3.2,
      metalness: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.98
    });
    const matTiger = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      emissive: 0x5a4805,
      emissiveIntensity: 3.2,
      metalness: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.98
    });
    const matBird = new THREE.MeshStandardMaterial({
      color: 0xff5252,
      emissive: 0x5a0e0e,
      emissiveIntensity: 3.2,
      metalness: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.98
    });
    this.materials.push(matDragon, matTortoise, matTiger, matBird);

    // 四象双锥八面体水晶钻石
    const starGeom = new THREE.OctahedronGeometry(0.028, 0);
    const hitGeom = new THREE.SphereGeometry(0.14, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false });

    const starPositions: THREE.Vector3[] = [];

    LUNAR_MANSIONS_DATA.forEach(mansion => {
      const rad = (mansion.angle * Math.PI) / 180;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      const z = 0;
      const localPos = new THREE.Vector3(x, y, z);

      let mat = matDragon;
      if (mansion.beastCategory === 'tortoise') mat = matTortoise;
      else if (mansion.beastCategory === 'tiger') mat = matTiger;
      else if (mansion.beastCategory === 'bird') mat = matBird;

      // 1. 发光双锥水晶晶体
      const starMesh = new THREE.Mesh(starGeom, mat);
      starMesh.position.copy(localPos);
      this.middleSanchenGroup.add(starMesh);

      // 2. 【浑圆】圆形琉璃星官天官印 Sprite
      const spriteTexture = this.createRoundBadgeTexture(mansion.char, mansion.beastColor);
      const spriteMat = new THREE.SpriteMaterial({
        map: spriteTexture,
        transparent: true,
        opacity: 0.98,
        depthWrite: false
      });
      this.materials.push(spriteMat);
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(x * 1.055, y * 1.055, 0);
      sprite.scale.set(0.105, 0.105, 1);
      this.middleSanchenGroup.add(sprite);

      // 3. 判定球
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.copy(localPos);
      hitMesh.userData = { isLunarMansion: true, mansion };
      this.middleSanchenGroup.add(hitMesh);
      this.interactableMeshes.push(hitMesh);
      this.starHitMeshes.push(hitMesh);

      this.starNodes.push({ mesh: starMesh, sprite, hitMesh, mansion, baseScale: 1.0 });
      starPositions.push(localPos);
    });

    // 二十八宿星图发光金丝织锦折线
    const lineGeom = new THREE.BufferGeometry().setFromPoints([...starPositions, starPositions[0]]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffe28a,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.materials.push(lineMat);
    this.middleSanchenGroup.add(new THREE.Line(lineGeom, lineMat));

    // 黄道星河流光星尘 (Ecliptic Nebula Stardust Stream)
    const particleCount = 320;
    const pGeom = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const cDragon = new THREE.Color('#38EF7D');
    const cBird = new THREE.Color('#FF5252');
    const cTiger = new THREE.Color('#FFE066');
    const cTortoise = new THREE.Color('#4FC3F7');

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const rOffset = (Math.sin(i * 12.34) * 0.5) * 0.09;
      const zOffset = (Math.cos(i * 7.89) * 0.5) * 0.08;
      const r = radius + rOffset;

      pPositions[i * 3] = Math.cos(angle) * r;
      pPositions[i * 3 + 1] = Math.sin(angle) * r;
      pPositions[i * 3 + 2] = zOffset;

      const deg = (angle * 180) / Math.PI;
      let col = cDragon;
      if (deg < 90) col = cDragon;
      else if (deg < 180) col = cTortoise;
      else if (deg < 270) col = cTiger;
      else col = cBird;

      pColors[i * 3] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;
    }

    pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.70,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.materials.push(pMat);
    this.middleSanchenGroup.add(new THREE.Points(pGeom, pMat));
  }

  /**
   * 3. 内层【四游仪 · 十二时辰生肖赤道日晷盘】：日晷齿轮盘规 + 六边形金石晷铭 + 动态时辰日晷金芒
   */
  private buildInnerSiyou(radius: number) {
    this.innerSiyouGroup.rotation.set(-0.35, 0.45, -0.22);

    // 日晷赤道主体规
    const ringGeom = new THREE.TorusGeometry(radius, 0.0028, 12, 160);
    const sundialMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.94,
      roughness: 0.18,
      emissive: 0x4a340a,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.85
    });
    this.materials.push(sundialMat);
    this.innerSiyouGroup.add(new THREE.Mesh(ringGeom, sundialMat));

    // 12 组日晷齿轮凸榫 (12 Gear Teeth of Ancient Sundial Astrolabe)
    const toothGeom = new THREE.BoxGeometry(0.008, 0.024, 0.006);
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
      const isMajorHour = i % 2 === 0;
      const toothMat = new THREE.MeshStandardMaterial({
        color: isMajorHour ? 0xffe28a : 0x8a6d24,
        metalness: 0.9,
        roughness: 0.2,
        emissive: isMajorHour ? 0x6a4a0a : 0x221502,
        emissiveIntensity: 1.2
      });
      this.materials.push(toothMat);
      const tooth = new THREE.Mesh(toothGeom, toothMat);
      tooth.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      tooth.rotation.z = angle;
      this.innerSiyouGroup.add(tooth);
    }

    const currentHour = new Date().getHours();
    const branchIndex = Math.floor(((currentHour + 1) % 24) / 2); // 0=子, 1=丑, ..., 9=酉

    const hitGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false });

    EARTHLY_BRANCHES_DATA.forEach((branch, idx) => {
      const rad = (branch.angle * Math.PI) / 180;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      const z = 0;

      const isCurrent = idx === branchIndex;

      // 日晷六棱柱基座
      const cylinderGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.008, 6);
      const branchMat = new THREE.MeshStandardMaterial({
        color: isCurrent ? 0xfff0aa : 0xd4af37,
        metalness: 0.92,
        roughness: 0.15,
        emissive: isCurrent ? 0xffa500 : 0x5a4805,
        emissiveIntensity: isCurrent ? 3.5 : 1.6
      });
      this.materials.push(branchMat);

      const cylinder = new THREE.Mesh(cylinderGeom, branchMat);
      cylinder.position.set(x, y, z);
      cylinder.rotation.x = Math.PI / 2;
      this.innerSiyouGroup.add(cylinder);

      // 【六边形】金石日晷晷铭 Sprite
      const spriteTexture = this.createHexBadgeTexture(branch.char, isCurrent ? '#FFA500' : '#FFE066', isCurrent);
      const spriteMat = new THREE.SpriteMaterial({
        map: spriteTexture,
        transparent: true,
        opacity: isCurrent ? 1.0 : 0.88,
        depthWrite: false
      });
      this.materials.push(spriteMat);
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(x * 1.06, y * 1.06, 0);
      sprite.scale.set(isCurrent ? 0.095 : 0.08, isCurrent ? 0.095 : 0.08, 1);
      this.innerSiyouGroup.add(sprite);

      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.set(x, y, z);
      hitMesh.userData = { isEarthlyBranch: true, branch };
      this.innerSiyouGroup.add(hitMesh);
      this.interactableMeshes.push(hitMesh);

      this.branchNodes.push({ mesh: cylinder, sprite, hitMesh, branch, isCurrent });
    });
  }

  /**
   * 绘制【外方】古青铜雷云回纹方印（用于二十四节气）
   */
  private createSquareBadgeTexture(text: string, color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // 方形底板与雷云青铜边框
    ctx.fillStyle = '#0e141c';
    ctx.fillRect(14, 14, 100, 100);

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = color;
    ctx.strokeRect(14, 14, 100, 100);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.strokeRect(20, 20, 88, 88);

    // 文字
    ctx.font = 'bold 36px "Noto Serif SC", "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(text, 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 绘制【浑圆】琉璃星官天官印（用于二十八星宿）
   */
  private createRoundBadgeTexture(text: string, color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fillStyle = '#080c14';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.stroke();

    ctx.font = 'bold 56px "Noto Serif SC", "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillText(text, 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 绘制【正六边形】金石日晷晷铭（用于十二时辰）
   */
  private createHexBadgeTexture(text: string, color: string, isCurrent: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // 绘制正六边形
    ctx.beginPath();
    const r = 50;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      const x = 64 + r * Math.cos(a);
      const y = 64 + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = isCurrent ? '#241402' : '#10141c';
    ctx.fill();
    ctx.lineWidth = isCurrent ? 4.5 : 3;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.font = 'bold 52px "Noto Serif SC", "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isCurrent ? '#FFE28A' : '#FFFFFF';
    ctx.shadowColor = color;
    ctx.shadowBlur = isCurrent ? 16 : 6;
    ctx.fillText(text, 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 3D 空间全向拖拽施加力矩 (Full 3D Pitch & Yaw Universal Gimbal Drag)
   */
  public apply3DDrag(deltaX: number, deltaY: number, sensitivity: number) {
    const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY * sensitivity);
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * sensitivity);
    const deltaQuat = new THREE.Quaternion().multiplyQuaternions(pitch, yaw);
    this.orientationQuat.premultiply(deltaQuat);
  }

  /**
   * 外部鼠标松开时注入 3D 物理冲量（前后俯仰 + 左右偏航 + 轴向自旋）
   */
  public inject3DImpulse(velX: number, velY: number, spinVel = 0) {
    this.angularVelocity3D.set(velY, velX);
    this.spinVelocity = THREE.MathUtils.clamp(spinVel, -6.0, 6.0);
  }

  /**
   * 外部鼠标/手势物理施加角位移（环向拖拽自转）
   */
  public applyDragDelta(deltaAngle: number) {
    this.middleAngle += deltaAngle;
    this.outerAngle += deltaAngle * 0.45;
    this.innerAngle -= deltaAngle * 0.75;
  }

  /**
   * 3D 鼠标全息空间微感应目标更新（防移开减震：悬停可交互目标时自动静止归零）
   */
  public setMouseParallax(ndcX: number, ndcY: number) {
    if (this.isHoveringInteractable) {
      this.mouseParallax.x = 0;
      this.mouseParallax.y = 0;
    } else {
      this.mouseParallax.x = ndcX;
      this.mouseParallax.y = ndcY;
    }
  }

  /**
   * 多轴三维立体旋转动画 + 3D 万向姿态 + 减震全息微感应 + 物理动量阻尼 + 背面剔除
   */
  public update(time: number, delta = 0.016, camera?: THREE.Camera) {
    // 1. 3D 万向惯性物理旋转更新 (Pitch & Yaw Momentum)
    if (this.angularVelocity3D.lengthSq() > 0.000001) {
      const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.angularVelocity3D.x * delta);
      const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.angularVelocity3D.y * delta);
      const deltaQuat = new THREE.Quaternion().multiplyQuaternions(pitch, yaw);
      this.orientationQuat.premultiply(deltaQuat);

      this.angularVelocity3D.multiplyScalar(Math.pow(this.MOMENTUM_DAMPING, delta * 60));
    }

    // 2. 3D 鼠标全息空间微感应（高精度减震阻尼：瞄准节点时瞬间稳定，绝不偏移跑位）
    const targetX = this.isHoveringInteractable ? 0 : this.mouseParallax.x;
    const targetY = this.isHoveringInteractable ? 0 : this.mouseParallax.y;
    const lerpSpeed = this.isHoveringInteractable ? Math.min(1.0, delta * 15.0) : Math.min(1.0, delta * 4.5);

    this.currentParallax.x += (targetX - this.currentParallax.x) * lerpSpeed;
    this.currentParallax.y += (targetY - this.currentParallax.y) * lerpSpeed;

    const parallaxPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -this.currentParallax.y * 0.045);
    const parallaxYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.currentParallax.x * 0.055);
    const parallaxQuat = new THREE.Quaternion().multiplyQuaternions(parallaxPitch, parallaxYaw);

    // 姿态融合：基础 3D 物理姿态 * 空间微感应视差
    this.group.quaternion.copy(this.orientationQuat).multiply(parallaxQuat);

    // 3. 轴向物理自转更新
    if (Math.abs(this.spinVelocity) > 0.0001) {
      this.middleAngle += this.spinVelocity * delta;
      this.outerAngle += this.spinVelocity * delta * 0.45;
      this.innerAngle -= this.spinVelocity * delta * 0.75;
      this.spinVelocity *= Math.pow(this.MOMENTUM_DAMPING, delta * 60);
    } else {
      // 自然常驻岁差慢旋
      this.outerAngle += delta * 0.006;
      this.middleAngle += delta * 0.016;
      this.innerAngle -= delta * 0.010;
    }

    this.outerLiuheGroup.rotation.z = this.outerAngle;
    this.outerLiuheGroup.rotation.y = Math.sin(time * 0.2) * 0.15 + 0.35;

    this.middleSanchenGroup.rotation.z = this.middleAngle;
    this.innerSiyouGroup.rotation.z = this.innerAngle;

    const pulse = 1.0 + Math.sin(time * 3.5) * 0.15;
    const tempWorldPos = new THREE.Vector3();

    // 28 星宿多面反射水晶自转
    this.starNodes.forEach((node) => {
      const scale = node.baseScale * pulse;
      node.mesh.scale.set(scale, scale, scale);
      node.mesh.rotation.y = time * 2.2;
      node.mesh.rotation.x = time * 1.4;

      if (camera) {
        node.mesh.getWorldPosition(tempWorldPos);
        const toCamera = camera.position.clone().sub(tempWorldPos).normalize();
        const fromOrigin = tempWorldPos.clone().normalize();
        const facing = toCamera.dot(fromOrigin);

        const isBehind = facing < -0.15;
        node.hitMesh.visible = !isBehind;
        (node.sprite.material as THREE.SpriteMaterial).opacity = isBehind ? 0.18 : 0.95;
      }
    });

    // 24 节气八面鎏金铜钉自转
    this.termNodes.forEach(node => {
      node.mesh.rotation.y = time * 1.2;
      if (camera) {
        node.mesh.getWorldPosition(tempWorldPos);
        const toCamera = camera.position.clone().sub(tempWorldPos).normalize();
        const fromOrigin = tempWorldPos.clone().normalize();
        const isBehind = toCamera.dot(fromOrigin) < -0.15;
        node.hitMesh.visible = !isBehind;
        (node.sprite.material as THREE.SpriteMaterial).opacity = isBehind ? 0.15 : 0.85;
      }
    });

    // 12 时辰日晷刻度（当前时辰金芒律动）
    this.branchNodes.forEach(node => {
      if (node.isCurrent) {
        const glowPulse = 1.0 + Math.sin(time * 4.0) * 0.25;
        node.mesh.scale.set(glowPulse, glowPulse, glowPulse);
      }
      if (camera) {
        node.mesh.getWorldPosition(tempWorldPos);
        const toCamera = camera.position.clone().sub(tempWorldPos).normalize();
        const fromOrigin = tempWorldPos.clone().normalize();
        const isBehind = toCamera.dot(fromOrigin) < -0.15;
        node.hitMesh.visible = !isBehind;
        (node.sprite.material as THREE.SpriteMaterial).opacity = isBehind ? 0.15 : 0.85;
      }
    });
  }

  /**
   * 高亮指定星宿
   */
  public highlightMansion(mansionId: string | null) {
    this.starNodes.forEach(node => {
      if (node.mansion.id === mansionId) {
        node.baseScale = 2.2;
        (node.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 4.8;
        node.sprite.scale.set(0.15, 0.15, 1);
      } else {
        node.baseScale = 1.0;
        (node.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 3.2;
        node.sprite.scale.set(0.105, 0.105, 1);
      }
    });
  }

  /**
   * 视距平滑淡隐淡现
   */
  public setOpacity(opacity: number) {
    const clamped = THREE.MathUtils.clamp(opacity, 0, 1);
    this.group.visible = clamped > 0.005;

    this.materials.forEach(mat => {
      mat.opacity = clamped;
    });
  }
}
