import * as THREE from 'three';
import { DestinationItem } from '../types';

export function latLngToVector3(lat: number, lng: number, radius: number = 2.0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * 全球山海灵脉光轨系统 (Global Mythic Ley Lines & Energy Beams)
 */
export class LeyLineSystem {
  public group: THREE.Group;
  private lineMaterials: THREE.LineBasicMaterial[] = [];

  constructor(destinations: DestinationItem[], radius: number = 2.0) {
    this.group = new THREE.Group();
    this.buildLeyLines(destinations, radius);
  }

  private buildLeyLines(destinations: DestinationItem[], radius: number) {
    // 选定若干关键地脉连线 (如华夏九寨-莫高窟-泰山，丝路-卡帕多奇亚-雅典-圣米歇尔山等)
    const connections: [number, number][] = [
      [0, 1],  // 九寨 - 莫高窟
      [1, 2],  // 莫高窟 - 泰山
      [0, 6],  // 九寨 - 富士山
      [1, 5],  // 莫高窟 - 卡帕多奇亚
      [5, 7],  // 卡帕多奇亚 - 佩特拉
      [5, 9],  // 卡帕多奇亚 - 雅典卫城
      [9, 3],  // 雅典卫城 - 圣米歇尔山
      [3, 8],  // 圣米歇尔山 - 冰岛瓦特纳
      [0, 10], // 九寨 - 瓦拉纳西
      [10, 11],// 瓦拉纳西 - 乌鲁鲁
      [3, 4],  // 圣米歇尔山 - 马丘比丘
      [4, 11]  // 马丘比丘 - 乌鲁鲁
    ];

    connections.forEach(([i1, i2], lineIdx) => {
      if (!destinations[i1] || !destinations[i2]) return;
      const p1 = latLngToVector3(destinations[i1].coordinates.lat, destinations[i1].coordinates.lng, radius);
      const p2 = latLngToVector3(destinations[i2].coordinates.lat, destinations[i2].coordinates.lng, radius);

      // 计算凸起的贝塞尔控制点 (拱起弧度)
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      const elevation = radius + Math.min(0.8, dist * 0.25);
      mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(lineIdx % 2 === 0 ? '#F39C12' : '#38EF7D'),
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });

      this.lineMaterials.push(material);
      const line = new THREE.Line(geometry, material);
      this.group.add(line);
    });
  }

  public update(time: number) {
    // 灵脉光轨呼吸流动效果
    this.lineMaterials.forEach((mat, idx) => {
      mat.opacity = 0.3 + 0.25 * Math.sin(time * 2.0 + idx * 0.8);
    });
  }
}
