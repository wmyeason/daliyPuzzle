// 搜索能让全部日期可解的碎片集
const S = require('./search.js');

const TET = ['Z4', 'I4', 'L4'];                       // 固定三个四连格
const MANDATORY = ['T5', 'V5', 'L5', 'Q5', 'U5'];     // 用户描述确定的五连格
const PENT_POOL = ['Z5', 'Z5a', 'Z5b', 'F5', 'I5', 'N5', 'P5', 'W5', 'X5', 'Y5', 'T5', 'V5', 'L5', 'Q5', 'U5'];

// 先只测"困难日期"做快速筛选
const HARD = [];
for (const [y, m, d] of S.ALL_DATES) {
  if (d === 26 || d === 28 || d === 5 || d === 6 || d === 10 || d === 11 || d === 17 || d === 18 || d === 19) HARD.push([y, m, d]);
}
console.log('困难日期数:', HARD.length);

const results = [];
let tested = 0;
for (let i = 0; i < PENT_POOL.length; i++) {
  for (let j = i; j < PENT_POOL.length; j++) {
    const set = [...TET, ...MANDATORY, PENT_POOL[i], PENT_POOL[j]];
    tested++;
    const f1 = S.testAll(set, HARD);
    if (f1.length > 0) continue;
    const f2 = S.testAll(set);
    if (f2.length === 0) results.push(set.join(','));
    else console.log('  部分失败:', set.join(','), '->', f2.length, f2.slice(0, 5).map(x => x.join('-')).join(' '));
  }
}
console.log('测试组合数:', tested);
console.log('全部日期可解的组合 (' + results.length + '):');
results.forEach(r => console.log('  ' + r));
