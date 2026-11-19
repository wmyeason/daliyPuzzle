// 搜索能让全部"可实现"日期可解的碎片集（排除 28日+星期二 的数学不可能组合）
const S = require('./search.js');

const TET = ['Z4', 'I4', 'L4'];
const MANDATORY = ['T5', 'V5', 'L5', 'Q5', 'U5'];
const PENT_POOL = ['Z5', 'Z5a', 'Z5b', 'F5', 'I5', 'N5', 'P5', 'W5', 'X5', 'Y5', 'T5', 'V5', 'L5', 'Q5', 'U5'];

// 排除数学上不可能的日期：28日 + 星期二
const FEASIBLE = S.ALL_DATES.filter(([y, m, d]) => {
  if (d !== 28) return true;
  return new Date(y, m - 1, d).getDay() !== 2;   // 2 = Tuesday
});
const IMPOSSIBLE = S.ALL_DATES.filter(([y, m, d]) => {
  if (d !== 28) return false;
  return new Date(y, m - 1, d).getDay() === 2;
});
console.log('可实现日期:', FEASIBLE.length, ' 数学不可能日期:', IMPOSSIBLE.length,
  '(' + IMPOSSIBLE.map(x => x.join('-')).join(', ') + ')');

// 快速筛选集：全部 26/28 日 + 抽样
const FILTER = FEASIBLE.filter(([y, m, d]) => d >= 24);
console.log('快速筛选日期数:', FILTER.length);

const results = [];
let tested = 0;
const t0 = Date.now();
for (let i = 0; i < PENT_POOL.length; i++) {
  for (let j = i; j < PENT_POOL.length; j++) {
    const set = [...TET, ...MANDATORY, PENT_POOL[i], PENT_POOL[j]];
    tested++;
    if (S.testAll(set, FILTER).length > 0) continue;
    const f2 = S.testAll(set, FEASIBLE);
    if (f2.length === 0) results.push(set.join(','));
    else console.log('  部分失败:', set.join(','), '->', f2.length, f2.slice(0, 6).map(x => x.join('-')).join(' '));
  }
}
console.log('测试组合:', tested, '耗时', Date.now() - t0, 'ms');
console.log('全部可实现日期可解的组合 (' + results.length + '):');
results.forEach(r => console.log('  ' + r));
