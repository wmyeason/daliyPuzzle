// 用 DLX 高速求解 + 碎片集搜索
const F = require('./fastsolver.js');
const { createDLX } = require('./dlx.js');
const { ROWS, COLS, CELLS, cellId, N, allPlacements, targetCells, ALL_DATES } = F;

// 碎片形状库（全部 12 种五连格 + 5 种四连格 + 2 个非标准Z变体）
const SHAPES = {
  // 四连格 (4格)
  Z4: [[0, 0], [0, 1], [1, 1], [1, 2]],
  I4: [[0, 0], [0, 1], [0, 2], [0, 3]],
  L4: [[0, 0], [1, 0], [2, 0], [2, 1]],
  T4: [[0, 0], [0, 1], [0, 2], [1, 1]],
  O4: [[0, 0], [0, 1], [1, 0], [1, 1]],
  // 五连格 (5格)
  F5: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  I5: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  L5: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
  P5: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  Q5: [[0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],   // 2x3 缺少左上（P的镜像）
  N5: [[0, 2], [0, 3], [1, 0], [1, 1], [1, 2]],
  T5: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
  U5: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]],
  V5: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  W5: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  X5: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  Y5: [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3]],
  Z5: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
  // Z 字形变体
  Z5a: [[0, 0], [0, 1], [0, 2], [1, 1], [1, 2]],   // XXX/.XX
  Z5b: [[0, 0], [0, 1], [1, 1], [2, 0], [2, 1]],   // XX./.X./XX.
};

const PLACE = {};
for (const k of Object.keys(SHAPES)) PLACE[k] = allPlacements(SHAPES[k]);

// 求解：blockedSet = 目标格（不参与覆盖）
function solveDate(pieceKeys, blockedSet) {
  const np = pieceKeys.length;
  // 列重映射：只把非 blocked 的格子作为列
  const colOf = new Int32Array(N).fill(-1);
  let nc = 0;
  for (let i = 0; i < N; i++) if (!blockedSet.has(i)) colOf[i] = nc++;
  const dlx = createDLX(nc + np);
  for (let i = 0; i < np; i++) {
    for (const cells of PLACE[pieceKeys[i]]) {
      if (cells.some(x => blockedSet.has(x))) continue;
      dlx.addRow(i, cells.map(x => colOf[x]).concat([nc + i]));
    }
  }
  return dlx.search();   // null=超限, false=无解, array=解(行号)
}

function testAll(pieceKeys, dates) {
  const list = dates || ALL_DATES;
  const fails = [];
  for (const [y, m, d] of list) {
    const tg = targetCells(y, m, d);
    const r = solveDate(pieceKeys, new Set(tg));
    if (r === null) fails.push([y, m, d, 'LIMIT']);
    else if (r === false) fails.push([y, m, d, 'NOSOL']);
  }
  return fails;
}

module.exports = { SHAPES, PLACE, solveDate, testAll, N, targetCells, ALL_DATES };

if (require.main === module) {
  const base = ['Z4', 'T5', 'Z5a', 'I4', 'L4', 'V5', 'Z5b', 'L5', 'Q5', 'U5'];
  const t0 = Date.now();
  const fails = testAll(base);
  console.log('基准碎片集:', base.join(','));
  console.log('耗时', Date.now() - t0, 'ms; 失败', fails.length);
  console.log(fails.map(f => f.join('-')).join(', '));
}
