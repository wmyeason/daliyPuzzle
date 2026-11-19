/**
 * 拼图碎片库
 *
 * 10 种碎片，共 47 格；棋盘有效格 50 格，留出 3 格（月 / 日 / 星期）作为目标。
 * 47 + 3 = 50，恰好精确覆盖。
 *
 * 坐标约定：cells 为 [行, 列] 列表，已归一化到左上角 (0,0)。
 * 该碎片集已经 DLX 精确覆盖求解器验证：2024-2026 全部 1096 个日期均可解。
 */

export type Cell = [number, number];

export interface PieceShape {
  /** 唯一键 */
  key: string;
  /** 中文形状描述 */
  name: string;
  cells: Cell[];
  /** 主题色 */
  color: string;
}

const RAW: Array<{ key: string; name: string; cells: Cell[]; color: string }> = [
  {
    key: 'Z4',
    name: '2×2 Z 字形',
    // XX.
    // .XX
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2]
    ],
    color: '#5c6bc0'
  },
  {
    key: 'T5',
    name: '3×3 T 字形',
    // XXX
    // .X.
    // .X.
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
      [2, 1]
    ],
    color: '#4a90d9'
  },
  {
    key: 'Z5a',
    name: '2×3 Z 字形',
    // XXX
    // .XX
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
      [1, 2]
    ],
    color: '#50b98a'
  },
  {
    key: 'I4',
    name: '1×4 竖条',
    // X
    // X
    // X
    // X
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3]
    ],
    color: '#9b6dd6'
  },
  {
    key: 'L4',
    name: '3×1 L 形',
    // X
    // X
    // XX
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1]
    ],
    color: '#e0596b'
  },
  {
    key: 'V5',
    name: '3×3 L 形',
    // X..
    // X..
    // XXX
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2]
    ],
    color: '#f0a93b'
  },
  {
    key: 'Z5b',
    name: '3×2 Z 字形',
    // XX.
    // .X.
    // XX.
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 0],
      [2, 1]
    ],
    color: '#3fb8c4'
  },
  {
    key: 'L5',
    name: '4×1 L 形',
    // X
    // X
    // X
    // XX
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1]
    ],
    color: '#d96ba8'
  },
  {
    key: 'Q5',
    name: '2×3 长方形缺少左上',
    // .XX
    // XXX
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2]
    ],
    color: '#7a9a3b'
  },
  {
    key: 'U5',
    name: '2×3 长方形缺少中下',
    // X.X
    // XXX
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 2]
    ],
    color: '#c0734a'
  }
];

export const PIECES: PieceShape[] = RAW;

/** 归一化：平移使最小行/列均为 0，并按 (行,列) 排序 */
export function normalize(shape: Cell[]): Cell[] {
  let minR = Infinity;
  let minC = Infinity;
  for (const [r, c] of shape) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }
  return shape
    .map(([r, c]) => [r - minR, c - minC] as Cell)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** 顺时针旋转 90° */
export function rot90(shape: Cell[]): Cell[] {
  const maxR = Math.max(...shape.map((s) => s[0]));
  return shape.map(([r, c]) => [c, maxR - r] as Cell);
}

const rotationCache = new Map<string, Cell[][]>();

/** 去重后的全部旋转态（1~4 个），索引即游戏内的 rot 值 */
export function rotationsOf(shape: Cell[]): Cell[][] {
  const cacheKey = JSON.stringify(shape);
  const cached = rotationCache.get(cacheKey);
  if (cached) return cached;

  const seen = new Set<string>();
  const out: Cell[][] = [];
  let cur = normalize(shape);
  for (let i = 0; i < 4; i++) {
    const k = JSON.stringify(cur);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(cur);
    }
    cur = normalize(rot90(cur));
  }
  rotationCache.set(cacheKey, out);
  return out;
}

export interface BBox {
  /** 列数 */
  w: number;
  /** 行数 */
  h: number;
}

export function bboxOf(cells: Cell[]): BBox {
  let maxR = 0;
  let maxC = 0;
  for (const [r, c] of cells) {
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  return { w: maxC + 1, h: maxR + 1 };
}

/** 碎片格数 */
export const PIECE_CELL_COUNT = PIECES.reduce((n, p) => n + p.cells.length, 0);
