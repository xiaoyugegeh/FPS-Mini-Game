import { Vector3 } from 'three';
import { CollisionBox } from '../types';

/**
 * 静态碰撞体空间网格
 * 将 AABB 按固定大小的格子索引，查询时只返回附近格子里的碰撞盒，
 * 避免每帧遍历全部墙体/障碍物。
 */
export class CollisionGrid {
  private cellSize: number;
  private boxes: CollisionBox[];
  private cells = new Map<string, number[]>();

  constructor(boxes: CollisionBox[], cellSize = 6) {
    this.cellSize = cellSize;
    this.boxes = boxes;
    this.build();
  }

  private key(cx: number, cy: number, cz: number): string {
    return `${cx},${cy},${cz}`;
  }

  private insert(index: number, box: CollisionBox): void {
    const cs = this.cellSize;
    const minX = Math.floor(box.min.x / cs);
    const maxX = Math.floor(box.max.x / cs);
    const minY = Math.floor(box.min.y / cs);
    const maxY = Math.floor(box.max.y / cs);
    const minZ = Math.floor(box.min.z / cs);
    const maxZ = Math.floor(box.max.z / cs);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const k = this.key(x, y, z);
          let arr = this.cells.get(k);
          if (!arr) {
            arr = [];
            this.cells.set(k, arr);
          }
          arr.push(index);
        }
      }
    }
  }

  private build(): void {
    this.cells.clear();
    this.boxes.forEach((box, i) => this.insert(i, box));
  }

  /**
   * 查询以 center 为中心、radius 为半径的球体范围内可能相交的碰撞盒
   */
  querySphere(center: Vector3, radius: number): CollisionBox[] {
    const cs = this.cellSize;
    const minX = Math.floor((center.x - radius) / cs);
    const maxX = Math.floor((center.x + radius) / cs);
    const minY = Math.floor((center.y - radius) / cs);
    const maxY = Math.floor((center.y + radius) / cs);
    const minZ = Math.floor((center.z - radius) / cs);
    const maxZ = Math.floor((center.z + radius) / cs);

    const set = new Set<number>();
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const arr = this.cells.get(this.key(x, y, z));
          if (arr) arr.forEach((idx) => set.add(idx));
        }
      }
    }

    const result: CollisionBox[] = [];
    set.forEach((idx) => result.push(this.boxes[idx]));
    return result;
  }
}
