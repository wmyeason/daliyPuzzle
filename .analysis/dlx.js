// DLX (Dancing Links) 精确覆盖求解器 — 支持"每个碎片恰好用一次"约束
// 用法: new DLX(nCellCols, nPieceCols) -> addRow(pieceIdx, cells) -> search()

function createDLX(nCols) {
  const n = nCols;
  const size = 8 * n + 4096;
  let cap = size;
  let L = new Int32Array(cap), R = new Int32Array(cap), U = new Int32Array(cap), D = new Int32Array(cap);
  let C = new Int32Array(cap), ROW = new Int32Array(cap);
  let S = new Int32Array(n + 1);          // 列大小（含头结点索引 n）
  let cnt = n + 1;                        // 已用结点数（0..n 为头结点）
  const H = n;                            // 根结点索引 = n

  function newNode() {
    if (cnt >= cap) {
      const nc = cap * 2;
      const nL = new Int32Array(nc); nL.set(L); L = nL;
      const nR = new Int32Array(nc); nR.set(R); R = nR;
      const nU = new Int32Array(nc); nU.set(U); U = nU;
      const nD = new Int32Array(nc); nD.set(D); D = nD;
      const nC = new Int32Array(nc); nC.set(C); C = nC;
      const nRow = new Int32Array(nc); nRow.set(ROW); ROW = nRow;
      cap = nc;
    }
    return cnt++;
  }
  // 初始化: 头结点 0..n-1 为列头, n 为根
  for (let i = 0; i <= n; i++) { L[i] = i; R[i] = i; U[i] = i; D[i] = i; C[i] = i; ROW[i] = -1; }
  // 串成水平环: 0-1-2-...-(n-1)-H-0
  for (let i = 0; i < n; i++) { R[i] = i + 1; L[i + 1] = i; }
  R[n - 1] = H; L[H] = n - 1; R[H] = 0; L[0] = H;
  for (let i = 0; i <= n; i++) S[i] = 0;

  function cover(c) {
    L[R[c]] = L[c]; R[L[c]] = R[c];
    for (let i = D[c]; i !== c; i = D[i]) {
      for (let j = R[i]; j !== i; j = R[j]) {
        U[D[j]] = U[j]; D[U[j]] = D[j]; S[C[j]]--;
      }
    }
  }
  function uncover(c) {
    for (let i = U[c]; i !== c; i = U[i]) {
      for (let j = L[i]; j !== i; j = L[j]) {
        S[C[j]]++; U[D[j]] = j; D[U[j]] = j;
      }
    }
    L[R[c]] = c; R[L[c]] = c;
  }

  const rows = [];        // rows[r] = [pieceIdx, [cellIds...]]
  const sol = [];
  let nodes = 0;
  const NODE_LIMIT = 2000000;

  function addRow(pieceIdx, cells) {
    const rowId = rows.length;
    rows.push([pieceIdx, cells]);
    let first = -1;
    for (const cell of cells) {
      const col = cell;                 // 0..nCellCols-1 为格子列
      const x = newNode();
      C[x] = col; ROW[x] = rowId;
      U[x] = U[col]; D[x] = col; D[U[col]] = x; U[col] = x; S[col]++;
      if (first === -1) { first = x; L[x] = x; R[x] = x; }
      else { L[x] = L[first]; R[x] = first; R[L[first]] = x; L[first] = x; }
    }
    return rowId;
  }

  function chooseCol() {
    let best = -1, bestS = 1e9;
    for (let c = R[H]; c !== H; c = R[c]) {
      if (S[c] < bestS) { bestS = S[c]; best = c; if (S[c] <= 1) break; }
    }
    return best;
  }

  function search() {
    if (++nodes > NODE_LIMIT) return null;   // null = 超限
    if (R[H] === H) return sol.slice();
    const c = chooseCol();
    if (S[c] === 0) return false;
    cover(c);
    for (let r = D[c]; r !== c; r = D[r]) {
      sol.push(ROW[r]);
      for (let j = R[r]; j !== r; j = R[j]) cover(C[j]);
      const res = search();
      if (res !== false) return res;
      for (let j = L[r]; j !== r; j = L[j]) uncover(C[j]);
      sol.pop();
    }
    uncover(c);
    return false;
  }

  return { addRow, search, get nodes() { return nodes; }, rows };
}

module.exports = { createDLX };
