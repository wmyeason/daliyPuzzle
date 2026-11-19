// 快速精确覆盖求解器 + 碎片集搜索
// 棋盘: 8行x7列, 50个有效格
//   row0: 1-6月 (c0-c5)   row1: 7-12月 (c0-c5)
//   row2-6: 1-31日 (7列)  row6 c3-c6 + row7 c3-c5: 日一二三四五六
const ROWS = 8, COLS = 7;

const CELLS = [];
const cellId = new Array(ROWS * COLS).fill(-1);
function addCell(r, c, label) {
  const k = r * COLS + c;
  if (cellId[k] !== -1) throw new Error('dup ' + r + ',' + c);
  cellId[k] = CELLS.length;
  CELLS.push({ r, c, label });
}
for (let c = 0; c < 6; c++) addCell(0, c, `${c + 1}月`);
for (let c = 0; c < 6; c++) addCell(1, c, `${c + 7}月`);
for (let d = 1; d <= 31; d++) {
  const di = d - 1;
  addCell(2 + Math.floor(di / 7), di % 7, `${d}日`);
}
const WPOS = [[6, 3], [6, 4], [6, 5], [6, 6], [7, 4], [7, 5], [7, 6]];
const WNAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
WPOS.forEach(([r, c], i) => addCell(r, c, WNAMES[i]));
const N = CELLS.length; // 50

// ---- 形状工具 ----
function normalize(shape) {
  const minR = Math.min(...shape.map(s => s[0])), minC = Math.min(...shape.map(s => s[1]));
  return shape.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
function rot90(shape) {
  const maxR = Math.max(...shape.map(s => s[0]));
  return shape.map(([r, c]) => [c, maxR - r]);
}
function rotations(shape) {
  const seen = new Set(), out = [];
  let cur = normalize(shape);
  for (let i = 0; i < 4; i++) {
    const k = JSON.stringify(cur);
    if (!seen.has(k)) { seen.add(k); out.push(cur); }
    cur = normalize(rot90(cur));
  }
  return out;
}
// 所有摆放（不含 blocked），返回 cell-index 数组的列表
function allPlacements(shape) {
  const out = [];
  for (const rot of rotations(shape)) {
    const h = Math.max(...rot.map(s => s[0])), w = Math.max(...rot.map(s => s[1]));
    for (let r = 0; r + h < ROWS; r++) {
      for (let c = 0; c + w < COLS; c++) {
        const ids = [];
        let ok = true;
        for (const [dr, dc] of rot) {
          const id = cellId[(r + dr) * COLS + (c + dc)];
          if (id < 0) { ok = false; break; }
          ids.push(id);
        }
        if (ok) out.push(ids);
      }
    }
  }
  return out;
}

// ---- 求解 ----
function solve(pieces, blockedMask, placementCache) {
  const np = pieces.length;
  const pl = placementCache || pieces.map(p => allPlacements(p.shape));
  // cell -> placements covering it
  const cover = Array.from({ length: N }, () => []);
  const avail = new Array(np);
  for (let i = 0; i < np; i++) {
    avail[i] = [];
    for (let k = 0; k < pl[i].length; k++) {
      const cells = pl[i][k];
      if (cells.some(x => blockedMask.has(x))) continue;
      avail[i].push(k);
      for (const x of cells) cover[x].push([i, k]);
    }
  }
  const filled = new Uint8Array(N);
  for (const b of blockedMask) filled[b] = 1;
  const used = new Uint8Array(np);
  let nodes = 0;
  const NODE_LIMIT = 400000;

  function pickCell() {
    let best = -1, bestCnt = 1e9;
    for (let x = 0; x < N; x++) {
      if (filled[x]) continue;
      let cnt = 0;
      for (const [i] of cover[x]) if (!used[i]) cnt++;
      if (cnt === 0) return x;      // 死格
      if (cnt < bestCnt) { bestCnt = cnt; best = x; if (cnt === 1) break; }
    }
    return best;
  }

  function bt() {
    if (++nodes > NODE_LIMIT) return false;
    const cell = pickCell();
    if (cell === -1) return true;
    for (const [i, k] of cover[cell]) {
      if (used[i]) continue;
      const cells = pl[i][k];
      if (cells.some(x => filled[x])) continue;
      for (const x of cells) filled[x] = 1;
      used[i] = 1;
      if (bt()) {
        for (const x of cells) filled[x] = 0;
        used[i] = 0;
        return true;
      }
      for (const x of cells) filled[x] = 0;
      used[i] = 0;
    }
    return false;
  }
  const ok = bt();
  return { ok, nodes, hitLimit: nodes > NODE_LIMIT };
}

// ---- 目标格 ----
function targetCells(year, month, day) {
  const mc = (month - 1) < 6 ? [0, (month - 1) % 6] : [1, (month - 1) % 6];
  const di = day - 1;
  const dc = [2 + Math.floor(di / 7), di % 7];
  const jsW = new Date(year, month - 1, day).getDay();
  const wc = WPOS[jsW];
  return [mc, dc, wc].map(([r, c]) => cellId[r * COLS + c]);
}

const ALL_DATES = [];
for (let y = 2024; y <= 2026; y++)
  for (let m = 1; m <= 12; m++) {
    const dim = new Date(y, m, 0).getDate();
    for (let d = 1; d <= dim; d++) ALL_DATES.push([y, m, d]);
  }

function testAll(pieces, cache, dates) {
  const list = dates || ALL_DATES;
  const fails = [];
  let maxNodes = 0;
  for (const [y, m, d] of list) {
    const tg = targetCells(y, m, d);
    const res = solve(pieces, new Set(tg), cache);
    maxNodes = Math.max(maxNodes, res.nodes);
    if (!res.ok) fails.push([y, m, d]);
  }
  return { fails, maxNodes };
}

module.exports = { ROWS, COLS, CELLS, cellId, N, normalize, rot90, rotations, allPlacements, solve, targetCells, ALL_DATES, testAll };
