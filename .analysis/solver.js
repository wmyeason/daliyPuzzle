// 日历拼图精确覆盖求解器：验证10个碎片(共47格)能覆盖任意日期目标外的所有格子
const ROWS = 8, COLS = 7;
// 构建棋盘格子 (row,col) -> label
function buildBoard() {
  const cells = [];
  for (let c = 0; c < 6; c++) cells.push({ r: 0, c, label: `${c+1}月` });
  for (let c = 0; c < 6; c++) cells.push({ r: 1, c, label: `${c+7}月` });
  for (let d = 1; d <= 31; d++) {
    const di = d - 1, r = 2 + Math.floor(di / 7), c = di % 7;
    cells.push({ r, c, label: `${d}日` });
  }
  const wk = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  const wpos = { '星期日':[6,3], '星期一':[6,4], '星期二':[6,5], '星期三':[6,6], '星期四':[7,3], '星期五':[7,4], '星期六':[7,5] };
  for (const w of wk) cells.push({ r: wpos[w][0], c: wpos[w][1], label: w });
  return cells;
}
const BOARD = buildBoard();
const CELL_SET = new Set(BOARD.map(b => b.r * COLS + b.c));
console.log('棋盘格子数:', BOARD.length);

// 目标格
function targets(year, month, day) {
  const mc = { r: (month-1) < 6 ? 0 : 1, c: (month-1) % 6 };
  const di = day - 1;
  const dc = { r: 2 + Math.floor(di / 7), c: di % 7 };
  const jsW = new Date(year, month-1, day).getDay(); // 0=日
  const wmap = [[6,3],[6,4],[6,5],[6,6],[7,3],[7,4],[7,5]];
  const wc = { r: wmap[jsW][0], c: wmap[jsW][1] };
  return [mc, dc, wc];
}

// 碎片定义（候选集合）
function rot90(shape) {
  const maxR = Math.max(...shape.map(s => s[0]));
  return shape.map(([r, c]) => [c, maxR - r]).sort((a,b) => a[0]-b[0] || a[1]-b[1]);
}
function normalize(shape) {
  const minR = Math.min(...shape.map(s => s[0])), minC = Math.min(...shape.map(s => s[1]));
  return shape.map(([r,c]) => [r-minR, c-minC]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
}
function rotations(shape) {
  const seen = new Set(), out = [];
  let cur = normalize(shape);
  for (let i = 0; i < 4; i++) {
    const key = JSON.stringify(cur);
    if (!seen.has(key)) { seen.add(key); out.push(cur); }
    cur = normalize(rot90(cur));
  }
  return out;
}

const PIECES = [
  { id: 'Z4',  shape: [[0,0],[0,1],[1,1],[1,2]] },                    // 2x2 Z字形 (S tetromino)
  { id: 'T5',  shape: [[0,0],[0,1],[0,2],[1,1],[2,1]] },              // 3x3 T字形
  { id: 'Z5a', shape: [[0,0],[0,1],[0,2],[1,1],[1,2]] },              // 2x3 Z字形
  { id: 'I4',  shape: [[0,0],[0,1],[0,2],[0,3]] },                    // 1x4 竖条
  { id: 'L4',  shape: [[0,0],[1,0],[2,0],[2,1]] },                    // 3x1 L
  { id: 'L5a', shape: [[0,0],[1,0],[2,0],[2,1],[2,2]] },              // 3x3 L
  { id: 'Z5b', shape: [[0,0],[0,1],[1,1],[2,1],[2,0]] },              // 3x2 Z字形 (尝试)
  { id: 'L5b', shape: [[0,0],[1,0],[2,0],[3,0],[3,1]] },              // 4x1 L
  { id: 'P5a', shape: [[0,1],[0,2],[1,0],[1,1],[1,2]] },              // 2x3 缺少左上
  { id: 'U5',  shape: [[0,0],[0,1],[0,2],[1,0],[1,2]] },              // 2x3 缺少中下
];
const total = PIECES.reduce((s,p) => s + p.shape.length, 0);
console.log('碎片总数:', PIECES.length, ' 总格数:', total, '(应为47)');

// 求解
function solve(year, month, day) {
  const tg = targets(year, month, day);
  const blocked = new Set(tg.map(t => t.r * COLS + t.c));
  const filled = new Uint8Array(ROWS * COLS);
  for (const b of blocked) filled[b] = 1;
  // 预计算每个碎片的所有摆放
  const placements = PIECES.map(p => {
    const list = [];
    for (const rot of rotations(p.shape)) {
      const h = Math.max(...rot.map(s=>s[0])), w = Math.max(...rot.map(s=>s[1]));
      for (let r = 0; r + h < ROWS; r++) {
        for (let c = 0; c + w < COLS; c++) {
          const cells = rot.map(([dr,dc]) => (r+dr)*COLS + (c+dc));
          if (cells.every(idx => CELL_SET.has(idx) && !filled[idx])) list.push(cells);
        }
      }
    }
    return list;
  });

  const used = new Array(PIECES.length).fill(false);
  let nodes = 0;
  function findEmpty() {
    for (let i = 0; i < ROWS*COLS; i++) if (CELL_SET.has(i) && !filled[i]) return i;
    return -1;
  }
  function bt() {
    nodes++;
    if (nodes > 3000000) return false;
    const idx = findEmpty();
    if (idx === -1) return true;
    const r = Math.floor(idx / COLS), c = idx % COLS;
    for (let pi = 0; pi < PIECES.length; pi++) {
      if (used[pi]) continue;
      for (const cells of placements[pi]) {
        if (!cells.includes(idx)) continue;
        if (cells.some(x => filled[x])) continue;
        for (const x of cells) filled[x] = 1;
        used[pi] = true;
        if (bt()) { for (const x of cells) filled[x] = 0; used[pi] = false; return true; }
        for (const x of cells) filled[x] = 0;
        used[pi] = false;
      }
    }
    return false;
  }
  const ok = bt();
  return { ok, nodes };
}

// 测试所有日期（2024-2026覆盖全部星期组合）
let fail = 0, dateCount = 0, maxNodes = 0;
for (let year = 2024; year <= 2026; year++) {
  for (let month = 1; month <= 12; month++) {
    const dim = new Date(year, month, 0).getDate();
    for (let day = 1; day <= dim; day++) {
      dateCount++;
      const res = solve(year, month, day);
      maxNodes = Math.max(maxNodes, res.nodes);
      if (!res.ok) { fail++; if (fail <= 30) console.log(`失败: ${year}-${month}-${day}`); }
    }
  }
}
console.log(`测试日期数: ${dateCount}, 失败: ${fail}, 最大搜索节点: ${maxNodes}`);
