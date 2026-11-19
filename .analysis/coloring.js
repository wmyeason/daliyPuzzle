// 棋盘染色分析：判断目标组合的色彩平衡是否可被碎片集补偿
const ROWS = 8, COLS = 7;
const cells = [];
for (let c = 0; c < 6; c++) { cells.push([0,c]); cells.push([1,c]); }
for (let d = 1; d <= 31; d++) { const di=d-1; cells.push([2+Math.floor(di/7), di%7]); }
const wpos = [[6,3],[6,4],[6,5],[6,6],[7,3],[7,4],[7,5]];
for (const [r,c] of wpos) cells.push([r,c]);

// (r+c) even = color0, odd = color1
let c0 = 0, c1 = 0;
for (const [r,c] of cells) { if ((r+c)%2===0) c0++; else c1++; }
console.log(`棋盘: ${cells.length}格, 色0=${c0}, 色1=${c1}, 差=${c0-c1}`);

// 目标格颜色
function targets(year, month, day) {
  const mc = (month-1) < 6 ? [0,(month-1)%6] : [1,(month-1)%6];
  const di = day-1;
  const dc = [2+Math.floor(di/7), di%7];
  const jsW = new Date(year, month-1, day).getDay();
  const wc = wpos[jsW];
  return [mc, dc, wc];
}
// 统计所有日期的 (色0目标数, 色1目标数)
const combos = new Map();
for (let year = 2024; year <= 2026; year++)
  for (let month = 1; month <= 12; month++) {
    const dim = new Date(year, month, 0).getDate();
    for (let day = 1; day <= dim; day++) {
      const tg = targets(year, month, day);
      const t0 = tg.filter(([r,c]) => (r+c)%2===0).length;
      const t1 = 3 - t0;
      const key = `${t0}-${t1}`;
      combos.set(key, (combos.get(key)||0)+1);
    }
  }
console.log('目标色组合分布 (色0目标数-色1目标数: 日期数):');
for (const [k,v] of [...combos.entries()].sort()) console.log(`  ${k}: ${v}`);

// 剩余区域色平衡: (c0-t0) - (c1-t1)
console.log('\n剩余区域色平衡 (色0-色1):');
for (const [k] of [...combos.entries()].sort()) {
  const [t0,t1] = k.split('-').map(Number);
  console.log(`  目标${k} -> 平衡 ${(c0-t0)-(c1-t1)}`);
}

// 碎片的色彩不平衡能力
const pieces = {
  'Z4(S tet)': [[0,0],[0,1],[1,1],[1,2]],
  'T5': [[0,0],[0,1],[0,2],[1,1],[2,1]],
  'Z5a': [[0,0],[0,1],[0,2],[1,1],[1,2]],
  'I4': [[0,0],[0,1],[0,2],[0,3]],
  'L4': [[0,0],[1,0],[2,0],[2,1]],
  'L5a': [[0,0],[1,0],[2,0],[2,1],[2,2]],
  'Z5b': [[0,0],[0,1],[1,1],[2,1],[2,0]],
  'L5b': [[0,0],[1,0],[2,0],[3,0],[3,1]],
  'P5a': [[0,1],[0,2],[1,0],[1,1],[1,2]],
  'U5': [[0,0],[0,1],[0,2],[1,0],[1,2]],
};
console.log('\n各碎片在锚点色0时的 (色0数-色1数):');
let sumMax = 0;
for (const [name, shape] of Object.entries(pieces)) {
  const e = shape.filter(([r,c]) => (r+c)%2===0).length;
  const o = shape.length - e;
  console.log(`  ${name}: ${shape.length}格, 锚点色0时平衡=${e-o}`);
}
