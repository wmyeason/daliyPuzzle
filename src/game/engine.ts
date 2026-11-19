/**
 * 游戏状态机（纯逻辑，不依赖 DOM）
 */

import { COLS, ROWS, isValidIndex, targetIndices } from './board';
import { PIECES, bboxOf, rotationsOf, type Cell } from './pieces';
import { solveFor, type Placement } from './solver';

export interface PieceState {
  /** PIECES 下标 */
  id: number;
  /** 当前旋转态（rotationsOf 的索引） */
  rot: number;
  /** 已放到背板上时的包围盒左上角行；-1 表示在托盘 */
  row: number;
  /** 已放到背板上时的包围盒左上角列；-1 表示在托盘 */
  col: number;
  /** 托盘槽位下标 0-9 */
  slot: number;
}

export interface GameState {
  year: number;
  month: number;
  day: number;
  weekday: number;
  /** 三个目标格 index */
  target: number[];
  pieces: PieceState[];
  /** 该日的参考解，key = 碎片 id */
  solution: Map<number, Placement>;
  /** 玩家操作次数 */
  moves: number;
}

/** 碎片在指定旋转态下的格子坐标 */
export function shapeCells(id: number, rot: number): Cell[] {
  return rotationsOf(PIECES[id].cells)[rot];
}

/** 碎片放到 (row, col) 后覆盖的 cell index 列表 */
export function pieceCellsAt(id: number, rot: number, row: number, col: number): number[] {
  return shapeCells(id, rot).map(([dr, dc]) => (row + dr) * COLS + (col + dc));
}

/**
 * 新建一局：先求出当日的参考解，再把 10 个碎片随机旋转、随机放进托盘槽位。
 */
export function createGame(year: number, month: number, day: number): GameState {
  const target = targetIndices(year, month, day);
  const solution = solveFor(new Set(target));
  if (!solution) {
    throw new Error(`${year}-${month}-${day} 未找到拼图解`);
  }

  // 两侧各 5 块：先排 4 格轻量碎片，再排 5 格核心碎片；同侧按形状交错。
  const leftPieceIds = [0, 4, 1, 2, 9];
  const rightPieceIds = [3, 5, 6, 7, 8];
  const slotOf = new Map<number, number>();
  leftPieceIds.forEach((pieceId, slot) => slotOf.set(pieceId, slot));
  rightPieceIds.forEach((pieceId, slot) => slotOf.set(pieceId, 5 + slot));
  const pieces: PieceState[] = PIECES.map((p, id) => {
    const nRot = rotationsOf(p.cells).length;
    // 随机初始旋转，但避免与参考解完全相同（否则太容易）
    let rot = Math.floor(Math.random() * nRot);
    const solRot = solution[id].rot;
    if (nRot > 1 && rot === solRot) rot = (rot + 1 + Math.floor(Math.random() * (nRot - 1))) % nRot;
    const slot = slotOf.get(id) ?? id;
    return { id, rot, row: -1, col: -1, slot };
  });

  const solutionMap = new Map<number, Placement>();
  solution.forEach((pl, i) => solutionMap.set(i, pl));

  return {
    year,
    month,
    day,
    weekday: new Date(year, month - 1, day).getDay(),
    target,
    pieces,
    solution: solutionMap,
    moves: 0
  };
}

/**
 * 判断碎片能否放到 (row, col)（已考虑旋转态 rot）：
 *  - 所有格都在背板有效范围内
 *  - 不覆盖其他碎片
 *  - 不覆盖目标格
 */
export function canPlace(state: GameState, id: number, rot: number, row: number, col: number): boolean {
  const cells = pieceCellsAt(id, rot, row, col);
  const occupied = new Set<number>();
  for (const p of state.pieces) {
    if (p.id === id || p.row < 0) continue;
    for (const c of pieceCellsAt(p.id, p.rot, p.row, p.col)) occupied.add(c);
  }
  for (const c of cells) {
    if (!isValidIndex(c)) return false;
    if (state.target.includes(c)) return false;
    if (occupied.has(c)) return false;
  }
  return true;
}

/** 已放置到背板上的碎片数量 */
export function placedCount(state: GameState): number {
  return state.pieces.filter((p) => p.row >= 0).length;
}

/** 胜负判定：10 个碎片全部在位、互不重叠、且不压住目标格，恰好盖满其余 47 格 */
export function isSolved(state: GameState): boolean {
  const covered = new Set<number>();
  for (const p of state.pieces) {
    if (p.row < 0) return false;
    for (const c of pieceCellsAt(p.id, p.rot, p.row, p.col)) {
      // 任何碎片落在无效格或目标格上，都视为非法（正常靠 canPlace 守住，这里兜底）
      if (!isValidIndex(c) || state.target.includes(c)) return false;
      if (covered.has(c)) return false;
      covered.add(c);
    }
  }
  let need = 0;
  for (let i = 0; i < ROWS * COLS; i++) {
    if (isValidIndex(i) && !state.target.includes(i)) need++;
  }
  return covered.size === need;
}

/** 该碎片当前是否摆在参考解给出的位置与方向上 */
export function isAtSolution(state: GameState, p: PieceState): boolean {
  const sol = state.solution.get(p.id);
  if (!sol) return false;
  return p.row === sol.row && p.col === sol.col && p.rot === sol.rot;
}

/** 把碎片放回托盘 */
export function sendToTray(p: PieceState): void {
  p.row = -1;
  p.col = -1;
}

/** 旋转态循环到下一个 */
export function nextRot(id: number, rot: number): number {
  const n = rotationsOf(PIECES[id].cells).length;
  return (rot + 1) % n;
}

/** 碎片包围盒尺寸（格） */
export function pieceBox(id: number, rot: number): { w: number; h: number } {
  return bboxOf(shapeCells(id, rot));
}
