// 复现 src/game/solver.ts 中新版 DLX 类 + buildPlacements 的逻辑，验证移植正确性
const ROWS = 8, COLS = 7, N = ROWS * COLS;

const SHAPES = [
  { key: 'Z4', cells: [[0,0],[0,1],[1,1],[1,2]] },
  { key: 'T5', cells: [[0,0],[0,1],[0,2],[1,1],[2,1]] },
  { key: 'Z5a', cells: [[0,0],[0,1],[0,2],[1,1],[1,2]] },
  { key: 'I4', cells: [[0,0],[0,1],[0,2],[0,3]] },
  { key: 'L4', cells: [[0,0],[1,0],[2,0],[2,1]] },
  { key: 'V5', cells: [[0,0],[1,0],[2,0],[2,1],[2,2]] },
  { key: 'Z5b', cells: [[0,0],[0,1],[1,1],[2,0],[2,1]] },
  { key: 'L5', cells: [[0,0],[1,0],[2,0],[3,0],[3,1]] },
  { key: 'Q5', cells: [[0,1],[0,2],[1,0],[1,1],[1,2]] },
  { key: 'U5', cells: [[0,0],[0,1],[0,2],[1,0],[1,2]] }
];

function normalize(shape) {
  const minR = Math.min(...shape.map(s => s[0])), minC = Math.min(...shape.map(s => s[1]));
  return shape.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
function rot90(shape) {
  const maxR = Math.max(...shape.map(s => s[0]));
  return shape.map(([r, c]) => [c, maxR - r]);
}
function rotationsOf(shape) {
  const seen = new Set(), out = [];
  let cur = normalize(shape);
  for (let i = 0; i < 4; i++) {
    const k = JSON.stringify(cur);
    if (!seen.has(k)) { seen.add(k); out.push(cur); }
    cur = normalize(rot90(cur));
  }
  return out;
}

// ---- 与 TS 版一致的 DLX ----
class DLX {
  constructor(nCols) {
    this.n = nCols; this.H = nCols;
    this.cap = 8 * nCols + 4096;
    this.L = new Int32Array(this.cap); this.R = new Int32Array(this.cap);
    this.U = new Int32Array(this.cap); this.D = new Int32Array(this.cap);
    this.C = new Int32Array(this.cap); this.ROW = new Int32Array(this.cap);
    this.S = new Int32Array(nCols + 1);
    this.cnt = nCols + 1;
    for (let i = 0; i <= nCols; i++) { this.L[i]=i; this.R[i]=i; this.U[i]=i; this.D[i]=i; this.C[i]=i; this.ROW[i]=-1; this.S[i]=0; }
    for (let i = 0; i < nCols; i++) { this.R[i] = i + 1; this.L[i + 1] = i; }
    this.R[nCols - 1] = this.H; this.L[this.H] = nCols - 1; this.R[this.H] = 0; this.L[0] = this.H;
    this.sol = []; this.rowCount = 0; this.nodes = 0; this.NODE_LIMIT = 2000000;
  }
  grow() {
    const nc = this.cap * 2;
    const cp = (arr) => { const a = new Int32Array(nc); a.set(arr); return a; };
    this.L = cp(this.L); this.R = cp(this.R); this.U = cp(this.U); this.D = cp(this.D);
    this.C = cp(this.C); this.ROW = cp(this.ROW); this.cap = nc;
  }
  newNode() { if (this.cnt >= this.cap) this.grow(); return this.cnt++; }
  addRow(cols) {
    const rowId = this.rowCount++;
    let first = -1;
    for (const col of cols) {
      const x = this.newNode();
      this.C[x] = col; this.ROW[x] = rowId;
      this.U[x] = this.U[col]; this.D[x] = col; this.D[this.U[col]] = x; this.U[col] = x; this.S[col]++;
      if (first === -1) { first = x; this.L[x] = x; this.R[x] = x; }
      else { this.L[x] = this.L[first]; this.R[x] = first; this.R[this.L[first]] = x; this.L[first] = x; }
    }
    return rowId;
  }
  cover(c) {
    this.L[this.R[c]] = this.L[c]; this.R[this.L[c]] = this.R[c];
    for (let i = this.D[c]; i !== c; i = this.D[i])
      for (let j = this.R[i]; j !== i; j = this.R[j]) { this.U[this.D[j]] = this.U[j]; this.D[this.U[j]] = this.D[j]; this.S[this.C[j]]--; }
  }
  uncover(c) {
    for (let i = this.U[c]; i !== c; i = this.U[i])
      for (let j = this.L[i]; j !== i; j = this.L[j]) { this.S[this.C[j]]++; this.U[this.D[j]] = j; this.D[this.U[j]] = j; }
    this.L[this.R[c]] = c; this.R[this.L[c]] = c;
  }
  chooseCol() {
    let best = -1, bestS = Infinity;
    for (let c = this.R[this.H]; c !== this.H; c = this.R[c]) {
      if (this.S[c] < bestS) { bestS = this.S[c]; best = c; if (this.S[c] <= 1) break; }
    }
    return best;
  }
  search() {
    if (++this.nodes > this.NODE_LIMIT) return null;
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

// ---- 棋盘（完全镜像 src/game/board.ts 的 put()） ----
const valid = new Array(N).fill(false);
const validOf = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && valid[r * COLS + c];
const MONTH_INDEX = {}, DAY_INDEX = {}, WEEK_INDEX = {};
for (let m = 1; m <= 12; m++) {
  const r = Math.floor((m - 1) / 6), c = (m - 1) % 6;
  valid[r * COLS + c] = true; MONTH_INDEX[m] = r * COLS + c;
}
for (let d = 1; d <= 31; d++) {
  const r = 2 + Math.floor((d - 1) / 7), c = (d - 1) % 7;
  valid[r * COLS + c] = true; DAY_INDEX[d] = r * COLS + c;
}
for (let w = 0; w < 7; w++) {
  const r = w < 4 ? 6 : 7, c = w < 4 ? 3 + w : 4 + (w - 4);
  valid[r * COLS + c] = true; WEEK_INDEX[w] = r * COLS + c;
}
const VALID_COUNT = valid.filter(Boolean).length;

const PLACEMENTS = SHAPES.map((shape) => {
  const out = [];
  for (const rot of rotationsOf(shape.cells)) {
    let maxR = 0, maxC = 0;
    for (const [r, c] of rot) { if (r > maxR) maxR = r; if (c > maxC) maxC = c; }
    const h = maxR + 1, w = maxC + 1;
    for (let row = 0; row + h <= ROWS; row++) {
      for (let col = 0; col + w <= COLS; col++) {
        const cells = []; let ok = true;
        for (const [dr, dc] of rot) {
          const rr = row + dr, cc = col + dc;
          if (!validOf(rr, cc)) { ok = false; break; }
          cells.push(rr * COLS + cc);
        }
        if (ok) out.push({ piece: SHAPES.indexOf(shape), rot: rotationsOf(shape.cells).indexOf(rot), row, col, cells });
      }
    }
  }
  return out;
});

// 与 TS 版 board.ts 一致的索引表（在上面的棋盘构建中已建立）
function targetIndices(y, m, d) {
  const w = new Date(y, m - 1, d).getDay();
  return [MONTH_INDEX[m], DAY_INDEX[d], WEEK_INDEX[w]];
}

function solveFor(blocked) {
  const np = SHAPES.length;
  const colOf = new Int32Array(N).fill(-1);
  let nc = 0;
  for (let i = 0; i < N; i++) if (!blocked.has(i) && valid[i]) colOf[i] = nc++;
  const dlx = new DLX(nc + np);
  const rowPl = [];
  for (let i = 0; i < np; i++) {
    for (const pl of PLACEMENTS[i]) {
      if (pl.cells.some(x => blocked.has(x))) continue;
      const cols = pl.cells.map(x => colOf[x]); cols.push(nc + i);
      rowPl[dlx.addRow(cols)] = pl;
    }
  }
  const res = dlx.search();
  if (!Array.isArray(res)) return null;
  const out = new Array(np);
  for (const rowId of res) { const pl = rowPl[rowId]; if (!pl) return null; out[pl.piece] = pl; }
  for (let i = 0; i < np; i++) if (!out[i]) return null;
  return out;
}

console.log('有效格总数 =', VALID_COUNT, '（应为 50）');
console.log('碎片总格数 =', SHAPES.reduce((n, s) => n + s.cells.length, 0), '（应为 47）');
const totalPlacements = PLACEMENTS.reduce((n, l) => n + l.length, 0);
console.log('候选摆放总数 =', totalPlacements);

const t0 = Date.now();
let fails = 0, maxNodes = 0, checked = 0;
for (let y = 2024; y <= 2026; y++) {
  for (let m = 1; m <= 12; m++) {
    const dim = new Date(y, m, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const r = solveFor(new Set(targetIndices(y, m, d)));
      checked++;
      if (!r) { fails++; if (fails <= 10) console.log('  失败:', y, m, d); }
    }
  }
}
console.log(`\n检查 ${checked} 个日期，失败 ${fails} 个，耗时 ${Date.now() - t0}ms`);

// 抽查一个解的结构完整性
const sol = solveFor(new Set(targetIndices(2026, 10, 16)));
console.log('\n2026-10-16 目标格:', targetIndices(2026, 10, 16).join(','));
const seen = new Set();
let dup = false;
for (const pl of sol) {
  for (const c of pl.cells) { if (seen.has(c)) dup = true; seen.add(c); }
}
console.log('解覆盖格数 =', seen.size, '（应为 47），重复覆盖 =', dup);
console.log('解与目标格相交 =', sol.some(pl => pl.cells.some(c => targetIndices(2026, 10, 16).includes(c))));
