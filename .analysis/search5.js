// 修正棋盘后的碎片集全量搜索
const S = require('./search.js');

const TET = ['Z4', 'I4', 'L4'];
const MANDATORY = ['T5', 'V5', 'L5', 'Q5', 'U5'];   // 用户描述可确定的五连格
const POOL = ['Z5', 'Z5a', 'Z5b', 'F5', 'I5', 'N5', 'P5', 'W5', 'X5', 'Y5', 'T5', 'V5', 'L5', 'Q5', 'U5'];
const ZLIKE = new Set(['Z5', 'Z5a', 'Z5b', 'F5', 'N5', 'W5']);

const results = [];
let tested = 0;
const t0 = Date.now();
for (let i = 0; i < POOL.length; i++) {
  for (let j = i; j < POOL.length; j++) {
    const set = [...TET, ...MANDATORY, POOL[i], POOL[j]];
    tested++;
    const f = S.testAll(set);
    if (f.length === 0) results.push({ set, z: [POOL[i], POOL[j]].filter(x => ZLIKE.has(x)).length });
  }
}
console.log('测试组合:', tested, '耗时', Date.now() - t0, 'ms');
console.log('全部 1096 个日期可解的组合 (' + results.length + '):');
results.sort((a, b) => b.z - a.z);
for (const r of results) console.log('  Z-like=' + r.z + ' : ' + r.set.join(','));
