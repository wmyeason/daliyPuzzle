// 搜索碎片变体：先只在已知失败日期上测试，快速筛选
const ROWS = 8, COLS = 7;
const CELL_SET = new Set();
for (let c = 0; c < 6; c++) { CELL_SET.add(0*COLS+c); CELL_SET.add(1*COLS+c); }
for (let d = 1; d <= 31; d++) { const di=d-1; CELL_SET.add((2+Math.floor(di/7))*COLS + di%7); }
const wpos = [[6,3],[6,4],[6,5],[6,6],[7,3],[7,4],[7,5]];
for (const [r,c] of wpos) CELL_SET.add(r*COLS+c);

function targets(year, month, day) {
  const mc = (month-1) < 6 ? 0*COLS + (month-1)%6 : 1*COLS + (month-1)%6;
  const di = day-1;
  const dc = (2+Math.floor(di/7))*COLS + di%7;
  const jsW = new Date(year, month-1, day).getDay();
  const wc = wpos[jsW][0]*COLS + wpos[jsW][1];
  return [mc, dc, wc];
}
function rot90(s) { const mr = Math.max(...s.map(x=>x[0])); return s.map(([r,c])=>[c,mr-r]); }
function norm(s) { const mr=Math.min(...s.map(x=>x[0])), mc=Math.min(...s.map(x=>x[1])); return s.map(([r,c])=>[r-mr,c-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]); }
function rotations(s) { const seen=new Set(), out=[]; let cur=norm(s); for(let i=0;i<4;i++){const k=JSON.stringify(cur); if(!seen.has(k)){seen.add(k);out.push(cur);} cur=norm(rot90(cur));} return out; }

function makeSolver(pieces) {
  return function solve(year, month, day) {
    const tg = targets(year, month, day);
    const filled = new Uint8Array(ROWS*COLS);
    for (const b of tg) filled[b] = 1;
    const placements = pieces.map(p => {
      const list = [];
      for (const rot of rotations(p)) {
        const h = Math.max(...rot.map(s=>s[0])), w = Math.max(...rot.map(s=>s[1]));
        for (let r = 0; r+h < ROWS; r++) for (let c = 0; c+w < COLS; c++) {
          const cells = rot.map(([dr,dc]) => (r+dr)*COLS + (c+dc));
          if (cells.every(i => CELL_SET.has(i) && !filled[i])) list.push(cells);
        }
      }
      return list;
    });
    const used = new Array(pieces.length).fill(false);
    let nodes = 0;
    function findEmpty() { for (let i=0;i<ROWS*COLS;i++) if (CELL_SET.has(i) && !filled[i]) return i; return -1; }
    function bt() {
      nodes++; if (nodes > 2000000) return false;
      const idx = findEmpty(); if (idx === -1) return true;
      for (let pi=0; pi<pieces.length; pi++) {
        if (used[pi]) continue;
        for (const cells of placements[pi]) {
          if (!cells.includes(idx)) continue;
          if (cells.some(x=>filled[x])) continue;
          for (const x of cells) filled[x]=1; used[pi]=true;
          if (bt()) { for (const x of cells) filled[x]=0; used[pi]=false; return true; }
          for (const x of cells) filled[x]=0; used[pi]=false;
        }
      }
      return false;
    }
    return bt();
  };
}

// 固定碎片
const FIXED = [
  [[0,0],[0,1],[1,1],[1,2]],                                   // Z4 S-tetromino
  [[0,0],[0,1],[0,2],[1,1],[2,1]],                             // T5
  [[0,0],[0,1],[0,2],[0,3]],                                   // I4
  [[0,0],[1,0],[2,0],[3,0],[3,1]],                             // L5b 4x1 L
  [[0,1],[0,2],[1,0],[1,1],[1,2]],                             // P5a 2x3缺左上
  [[0,0],[0,1],[0,2],[1,0],[1,2]],                             // U5 2x3缺中下
];
// 变体碎片
const Z5A = { A: [[0,0],[0,1],[0,2],[1,1],[1,2]], B: [[0,0],[0,1],[0,2],[1,0],[1,1]] }; // XXX/.XX vs XXX/XX.
const Z5B = {
  v1: [[0,1],[1,0],[1,1],[2,0],[2,1]],  // .X/XX/XX
  v2: [[0,0],[1,0],[1,1],[2,0],[2,1]],  // X./XX/XX
  v3: [[0,0],[0,1],[1,1],[2,0],[2,1]],  // XX/.X/XX
  v4: [[0,0],[0,1],[1,0],[2,0],[2,1]],  // XX/X./XX
  v5: [[0,0],[0,1],[1,0],[1,1],[2,1]],  // XX/XX/.X
  v6: [[0,0],[0,1],[1,0],[1,1],[2,0]],  // XX/XX/X.
};
const L5A = { L: [[0,0],[1,0],[2,0],[2,1],[2,2]], J: [[0,2],[1,2],[2,0],[2,1],[2,2]] };
const L4  = { L: [[0,0],[1,0],[2,0],[2,1]], J: [[0,1],[1,1],[2,0],[2,1]] };

const FAIL_DATES = [[2024,5,28],[2024,6,28],[2025,1,28],[2025,2,28],[2025,3,28],[2025,10,28],[2025,11,28],[2026,4,26],[2026,4,28],[2026,7,26],[2026,7,28],[2026,8,28]];

let winners = [];
for (const [zaName, za] of Object.entries(Z5A))
for (const [zbName, zb] of Object.entries(Z5B))
for (const [laName, la] of Object.entries(L5A))
for (const [l4Name, l4] of Object.entries(L4)) {
  const pieces = [FIXED[0], FIXED[1], za, FIXED[2], l4, la, zb, FIXED[3], FIXED[4], FIXED[5]];
  const solve = makeSolver(pieces);
  let ok = true;
  for (const [y,m,d] of FAIL_DATES) { if (!solve(y,m,d)) { ok = false; break; } }
  if (ok) winners.push(`Z5a=${zaName} Z5b=${zbName} L5a=${laName} L4=${l4Name}`);
}
console.log('通过失败日期筛选的变体数:', winners.length);
winners.forEach(w => console.log(' ', w));
