<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { CELLS, COLS, ROWS, WEEKDAY_NAMES } from '../game/board';
import { PIECES } from '../game/pieces';
import {
  canPlace,
  isSolved,
  nextRot,
  pieceBox,
  shapeCells,
  type GameState,
  type PieceState
} from '../game/engine';

/* ------------------------------------------------------------------ */
/* 布局常量（逻辑像素，画布整体由 CSS 等比缩放）                        */
/* ------------------------------------------------------------------ */
const W = 1460;
const H = 820;
const CELL = 70;
const TRAY_CELL = 34;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const BOARD_X = (W - BOARD_W) / 2;
const BOARD_Y = 200;
const DATE_TOP = 18;
const DATE_H = 130;
const SIDE_TOP = 206;
const PANEL_X = [30, 1080];
const PANEL_W = 350;
const PANEL_PAD = 16;
const SLOT_W = 153;
const SLOT_H = 148;
const SLOT_GAP_X = 12;
const SLOT_GAP_Y = 12;
const SIDE_SLOT_COUNT = 5;

const FONT = '"PingFang SC","Microsoft YaHei","Hiragino Sans GB","Noto Sans SC",sans-serif';
const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];

/* ------------------------------------------------------------------ */
/* 主题调色板                                                          */
/* ------------------------------------------------------------------ */
interface Palette {
  backdrop: [string, string, string];
  boardGrad: [string, string];
  gridLine: string;
  boardEdge: string;
  cellFill: string;
  cellFillTarget: string;
  cellStroke: string;
  cellStrokeTarget: string;
  cellText: string;
  cellTextTarget: string;
  cellGlow: string;
  accent: string;
  panelFill: string;
  panelStroke: string;
  slotEmpty: string;
  slotOcc: string;
  slotStroke: string;
  slotStrokeSolid: string;
  label: string;
  labelLine: string;
  bannerTop: string;
  bannerBottom: string;
  bannerStroke: string;
  bannerDivider: string;
  dateColor: string;
  subColor: string;
  weekColor: string;
  progNum: string;
  progLabel: string;
  toastBg: string;
  toastText: string;
}

const DARK: Palette = {
  backdrop: ['#1b2b3f', '#152438', '#102033'],
  boardGrad: ['#18344e', '#11263a'],
  gridLine: 'rgba(123,183,228,.12)',
  boardEdge: 'rgba(120,181,226,.25)',
  cellFill: 'rgba(229,241,251,.9)',
  cellFillTarget: '#dff5ff',
  cellStroke: 'rgba(164,205,236,.42)',
  cellStrokeTarget: '#8bd8ff',
  cellText: '#294f70',
  cellTextTarget: '#145b88',
  cellGlow: 'rgba(95,198,255,.9)',
  accent: '#7fd4ff',
  panelFill: 'rgba(23,45,68,.66)',
  panelStroke: 'rgba(126,175,219,.18)',
  slotEmpty: 'rgba(90,144,190,.06)',
  slotOcc: 'rgba(105,162,206,.12)',
  slotStroke: 'rgba(126,183,229,.24)',
  slotStrokeSolid: 'rgba(98,153,195,.2)',
  label: 'rgba(178,209,236,.72)',
  labelLine: 'rgba(111,170,218,.28)',
  bannerTop: 'rgba(37,66,94,.78)',
  bannerBottom: 'rgba(19,41,61,.72)',
  bannerStroke: 'rgba(131,190,232,.2)',
  bannerDivider: 'rgba(131,190,232,.18)',
  dateColor: '#eef8ff',
  subColor: 'rgba(178,210,233,.72)',
  weekColor: '#8ed5ff',
  progNum: '#eef8ff',
  progLabel: 'rgba(178,210,233,.66)',
  toastBg: 'rgba(22,43,63,.94)',
  toastText: 'rgba(239,249,255,.94)'
};

const LIGHT: Palette = {
  backdrop: ['#f2f7fd', '#e9f1f9', '#e1ebf5'],
  boardGrad: ['#2d5272', '#193a57'],
  gridLine: 'rgba(158,211,248,.12)',
  boardEdge: 'rgba(130,195,239,.34)',
  cellFill: '#f7fbfe',
  cellFillTarget: '#e6f8ff',
  cellStroke: 'rgba(142,178,211,.48)',
  cellStrokeTarget: '#75c9f3',
  cellText: '#385b7b',
  cellTextTarget: '#14608c',
  cellGlow: 'rgba(88,190,244,.78)',
  accent: '#3b9bd0',
  panelFill: 'rgba(255,255,255,.64)',
  panelStroke: 'rgba(111,150,190,.2)',
  slotEmpty: 'rgba(214,230,245,.42)',
  slotOcc: 'rgba(236,246,255,.8)',
  slotStroke: 'rgba(105,155,201,.34)',
  slotStrokeSolid: 'rgba(90,142,187,.23)',
  label: '#547899',
  labelLine: 'rgba(84,129,169,.22)',
  bannerTop: 'rgba(255,255,255,.9)',
  bannerBottom: 'rgba(232,242,252,.84)',
  bannerStroke: 'rgba(99,143,185,.22)',
  bannerDivider: 'rgba(99,143,185,.2)',
  dateColor: '#193b5a',
  subColor: '#63829f',
  weekColor: '#267fae',
  progNum: '#173a59',
  progLabel: '#6a89a5',
  toastBg: 'rgba(248,252,255,.96)',
  toastText: '#315677'
};

/* ------------------------------------------------------------------ */
/* props / emits                                                       */
/* ------------------------------------------------------------------ */
const props = defineProps<{ game: GameState; won: boolean; theme?: 'light' | 'dark' }>();
const emit = defineEmits<{ (e: 'win'): void }>();

const game = computed(() => props.game);

function pal(): Palette {
  return props.theme === 'light' ? LIGHT : DARK;
}

/* ------------------------------------------------------------------ */
/* 内部状态                                                            */
/* ------------------------------------------------------------------ */
const cv = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let boardTexture: HTMLCanvasElement | null = null;
const toast = ref('');
let toastTimer = 0;

interface DragState {
  id: number;
  dr: number; // 抓取的相对格行（用于拖起后保持该格在指针下）
  dc: number;
  x: number; // 当前绘制锚点（背板坐标，按 CELL 放大）
  y: number;
  prevRow: number;
  prevCol: number;
}
let drag: DragState | null = null;

/* ------------------------------------------------------------------ */
/* 绘图工具                                                            */
/* ------------------------------------------------------------------ */
function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.lineTo(x + w - rr, y);
  g.quadraticCurveTo(x + w, y, x + w, y + rr);
  g.lineTo(x + w, y + h - rr);
  g.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  g.lineTo(x + rr, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - rr);
  g.lineTo(x, y + rr);
  g.quadraticCurveTo(x, y, x + rr, y);
  g.closePath();
}

/** 由格子集合求并集轮廓（返回格子坐标下的有序顶点，可围成一条闭合折线） */
function unionOutline(cellSet: Set<number>, w: number, h: number): Array<[number, number]> {
  const has = (r: number, c: number) => cellSet.has(r * 100 + c);
  const edges: Array<[number, number, number, number]> = [];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!has(r, c)) continue;
      if (!has(r - 1, c)) edges.push([c, r, c + 1, r]);
      if (!has(r, c + 1)) edges.push([c + 1, r, c + 1, r + 1]);
      if (!has(r + 1, c)) edges.push([c + 1, r + 1, c, r + 1]);
      if (!has(r, c - 1)) edges.push([c, r + 1, c, r]);
    }
  }
  if (edges.length === 0) return [];

  const byStart = new Map<string, number[]>();
  edges.forEach((e, i) => {
    const k = `${e[0]},${e[1]}`;
    const arr = byStart.get(k);
    if (arr) arr.push(i);
    else byStart.set(k, [i]);
  });

  const used = new Array<boolean>(edges.length).fill(false);
  const out: Array<[number, number]> = [[edges[0][0], edges[0][1]]];
  used[0] = true;
  let end: [number, number] = [edges[0][2], edges[0][3]];
  for (let step = 0; step < edges.length; step++) {
    const cand = byStart.get(`${end[0]},${end[1]}`) || [];
    let nxt = -1;
    for (const i of cand) if (!used[i]) { nxt = i; break; }
    if (nxt === -1) break;
    used[nxt] = true;
    out.push([edges[nxt][0], edges[nxt][1]]);
    end = [edges[nxt][2], edges[nxt][3]];
  }
  return out;
}

/** 把矩形折线描成圆角路径 */
function tracePath(g: CanvasRenderingContext2D, pts: Array<[number, number]>, radius: number): void {
  const n = pts.length;
  // 必须先重置当前路径：否则 fill() 会把同一 context 上此前累积的所有子路径一起填充
  // （最后一个碎片会用它自己的配色重绘此前所有碎片，甚至把背板最后一个格也盖成灰色）
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const nxt = pts[(i + 1) % n];
    const l1 = Math.hypot(prev[0] - cur[0], prev[1] - cur[1]) || 1;
    const l2 = Math.hypot(nxt[0] - cur[0], nxt[1] - cur[1]) || 1;
    const r1 = Math.min(radius, l1 / 2);
    const r2 = Math.min(radius, l2 / 2);
    const p1x = cur[0] + ((prev[0] - cur[0]) / l1) * r1;
    const p1y = cur[1] + ((prev[1] - cur[1]) / l1) * r1;
    const p2x = cur[0] + ((nxt[0] - cur[0]) / l2) * r2;
    const p2y = cur[1] + ((nxt[1] - cur[1]) / l2) * r2;
    if (i === 0) g.moveTo(p1x, p1y);
    else g.lineTo(p1x, p1y);
    g.quadraticCurveTo(cur[0], cur[1], p2x, p2y);
  }
  g.closePath();
}

/** 程序化生成科技感背板贴图 */
function makeBoardTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) return c;
  const p = pal();
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, p.boardGrad[0]);
  grad.addColorStop(0.55, p.boardGrad[1]);
  grad.addColorStop(1, p.boardGrad[0]);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  g.save();
  g.strokeStyle = p.gridLine;
  g.lineWidth = 1;
  for (let x = 0; x <= w; x += 24) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, h);
    g.stroke();
  }
  for (let y = 0; y <= h; y += 24) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(w, y + 0.5);
    g.stroke();
  }
  g.restore();

  g.save();
  g.strokeStyle = p.gridLine;
  g.globalAlpha = 0.7;
  for (let i = 0; i < 8; i++) {
    const x = 12 + i * 50;
    g.beginPath();
    g.moveTo(x, h);
    g.lineTo(x + 34, h - 34);
    g.stroke();
  }
  g.restore();

  const vg = g.createRadialGradient(w / 2, h * 0.35, 30, w / 2, h / 2, Math.max(w, h) * 0.72);
  vg.addColorStop(0, 'rgba(108,184,238,.08)');
  vg.addColorStop(0.55, 'rgba(24,54,78,0)');
  vg.addColorStop(1, 'rgba(5,20,34,.32)');
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);
  return c;
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const gg = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `rgb(${r},${gg},${b})`;
}

/* ------------------------------------------------------------------ */
/* 侧栏 / 槽位布局                                                      */
/* ------------------------------------------------------------------ */
function slotRect(slot: number): { x: number; y: number; w: number; h: number } {
  const side = slot < SIDE_SLOT_COUNT ? 0 : 1;
  const local = slot < SIDE_SLOT_COUNT ? slot : slot - SIDE_SLOT_COUNT;
  const col = local % 2;
  const rowIdx = Math.floor(local / 2);
  const centered = local === 4;
  return {
    x:
      PANEL_X[side] +
      PANEL_PAD +
      (centered ? (PANEL_W - PANEL_PAD * 2 - SLOT_W) / 2 : col * (SLOT_W + SLOT_GAP_X)),
    y: SIDE_TOP + 58 + rowIdx * (SLOT_H + SLOT_GAP_Y),
    w: SLOT_W,
    h: SLOT_H
  };
}

function panelRect(side: number): { x: number; y: number; w: number; h: number } {
  const rows = Math.ceil(SIDE_SLOT_COUNT / 2);
  return {
    x: PANEL_X[side],
    y: SIDE_TOP,
    w: PANEL_W,
    h: 58 + rows * (SLOT_H + SLOT_GAP_Y) + 14
  };
}

function pieceScale(p: PieceState): number {
  return p.row >= 0 ? CELL : TRAY_CELL;
}

function pieceAnchor(p: PieceState): { x: number; y: number } {
  if (drag && drag.id === p.id) return { x: drag.x, y: drag.y };
  if (p.row >= 0) return { x: BOARD_X + p.col * CELL, y: BOARD_Y + p.row * CELL };
  const s = slotRect(p.slot);
  const cell = TRAY_CELL;
  const box = pieceBox(p.id, p.rot);
  return { x: s.x + (s.w - box.w * cell) / 2, y: s.y + (s.h - box.h * cell) / 2 };
}

/* ------------------------------------------------------------------ */
/* 绘制                                                                */
/* ------------------------------------------------------------------ */
function drawPiece(
  g: CanvasRenderingContext2D,
  id: number,
  rot: number,
  x: number,
  y: number,
  alpha: number,
  outline?: string,
  cell: number = CELL
): void {
  const cells = shapeCells(id, rot);
  const set = new Set<number>();
  let maxR = 0;
  let maxC = 0;
  for (const [r, c] of cells) {
    set.add(r * 100 + c);
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  const w = maxC + 1;
  const h = maxR + 1;
  const raw = unionOutline(set, w, h);
  if (raw.length < 3) return;
  const onBoard = cell === CELL;
  const inset = onBoard ? 0 : Math.max(1, cell * 0.08);
  const rad = Math.max(1.2, cell * (onBoard ? 0.022 : 0.16));
  const pts = raw.map(
    ([a, b]) => [x + inset + a * (cell - inset * 2), y + inset + b * (cell - inset * 2)] as [number, number]
  );

  g.save();
  g.globalAlpha = alpha;

  if (!onBoard) {
    g.save();
    g.translate(0, Math.max(2, cell * 0.07));
    tracePath(g, pts, rad);
    g.fillStyle = 'rgba(22,44,66,.24)';
    g.fill();
    g.restore();
  }

  tracePath(g, pts, rad);
  const grad = g.createLinearGradient(x, y, x + w * cell, y + h * cell);
  grad.addColorStop(0, shade(PIECES[id].color, 15));
  grad.addColorStop(0.45, PIECES[id].color);
  grad.addColorStop(1, shade(PIECES[id].color, -38));
  g.fillStyle = grad;
  g.fill();

  g.lineWidth = onBoard ? 1 : Math.max(1, cell * 0.035);
  g.strokeStyle = onBoard ? 'rgba(226,244,255,.5)' : 'rgba(255,255,255,.48)';
  g.stroke();

  if (onBoard) {
    g.save();
    g.globalAlpha = alpha * 0.28;
    g.strokeStyle = '#e8f8ff';
    g.lineWidth = 0.8;
    g.translate(0, -1);
    g.stroke();
    g.restore();
  }

  if (outline) {
    g.lineWidth = Math.max(2, cell * 0.08);
    g.strokeStyle = outline;
    g.stroke();
  }
  g.restore();
}

function drawBackdrop(g: CanvasRenderingContext2D): void {
  const p = pal();
  const grad = g.createLinearGradient(0, 0, W * 0.85, H);
  grad.addColorStop(0, p.backdrop[0]);
  grad.addColorStop(0.55, p.backdrop[1]);
  grad.addColorStop(1, p.backdrop[2]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  g.save();
  g.fillStyle = 'rgba(86,149,197,.09)';
  for (let y = 24; y < H; y += 32) {
    for (let x = 24; x < W; x += 32) {
      const fade = 1 - Math.min(1, Math.hypot(x - W / 2, y - H / 2) / (W * 0.8));
      g.globalAlpha = Math.max(0, fade) * 0.7;
      g.beginPath();
      g.arc(x, y, 1.2, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}

function sectionLabel(g: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  const p = pal();
  g.font = `600 14px ${FONT}`;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillStyle = p.label;
  g.fillText(text, x, y);
  const wdt = g.measureText(text).width;
  g.fillStyle = p.labelLine;
  g.fillRect(x, y + 7, wdt, 2);
}

function drawDateBanner(g: CanvasRenderingContext2D): void {
  const p = pal();
  const st = game.value;
  const cx = BOARD_X + BOARD_W / 2;
  const bw = BOARD_W + 130;
  const bx = cx - bw / 2;
  const by = DATE_TOP;
  const bh = DATE_H;

  g.save();
  roundRect(g, bx, by, bw, bh, 16);
  const bg = g.createLinearGradient(bx, by, bx, by + bh);
  bg.addColorStop(0, p.bannerTop);
  bg.addColorStop(1, p.bannerBottom);
  g.fillStyle = bg;
  g.fill();
  g.strokeStyle = p.bannerStroke;
  g.lineWidth = 1;
  g.stroke();
  g.restore();

  const dividerX = bx + bw * 0.64;
  g.save();
  g.strokeStyle = p.bannerDivider;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(dividerX, by + 18);
  g.lineTo(dividerX, by + bh - 18);
  g.stroke();
  g.restore();

  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.font = `700 30px ${FONT}`;
  g.fillStyle = p.dateColor;
  g.fillText(`${st.year} 年 ${st.month} 月 ${st.day} 日`, bx + 28, by + 44);
  g.font = `500 14px ${FONT}`;
  g.fillStyle = p.subColor;
  g.fillText('目标：只露出「月份 · 日期 · 星期」三格', bx + 28, by + 72);

  g.textAlign = 'right';
  g.font = `700 26px ${FONT}`;
  g.fillStyle = p.weekColor;
  g.fillText(WEEKDAY_NAMES[st.weekday], bx + bw - 26, by + 44);
  const placed = st.pieces.filter((pp) => pp.row >= 0).length;
  g.font = `500 13px ${FONT}`;
  g.fillStyle = p.progLabel;
  g.fillText('已放置碎片', bx + bw - 26, by + 64);
  g.font = `700 22px ${FONT}`;
  g.fillStyle = p.progNum;
  g.fillText(`${placed} / ${PIECES.length}`, bx + bw - 26, by + 86);
}

function drawHelpPanels(g: CanvasRenderingContext2D): void {
  const p = pal();
  const y = DATE_TOP;
  // 高度与中间的日期横幅一致，上下边框正好对齐
  const h = DATE_H;
  const sections = [
    {
      title: '操作玩法',
      eyebrow: 'HOW TO PLAY',
      lines: ['拖拽碎片至背板自动吸附', '右键 / 双击旋转 90°', '提示一块 · 自动归位']
    },
    {
      title: '通关规则',
      eyebrow: 'WIN CONDITION',
      lines: ['只保留月份 / 日期 / 星期', '覆盖其余 47 个日期格', '完成后可关闭弹窗查看']
    }
  ];

  sections.forEach((section, side) => {
    const x = PANEL_X[side];
    const w = PANEL_W;
    g.save();
    roundRect(g, x, y, w, h, 16);
    const bg = g.createLinearGradient(x, y, x + w, y + h);
    bg.addColorStop(0, p.bannerTop);
    bg.addColorStop(1, p.bannerBottom);
    g.fillStyle = bg;
    g.fill();
    g.strokeStyle = p.bannerStroke;
    g.lineWidth = 1;
    g.stroke();
    g.restore();

    g.save();
    g.fillStyle = p.accent;
    g.globalAlpha = 0.65;
    roundRect(g, x + 16, y + 15, 3, 18, 2);
    g.fill();
    g.restore();

    g.save();
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.font = `700 9px "SFMono-Regular", Consolas, monospace`;
    g.fillStyle = p.label;
    g.fillText(section.eyebrow, x + 29, y + 26);
    g.font = `700 20px ${FONT}`;
    g.fillStyle = p.dateColor;
    g.fillText(section.title, x + 27, y + 50);
    g.font = `500 12px ${FONT}`;
    g.fillStyle = p.subColor;
    section.lines.forEach((line, index) => {
      const ly = y + 76 + index * 20;
      g.fillStyle = p.accent;
      g.globalAlpha = 0.75;
      g.beginPath();
      g.arc(x + 31, ly - 4, 2.2, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.fillStyle = p.subColor;
      g.fillText(line, x + 43, ly);
    });
    g.restore();
  });
}

function drawBoard(g: CanvasRenderingContext2D): void {
  const p = pal();
  const st = game.value;

  g.save();
  roundRect(g, BOARD_X - 11, BOARD_Y - 11, BOARD_W + 22, BOARD_H + 22, 16);
  g.shadowColor = 'rgba(24,66,104,.25)';
  g.shadowBlur = 28;
  g.shadowOffsetY = 10;
  g.fillStyle = p.boardGrad[1];
  g.fill();
  g.restore();

  g.save();
  roundRect(g, BOARD_X - 11, BOARD_Y - 11, BOARD_W + 22, BOARD_H + 22, 16);
  g.clip();
  if (boardTexture) g.drawImage(boardTexture, BOARD_X - 11, BOARD_Y - 11, BOARD_W + 22, BOARD_H + 22);
  g.restore();

  g.save();
  roundRect(g, BOARD_X - 11, BOARD_Y - 11, BOARD_W + 22, BOARD_H + 22, 16);
  g.strokeStyle = p.boardEdge;
  g.lineWidth = 1.6;
  g.stroke();
  g.restore();

  g.save();
  roundRect(g, BOARD_X - 5, BOARD_Y - 5, BOARD_W + 10, BOARD_H + 10, 12);
  g.strokeStyle = 'rgba(202,235,255,.18)';
  g.lineWidth = 1;
  g.stroke();
  g.restore();

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < CELLS.length; i++) {
    const info = CELLS[i];
    if (!info) continue;
    const x = BOARD_X + info.col * CELL;
    const y = BOARD_Y + info.row * CELL;
    const isTarget = st.target.includes(i);

    if (isTarget) {
      // 背光：两圈叠加辉光，先把目标格外围「点亮」
      g.save();
      g.shadowColor = p.cellGlow;
      g.shadowBlur = 34;
      g.fillStyle = p.cellFillTarget;
      roundRect(g, x + 3, y + 3, CELL - 6, CELL - 6, 8);
      g.fill();
      g.shadowBlur = 16;
      g.fill();
      g.restore();
    }

    g.save();
    roundRect(g, x + 3, y + 3, CELL - 6, CELL - 6, 8);
    const fill = g.createLinearGradient(x, y, x + CELL, y + CELL);
    fill.addColorStop(0, isTarget ? '#f7feff' : p.cellFill);
    fill.addColorStop(1, isTarget ? '#b7e8ff' : '#eaf4fc');
    g.fillStyle = fill;
    g.fill();
    g.strokeStyle = isTarget ? p.cellStrokeTarget : p.cellStroke;
    g.lineWidth = isTarget ? 2.4 : 1;
    g.stroke();

    if (isTarget) {
      // 内侧高亮描边，让高亮格与普通格拉开层次
      g.save();
      roundRect(g, x + 6, y + 6, CELL - 12, CELL - 12, 6);
      g.strokeStyle = p.accent;
      g.globalAlpha = 0.6;
      g.lineWidth = 1.6;
      g.stroke();
      g.restore();
    }
    g.restore();

    g.fillStyle = isTarget ? p.cellTextTarget : p.cellText;
    const cx = x + CELL / 2;
    const cy = y + CELL / 2;
    if (info.kind === 'month') {
      g.font = `600 ${Math.round(CELL * 0.34)}px ${FONT}`;
      g.fillText(info.label, cx, cy + 1);
    } else if (info.kind === 'day') {
      g.font = `700 ${Math.round(CELL * 0.46)}px ${FONT}`;
      g.fillText(info.label, cx, cy + 1);
    } else {
      g.font = `600 ${Math.round(CELL * 0.22)}px ${FONT}`;
      g.fillText('星期', cx, cy - CELL * 0.16);
      g.fillText(WEEK_CN[info.value], cx, cy + CELL * 0.18);
    }
  }
}

function drawTray(g: CanvasRenderingContext2D): void {
  const p = pal();
  const st = game.value;
  const titles = ['左侧碎片 · LIGHT', '右侧碎片 · CORE'];

  for (let side = 0; side < 2; side++) {
    const pr = panelRect(side);
    g.save();
    roundRect(g, pr.x, pr.y, pr.w, pr.h, 18);
    const panelBg = g.createLinearGradient(pr.x, pr.y, pr.x + pr.w, pr.y + pr.h);
    panelBg.addColorStop(0, p.panelFill);
    panelBg.addColorStop(1, side === 0 ? 'rgba(244,251,255,.72)' : 'rgba(234,246,254,.7)');
    g.fillStyle = panelBg;
    g.fill();
    g.strokeStyle = p.panelStroke;
    g.lineWidth = 1;
    g.stroke();
    g.save();
    roundRect(g, pr.x + 5, pr.y + 5, pr.w - 10, pr.h - 10, 14);
    g.strokeStyle = 'rgba(255,255,255,.55)';
    g.lineWidth = 1;
    g.stroke();
    g.restore();
    g.restore();

    sectionLabel(g, pr.x + 14, pr.y + 23, titles[side]);

    g.save();
    g.font = `600 9px "SFMono-Regular", Consolas, monospace`;
    g.textAlign = 'right';
    g.textBaseline = 'alphabetic';
    g.fillStyle = p.labelLine;
    const count = st.pieces.filter(
      (pp) => (side === 0 ? pp.slot < SIDE_SLOT_COUNT : pp.slot >= SIDE_SLOT_COUNT)
    ).length;
    g.fillText(`${count} / ${SIDE_SLOT_COUNT} READY`, pr.x + pr.w - 15, pr.y + 23);
    g.restore();
  }

  for (let s = 0; s < PIECES.length; s++) {
    const r = slotRect(s);
    const occupant = st.pieces.find(
      (pp) => pp.slot === s && pp.row < 0 && !(drag && drag.id === pp.id)
    );
    g.save();
    roundRect(g, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 12);
    const slotBg = g.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    slotBg.addColorStop(0, occupant ? 'rgba(255,255,255,.96)' : p.slotEmpty);
    slotBg.addColorStop(1, occupant ? p.slotOcc : 'rgba(229,241,251,.48)');
    g.fillStyle = slotBg;
    g.fill();
    if (occupant) {
      g.setLineDash([]);
      g.strokeStyle = p.slotStrokeSolid;
    } else {
      g.setLineDash([5, 5]);
      g.strokeStyle = p.slotStroke;
    }
    g.lineWidth = 1;
    g.stroke();
    if (occupant) {
      g.save();
      g.fillStyle = p.accent;
      g.globalAlpha = 0.32;
      g.beginPath();
      g.arc(r.x + r.w - 9, r.y + 9, 2.2, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.restore();
  }
}

function drawPieces(g: CanvasRenderingContext2D): void {
  const st = game.value;
  for (const p of st.pieces) {
    if (drag && drag.id === p.id) continue;
    const a = pieceAnchor(p);
    const cell = pieceScale(p);
    drawPiece(g, p.id, p.rot, a.x, a.y, 1, undefined, cell);
  }
}

function snapTarget(x: number, y: number): { row: number; col: number } | null {
  const row = Math.round((y - BOARD_Y) / CELL);
  const col = Math.round((x - BOARD_X) / CELL);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
  if (Math.abs(y - (BOARD_Y + row * CELL)) > CELL * 0.9) return null;
  if (Math.abs(x - (BOARD_X + col * CELL)) > CELL * 0.9) return null;
  return { row, col };
}

function drawDragLayer(g: CanvasRenderingContext2D): void {
  if (!drag) return;
  const st = game.value;
  const p = st.pieces[drag.id];
  const snap = snapTarget(drag.x, drag.y);
  if (snap) {
    const ok = canPlace(st, p.id, p.rot, snap.row, snap.col);
    drawPiece(
      g,
      p.id,
      p.rot,
      BOARD_X + snap.col * CELL,
      BOARD_Y + snap.row * CELL,
      0.42,
      ok ? '#57d97f' : '#ef5f5f'
    );
  }
  drawPiece(g, p.id, p.rot, drag.x, drag.y, 0.94);
}

function drawToast(g: CanvasRenderingContext2D): void {
  const p = pal();
  if (!toast.value) return;
  g.save();
  g.font = `500 14px ${FONT}`;
  const tw = g.measureText(toast.value).width;
  const bw = tw + 36;
  roundRect(g, W / 2 - bw / 2, 8, bw, 32, 16);
  g.fillStyle = p.toastBg;
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,.18)';
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = p.toastText;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(toast.value, W / 2, 25);
  g.restore();
}

function draw(): void {
  if (!ctx) return;
  const g = ctx;
  g.clearRect(0, 0, W, H);
  drawBackdrop(g);
  drawDateBanner(g);
  drawHelpPanels(g);
  drawTray(g);
  drawBoard(g);
  drawPieces(g);
  drawDragLayer(g);
  drawToast(g);
}

/* ------------------------------------------------------------------ */
/* 交互                                                                */
/* ------------------------------------------------------------------ */
function toCanvas(e: { clientX: number; clientY: number }): { x: number; y: number } {
  const el = cv.value;
  if (!el) return { x: 0, y: 0 };
  const r = el.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
}

function hitPiece(x: number, y: number): PieceState | null {
  const st = game.value;
  for (let i = st.pieces.length - 1; i >= 0; i--) {
    const p = st.pieces[i];
    const cell = pieceScale(p);
    const a = pieceAnchor(p);
    for (const [dr, dc] of shapeCells(p.id, p.rot)) {
      const px = a.x + dc * cell;
      const py = a.y + dr * cell;
      if (x >= px && x <= px + cell && y >= py && y <= py + cell) return p;
    }
  }
  return null;
}

function flash(text: string): void {
  toast.value = text;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value = '';
    draw();
  }, 2200);
}

function checkWin(): void {
  if (!props.won && isSolved(game.value)) emit('win');
}

function onDown(e: PointerEvent): void {
  if (props.won) return;
  const { x, y } = toCanvas(e);
  const p = hitPiece(x, y);
  if (!p) return;
  e.preventDefault();
  const el = e.currentTarget as HTMLElement;
  if (el.setPointerCapture) {
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* 忽略 */
    }
  }
  // 记录抓取的相对格，使拖起后该格始终跟随指针（托盘小比例 → 背板大比例平滑过渡）
  const cell = pieceScale(p);
  const a = pieceAnchor(p);
  const dr = Math.max(0, Math.floor((y - a.y) / cell));
  const dc = Math.max(0, Math.floor((x - a.x) / cell));
  drag = {
    id: p.id,
    dr,
    dc,
    x: x - (dc + 0.5) * CELL,
    y: y - (dr + 0.5) * CELL,
    prevRow: p.row,
    prevCol: p.col
  };
  p.row = -1;
  p.col = -1;
  game.value.moves++;
  if (cv.value) cv.value.style.cursor = 'grabbing';
  draw();
}

function onMove(e: PointerEvent): void {
  const { x, y } = toCanvas(e);
  if (!drag) {
    if (cv.value) cv.value.style.cursor = hitPiece(x, y) ? 'grab' : 'default';
    return;
  }
  drag.x = x - (drag.dc + 0.5) * CELL;
  drag.y = y - (drag.dr + 0.5) * CELL;
  draw();
}

function onUp(): void {
  if (!drag) return;
  const d = drag;
  drag = null;
  const p = game.value.pieces[d.id];
  const box = pieceBox(p.id, p.rot);
  const cx = d.x + (box.w * CELL) / 2;
  const cy = d.y + (box.h * CELL) / 2;
  // 以碎片中心判定落点：在背板矩形（外扩半格）内才尝试吸附；否则视为放回托盘
  const overBoard =
    cx >= BOARD_X - CELL / 2 &&
    cx <= BOARD_X + BOARD_W + CELL / 2 &&
    cy >= BOARD_Y - CELL / 2 &&
    cy <= BOARD_Y + BOARD_H + CELL / 2;
  const snap = overBoard ? snapTarget(d.x, d.y) : null;
  if (snap && canPlace(game.value, p.id, p.rot, snap.row, snap.col)) {
    p.row = snap.row;
    p.col = snap.col;
  } else if (!overBoard) {
    p.row = -1;
    p.col = -1;
  } else if (d.prevRow >= 0 && canPlace(game.value, p.id, p.rot, d.prevRow, d.prevCol)) {
    p.row = d.prevRow;
    p.col = d.prevCol;
  } else {
    p.row = -1;
    p.col = -1;
  }
  if (cv.value) cv.value.style.cursor = 'default';
  checkWin();
  draw();
}

function rotatePiece(p: PieceState): void {
  const id = p.id;
  const oldRot = p.rot;
  const newRot = nextRot(id, oldRot);
  const oldBox = pieceBox(id, oldRot);
  const newBox = pieceBox(id, newRot);
  const scale = pieceScale(p);
  const a = pieceAnchor(p);
  const cx = a.x + (oldBox.w * scale) / 2;
  const cy = a.y + (oldBox.h * scale) / 2;

  p.rot = newRot;
  if (p.row >= 0) {
    const row = Math.round((cy - (newBox.h * CELL) / 2 - BOARD_Y) / CELL);
    const col = Math.round((cx - (newBox.w * CELL) / 2 - BOARD_X) / CELL);
    if (canPlace(game.value, id, newRot, row, col)) {
      p.row = row;
      p.col = col;
    } else {
      p.row = -1;
      p.col = -1;
      flash('旋转后放不下了，已放回托盘');
    }
  }
  // 托盘内碎片旋转后自动保持在原槽位居中（pieceAnchor 依据 slot 重新计算）
  game.value.moves++;
  checkWin();
  draw();
}

function onContextMenu(e: MouseEvent): void {
  e.preventDefault();
  if (props.won) return;
  const { x, y } = toCanvas(e);
  const p = hitPiece(x, y);
  if (p) rotatePiece(p);
}

function onDblClick(e: MouseEvent): void {
  if (props.won) return;
  const { x, y } = toCanvas(e);
  const p = hitPiece(x, y);
  if (p) rotatePiece(p);
}

/* ------------------------------------------------------------------ */
/* 生命周期                                                            */
/* ------------------------------------------------------------------ */
onMounted(async () => {
  await nextTick();
  const el = cv.value;
  if (!el) return;
  // 高分屏适配：背板像素按 devicePixelRatio 放大，避免整体发虚
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  el.width = Math.round(W * dpr);
  el.height = Math.round(H * dpr);
  ctx = el.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  boardTexture = makeBoardTexture(BOARD_W + 24, BOARD_H + 24);
  // 兜底：即使 setPointerCapture 失败，也能收到画布外的抬手事件
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  draw();
});

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onUp);
});

// 换局 / 重开：清空拖拽态并重绘
watch(
  () => props.game,
  () => {
    drag = null;
    draw();
  }
);

// 局内状态被外部改动（提示 / 自动完成）时重绘
watch(
  () => props.game,
  () => draw(),
  { deep: true }
);

// 主题切换时重绘（画布内的颜色随主题变化）
watch(
  () => props.theme,
  () => draw()
);
</script>

<template>
  <canvas
    ref="cv"
    class="puzzle-canvas"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @contextmenu="onContextMenu"
    @dblclick="onDblClick"
  />
</template>

<style scoped>
.puzzle-canvas {
  /* 画布按视口高度等比缩放（比例 = 1460 : 820），保证首屏能看到底部的星期四/五/六 */
  width: min(100%, calc((100vh - 92px) * 1.7805));
  max-width: 1460px;
  height: auto;
  display: block;
  border-radius: 15px;
  box-shadow: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  background: transparent;
  margin: 0 auto;
}
</style>
