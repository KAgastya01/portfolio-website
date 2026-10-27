const GITHUB_PALETTE = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const ACTIVITY_TYPES = ["grid", "skyline", "pulse", "ring", "streak", "terminal"];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

function contributionLevel(day) {
  if (Number.isInteger(day.level)) return clamp(day.level, 0, 4);
  const count = Number(day.count || 0);
  return count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4;
}
function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, rr) : ctx.rect(x, y, w, h);
}
function text(ctx, value, x, y, size = 11, color = "#59645c", font = "ui-monospace, SFMono-Regular, Menlo, monospace") {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${font}`;
  ctx.fillText(value, x, y);
}
function dayLabel(day) {
  const date = new Date(`${day.date}T12:00:00`);
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}: ${day.count} contribution${day.count === 1 ? "" : "s"}`;
}
function drawEmpty(ctx, w, h, t) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f3f0e9";
  ctx.fillRect(0, 0, w, h);
  text(ctx, "CONTRIBUTION DATA NOT GENERATED", 18, h / 2 - 5, 12, "#0d4f45");
  text(ctx, "Run: npm run fetch-github", 18, h / 2 + 17, 11, "#59645c");
}

function drawGrid(ctx, w, h, t, days, state) {
  ctx.clearRect(0, 0, w, h);
  const cols = Math.ceil(days.length / 7), padX = 8, padY = 20;
  const gap = Math.max(2, Math.min(4, w / (cols * 1.35)));
  const cell = Math.min(12, (w - padX * 2 - gap * (cols - 1)) / cols, (h - padY - 8 - gap * 6) / 7);
  const totalW = cols * cell + (cols - 1) * gap, x0 = (w - totalW) / 2;
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const progress = t === Infinity ? 1 : clamp(t / 2100, 0, 1);
  const visible = Math.floor(easeOut(progress) * days.length);
  text(ctx, `${Math.round(total * easeOut(clamp(progress, 0, 1)))} CONTRIBUTIONS`, x0, 12, 9, "#0d4f45");
  days.forEach((day, i) => {
    const col = Math.floor(i / 7), row = i % 7;
    const x = x0 + col * (cell + gap), y = padY + row * (cell + gap);
    const delay = (col / Math.max(1, cols - 1)) * 0.75 + (row / 7) * 0.25;
    const p = t === Infinity ? 1 : clamp((progress - delay * 0.9) / 0.28, 0, 1);
    const scale = 0.15 + 0.85 * easeOut(p);
    const cx = x + cell / 2, cy = y + cell / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale);
    ctx.fillStyle = GITHUB_PALETTE[contributionLevel(day)];
    roundedRect(ctx, -cell/2, -cell/2, cell, cell, 2); ctx.fill();
    ctx.restore();
  });
  state.grid = { x0, padY, cell, gap, cols, days };
}
function drawSkyline(ctx, w, h, t, days) {
  ctx.clearRect(0, 0, w, h);
  const count = days.length, cols = Math.ceil(count / 7);
  const maxCount = Math.max(1, ...days.map(d => d.count));
  const cellW = Math.min(8, (w - 34) / (cols + 6)), cellH = cellW * 0.72;
  const gap = cellW * 0.28, originX = w * 0.5 - cols * (cellW + gap) * 0.5, originY = h * 0.76;
  const progress = t === Infinity ? 1 : clamp(t / 2400, 0, 1);
  for (let i = 0; i < count; i++) {
    const col = Math.floor(i / 7), row = i % 7;
    const x = originX + col * (cellW + gap) - row * cellW * 0.42;
    const y = originY - col * cellH * 0.44 - row * cellH * 0.55;
    const p = easeOut(clamp((progress * 1.35 - col / Math.max(1, cols) * 0.8), 0, 1));
    const height = (1.5 + Math.sqrt(days[i].count) / Math.sqrt(maxCount) * 24) * p;
    const level = contributionLevel(days[i]);
    ctx.fillStyle = GITHUB_PALETTE[level];
    ctx.beginPath(); ctx.moveTo(x, y - height); ctx.lineTo(x + cellW * 0.5, y - height - cellH * 0.35); ctx.lineTo(x + cellW, y - height); ctx.lineTo(x + cellW * 0.5, y + cellH * 0.35 - height); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ["#d5d9dc","#80d991","#2ca956","#208343","#175a31"][level];
    ctx.beginPath(); ctx.moveTo(x, y-height); ctx.lineTo(x+cellW*0.5,y+cellH*0.35-height); ctx.lineTo(x+cellW*0.5,y+cellH*0.35); ctx.lineTo(x,y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ["#c8cdd0","#69ca7e","#25984b","#1b743b","#124c2a"][level];
    ctx.beginPath(); ctx.moveTo(x+cellW*0.5,y+cellH*0.35-height); ctx.lineTo(x+cellW,y-height); ctx.lineTo(x+cellW,y); ctx.lineTo(x+cellW*0.5,y+cellH*0.35); ctx.closePath(); ctx.fill();
  }
  text(ctx, "DAILY ACTIVITY / ISOMETRIC VIEW", 10, 16, 9, "#0d4f45");
}
function drawPulse(ctx, w, h, t, days) {
  ctx.clearRect(0, 0, w, h);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const totals = weeks.map(week => week.reduce((s, d) => s + d.count, 0));
  const max = Math.max(1, ...totals), left = 16, right = w - 12, top = 28, chartH = 76;
  const progress = t === Infinity ? 1 : clamp(t / 2300, 0, 1);
  ctx.strokeStyle = "#d9d1c6"; ctx.lineWidth = 1;
  for (let j = 0; j < 4; j++) { const y = top + j * chartH / 3; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); }
  ctx.beginPath();
  totals.forEach((v, i) => {
    const x = left + i * (right - left) / Math.max(1, totals.length - 1);
    const y = top + chartH - v / max * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#126b5b"; ctx.lineWidth = 2; ctx.stroke();
  const marker = progress * (totals.length - 1), ix = Math.floor(marker), frac = marker - ix;
  const x = left + marker * (right - left) / Math.max(1, totals.length - 1);
  const yv = (totals[ix] || 0) * (1 - frac) + (totals[Math.min(ix + 1, totals.length - 1)] || 0) * frac;
  const y = top + chartH - yv / max * chartH;
  ctx.fillStyle = "#c94b38"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  text(ctx, "WEEKLY CONTRIBUTION PULSE", left, 14, 9, "#0d4f45");
  const cols = weeks.length, gap = 2, cell = Math.min(7, (w - 30 - gap * (cols - 1)) / cols);
  const startX = (w - (cols * cell + (cols - 1) * gap)) / 2, gridY = 135;
  days.forEach((d, i) => {
    const col = Math.floor(i / 7), row = i % 7;
    const reveal = t === Infinity ? 1 : clamp((progress * 1.25 - col / cols * 0.8), 0, 1);
    if (reveal <= 0) return;
    ctx.globalAlpha = reveal;
    ctx.fillStyle = GITHUB_PALETTE[contributionLevel(d)];
    roundedRect(ctx, startX + col * (cell + gap), gridY + row * (cell + gap), cell, cell, 1.5); ctx.fill();
    ctx.globalAlpha = 1;
  });
}
function drawRing(ctx, w, h, t, days) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2 + 5, radius = Math.min(w * 0.32, h * 0.37);
  const progress = t === Infinity ? 1 : clamp(t / 2200, 0, 1);
  for (let d = 0; d < 7; d++) {
    const weekdayDays = days.filter((_, i) => i % 7 === d);
    const ringR = radius * (0.35 + d * 0.105);
    ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.strokeStyle = "#d9d1c6"; ctx.lineWidth = 1; ctx.stroke();
    weekdayDays.forEach((day, i) => {
      const angle = -Math.PI / 2 + (i / weekdayDays.length) * Math.PI * 2;
      const reveal = t === Infinity ? 1 : clamp(progress * 1.35 - i / weekdayDays.length, 0, 1);
      if (reveal <= 0) return;
      const r = ringR + Math.sin(angle) * 0.1;
      ctx.beginPath(); ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 1.4 + contributionLevel(day) * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = GITHUB_PALETTE[contributionLevel(day)]; ctx.globalAlpha = reveal; ctx.fill(); ctx.globalAlpha = 1;
    });
  }
  const angle = progress * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = "#c94b38"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * radius * 1.13, cy + Math.sin(angle) * radius * 1.13); ctx.stroke();
  ctx.fillStyle = "#c94b38"; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
  text(ctx, "7 DAY RINGS / 1 YEAR OF ACTIVITY", 10, 16, 9, "#0d4f45");
}
function drawStreak(ctx, w, h, t, days) {
  ctx.clearRect(0, 0, w, h);
  const recent = days.slice(-84), active = recent.filter(d => d.count > 0);
  let streak = 0;
  for (let i = days.length - 1; i >= 0 && days[i].count > 0; i--) streak++;
  const cols = 12, rows = 7, gap = 5, cell = Math.min(15, (w - 28 - (cols - 1) * gap) / cols);
  const gridW = cols * (cell + gap) - gap, x0 = (w - gridW) / 2, y0 = 38;
  const progress = t === Infinity ? 1 : clamp(t / 1900, 0, 1);
  text(ctx, `${streak} DAY CURRENT STREAK`, 10, 16, 10, "#0d4f45");
  recent.forEach((day, i) => {
    const col = Math.floor(i / rows), row = i % rows;
    const p = t === Infinity ? 1 : clamp(progress * 1.4 - i / recent.length, 0, 1);
    if (p <= 0) return;
    const x = x0 + col * (cell + gap), y = y0 + row * (cell + gap);
    ctx.globalAlpha = p;
    ctx.fillStyle = GITHUB_PALETTE[contributionLevel(day)];
    roundedRect(ctx, x, y, cell, cell, 2); ctx.fill(); ctx.globalAlpha = 1;
    if (i > 0 && day.count > 0 && recent[i - 1].count > 0) {
      ctx.strokeStyle = "#126b5b"; ctx.lineWidth = 1.5; ctx.globalAlpha = p;
      ctx.beginPath(); ctx.moveTo(x0 + Math.floor((i-1)/rows)*(cell+gap)+cell/2, y0 + ((i-1)%rows)*(cell+gap)+cell/2); ctx.lineTo(x+cell/2,y+cell/2); ctx.stroke(); ctx.globalAlpha = 1;
    }
  });
  const last = recent[recent.length - 1];
  if (last && last.count === 0) {
    ctx.strokeStyle = "#c94b38"; ctx.lineWidth = 2;
    const x = x0 + (cols - 1) * (cell + gap), y = y0 + (rows - 1) * (cell + gap);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y + cell); ctx.moveTo(x + cell, y); ctx.lineTo(x, y + cell); ctx.stroke();
  }
  text(ctx, "LATEST 12 WEEKS", 10, h - 10, 9, "#59645c");
}
function drawTerminal(ctx, w, h, t, days) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#101a16"; ctx.fillRect(0, 0, w, h);
  const green = "#8ce99a", muted = "#72947b";
  const progress = t === Infinity ? 1 : clamp(t / 2400, 0, 1);
  const command = "$ gh api graphql -f query=contributionCalendar";
  const chars = Math.floor(command.length * clamp(progress * 2.5, 0, 1));
  text(ctx, command.slice(0, chars), 14, 24, 11, green);
  text(ctx, "DATE       CONTRIBUTIONS   DENSITY", 14, 46, 9, muted);
  const cols = Math.ceil(days.length / 7), gap = Math.max(1, Math.min(3, w / (cols * 1.7)));
  const cell = Math.min(10, (w - 28 - gap * (cols - 1)) / cols), totalW = cols * (cell + gap) - gap, x0 = (w-totalW)/2, y0 = 66;
  const rowsFit = Math.min(7, Math.floor((h - y0 - 12) / (cell + gap)));
  const glyphs = ["·", ":", "+", "#", "@"];
  days.forEach((day, i) => {
    const col = Math.floor(i / 7), row = i % 7;
    if (row >= rowsFit) return;
    const reveal = t === Infinity ? 1 : clamp(progress * 1.55 - col / cols * 0.9, 0, 1);
    if (reveal <= 0) return;
    const level = contributionLevel(day);
    const glyph = reveal > 0.78 ? glyphs[level] : glyphs[Math.floor(Math.abs(Math.sin(i * 7.13 + t / 37)) * 5)];
    ctx.globalAlpha = reveal; text(ctx, glyph, x0 + col * (cell + gap), y0 + row * (cell + gap) + cell, Math.max(8, cell + 2), GITHUB_PALETTE[level]); ctx.globalAlpha = 1;
  });
  text(ctx, "PROCESS COMPLETE_", 14, h - 8, 9, green);
}

function drawActivity(type, ctx, w, h, t, days, state) {
  if (!days.length) return drawEmpty(ctx, w, h, t);
  const drawers = { grid: drawGrid, skyline: drawSkyline, pulse: drawPulse, ring: drawRing, streak: drawStreak, terminal: drawTerminal };
  if (type === "grid") drawers.grid(ctx, w, h, t, days, state);
  else drawers[type](ctx, w, h, t, days);
}

async function initGithubActivity() {
  const totalNode = document.querySelector("[data-github-total]");
  const statusNode = document.querySelector("[data-github-status]");
  const canvases = [...document.querySelectorAll("canvas[data-activity]")];
  let payload;
  try {
    const response = await fetch("./data/github.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Contribution file not found");
    payload = await response.json();
  } catch {
    payload = { status: "missing", days: [], totalContributions: 0 };
  }
  const days = Array.isArray(payload.days) ? payload.days : [];
  const total = Number(payload.totalContributions || days.reduce((sum, d) => sum + Number(d.count || 0), 0));
  if (totalNode) totalNode.textContent = total.toLocaleString();
  if (statusNode) {
    statusNode.textContent = days.length
      ? `Loaded ${days.length} days of contribution data from the local JSON file.`
      : "No real contribution data is loaded yet. Run npm run fetch-github with a GitHub token to generate it.";
  }

  const instances = canvases.map(canvas => {
    const type = canvas.dataset.activity;
    const ctx = canvas.getContext("2d");
    const state = {};
    let startedAt = null, raf = null, visible = false, replayKey = 0;
    const duration = type === "terminal" ? 2600 : 2400;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(prefersReducedMotion.matches ? Infinity : (startedAt === null ? 0 : performance.now() - startedAt));
    }
    function render(t) {
      const rect = canvas.getBoundingClientRect();
      drawActivity(type, ctx, rect.width, rect.height, t, days, state);
    }
    function tick(now) {
      if (!visible) { raf = null; return; }
      if (startedAt === null) startedAt = now;
      const t = prefersReducedMotion.matches ? Infinity : Math.min(now - startedAt, duration);
      render(t);
      if (t < duration && !prefersReducedMotion.matches) raf = requestAnimationFrame(tick);
      else raf = null;
    }
    function play() {
      replayKey++;
      startedAt = null;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      if (visible) {
        if (prefersReducedMotion.matches) render(Infinity);
        else raf = requestAnimationFrame(tick);
      } else render(prefersReducedMotion.matches ? Infinity : 0);
    }
    const replayButton = document.querySelector(`[data-replay="${type}"]`);
    replayButton?.addEventListener("click", play);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          visible = entry.isIntersecting && entry.intersectionRatio >= 0.4;
          if (visible && raf === null) {
            if (startedAt !== null && performance.now() - startedAt >= duration) startedAt = null;
            raf = requestAnimationFrame(tick);
          } else if (!visible && raf !== null) {
            cancelAnimationFrame(raf); raf = null;
          }
        });
      }, { threshold: [0, 0.4, 1] });
      observer.observe(canvas);
    } else { visible = true; play(); }
    if (type === "grid") {
      const tooltip = document.querySelector("[data-grid-tooltip]");
      canvas.addEventListener("mousemove", event => {
        if (!state.grid || !tooltip || !days.length) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left, y = event.clientY - rect.top;
        const { x0, padY, cell, gap, cols } = state.grid;
        const col = Math.floor((x - x0) / (cell + gap)), row = Math.floor((y - padY) / (cell + gap));
        const day = days[col * 7 + row];
        if (day && col >= 0 && row >= 0 && row < 7 && x >= x0 + col*(cell+gap) && x <= x0 + col*(cell+gap)+cell && y >= padY + row*(cell+gap) && y <= padY + row*(cell+gap)+cell) {
          tooltip.hidden = false; tooltip.textContent = dayLabel(day);
        } else tooltip.hidden = true;
      });
      canvas.addEventListener("mouseleave", () => { if (tooltip) tooltip.hidden = true; });
    }
    return { resize, play };
  });
  const resizeObserver = new ResizeObserver(() => instances.forEach(instance => instance.resize()));
  canvases.forEach(canvas => resizeObserver.observe(canvas));
  prefersReducedMotion.addEventListener?.("change", () => instances.forEach(instance => instance.play()));
}
document.addEventListener("DOMContentLoaded", initGithubActivity);
