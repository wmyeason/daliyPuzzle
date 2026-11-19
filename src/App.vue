<script setup lang="ts">
import { ref } from 'vue';

import GameCanvas from './components/GameCanvas.vue';
import { createGame, isAtSolution, isSolved, type GameState } from './game/engine';
import { daysInMonth, formatDate, toDateInputValue } from './game/board';

const today = new Date();
const game = ref<GameState>(
  createGame(today.getFullYear(), today.getMonth() + 1, today.getDate())
);
const won = ref(false);
const showWin = ref(false);
const winDate = ref('');
const dateStr = ref(toDateInputValue(today.getFullYear(), today.getMonth() + 1, today.getDate()));

const theme = ref<'light' | 'dark'>(
  (localStorage.getItem('puzzle-theme-v2') as 'light' | 'dark') || 'light'
);
function applyTheme(): void {
  document.documentElement.classList.toggle('theme-dark', theme.value === 'dark');
  document.documentElement.classList.remove('theme-light');
}
function toggleTheme(): void {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('puzzle-theme-v2', theme.value);
  applyTheme();
}
applyTheme();

function startGame(year: number, month: number, day: number): void {
  try {
    game.value = createGame(year, month, day);
    won.value = false;
    showWin.value = false;
    dateStr.value = toDateInputValue(year, month, day);
  } catch {
    /* 极少数情况下无法求解时，保持当前局面 */
  }
}

function onDateInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return;
  startGame(year, month, day);
}

function randomDate(): void {
  const start = new Date(2024, 0, 1).getTime();
  const end = new Date(2026, 11, 31).getTime();
  const pick = new Date(start + Math.random() * (end - start));
  startGame(pick.getFullYear(), pick.getMonth() + 1, pick.getDate());
}

function reset(): void {
  const state = game.value;
  startGame(state.year, state.month, state.day);
}

function checkWin(): void {
  if (won.value) return;
  const state = game.value;
  if (isSolved(state)) {
    won.value = true;
    showWin.value = true;
    winDate.value = formatDate(state.year, state.month, state.day);
  }
}

function closeWin(): void {
  showWin.value = false;
}

function hint(): void {
  if (won.value) return;
  const state = game.value;
  const piece = state.pieces.find((item) => !isAtSolution(state, item));
  if (!piece) return;
  const solution = state.solution.get(piece.id);
  if (!solution) return;
  piece.rot = solution.rot;
  piece.row = solution.row;
  piece.col = solution.col;
  state.moves++;
  checkWin();
}

function autoSolve(): void {
  if (won.value) {
    showWin.value = true;
    return;
  }
  const state = game.value;
  for (const piece of state.pieces) {
    const solution = state.solution.get(piece.id);
    if (!solution) continue;
    piece.rot = solution.rot;
    piece.row = solution.row;
    piece.col = solution.col;
  }
  state.moves++;
  checkWin();
}

</script>

<template>
  <div class="app" :class="theme === 'dark' ? 'is-dark' : 'is-light'">
    <header class="topbar">
      <div class="brand">
        <div class="logo-mark" aria-hidden="true"><span></span><span></span></div>
        <div class="brand-text">
          <p class="eyebrow">DAILY CALENDAR PUZZLE</p>
          <h1>日历拼图 <span>AI Puzzle Lab</span></h1>
        </div>
      </div>

      <div class="controls">
        <button type="button" class="btn icon-btn" :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'" @click="toggleTheme">
          {{ theme === 'dark' ? '☀' : '☾' }}
        </button>
        <label class="date-field">
          <span>目标日期</span>
          <input type="date" :value="dateStr" @change="onDateInput" />
        </label>
        <button type="button" class="btn" @click="randomDate">随机一天</button>
        <button type="button" class="btn" @click="reset">重新打乱</button>
        <button type="button" class="btn" @click="hint">提示一块</button>
        <button type="button" class="btn primary" @click="autoSolve">自动完成</button>
      </div>
    </header>

    <main class="stage">
      <section class="game-shell">
        <div class="canvas-wrap">
          <GameCanvas :game="game" :won="won" :theme="theme" @win="checkWin" />

          <div v-if="won && showWin" class="win-mask" @click.self="closeWin">
            <div class="win-card" role="dialog" aria-modal="true" aria-label="拼图完成">
              <button type="button" class="win-close" aria-label="关闭提示" @click="closeWin">×</button>
              <div class="win-badge"><span>COMPLETE</span><i></i></div>
              <div class="win-emoji">🎉</div>
              <h2>拼图完成</h2>
              <p class="win-date">{{ winDate }}</p>
              <p class="win-sub">共用 {{ game.moves }} 步操作 · 10 块碎片已全部归位</p>
              <div class="win-btns">
                <button type="button" class="primary" @click="closeWin">查看完成图</button>
                <button type="button" class="ghost" @click="randomDate">再来一天</button>
                <button type="button" class="ghost" @click="reset">重玩这天</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="foot">
        <span>AI-ASSISTED PRECISION COVER</span>
        <p>拼图合法性由内置 <b>DLX 精确覆盖求解器</b> 保证 · 2024–2026 全部 1096 个日期均验证可解</p>
      </footer>
    </main>
  </div>
</template>
<style scoped>
.app {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #264866;
  overflow-x: clip;
}

.app::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  content: "";
  background-image:
    linear-gradient(rgba(104, 157, 200, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(104, 157, 200, 0.035) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(to bottom, black, transparent 82%);
  pointer-events: none;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  padding: 12px clamp(18px, 3vw, 42px);
  background: rgba(247, 252, 255, 0.88);
  border-bottom: 1px solid rgba(112, 158, 199, 0.16);
  box-shadow: 0 5px 22px rgba(67, 116, 159, 0.06);
  backdrop-filter: blur(18px) saturate(140%);
}

.brand { display: flex; align-items: center; gap: 13px; }

.logo-mark {
  position: relative;
  width: 42px;
  height: 42px;
  flex: none;
  background: linear-gradient(145deg, #416a96, #162c47);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(36, 76, 120, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.logo-mark::after {
  position: absolute;
  inset: 7px;
  content: "";
  border: 1px solid rgba(155, 219, 255, 0.58);
  border-radius: 7px;
}

.logo-mark span {
  position: absolute;
  z-index: 1;
  width: 8px;
  height: 8px;
  background: #c8efff;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(136, 220, 255, 0.9);
}

.logo-mark span:first-child { top: 11px; left: 11px; }
.logo-mark span:last-child { right: 11px; bottom: 11px; }
.brand-text { min-width: 0; }

.eyebrow,
.panel-kicker {
  margin: 0;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #6d8aab;
}

.brand-text h1 {
  margin: 3px 0 0;
  font-size: 19px;
  letter-spacing: 0.02em;
  color: #19324d;
}

.brand-text h1 span {
  margin-left: 7px;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: #557aa0;
}

.controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

.date-field {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 38px;
  padding: 0 5px 0 12px;
  font-size: 11px;
  font-weight: 600;
  color: #55708f;
  background: rgba(233, 241, 250, 0.82);
  border: 1px solid rgba(93, 126, 165, 0.2);
  border-radius: 11px;
}

.date-field input {
  height: 30px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #254665;
  background: #fdfefe;
  border: 1px solid rgba(105, 139, 177, 0.18);
  border-radius: 8px;
  outline: none;
}

.date-field input:focus {
  border-color: #6da8d8;
  box-shadow: 0 0 0 3px rgba(91, 163, 218, 0.12);
}

.btn {
  height: 38px;
  padding: 0 15px;
  font-size: 12px;
  font-weight: 600;
  color: #365878;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(234, 242, 251, 0.94));
  border: 1px solid rgba(95, 129, 169, 0.2);
  border-radius: 11px;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(40, 76, 116, 0.06);
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.btn:hover {
  background: #fff;
  border-color: rgba(70, 130, 185, 0.42);
  box-shadow: 0 7px 18px rgba(47, 99, 151, 0.12);
  transform: translateY(-1px);
}

.btn.primary {
  color: #eff9ff;
  font-weight: 700;
  background: linear-gradient(135deg, #3d7bab, #25587f);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 7px 18px rgba(37, 91, 134, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.btn.primary:hover { background: linear-gradient(135deg, #4689bb, #28658f); }
.icon-btn { width: 38px; padding: 0; font-size: 17px; }

.stage {
  flex: 1;
  width: 100%;
  max-width: 1460px;
  margin: 0 auto;
  padding: 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.game-shell {
  padding: 12px;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.93), rgba(238, 247, 254, 0.88));
  border: 1px solid rgba(105, 157, 201, 0.24);
  border-radius: 22px;
  box-shadow: 0 18px 50px rgba(72, 123, 168, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
}

.shell-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 30px;
  padding: 0 10px 10px;
  font-size: 11px;
  color: #6682a0;
}

.status-target,
.status-progress { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

.status-target strong,
.status-progress strong {
  font-family: "SFMono-Regular", Consolas, monospace;
  color: #294e72;
}

.status-weekday {
  padding: 3px 8px;
  color: #4f83ad;
  background: rgba(218, 237, 252, 0.7);
  border: 1px solid rgba(99, 157, 207, 0.2);
  border-radius: 999px;
}

.live-dot {
  width: 7px;
  height: 7px;
  background: #4b9dd4;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(75, 157, 212, 0.13), 0 0 13px rgba(75, 157, 212, 0.7);
}

.done-pill {
  padding: 4px 9px;
  font-weight: 700;
  color: #2a6b94;
  background: rgba(210, 238, 255, 0.72);
  border: 1px solid rgba(70, 153, 205, 0.22);
  border-radius: 999px;
}

.canvas-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 15px;
}

.shell-status .status-target,
.shell-status .status-progress {
  padding: 4px 9px;
  background: rgba(232, 245, 254, 0.62);
  border: 1px solid rgba(108, 166, 207, 0.16);
  border-radius: 999px;
}

.win-mask {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(94, 124, 155, 0.24);
  backdrop-filter: blur(6px) saturate(120%);
  animation: fade-in 0.22s ease;
}

.win-card {
  position: relative;
  width: min(420px, 92%);
  padding: 25px 28px 24px;
  overflow: hidden;
  text-align: center;
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.98), rgba(236, 244, 252, 0.98));
  border: 1px solid rgba(76, 127, 175, 0.24);
  border-radius: 20px;
  box-shadow: 0 28px 80px rgba(24, 54, 86, 0.3), inset 0 1px 0 #fff;
  animation: card-in 0.3s cubic-bezier(0.2, 0.9, 0.25, 1.1);
}

.win-card::before {
  position: absolute;
  top: -70px;
  left: 50%;
  width: 230px;
  height: 130px;
  content: "";
  background: radial-gradient(circle, rgba(93, 174, 230, 0.26), transparent 70%);
  transform: translateX(-50%);
  pointer-events: none;
}

.win-close {
  position: absolute;
  top: 13px;
  right: 13px;
  z-index: 2;
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
  color: #66829f;
  background: rgba(226, 237, 248, 0.78);
  border: 1px solid rgba(99, 137, 177, 0.16);
  border-radius: 8px;
  cursor: pointer;
}

.win-close:hover { color: #294f72; background: #fff; }

.win-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #5684aa;
}

.win-badge i { width: 23px; height: 1px; background: linear-gradient(90deg, #74aed7, transparent); }
.win-emoji { font-size: 42px; line-height: 1; }
.win-card h2 { margin: 10px 0 6px; font-size: 23px; color: #1d3c5a; }
.win-date { margin: 0; font-size: 17px; font-weight: 700; color: #347cac; }
.win-sub { margin: 8px 0 20px; font-size: 12px; color: #6e89a5; }
.win-btns { display: flex; flex-wrap: wrap; gap: 9px; justify-content: center; }

.win-btns button {
  min-height: 38px;
  padding: 0 17px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease, background 0.15s ease;
}

.win-btns button:hover { transform: translateY(-1px); filter: brightness(1.02); }

.win-btns .primary {
  color: #f3faff;
  background: linear-gradient(135deg, #4486b8, #28658d);
  box-shadow: 0 8px 18px rgba(49, 111, 161, 0.24);
}

.win-btns .ghost {
  color: #4e708f;
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(91, 132, 174, 0.22);
}

.info-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 18px;
}

.panel {
  padding: 20px 22px;
  background: rgba(250, 253, 255, 0.8);
  border: 1px solid rgba(101, 153, 198, 0.18);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(72, 121, 164, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 13px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(96, 130, 166, 0.12);
}

.panel-heading h2 { margin: 4px 0 0; font-size: 16px; color: #274967; }
.panel-heading h2 small { margin-left: 6px; font-size: 10px; font-weight: 500; color: #7b95ad; }

.panel-index {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 18px;
  font-weight: 700;
  color: rgba(82, 122, 163, 0.23);
}

.rules { margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; list-style: none; }

.rules li {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 8px 10px;
  background: linear-gradient(90deg, rgba(228, 239, 250, 0.56), rgba(247, 251, 255, 0.32));
  border-left: 2px solid rgba(80, 141, 191, 0.32);
  border-radius: 0 8px 8px 0;
}

.rules b { font-size: 12px; color: #2b577c; }
.rules span { font-size: 12px; line-height: 1.6; color: #607b95; }
.legend-group + .legend-group { margin-top: 15px; }

.legend-group-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.legend-group-head b { font-size: 12px; color: #365d7e; }

.legend-group-head span {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.06em;
  color: #8aa2b8;
}

.legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }

.legend-item {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 7px 9px;
  background: rgba(239, 246, 253, 0.62);
  border: 1px solid rgba(98, 135, 174, 0.11);
  border-radius: 9px;
}

.legend-grid { display: grid; gap: 1px; flex: none; }
.legend-grid span { width: 11px; height: 11px; border-radius: 2px; }
.legend-grid span.off { background: rgba(100, 135, 169, 0.07); }
.legend-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.legend-meta b {
  overflow: hidden;
  font-size: 10px;
  font-weight: 600;
  color: #466787;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-meta span {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 9px;
  color: #8aa2b8;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 14px;
  padding: 2px 10px;
  font-size: 11px;
  text-align: center;
  color: #8299ae;
}

.foot > span {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  color: #6b8dab;
}

.foot p { margin: 0; }
.foot b { color: #557a99; }

.app.is-dark { color: #d9e8f6; }

.app.is-dark .topbar {
  background: rgba(16, 29, 45, 0.88);
  border-bottom-color: rgba(132, 181, 224, 0.12);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.app.is-dark .brand-text h1,
.app.is-dark .panel-heading h2 { color: #e7f2fc; }

.app.is-dark .brand-text h1 span,
.app.is-dark .eyebrow,
.app.is-dark .panel-kicker { color: #88a9c7; }

.app.is-dark .date-field,
.app.is-dark .btn {
  color: #c2d6e8;
  background: rgba(34, 54, 76, 0.78);
  border-color: rgba(137, 183, 222, 0.16);
}

.app.is-dark .date-field input {
  color: #e4f1fc;
  background: #1c3046;
  border-color: rgba(137, 183, 222, 0.16);
  color-scheme: dark;
}

.app.is-dark .game-shell,
.app.is-dark .panel {
  background: linear-gradient(150deg, rgba(28, 50, 73, 0.9), rgba(17, 36, 55, 0.86));
  border-color: rgba(132, 181, 224, 0.13);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.app.is-dark .shell-status,
.app.is-dark .rules span,
.app.is-dark .win-sub,
.app.is-dark .foot { color: #91acc4; }

.app.is-dark .status-target strong,
.app.is-dark .status-progress strong,
.app.is-dark .rules b,
.app.is-dark .legend-group-head b,
.app.is-dark .legend-meta b { color: #c8e2f5; }

.app.is-dark .status-weekday,
.app.is-dark .done-pill {
  color: #a9d7f4;
  background: rgba(53, 100, 136, 0.35);
  border-color: rgba(112, 184, 233, 0.2);
}

.app.is-dark .rules li,
.app.is-dark .legend-item {
  background: rgba(52, 78, 104, 0.35);
  border-color: rgba(126, 172, 211, 0.1);
}

.app.is-dark .legend-grid span.off { background: rgba(160, 196, 226, 0.08); }

.app.is-dark .win-card {
  background: linear-gradient(155deg, #20384f, #172a3e);
  border-color: rgba(133, 191, 237, 0.2);
}

.app.is-dark .win-card h2 { color: #eaf6ff; }
.app.is-dark .win-date { color: #8acbf3; }

.app.is-dark .win-close,
.app.is-dark .win-btns .ghost {
  color: #a9c5da;
  background: rgba(48, 75, 100, 0.72);
  border-color: rgba(133, 177, 212, 0.16);
}

.app.is-dark .win-mask { background: rgba(5, 16, 28, 0.48); }

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 980px) {
  .info-grid { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .topbar { justify-content: center; }
  .brand, .controls { justify-content: center; }
  .stage { padding: 14px 10px 28px; }
  .game-shell { padding: 8px; border-radius: 17px; }
  .panel { padding: 16px; }
  .legend { grid-template-columns: 1fr; }
}
</style>
