/**
 * DLX（Dancing Links）精确覆盖求解器
 *
 * 用于在给定"目标日"时，求出一组把棋盘上除目标格之外全部 47 格恰好覆盖一遍的碎片摆放。
 * 列 = 47 个非目标有效格 + 每个碎片一个专属列（保证每个碎片恰好使用一次）。
 *
 * 该实现与 .analysis/dlx.js 中的验证版一致，已验证 2024-2026 全部 1096 个日期可解。
 */

import { CELL_COUNT, COLS, isValidCell, isValidIndex } from './board';
import { PIECES, bboxOf, rotationsOf, type Cell } from './pieces';

class DLX {
  private readonly H: number;
  private cap: number;
  private L: Int32Array;
  private R: Int32Array;
  private U: Int32Array;
  private D: Int32Array;
  private C: Int32Array;
  private ROW: Int32Array;
  private readonly S: Int32Array;
  private cnt: number;
  private readonly sol: number[] = [];
  private rowCount = 0;
  private nodes = 0;
  private static readonly NODE_LIMIT = 2_000_000;

  constructor(nCols: number) {
    this.H = nCols;
    this.cap = 8 * nCols + 4096;
    this.L = new Int32Array(this.cap);
    this.R = new Int32Array(this.cap);
    this.U = new Int32Array(this.cap);
    this.D = new Int32Array(this.cap);
    this.C = new Int32Array(this.cap);
    this.ROW = new Int32Array(this.cap);
    this.S = new Int32Array(nCols + 1);
    this.cnt = nCols + 1;

    // 头结点 0..n-1 为列头，n 为根结点
    for (let i = 0; i <= nCols; i++) {
      this.L[i] = i;
      this.R[i] = i;
      this.U[i] = i;
      this.D[i] = i;
      this.C[i] = i;
      this.ROW[i] = -1;
      this.S[i] = 0;
    }
    // 串成水平环 0-1-...-(n-1)-H-0
    for (let i = 0; i < nCols; i++) {
      this.R[i] = i + 1;
      this.L[i + 1] = i;
    }
    this.R[nCols - 1] = this.H;
    this.L[this.H] = nCols - 1;
    this.R[this.H] = 0;
    this.L[0] = this.H;
  }

  private grow(): void {
    const nc = this.cap * 2;
    const nL = new Int32Array(nc);
    nL.set(this.L);
    this.L = nL;
    const nR = new Int32Array(nc);
    nR.set(this.R);
    this.R = nR;
    const nU = new Int32Array(nc);
    nU.set(this.U);
    this.U = nU;
    const nD = new Int32Array(nc);
    nD.set(this.D);
    this.D = nD;
    const nC = new Int32Array(nc);
    nC.set(this.C);
    this.C = nC;
    const nRow = new Int32Array(nc);
    nRow.set(this.ROW);
    this.ROW = nRow;
    this.cap = nc;
  }

  private newNode(): number {
    if (this.cnt >= this.cap) this.grow();
    return this.cnt++;
  }

  /** 添加一行（一个候选摆放），返回行号 */
  addRow(cols: number[]): number {
    const rowId = this.rowCount++;
    let first = -1;
    for (const col of cols) {
      const x = this.newNode();
      this.C[x] = col;
      this.ROW[x] = rowId;
      this.U[x] = this.U[col];
      this.D[x] = col;
      this.D[this.U[col]] = x;
      this.U[col] = x;
      this.S[col]++;
      if (first === -1) {
        first = x;
        this.L[x] = x;
        this.R[x] = x;
      } else {
        this.L[x] = this.L[first];
        this.R[x] = first;
        this.R[this.L[first]] = x;
        this.L[first] = x;
      }
    }
    return rowId;
  }

  private cover(c: number): void {
    this.L[this.R[c]] = this.L[c];
    this.R[this.L[c]] = this.R[c];
    for (let i = this.D[c]; i !== c; i = this.D[i]) {
      for (let j = this.R[i]; j !== i; j = this.R[j]) {
        this.U[this.D[j]] = this.U[j];
        this.D[this.U[j]] = this.D[j];
        this.S[this.C[j]]--;
      }
    }
  }

  private uncover(c: number): void {
    for (let i = this.U[c]; i !== c; i = this.U[i]) {
      for (let j = this.L[i]; j !== i; j = this.L[j]) {
        this.S[this.C[j]]++;
        this.U[this.D[j]] = j;
        this.D[this.U[j]] = j;
      }
    }
    this.L[this.R[c]] = c;
    this.R[this.L[c]] = c;
  }

  private chooseCol(): number {
    let best = -1;
    let bestS = Infinity;
    for (let c = this.R[this.H]; c !== this.H; c = this.R[c]) {
      if (this.S[c] < bestS) {
        bestS = this.S[c];
        best = c;
        if (this.S[c] <= 1) break;
      }
    }
    return best;
  }

  /** @returns 行号数组；null = 超出节点上限；false = 无解 */
  search(): number[] | null | false {
    if (++this.nodes > DLX.NODE_LIMIT) return null;
    if (this.R[this.H] === this.H) return this.sol.slice();
    const c = this.chooseCol();
    if (this.S[c] === 0) return false;
    this.cover(c);
    for (let r = this.D[c]; r !== c; r = this.D[r]) {
      this.sol.push(this.ROW[r]);
      for (let j = this.R[r]; j !== r; j = this.R[j]) this.cover(this.C[j]);
      const res = this.search();
      if (res !== false) return res;
      for (let j = this.L[r]; j !== r; j = this.L[j]) this.uncover(this.C[j]);
      this.sol.pop();
    }
    this.uncover(c);
    return false;
  }
}

export interface Placement {
  /** 碎片在 PIECES 中的下标 */
  piece: number;
  key: string;
  /** 旋转态下标（rotationsOf 的索引） */
  rot: number;
  /** 碎片包围盒左上角所在行 */
  row: number;
  /** 碎片包围盒左上角所在列 */
  col: number;
  /** 覆盖的 cell index 列表 */
  cells: number[];
}

function buildPlacements(): Placement[][] {
  const out: Placement[][] = [];
  for (let piece = 0; piece < PIECES.length; piece++) {
    const shape = PIECES[piece];
    const list: Placement[] = [];
    const rots = rotationsOf(shape.cells);
    for (let rot = 0; rot < rots.length; rot++) {
      const cells = rots[rot];
      const { w, h } = bboxOf(cells);
      for (let row = 0; row + h <= 8; row++) {
        for (let col = 0; col + w <= 7; col++) {
          const covered: number[] = [];
          let ok = true;
          for (const [dr, dc] of cells as Cell[]) {
            const rr = row + dr;
            const cc = col + dc;
            if (!isValidCell(rr, cc)) {
              ok = false;
              break;
            }
            covered.push(rr * COLS + cc);
          }
          if (ok) list.push({ piece, key: shape.key, rot, row, col, cells: covered });
        }
      }
    }
    out.push(list);
  }
  return out;
}

let PLACEMENTS: Placement[][] | null = null;

/**
 * 求解：用全部 10 种碎片恰好覆盖除 blocked 之外的所有有效格。
 * @param blocked 目标格集合（月 / 日 / 星期）
 * @returns 与 PIECES 等长的摆放数组；无解返回 null
 */
export function solveFor(blocked: Set<number>): Placement[] | null {
  if (!PLACEMENTS) PLACEMENTS = buildPlacements();
  const np = PIECES.length;

  // 列重映射：只把"非目标的有效格"作为 DLX 列
  // （row7 的 c0-c3 在物理背板上不存在，不能建列，否则该列 S=0 会直接判无解）
  const colOf = new Int32Array(CELL_COUNT).fill(-1);
  let nc = 0;
  for (let i = 0; i < CELL_COUNT; i++) {
    if (!blocked.has(i) && isValidIndex(i)) colOf[i] = nc++;
  }

  const dlx = new DLX(nc + np);
  const rowPlacement: (Placement | undefined)[] = [];
  for (let i = 0; i < np; i++) {
    for (const pl of PLACEMENTS[i]) {
      if (pl.cells.some((x) => blocked.has(x))) continue;
      const cols = pl.cells.map((x) => colOf[x]);
      cols.push(nc + i); // 碎片专属列：保证每个碎片恰好用一次
      rowPlacement[dlx.addRow(cols)] = pl;
    }
  }

  const res = dlx.search();
  if (!Array.isArray(res)) return null;

  const out: Placement[] = new Array(np);
  for (const rowId of res) {
    const pl = rowPlacement[rowId];
    if (!pl) return null;
    out[pl.piece] = pl;
  }
  for (let i = 0; i < np; i++) if (!out[i]) return null;
  return out;
}

/** 预热摆放表（避免首次点击时的轻微卡顿） */
export function warmUpSolver(): void {
  if (!PLACEMENTS) PLACEMENTS = buildPlacements();
}
