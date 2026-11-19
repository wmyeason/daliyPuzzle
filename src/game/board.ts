/**
 * 棋盘布局定义
 *
 *  物理背板为 8 行 × 7 列，共 50 个有效格：
 *
 *    row0: 1月 2月 3月 4月 5月 6月          (c0-c5)
 *    row1: 7月 8月 9月 10月 11月 12月       (c0-c5)
 *    row2: 1日 ... 7日
 *    row3: 8日 ... 14日
 *    row4: 15日 ... 21日
 *    row5: 22日 ... 28日
 *    row6: 29日 30日 31日 星期日 星期一 星期二 星期三
 *    row7:                    星期四 星期五 星期六      (c4-c6)
 *
 *  无效格（row7 的 c0-c3）在物理背板上并不存在，碎片不能覆盖。
 */

export const ROWS = 8;
export const COLS = 7;
export const CELL_COUNT = ROWS * COLS;

export type CellKind = 'month' | 'day' | 'weekday';

export interface CellInfo {
  kind: CellKind;
  /** 完整标签，如 "10月" / "16" / "星期五" */
  label: string;
  /** 月份 1-12 / 日期 1-31 / 星期 0-6（0=周日） */
  value: number;
  row: number;
  col: number;
}

const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];

/** 长度 56，无效位置为 null */
export const CELLS: (CellInfo | null)[] = Array.from({ length: CELL_COUNT }, () => null);

function put(row: number, col: number, kind: CellKind, label: string, value: number): void {
  const idx = row * COLS + col;
  if (CELLS[idx] !== null) throw new Error(`duplicate cell at ${row},${col}`);
  CELLS[idx] = { kind, label, value, row, col };
}

// 12 个月份格
for (let m = 1; m <= 12; m++) {
  put(Math.floor((m - 1) / 6), (m - 1) % 6, 'month', `${m}月`, m);
}
// 31 个日期格
for (let d = 1; d <= 31; d++) {
  put(2 + Math.floor((d - 1) / 7), (d - 1) % 7, 'day', `${d}`, d);
}
// 7 个星期格
for (let w = 0; w < 7; w++) {
  const row = w < 4 ? 6 : 7;
  const col = w < 4 ? 3 + w : 4 + (w - 4);
  put(row, col, 'weekday', `星期${WEEK_CN[w]}`, w);
}

export const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function isValidCell(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS && CELLS[row * COLS + col] !== null;
}

export function isValidIndex(idx: number): boolean {
  return idx >= 0 && idx < CELL_COUNT && CELLS[idx] !== null;
}

/** 有效格（可被碎片覆盖或作为目标）总数 = 50 */
export const VALID_CELL_COUNT = CELLS.reduce((n, c) => n + (c ? 1 : 0), 0);

/** 月份 / 日期 / 星期 格的 cell index 查表，保证与上面的 put() 完全一致 */
export const MONTH_INDEX: number[] = [];
export const DAY_INDEX: number[] = [];
export const WEEK_INDEX: number[] = [];
for (let i = 0; i < CELLS.length; i++) {
  const c = CELLS[i];
  if (!c) continue;
  if (c.kind === 'month') MONTH_INDEX[c.value] = i;
  else if (c.kind === 'day') DAY_INDEX[c.value] = i;
  else WEEK_INDEX[c.value] = i;
}

/**
 * 某一天需要"露出来"的三个格子：月份格、日期格、星期格
 * @returns 三个 cell index
 */
export function targetIndices(year: number, month: number, day: number): number[] {
  const weekday = new Date(year, month - 1, day).getDay();
  return [MONTH_INDEX[month], DAY_INDEX[day], WEEK_INDEX[weekday]];
}

/** 日期 -> "2026年10月16日 星期五" */
export function formatDate(year: number, month: number, day: number): string {
  return `${year}年${month}月${day}日 ${WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()]}`;
}

/** 日期 -> "YYYY-MM-DD"（用于 input[type=date]） */
export function toDateInputValue(year: number, month: number, day: number): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${year}-${p(month)}-${p(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
