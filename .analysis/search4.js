// 更广的碎片集搜索：固定 4 个高置信度五连格，其余 3 个槽位自由搜索
const S = require('./search.js');

const TET = ['Z4', 'I4', 'L4'];
const POOL = ['T5', 'V5', 'L5', 'Q5', 'U5', 'Z5', 'Z5a', 'Z5b', 'F5', 'N5', 'P5', 'W5', 'X5', 'Y5', 'I5'];
const ZLIKE = new Set(['Z5', 'Z5a', 'Z5b', 'F5', 'N5', 'W5']);

const FEASIBLE = S.ALL_DATES.filter(([y, m, d]) => !(d === 28 && new Date(y, m - 1, d).getDay() === 2));
const FILTER = FEASIBLE.filter(([y, m, d]) => d >= 22);

const t0 = Date.now();
const results = [];
let tested = 0;
for (let a = 0; a < POOL.length; a++)
  for (let b = a; b < POOL.length; b++)
    for (let c = b; c < POOL.length; c++) {
      const free = [POOL[a], POOL[b], POOL[c]];
      const set = [...TET, 'T5', 'V5', 'L5', 'Q5', ...free];
      tested++;
      if (S.testAll(set, FILTER).length > 0) continue;
      const f = S.testAll(set, FEASIBLE);
      if (f.length === 0) results.push({ set, zlike: free.filter(x => ZLIKE.has(x)).length });
    }
console.log('测试组合:', tested, '耗时', Date.now() - t0, 'ms');
console.log('全部可实现日期可解:', results.length);
results.sort((x, y) => y.zlike - x.zlike);
for (const r of results) console.log('  Z-like数=' + r.zlike + ' : ' + r.set.join(','));
