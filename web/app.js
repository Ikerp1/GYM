// GYM — app principal.
// Pantallas: Hoy (rutina que toca + entreno en curso), Rutinas, Progreso.
import { html, render, useState, useEffect, useMemo, useRef } from "https://cdn.jsdelivr.net/npm/htm@3.1.1/preact/standalone.module.js";
import { watchUser, login, logout, watchCollection, saveDoc, removeDoc, newId, watchDoc, readDoc, mergeDoc, addToList, removeFromList } from "./db.js";
import { BUILTIN_EXERCISES, GROUPS } from "./exercises.js";
import { FIGURES } from "./figures.js";
import { drawExercise, phaseAt, VIEWBOX, viewBoxFor } from "./figure-engine.js";

// ---------- Utilidades ----------
const DEFAULT_REST = 90;
const REST_OPTIONS = [45, 60, 90, 120, 150, 180, 240];
const num = (v) => { if (v === "" || v == null) return null; const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; };
const fmtKg = (kg) => kg == null ? "—" : (Math.round(kg * 100) / 100).toString().replace(".", ",");
const e1rm = (kg, reps) => kg && reps ? kg * (1 + reps / 30) : 0; // fórmula de Epley
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const dayLabel = (ms) => new Date(ms).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
const shortDate = (ms) => new Date(ms).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
const minutes = (a, b) => Math.max(1, Math.round((b - a) / 60000));
const relDays = (ms) => {
  const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  const d1 = new Date(ms); d1.setHours(0, 0, 0, 0);
  const n = Math.round((d0 - d1) / 86400000);
  return n === 0 ? "hoy" : n === 1 ? "ayer" : `hace ${n} días`;
};
const doneSets = (item) => item.sets.filter((s) => s.done);
const setsText = (sets) => sets.map((s) => `${fmtKg(s.kg)}×${s.reps ?? "—"}`).join(" · ");

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

// Sonido corto al terminar el descanso (el navegador solo deja sonar tras tocar la pantalla).
let audioCtx = null;
const unlockAudio = () => { try { audioCtx ??= new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); } catch {} };
function beep() {
  try {
    if (!audioCtx) return;
    [0, 0.25].forEach((t) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; g.gain.value = 0.15;
      o.connect(g); g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.15);
    });
  } catch {}
}

// ---------- Iconos (SVG en línea) ----------
const I = {
  today: html`<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/></svg>`,
  list: html`<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>`,
  chart: html`<svg viewBox="0 0 24 24"><path d="M4 19h16M6 15l4-5 4 3 5-7"/></svg>`,
  check: html`<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  plus: html`<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  x: html`<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  up: html`<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>`,
  down: html`<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>`,
  trash: html`<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`,
  edit: html`<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>`,
  search: html`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>`,
  trophy: html`<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8.5 20h7"/></svg>`,
  timer: html`<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M10 2.5h4"/></svg>`,
  back: html`<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>`,
  users: html`<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 19.5c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M18 14.4c1.7.8 2.9 2.6 3.4 5.1"/></svg>`,
  copy: html`<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0014.5 4h-9A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8"/></svg>`,
};

// ---------- Componentes base ----------
function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    // Contador para que, con una ventana abierta encima de otra, la página no se desbloquee antes de tiempo.
    const b = document.body; b.dataset.sheets = String((+b.dataset.sheets || 0) + 1); b.classList.add("no-scroll");
    return () => { document.removeEventListener("keydown", k); const n = (+b.dataset.sheets || 1) - 1; b.dataset.sheets = String(n); if (!n) b.classList.remove("no-scroll"); };
  }, []);
  return html`<div class="sheet-backdrop" onClick=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="sheet" role="dialog" aria-modal="true" aria-label=${title}>
      <header class="sheet-head"><h2>${title}</h2><button class="icon-btn" aria-label="Cerrar" onClick=${onClose}>${I.x}</button></header>
      <div class="sheet-body">${children}</div>
      ${footer && html`<footer class="sheet-foot">${footer}</footer>`}
    </div>
  </div>`;
}

function Confirm({ title, text, yes, danger, onYes, onClose }) {
  return html`<${Sheet} title=${title} onClose=${onClose} footer=${html`
      <button class="btn ghost" onClick=${onClose}>Cancelar</button>
      <button class=${"btn " + (danger ? "danger" : "primary")} onClick=${() => { onClose(); onYes(); }}>${yes}</button>`}>
    <p class="muted">${text}</p>
  </${Sheet}>`;
}

function Stepper({ value, min = 1, max = 99, step = 1, onChange, label }) {
  return html`<div class="stepper" role="group" aria-label=${label}>
    <button aria-label=${"Menos " + label} onClick=${() => onChange(Math.max(min, value - step))}>−</button>
    <span>${value}</span>
    <button aria-label=${"Más " + label} onClick=${() => onChange(Math.min(max, value + step))}>+</button>
  </div>`;
}

// Selector de ejercicios con buscador, filtro por grupo y opción de crear uno propio.
function ExercisePicker({ exercises, onPick, onCreate, onClose, title = "Añadir ejercicio" }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState(GROUPS[0]);
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const list = exercises.filter((e) => (!group || e.group === group) && norm(e.name).includes(norm(q)));
  if (creating) {
    return html`<${Sheet} title="Nuevo ejercicio" onClose=${onClose} footer=${html`
        <button class="btn ghost" onClick=${() => setCreating(false)}>Volver</button>
        <button class="btn primary" disabled=${!newName.trim()} onClick=${async () => { const ex = await onCreate(newName.trim(), newGroup); onPick(ex); }}>Crear y añadir</button>`}>
      <label class="field"><span>Nombre</span><input id="new-ex-name" class="input" value=${newName} placeholder="Ej. Press inclinado en Smith" onInput=${(e) => setNewName(e.target.value)} /></label>
      <div class="field"><span>Grupo muscular</span><div class="chips">${GROUPS.map((g) => html`<button class=${"chip " + (newGroup === g ? "on" : "")} onClick=${() => setNewGroup(g)}>${g}</button>`)}</div></div>
    </${Sheet}>`;
  }
  return html`<${Sheet} title=${title} onClose=${onClose}>
    <div class="search"><span class="search-icon">${I.search}</span><input id="ex-search" class="input" type="search" placeholder="Buscar ejercicio" value=${q} onInput=${(e) => setQ(e.target.value)} /></div>
    <div class="chips scroll-x">
      <button class=${"chip " + (!group ? "on" : "")} onClick=${() => setGroup("")}>Todos</button>
      ${GROUPS.map((g) => html`<button class=${"chip " + (group === g ? "on" : "")} onClick=${() => setGroup(g)}>${g}</button>`)}
    </div>
    <ul class="pick-list">
      ${list.map((e) => html`<li><button onClick=${() => onPick(e)}><${ExerciseFigure} exId=${e.id} /><span class="pick-name">${e.name}</span><small>${e.group}${e.custom ? " · propio" : ""}</small></button></li>`)}
    </ul>
    ${!list.length && html`<p class="muted center">No hay ningún ejercicio con ese nombre.</p>`}
    <button class="btn ghost block" onClick=${() => { setCreating(true); setNewName(q); setNewGroup(group || GROUPS[0]); }}>${I.plus} Crear ejercicio propio</button>
  </${Sheet}>`;
}

// ---------- Siluetas de los ejercicios ----------
// Miniatura fija (postura final, o la indicada en "thumb") o animación en bucle entre la postura inicial y la final.
function ExerciseFigure({ exId, animate = false, cls = "thumb" }) {
  const def = FIGURES[exId];
  const ref = useRef(null);
  useEffect(() => {
    if (!def || !animate || !ref.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf;
    const start = performance.now();
    const loop = (now) => { if (ref.current) ref.current.innerHTML = drawExercise(def, phaseAt(now - start)); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exId, animate]);
  if (!def) return html`<span class=${cls + " fig-none"} aria-hidden="true">${I.today}</span>`;
  return html`<svg ref=${ref} class=${cls + " fig"} viewBox=${animate ? VIEWBOX : viewBoxFor(def)} aria-hidden="true" dangerouslySetInnerHTML=${{ __html: drawExercise(def, animate ? 0 : def.thumb ?? 1) }}></svg>`;
}

// Ventana con la silueta en grande y animada.
function ExerciseInfo({ ex, onClose }) {
  return html`<${Sheet} title=${ex.name} onClose=${onClose}>
    <div class="fig-stage"><${ExerciseFigure} exId=${ex.id} animate=${true} cls="fig-big" /></div>
    <p class="muted center">${ex.group}${FIGURES[ex.id] ? "" : " · ejercicio propio, sin dibujo"}</p>
  </${Sheet}>`;
}

// ---------- Gráfica ----------
function LineChart({ points, unit }) {
  if (points.length < 2) return html`<div class="empty small">La gráfica aparece cuando tengas al menos dos entrenos de este ejercicio.</div>`;
  const W = 340, H = 180, padL = 36, padR = 12, padT = 14, padB = 24;
  const vals = points.map((p) => p.v);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min = Math.max(0, min - span * 0.1); max = max + span * 0.1;
  const x = (i) => padL + (W - padL - padR) * (i / (points.length - 1));
  const y = (v) => padT + (H - padT - padB) * (1 - (v - min) / (max - min));
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1)},${H - padB} L${x(0)},${H - padB} Z`;
  const ticks = [min, (min + max) / 2, max];
  const labelIdx = points.length <= 4 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const last = points.at(-1);
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label=${`Evolución: último valor ${fmtKg(last.v)} ${unit}`}>
    ${ticks.map((t) => html`<g><line x1=${padL} x2=${W - padR} y1=${y(t)} y2=${y(t)} class="grid" /><text x=${padL - 6} y=${y(t) + 3} class="tick" text-anchor="end">${Math.round(t)}</text></g>`)}
    <path d=${area} class="area" />
    <path d=${path} class="line" />
    ${points.map((p, i) => html`<circle cx=${x(i)} cy=${y(p.v)} r=${i === points.length - 1 ? 4.5 : 2.5} class=${i === points.length - 1 ? "dot last" : "dot"} />`)}
    ${labelIdx.map((i) => html`<text x=${x(i)} y=${H - 6} class="tick" text-anchor=${i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}>${shortDate(points[i].t)}</text>`)}
  </svg>`;
}

// ---------- Descanso ----------
function RestBar({ rest, onChange }) {
  const now = useNow(250);
  const left = Math.ceil((rest.endsAt - now) / 1000);
  const fired = useRef(false);
  useEffect(() => {
    if (left <= 0 && !fired.current) {
      fired.current = true;
      try { navigator.vibrate?.([300, 150, 300]); } catch {}
      beep();
      setTimeout(() => onChange(null), 4000);
    }
  }, [left <= 0]);
  const pct = Math.max(0, Math.min(100, (left / rest.total) * 100));
  const done = left <= 0;
  return html`<div class=${"restbar " + (done ? "done" : "")} role="timer" aria-live="polite">
    <div class="rest-progress" style=${`width:${pct}%`}></div>
    <div class="rest-row">
      <span class="rest-icon">${I.timer}</span>
      <strong class="rest-time">${done ? "¡A por la siguiente!" : mmss(left)}</strong>
      ${!done && html`
        <button class="rest-btn" onClick=${() => onChange({ ...rest, endsAt: rest.endsAt - 15000 })}>−15</button>
        <button class="rest-btn" onClick=${() => onChange({ ...rest, endsAt: rest.endsAt + 15000, total: rest.total + 15 })}>+15</button>`}
      <button class="rest-btn" onClick=${() => onChange(null)}>${done ? "Cerrar" : "Saltar"}</button>
    </div>
  </div>`;
}

// ---------- Pantalla: Hoy ----------
function TodayView({ routines, finished, exById, lastSetsFor, onStart, goRoutines }) {
  const ordered = routines;
  const lastRoutineWorkout = finished.find((w) => w.routineId && ordered.some((r) => r.id === w.routineId));
  const nextIdx = lastRoutineWorkout ? (ordered.findIndex((r) => r.id === lastRoutineWorkout.routineId) + 1) % ordered.length : 0;
  const [pickedId, setPickedId] = useState(null);
  const [info, setInfo] = useState(null);
  const routine = ordered.find((r) => r.id === pickedId) || ordered[nextIdx];
  const last = finished[0];
  const lastOfThis = routine && finished.find((w) => w.routineId === routine.id);

  return html`<section class="view">
    <header class="view-head">
      <p class="eyebrow">${new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
      <h1>${routine ? "Hoy toca" : "Bienvenido"}</h1>
    </header>

    ${routine ? html`
      <article class="hero">
        <div class="hero-top">
          <h2 class="hero-title">${routine.name}</h2>
          <p class="muted">${routine.items.length} ejercicios · ${routine.items.reduce((n, it) => n + it.sets, 0)} series${lastOfThis ? ` · última vez ${relDays(lastOfThis.finishedAt)}` : ""}</p>
        </div>
        <ul class="plan">
          ${routine.items.map((it) => {
            const top = Math.max(0, ...lastSetsFor(it.exId).map((s) => s.kg || 0)) || it.kg || 0;
            const ex = exById[it.exId];
            return html`<li><button class="plan-row" aria-label=${`Ver cómo se hace ${ex?.name || ""}`} onClick=${() => ex && setInfo(ex)}>
              <${ExerciseFigure} exId=${it.exId} />
              <span class="plan-name">${ex?.name || "Ejercicio"}</span>
              <span class="plan-meta">${it.sets}×${it.reps}${top > 0 ? html` · <b>${fmtKg(top)} kg</b>` : ""}</span>
            </button></li>`;
          })}
        </ul>
        <button class="btn primary big block" onClick=${() => { unlockAudio(); onStart(routine); }}>Empezar ${routine.name}</button>
      </article>
      ${ordered.length > 1 && html`
        <div class="other-routines">
          <p class="eyebrow">¿Hoy prefieres otra?</p>
          <div class="chips scroll-x">${ordered.map((r) => html`<button class=${"chip " + (r.id === routine.id ? "on" : "")} onClick=${() => setPickedId(r.id)}>${r.name}</button>`)}</div>
        </div>`}
      <button class="btn ghost block" onClick=${() => { unlockAudio(); onStart(null); }}>Entreno libre, sin rutina</button>
    ` : html`
      <article class="hero">
        <h2 class="hero-title">Crea tu primera rutina</h2>
        <p class="muted">Haz tus rutinas (por ejemplo «Empuje», «Tirón», «Pierna»). La app te propondrá cada día la siguiente que toca, por turnos.</p>
        <button class="btn primary big block" onClick=${goRoutines}>Crear rutina</button>
      </article>
      <button class="btn ghost block" onClick=${() => { unlockAudio(); onStart(null); }}>O empieza un entreno libre</button>
    `}

    ${last && html`
      <section class="card">
        <p class="eyebrow">Último entreno · ${relDays(last.finishedAt)}</p>
        <h3>${last.name}</h3>
        <p class="muted">${minutes(last.startedAt, last.finishedAt)} min · ${last.items.reduce((n, it) => n + doneSets(it).length, 0)} series</p>
      </section>`}
    ${info && html`<${ExerciseInfo} ex=${info} onClose=${() => setInfo(null)} />`}
  </section>`;
}

// ---------- Pantalla: Entreno en curso ----------
function WorkoutView({ workout, exercises, exById, lastSetsFor, onSave, onFinish, onDiscard, onRest, onCreateExercise }) {
  const [w, setW] = useState(workout);
  const [picker, setPicker] = useState(false);
  const [ask, setAsk] = useState(null);
  const [info, setInfo] = useState(null);
  const timer = useRef(null);
  const latest = useRef(w);
  const now = useNow(1000);
  latest.current = w;

  // Guardado: inmediato al marcar series, agrupado mientras escribes números.
  const commit = (next, immediate = false) => {
    setW(next); latest.current = next;
    clearTimeout(timer.current);
    if (immediate) onSave(next); else timer.current = setTimeout(() => onSave(latest.current), 700);
  };
  useEffect(() => () => { clearTimeout(timer.current); }, []);
  useEffect(() => { const flush = () => onSave(latest.current); window.addEventListener("pagehide", flush); return () => window.removeEventListener("pagehide", flush); }, []);

  // Parte siempre del estado más reciente, para no perder cambios hechos muy seguidos.
  const setItem = (i, fn, immediate) => { const cur = latest.current; commit({ ...cur, items: cur.items.map((it, j) => (j === i ? fn(it) : it)) }, immediate); };
  const setSet = (i, k, patch, immediate) => setItem(i, (it) => ({ ...it, sets: it.sets.map((s, j) => (j === k ? { ...s, ...patch } : s)) }), immediate);
  const toggle = (i, k) => {
    unlockAudio();
    const s = w.items[i].sets[k];
    // Si marcas ✓ sin escribir nada, se usan los números en gris (los de la última vez).
    const fill = !s.done ? { kg: s.kg ?? s.hint?.kg ?? null, reps: s.reps ?? s.hint?.reps ?? null } : {};
    setSet(i, k, { ...fill, done: !s.done }, true);
    if (!s.done) onRest(w.items[i].rest || DEFAULT_REST);
  };
  // Serie nueva: vacía, con la pista en gris de la serie anterior.
  const addSet = (i) => setItem(i, (it) => { const l = it.sets.at(-1); return { ...it, sets: [...it.sets, { kg: null, reps: null, done: false, hint: { kg: l?.kg ?? l?.hint?.kg ?? null, reps: l?.reps ?? l?.hint?.reps ?? null } }] }; }, true);
  const removeSet = (i, k) => setItem(i, (it) => ({ ...it, sets: it.sets.filter((_, j) => j !== k) }), true);
  const move = (i, d) => { const items = [...w.items]; [items[i], items[i + d]] = [items[i + d], items[i]]; commit({ ...w, items }, true); };
  const addExercise = (ex) => {
    const prev = lastSetsFor(ex.id);
    const sets = (prev.length ? prev : [{}, {}, {}]).map((s) => ({ kg: null, reps: null, done: false, hint: { kg: s.kg ?? null, reps: s.reps ?? null } }));
    commit({ ...w, items: [...w.items, { exId: ex.id, rest: DEFAULT_REST, sets }] }, true);
    setPicker(false);
  };
  const totalDone = w.items.reduce((n, it) => n + doneSets(it).length, 0);
  const total = w.items.reduce((n, it) => n + it.sets.length, 0);

  return html`<section class="view workout">
    <header class="view-head row">
      <div>
        <p class="eyebrow">En curso · ${mmss(Math.floor((now - w.startedAt) / 1000))}</p>
        <h1>${w.name}</h1>
      </div>
      <span class="pill">${totalDone}/${total} series</span>
    </header>

    ${w.items.map((it, i) => {
      const ex = exById[it.exId];
      const prev = lastSetsFor(it.exId, w.id);
      return html`<article class="card ex-card">
        <header class="ex-head">
          <button class="thumb-btn" aria-label=${`Ver cómo se hace ${ex?.name || ""}`} onClick=${() => ex && setInfo(ex)}><${ExerciseFigure} exId=${it.exId} /></button>
          <div class="ex-title">
            <h3>${ex?.name || "Ejercicio"}</h3>
            <p class="muted small">${prev.length ? `Última vez ${relDays(prev.when)}` : "Primera vez con este ejercicio"}</p>
          </div>
          <div class="ex-tools">
            <button class="icon-btn" aria-label="Subir" disabled=${i === 0} onClick=${() => move(i, -1)}>${I.up}</button>
            <button class="icon-btn" aria-label="Bajar" disabled=${i === w.items.length - 1} onClick=${() => move(i, 1)}>${I.down}</button>
            <button class="icon-btn" aria-label="Quitar ejercicio" onClick=${() => setAsk({ title: "Quitar ejercicio", text: `¿Quitar ${ex?.name || "este ejercicio"} del entreno de hoy?`, yes: "Quitar", danger: true, onYes: () => commit({ ...w, items: w.items.filter((_, j) => j !== i) }, true) })}>${I.trash}</button>
          </div>
        </header>
        <div class="sets">
          <div class="set-row head"><span aria-label="Serie">#</span><span>kg</span><span>Reps</span><span></span></div>
          ${it.sets.map((s, k) => html`<div class=${"set-row " + (s.done ? "is-done" : "")}>
            <button class="set-n" aria-label=${"Borrar serie " + (k + 1)} title="Mantén pulsado para borrar" onContextMenu=${(e) => { e.preventDefault(); removeSet(i, k); }}>${k + 1}</button>
            <input id=${`kg-${i}-${k}`} class="num" inputmode="decimal" enterkeyhint="next" aria-label=${`Peso serie ${k + 1}`} value=${s.kg == null ? "" : String(s.kg).replace(".", ",")} placeholder=${s.hint?.kg != null ? fmtKg(s.hint.kg) : "kg"} onFocus=${(e) => e.target.select()} onInput=${(e) => setSet(i, k, { kg: num(e.target.value) })} />
            <input id=${`reps-${i}-${k}`} class="num" inputmode="numeric" enterkeyhint="done" aria-label=${`Repeticiones serie ${k + 1}`} value=${s.reps ?? ""} placeholder=${s.hint?.reps != null ? String(s.hint.reps) : "reps"} onFocus=${(e) => e.target.select()} onInput=${(e) => setSet(i, k, { reps: num(e.target.value) })} />
            <button class=${"check " + (s.done ? "on" : "")} aria-label=${s.done ? "Desmarcar serie" : "Marcar serie hecha"} aria-pressed=${s.done} onClick=${() => toggle(i, k)}>${I.check}</button>
          </div>`)}
        </div>
        <footer class="ex-foot">
          <button class="btn ghost sm" onClick=${() => addSet(i)}>${I.plus} Serie</button>
          ${it.sets.length > 1 && html`<button class="btn ghost sm" onClick=${() => removeSet(i, it.sets.length - 1)}>Quitar última</button>`}
          <label class="rest-select">${I.timer}
            <select aria-label="Descanso" value=${it.rest || DEFAULT_REST} onChange=${(e) => setItem(i, (x) => ({ ...x, rest: Number(e.target.value) }), true)}>
              ${REST_OPTIONS.map((r) => html`<option value=${r}>${mmss(r)}</option>`)}
            </select>
          </label>
        </footer>
      </article>`;
    })}

    ${!w.items.length && html`<div class="empty">Añade el primer ejercicio para empezar.</div>`}
    <button class="btn ghost block" onClick=${() => setPicker(true)}>${I.plus} Añadir ejercicio</button>
    <button class="btn primary big block" onClick=${() => setAsk({ title: "Terminar entreno", text: totalDone ? `Has hecho ${totalDone} series. Se guardarán solo las series marcadas con ✓.` : "No has marcado ninguna serie como hecha. ¿Terminar igualmente?", yes: "Terminar y guardar", onYes: () => { clearTimeout(timer.current); onFinish(latest.current); } })}>Terminar entreno</button>
    <button class="btn link block danger-text" onClick=${() => setAsk({ title: "Descartar entreno", text: "Se borrará este entreno sin guardarlo. No se puede deshacer.", yes: "Descartar", danger: true, onYes: () => { clearTimeout(timer.current); onDiscard(w); } })}>Descartar entreno</button>

    ${picker && html`<${ExercisePicker} exercises=${exercises} onPick=${addExercise} onCreate=${onCreateExercise} onClose=${() => setPicker(false)} />`}
    ${ask && html`<${Confirm} ...${ask} onClose=${() => setAsk(null)} />`}
    ${info && html`<${ExerciseInfo} ex=${info} onClose=${() => setInfo(null)} />`}
  </section>`;
}

// ---------- Resumen al terminar ----------
function Summary({ workout, records, exById, onClose }) {
  const sets = workout.items.reduce((n, it) => n + it.sets.length, 0);
  const volume = workout.items.reduce((n, it) => n + it.sets.reduce((m, s) => m + (s.kg || 0) * (s.reps || 0), 0), 0);
  return html`<${Sheet} title="¡Entreno guardado!" onClose=${onClose} footer=${html`<button class="btn primary block" onClick=${onClose}>Hecho</button>`}>
    <div class="stats">
      <div><b>${minutes(workout.startedAt, workout.finishedAt)}</b><span>minutos</span></div>
      <div><b>${sets}</b><span>series</span></div>
      <div><b>${Math.round(volume).toLocaleString("es-ES")}</b><span>kg totales</span></div>
    </div>
    ${records.length ? html`
      <h3 class="pr-title">${I.trophy} ${records.length === 1 ? "Nuevo récord" : `${records.length} récords nuevos`}</h3>
      <ul class="pr-list">${records.map((r) => html`<li><span>${exById[r.exId]?.name}</span><b>${fmtKg(r.kg)} kg × ${r.reps}</b></li>`)}</ul>`
      : html`<p class="muted">Cada entreno cuenta. ¡Buen trabajo!</p>`}
  </${Sheet}>`;
}

// ---------- Pantalla: Rutinas ----------
function RoutineEditor({ routine, exercises, exById, onSave, onDelete, onClose, onCreateExercise }) {
  const [r, setR] = useState(routine);
  const [picker, setPicker] = useState(false);
  const [ask, setAsk] = useState(null);
  const setItem = (i, patch) => setR({ ...r, items: r.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const move = (i, d) => { const items = [...r.items]; [items[i], items[i + d]] = [items[i + d], items[i]]; setR({ ...r, items }); };
  return html`<${Sheet} title=${routine.isNew ? "Nueva rutina" : "Editar rutina"} onClose=${onClose} footer=${html`
      ${!routine.isNew && html`<button class="btn ghost danger-text" onClick=${() => setAsk({ title: "Borrar rutina", text: `¿Borrar «${r.name}»? Tus entrenos ya hechos no se borran.`, yes: "Borrar", danger: true, onYes: () => onDelete(r) })}>Borrar</button>`}
      <button class="btn primary" disabled=${!r.name.trim() || !r.items.length} onClick=${() => onSave(r)}>Guardar</button>`}>
    <label class="field"><span>Nombre</span><input id="routine-name" class="input" value=${r.name} placeholder="Ej. Empuje, Pierna, Torso A…" onInput=${(e) => setR({ ...r, name: e.target.value })} /></label>
    <p class="eyebrow">Ejercicios</p>
    <p class="muted small">El peso es el de partida: se pone solo la primera vez. Después, cada serie viene con el peso de tu último entreno.</p>
    <ul class="edit-list">
      ${r.items.map((it, i) => html`<li class="edit-item">
        <div class="edit-top">
          <${ExerciseFigure} exId=${it.exId} />
          <b>${exById[it.exId]?.name || "Ejercicio"}</b>
          <div class="ex-tools">
            <button class="icon-btn" aria-label="Subir" disabled=${i === 0} onClick=${() => move(i, -1)}>${I.up}</button>
            <button class="icon-btn" aria-label="Bajar" disabled=${i === r.items.length - 1} onClick=${() => move(i, 1)}>${I.down}</button>
            <button class="icon-btn" aria-label="Quitar" onClick=${() => setR({ ...r, items: r.items.filter((_, j) => j !== i) })}>${I.trash}</button>
          </div>
        </div>
        <div class="edit-controls">
          <label><span>Series</span><${Stepper} label="series" value=${it.sets} onChange=${(v) => setItem(i, { sets: v })} /></label>
          <label><span>Reps</span><${Stepper} label="repeticiones" value=${it.reps} max=${100} onChange=${(v) => setItem(i, { reps: v })} /></label>
          <label><span>Peso (kg)</span><input class="input kg-input" inputmode="decimal" placeholder="—" aria-label="Peso inicial en kg" value=${it.kg == null ? "" : String(it.kg).replace(".", ",")} onFocus=${(e) => e.target.select()} onInput=${(e) => setItem(i, { kg: num(e.target.value) })} /></label>
          <label><span>Descanso</span><select class="input" value=${it.rest} onChange=${(e) => setItem(i, { rest: Number(e.target.value) })}>${REST_OPTIONS.map((x) => html`<option value=${x}>${mmss(x)}</option>`)}</select></label>
        </div>
      </li>`)}
    </ul>
    ${!r.items.length && html`<div class="empty small">Todavía no hay ejercicios en esta rutina.</div>`}
    <button class="btn ghost block" onClick=${() => setPicker(true)}>${I.plus} Añadir ejercicio</button>
    ${picker && html`<${ExercisePicker} exercises=${exercises} onCreate=${onCreateExercise} onPick=${(ex) => { setR({ ...r, items: [...r.items, { exId: ex.id, sets: 3, reps: 10, rest: DEFAULT_REST }] }); setPicker(false); }} onClose=${() => setPicker(false)} />`}
    ${ask && html`<${Confirm} ...${ask} onClose=${() => setAsk(null)} />`}
  </${Sheet}>`;
}

function RoutinesView({ routines, exById, nextId, onEdit, onNew, onReorder }) {
  return html`<section class="view">
    <header class="view-head row">
      <div><p class="eyebrow">Por turnos, en este orden</p><h1>Rutinas</h1></div>
      <button class="btn primary" onClick=${onNew}>${I.plus} Nueva</button>
    </header>
    ${routines.length ? html`<ol class="routine-list">
      ${routines.map((r, i) => html`<li class="card routine-card">
        <button class="routine-main" onClick=${() => onEdit(r)}>
          <span class="routine-n">${i + 1}</span>
          <span class="routine-info">
            <b>${r.name}${r.id === nextId ? html` <span class="pill accent">toca hoy</span>` : ""}</b>
            <small>${r.items.map((it) => exById[it.exId]?.name).filter(Boolean).join(" · ")}</small>
          </span>
          <span class="routine-edit">${I.edit}</span>
        </button>
        <div class="ex-tools vertical">
          <button class="icon-btn" aria-label="Subir" disabled=${i === 0} onClick=${() => onReorder(i, -1)}>${I.up}</button>
          <button class="icon-btn" aria-label="Bajar" disabled=${i === routines.length - 1} onClick=${() => onReorder(i, 1)}>${I.down}</button>
        </div>
      </li>`)}
    </ol>
    <p class="muted small center">Cuando terminas una rutina, la próxima vez te toca la siguiente de la lista. Después de la última, vuelve a la primera.</p>`
    : html`<div class="empty">Aún no tienes rutinas. Crea la primera con «Nueva».</div>`}
  </section>`;
}

// ---------- Pantalla: Progreso ----------
function ProgressView({ finished, exById, onDelete }) {
  const [metric, setMetric] = useState("kg");
  const [open, setOpen] = useState(null);
  const [ask, setAsk] = useState(null);
  // Ejercicios con datos, ordenados por número de entrenos.
  const byEx = useMemo(() => {
    const m = {};
    for (const w of [...finished].reverse()) {
      for (const it of w.items) {
        const sets = doneSets(it).filter((s) => s.kg != null && s.reps);
        if (!sets.length) continue;
        (m[it.exId] ??= []).push({ t: w.finishedAt, sets });
      }
    }
    return m;
  }, [finished]);
  const exIds = Object.keys(byEx).sort((a, b) => byEx[b].length - byEx[a].length);
  const [exId, setExId] = useState(null);
  const sel = exId && byEx[exId] ? exId : exIds[0];
  const sessions = sel ? byEx[sel] : [];
  const points = sessions.map((s) => ({ t: s.t, v: metric === "kg" ? Math.max(...s.sets.map((x) => x.kg)) : Math.max(...s.sets.map((x) => e1rm(x.kg, x.reps))) }));
  const best = sessions.flatMap((s) => s.sets.map((x) => ({ ...x, t: s.t })));
  const heaviest = best.reduce((a, b) => (!a || b.kg > a.kg || (b.kg === a.kg && b.reps > a.reps) ? b : a), null);
  const best1rm = best.reduce((a, b) => (!a || e1rm(b.kg, b.reps) > e1rm(a.kg, a.reps) ? b : a), null);
  const bestVol = sessions.reduce((a, s) => { const v = s.sets.reduce((n, x) => n + x.kg * x.reps, 0); return !a || v > a.v ? { v, t: s.t } : a; }, null);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = finished.filter((w) => w.finishedAt >= monthStart.getTime()).length;
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const thisWeek = finished.filter((w) => w.finishedAt >= weekStart.getTime()).length;

  return html`<section class="view">
    <header class="view-head"><p class="eyebrow">Tus números</p><h1>Progreso</h1></header>
    <div class="stats">
      <div><b>${thisWeek}</b><span>esta semana</span></div>
      <div><b>${thisMonth}</b><span>este mes</span></div>
      <div><b>${finished.length}</b><span>en total</span></div>
    </div>

    ${exIds.length ? html`
      <section class="card">
        <label class="field"><span>Ejercicio</span>
          <select id="progress-ex" class="input" value=${sel} onChange=${(e) => setExId(e.target.value)}>
            ${exIds.map((id) => html`<option value=${id}>${exById[id]?.name || id} (${byEx[id].length})</option>`)}
          </select>
        </label>
        <div class="seg" role="tablist">
          <button role="tab" aria-selected=${metric === "kg"} class=${metric === "kg" ? "on" : ""} onClick=${() => setMetric("kg")}>Peso máximo</button>
          <button role="tab" aria-selected=${metric === "1rm"} class=${metric === "1rm" ? "on" : ""} onClick=${() => setMetric("1rm")}>1RM estimado</button>
        </div>
        <${LineChart} points=${points} unit="kg" />
        ${metric === "1rm" && html`<p class="muted small">El 1RM estimado es el peso que podrías levantar a una sola repetición, calculado con tus series (fórmula de Epley). Es orientativo.</p>`}
        <h3 class="pr-title">${I.trophy} Récords</h3>
        <ul class="pr-list">
          ${heaviest && html`<li><span>Peso máximo</span><b>${fmtKg(heaviest.kg)} kg × ${heaviest.reps}</b><small>${shortDate(heaviest.t)}</small></li>`}
          ${best1rm && html`<li><span>Mejor 1RM estimado</span><b>${fmtKg(Math.round(e1rm(best1rm.kg, best1rm.reps) * 10) / 10)} kg</b><small>${shortDate(best1rm.t)}</small></li>`}
          ${bestVol && html`<li><span>Más volumen en un día</span><b>${Math.round(bestVol.v).toLocaleString("es-ES")} kg</b><small>${shortDate(bestVol.t)}</small></li>`}
        </ul>
      </section>` : html`<div class="empty">Cuando termines tu primer entreno, aquí verás tus gráficas y récords.</div>`}

    ${finished.length > 0 && html`<h2 class="section-title">Historial</h2>
      <ul class="history">
        ${finished.map((w) => html`<li class="card hist-card">
          <button class="hist-main" aria-expanded=${open === w.id} onClick=${() => setOpen(open === w.id ? null : w.id)}>
            <span><b>${w.name}</b><small>${dayLabel(w.finishedAt)} · ${minutes(w.startedAt, w.finishedAt)} min</small></span>
            <span class="pill">${w.items.reduce((n, it) => n + it.sets.length, 0)} series</span>
          </button>
          ${open === w.id && html`<div class="hist-detail">
            ${w.items.map((it) => html`<p><b>${exById[it.exId]?.name || "Ejercicio"}</b><br /><span class="muted">${setsText(it.sets) || "Sin series"}</span></p>`)}
            <button class="btn link danger-text" onClick=${() => setAsk({ title: "Borrar entreno", text: `¿Borrar el entreno «${w.name}» del ${dayLabel(w.finishedAt)}? No se puede deshacer.`, yes: "Borrar", danger: true, onYes: () => onDelete(w) })}>Borrar este entreno</button>
          </div>`}
        </li>`)}
      </ul>`}
    ${ask && html`<${Confirm} ...${ask} onClose=${() => setAsk(null)} />`}
  </section>`;
}

// ---------- Amigos ----------
// Cada usuario publica un resumen en shared/{uid} (nombre, récords, evolución, fechas de entrenos).
// Solo pueden leerlo los uid que estén en su lista "friends". Los códigos de amigo están en codes/{código}.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0 ni I/1 para que no se confundan
const makeCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

// Resumen que ve un amigo. Se calcula de tus entrenos terminados.
function buildSummary(finished, exById, user) {
  const exercises = {};
  for (const w of [...finished].reverse()) {
    for (const it of w.items) {
      const sets = doneSets(it).filter((s) => s.kg != null && s.reps);
      if (!sets.length) continue;
      const e = (exercises[it.exId] ??= { name: exById[it.exId]?.name || "Ejercicio", best: null, best1rm: 0, series: [] });
      const top = sets.reduce((a, s) => (s.kg > a.kg || (s.kg === a.kg && s.reps > a.reps) ? s : a));
      e.series.push({ t: w.finishedAt, kg: top.kg });
      if (!e.best || top.kg > e.best.kg || (top.kg === e.best.kg && top.reps > e.best.reps)) e.best = { kg: top.kg, reps: top.reps, t: w.finishedAt };
      for (const s of sets) e.best1rm = Math.max(e.best1rm, Math.round(e1rm(s.kg, s.reps) * 10) / 10);
    }
  }
  for (const e of Object.values(exercises)) e.series = e.series.slice(-40);
  return { name: user.displayName || "Sin nombre", photo: user.photoURL || null, dates: finished.slice(0, 150).map((w) => w.finishedAt), exercises };
}
const countSince = (dates = [], from) => dates.filter((t) => t >= from).length;
const weekStartMs = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
const monthStartMs = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); };

function Avatar({ name, photo, cls = "avatar" }) {
  return html`<span class=${cls}>${photo ? html`<img src=${photo} alt="" referrerpolicy="no-referrer" />` : (name || "?")[0]}</span>`;
}

// Gráfica con dos líneas: tú (ámbar) y tu amigo (azul).
function DuoChart({ a, b }) {
  const all = [...a, ...b];
  if (all.length < 2) return html`<div class="empty small">Aún no hay datos suficientes para la gráfica.</div>`;
  const W = 340, H = 180, padL = 36, padR = 12, padT = 14, padB = 24;
  const t0 = Math.min(...all.map((p) => p.t)), t1 = Math.max(...all.map((p) => p.t));
  let min = Math.min(...all.map((p) => p.kg)), max = Math.max(...all.map((p) => p.kg));
  if (min === max) { min -= 1; max += 1; }
  const span = max - min; min = Math.max(0, min - span * 0.1); max += span * 0.1;
  const x = (t) => padL + (W - padL - padR) * (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0));
  const y = (v) => padT + (H - padT - padB) * (1 - (v - min) / (max - min));
  const line = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
  const ticks = [min, (min + max) / 2, max];
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución comparada del peso máximo">
    ${ticks.map((t) => html`<g><line x1=${padL} x2=${W - padR} y1=${y(t)} y2=${y(t)} class="grid" /><text x=${padL - 6} y=${y(t) + 3} class="tick" text-anchor="end">${Math.round(t)}</text></g>`)}
    <path d=${line(b)} class="line friend" />
    ${b.map((p) => html`<circle cx=${x(p.t)} cy=${y(p.kg)} r="2.5" class="dot friend" />`)}
    <path d=${line(a)} class="line" />
    ${a.map((p) => html`<circle cx=${x(p.t)} cy=${y(p.kg)} r="2.5" class="dot" />`)}
    <text x=${padL} y=${H - 6} class="tick" text-anchor="start">${shortDate(t0)}</text>
    <text x=${W - padR} y=${H - 6} class="tick" text-anchor="end">${shortDate(t1)}</text>
  </svg>`;
}

function CompareView({ me, them, onBack, onRemove }) {
  const [open, setOpen] = useState(null);
  const common = Object.keys(me.exercises || {}).filter((id) => them.exercises?.[id]).sort((p, q) => (me.exercises[q].series.length + them.exercises[q].series.length) - (me.exercises[p].series.length + them.exercises[p].series.length));
  const rows = [["Esta semana", weekStartMs()], ["Este mes", monthStartMs()], ["En total", 0]];
  const first = them.name.split(" ")[0];
  return html`<section class="view">
    <button class="btn link back-link" onClick=${onBack}>${I.back} Amigos</button>
    <header class="vs-head">
      <div class="vs-side"><${Avatar} name=${me.name} photo=${me.photo} cls="avatar big" /><b>Tú</b></div>
      <span class="vs">VS</span>
      <div class="vs-side"><${Avatar} name=${them.name} photo=${them.photo} cls="avatar big friend" /><b>${first}</b></div>
    </header>
    <section class="card">
      <p class="eyebrow">Entrenos</p>
      ${rows.map(([label, from]) => {
        const a = countSince(me.dates, from), b = countSince(them.dates, from);
        return html`<div class="vs-row"><b class=${a > b ? "win" : ""}>${a}</b><span>${label}</span><b class=${b > a ? "win friend-text" : "friend-text"}>${b}</b></div>`;
      })}
    </section>
    <h2 class="section-title">Ejercicios en común</h2>
    ${common.length ? html`<ul class="history">${common.map((id) => {
      const A = me.exercises[id], B = them.exercises[id];
      const aWin = A.best1rm > B.best1rm, bWin = B.best1rm > A.best1rm;
      return html`<li class="card hist-card">
        <button class="hist-main vs-ex" aria-expanded=${open === id} onClick=${() => setOpen(open === id ? null : id)}>
          <${ExerciseFigure} exId=${id} />
          <span class="vs-ex-name"><b>${A.name}</b><small>Récord de peso</small></span>
          <span class="vs-ex-vals"><b class=${aWin ? "win" : ""}>${fmtKg(A.best.kg)}×${A.best.reps}</b><b class=${"friend-text " + (bWin ? "win" : "")}>${fmtKg(B.best.kg)}×${B.best.reps}</b></span>
        </button>
        ${open === id && html`<div class="hist-detail">
          <div class="legend"><span class="key me"></span>Tú · 1RM est. ${fmtKg(A.best1rm)} kg<span class="key friend"></span>${first} · ${fmtKg(B.best1rm)} kg</div>
          <${DuoChart} a=${A.series} b=${B.series} />
          <p class="muted small">Peso máximo de cada entreno. Gana quien tenga mejor 1RM estimado (tiene en cuenta peso y repeticiones).</p>
        </div>`}
      </li>`;
    })}</ul>` : html`<div class="empty">Todavía no habéis hecho ningún ejercicio en común. Cuando los dos terminéis un entreno con el mismo ejercicio, aparecerá aquí.</div>`}
    <button class="btn link danger-text block" onClick=${onRemove}>Quitar a ${first} de mis amigos</button>
  </section>`;
}

function FriendsView({ uid, mySummary, toast }) {
  const [profile, setProfile] = useState(undefined);
  const [shared, setShared] = useState(undefined);
  const [friendsData, setFriendsData] = useState({});
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(null);
  const [ask, setAsk] = useState(null);
  const [rulesError, setRulesError] = useState(false);
  const denied = (e) => { if (e?.code === "permission-denied") setRulesError(true); };

  useEffect(() => watchDoc(["users", uid, "meta", "profile"], setProfile, () => setProfile(null)), [uid]);
  useEffect(() => watchDoc(["shared", uid], setShared, (e) => { denied(e); setShared(null); }), [uid]);
  // Crear tu código de amigo la primera vez.
  useEffect(() => {
    if (profile === undefined || profile?.code) return;
    (async () => {
      for (let i = 0; i < 5; i++) {
        const c = makeCode();
        try { await mergeDoc(["codes", c], { uid }); await mergeDoc(["users", uid, "meta", "profile"], { code: c }); return; }
        catch (e) { denied(e); if (e?.code === "permission-denied" && i > 1) return; }
      }
    })();
  }, [profile === undefined, profile?.code]);

  const friends = shared?.friends || [];
  useEffect(() => {
    const offs = friends.map((f) => watchDoc(["shared", f], (d) => setFriendsData((m) => ({ ...m, [f]: d || "pending" })), () => setFriendsData((m) => ({ ...m, [f]: "pending" }))));
    return () => offs.forEach((off) => off());
  }, [friends.join(",")]);

  const add = async () => {
    const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 6) { setMsg("El código tiene 6 letras o números."); return; }
    setBusy(true); setMsg("");
    try {
      const d = await readDoc(["codes", c]);
      if (!d) setMsg("No hay nadie con ese código. Revisa que esté bien escrito.");
      else if (d.uid === uid) setMsg("Ese es tu propio código.");
      else if (friends.includes(d.uid)) setMsg("Ya lo tienes en tu lista.");
      else {
        await addToList(["shared", uid], "friends", d.uid);
        await mergeDoc(["users", uid, "meta", "profile"], { friendCodes: { [d.uid]: c } });
        setCode("");
        setMsg("¡Añadido! Para que podáis compararos, él también tiene que añadirte con tu código.");
      }
    } catch (e) { denied(e); setMsg("No se pudo añadir. Inténtalo otra vez."); }
    setBusy(false);
  };
  const remove = async (f) => { await removeFromList(["shared", uid], "friends", f); setSel(null); toast("Amigo quitado"); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(profile.code); toast("Código copiado"); }
    catch { toast(`Tu código es ${profile.code}`); }
  };
  const share = async () => {
    const text = `¡Compárate conmigo en GYM! Entra en ${location.origin + location.pathname} con tu cuenta de Google, ve a Amigos y añade mi código: ${profile.code}`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast("Mensaje copiado: pégalo en WhatsApp"); } } catch {}
  };

  const selData = sel && friendsData[sel];
  if (sel && selData && selData !== "pending") {
    return html`<${CompareView} me=${mySummary} them=${selData} onBack=${() => setSel(null)} onRemove=${() => setAsk({ title: "Quitar amigo", text: `¿Quitar a ${selData.name} de tus amigos? Dejará de ver tu progreso.`, yes: "Quitar", danger: true, onYes: () => remove(sel) })} />
      ${ask && html`<${Confirm} ...${ask} onClose=${() => setAsk(null)} />`}`;
  }

  return html`<section class="view">
    <header class="view-head"><p class="eyebrow">Compárate con tus amigos</p><h1>Amigos</h1></header>
    ${rulesError && html`<div class="warn">Falta actualizar las reglas de seguridad de Firebase para usar Amigos. Pídele a Claude el texto de las reglas.</div>`}
    <section class="card code-card">
      <p class="eyebrow">Tu código de amigo</p>
      <div class="code-row">
        <span class="code">${profile?.code || "······"}</span>
        <button class="icon-btn" aria-label="Copiar código" disabled=${!profile?.code} onClick=${copy}>${I.copy}</button>
      </div>
      <button class="btn primary block" disabled=${!profile?.code} onClick=${share}>Invitar a un amigo</button>
      <p class="muted small">Tu amigo entra en la app con su cuenta de Google, va a Amigos y escribe tu código. Tú haces lo mismo con el suyo.</p>
    </section>
    <section class="card">
      <p class="eyebrow">Añadir amigo</p>
      <div class="add-row">
        <input id="friend-code" class="input code-input" placeholder="CÓDIGO" maxlength="8" autocapitalize="characters" autocomplete="off" value=${code} onInput=${(e) => setCode(e.target.value.toUpperCase())} onKeyDown=${(e) => e.key === "Enter" && add()} />
        <button class="btn primary" disabled=${busy || !code.trim()} onClick=${add}>Añadir</button>
      </div>
      ${msg && html`<p class="small" role="status">${msg}</p>`}
    </section>
    ${friends.length > 0 && html`<h2 class="section-title">Tus amigos</h2>
      <ul class="history">${friends.map((f) => {
        const d = friendsData[f];
        const pending = !d || d === "pending";
        return html`<li class="card hist-card"><button class="hist-main friend-row" onClick=${() => (pending ? setAsk({ title: "Esperando", text: `Todavía no puedes ver su progreso: tiene que añadirte con tu código (${profile?.code}). ¿Quieres quitarlo de la lista?`, yes: "Quitar", danger: true, onYes: () => remove(f) }) : setSel(f))}>
          ${pending ? html`<span class="avatar">?</span>` : html`<${Avatar} name=${d.name} photo=${d.photo} />`}
          <span class="friend-info"><b>${pending ? `Código ${profile?.friendCodes?.[f] || ""}` : d.name}</b><small>${pending ? "Esperando a que te añada" : `${countSince(d.dates, weekStartMs())} entrenos esta semana`}</small></span>
          ${!pending && html`<span class="pill accent">Comparar</span>`}
        </button></li>`;
      })}</ul>`}
    ${ask && html`<${Confirm} ...${ask} onClose=${() => setAsk(null)} />`}
  </section>`;
}

// ---------- Barra inferior con el bíceps que salta ----------
// El bíceps ocupa el lugar del icono de la pestaña activa. Al cambiar de pestaña, salta en arco
// desde la anterior hasta la nueva y, al llegar, "hace fuerza" (se hincha un momento).
const BICEP = html`<svg class="bicep" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M3.6 18.2H18.2L15.4 6.4" class="bicep-arm" />
  <circle cx="9.4" cy="14.4" r="4.9" class="bicep-fill" />
  <circle cx="13.9" cy="4.6" r="3.7" class="bicep-fill" />
  <path d="M14.6 17c-.2-2.3-.8-4.3-1.7-6" class="bicep-line" />
</svg>`;

function TabBar({ tabs, tab, onTab, live }) {
  const navRef = useRef(null);
  const flyRef = useRef(null);
  const prevX = useRef(null);
  const centerOf = (id) => {
    const b = navRef.current?.querySelector(`[data-tab="${id}"] .tab-icon`);
    const n = navRef.current?.getBoundingClientRect();
    if (!b || !n) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left - n.left + r.width / 2, y: r.top - n.top + r.height / 2 };
  };
  const place = (animate) => {
    const el = flyRef.current, to = centerOf(tab);
    if (!el || !to) return;
    const end = `translate(${to.x}px, ${to.y}px)`;
    const from = prevX.current;
    prevX.current = to;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.style.transform = end;
    if (!animate || !from || from.x === to.x || reduce || !el.animate) return;
    const mid = (from.x + to.x) / 2, dist = Math.abs(to.x - from.x);
    const dir = to.x > from.x ? 1 : -1;
    // Cada tramo con su propio ritmo: sube frenando, cae acelerando, se hincha y vuelve a su tamaño.
    el.animate([
      { transform: `translate(${from.x}px, ${from.y}px) rotate(0deg) scale(1)`, easing: "cubic-bezier(.2,.7,.4,1)" },
      { transform: `translate(${mid}px, ${from.y - 18 - dist * 0.06}px) rotate(${dir * 18}deg) scale(1.05)`, offset: 0.36, easing: "cubic-bezier(.6,0,.9,.5)" },
      { transform: `translate(${to.x}px, ${to.y}px) rotate(0deg) scale(0.88)`, offset: 0.6, easing: "cubic-bezier(.2,.8,.3,1)" },
      { transform: `translate(${to.x}px, ${to.y}px) rotate(0deg) scale(1.45)`, offset: 0.78, easing: "ease-in-out" },
      { transform: end + " rotate(0deg) scale(1)" },
    ], { duration: 780, easing: "linear" });
  };
  useEffect(() => { place(true); }, [tab]);
  useEffect(() => {
    const onResize = () => { prevX.current = null; place(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [tab]);
  return html`<nav class="tabbar" ref=${navRef}>
    ${tabs.map(([id, label, icon]) => html`<button data-tab=${id} class=${tab === id ? "on" : ""} aria-current=${tab === id ? "page" : undefined} onClick=${() => onTab(id)}><span class="tab-icon">${icon}</span><span>${label}</span>${id === "hoy" && live ? html`<i class="live-dot"></i>` : ""}</button>`)}
    <span class="tab-fly" ref=${flyRef}>${BICEP}</span>
  </nav>`;
}

// ---------- App ----------
function Login({ error }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(error || "");
  return html`<main class="login">
    <div class="logo">${I.today}</div>
    <h1>GYM</h1>
    <p class="muted">Apunta tus entrenos y mira cómo progresas. Tus datos se guardan en tu cuenta y se ven igual en el móvil y en el PC.</p>
    <button class="btn primary big block" disabled=${busy} onClick=${async () => { setBusy(true); setErr(""); try { await login(); } catch (e) { setErr(e.code === "auth/popup-closed-by-user" ? "Has cerrado la ventana de Google antes de terminar." : "No se pudo iniciar sesión. Inténtalo otra vez."); setBusy(false); } }}>${busy ? "Abriendo Google…" : "Entrar con Google"}</button>
    ${err && html`<p class="error">${err}</p>`}
  </main>`;
}

function App() {
  const [user, setUser] = useState(undefined);
  const [tab, setTab] = useState(() => { try { return localStorage.getItem("gym-tab") || "hoy"; } catch { return "hoy"; } });
  const [routines, setRoutines] = useState([]);
  const [customEx, setCustomEx] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [rest, setRestState] = useState(() => { try { const r = JSON.parse(localStorage.getItem("gym-rest")); return r && r.endsAt > Date.now() ? r : null; } catch { return null; } });
  const [editing, setEditing] = useState(null);
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);

  useEffect(() => watchUser((u) => setUser(u || null)), []);
  useEffect(() => { try { localStorage.setItem("gym-tab", tab); } catch {} }, [tab]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); }, [toast]);

  useEffect(() => {
    if (!user) return;
    const onErr = () => setToast("No se pudieron cargar tus datos. Revisa la conexión.");
    let pending = 3;
    const ready = () => { if (--pending === 0) setLoaded(true); };
    const once = (fn) => { let first = true; return (v) => { fn(v); if (first) { first = false; ready(); } }; };
    const u1 = watchCollection(user.uid, "routines", once((list) => setRoutines(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))), onErr);
    const u2 = watchCollection(user.uid, "exercises", once((list) => setCustomEx(list.map((e) => ({ ...e, custom: true })))), onErr);
    const u3 = watchCollection(user.uid, "workouts", once((list) => setWorkouts(list.sort((a, b) => b.startedAt - a.startedAt))), onErr);
    return () => { u1(); u2(); u3(); };
  }, [user?.uid]);

  const setRest = (r) => { setRestState(r); try { r ? localStorage.setItem("gym-rest", JSON.stringify(r)) : localStorage.removeItem("gym-rest"); } catch {} };
  const startRest = (secs) => setRest({ endsAt: Date.now() + secs * 1000, total: secs });

  const exercises = useMemo(() => [...BUILTIN_EXERCISES, ...customEx].sort((a, b) => a.name.localeCompare(b.name, "es")), [customEx]);
  const exById = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises]);
  const finished = useMemo(() => workouts.filter((w) => w.finishedAt).sort((a, b) => b.finishedAt - a.finishedAt), [workouts]);
  const active = workouts.find((w) => !w.finishedAt);

  // Resumen para tus amigos: se publica en shared/{uid} solo cuando cambia.
  const mySummary = useMemo(() => (user ? buildSummary(finished, exById, user) : null), [finished, exById, user?.uid]);
  const lastPublished = useRef("");
  useEffect(() => {
    if (!user || !loaded || !mySummary) return;
    const json = JSON.stringify(mySummary);
    const key = "gym-shared-" + user.uid;
    let prev = lastPublished.current;
    try { prev ||= localStorage.getItem(key) || ""; } catch {}
    if (json === prev) return;
    mergeDoc(["shared", user.uid], { ...mySummary, updatedAt: Date.now() })
      .then(() => { lastPublished.current = json; try { localStorage.setItem(key, json); } catch {} })
      .catch(() => {}); // si las reglas aún no están actualizadas, se reintenta en el próximo cambio
  }, [mySummary, loaded]);

  // Series de la última vez que hiciste un ejercicio (solo las marcadas como hechas).
  const lastSetsFor = (exId, excludeId) => {
    for (const w of finished) {
      if (w.id === excludeId) continue;
      const it = w.items.find((x) => x.exId === exId);
      const sets = it ? doneSets(it) : [];
      if (sets.length) { sets.when = w.finishedAt; return sets; } // "when": fecha de ese entreno
    }
    return [];
  };

  if (user === undefined) return html`<main class="login"><div class="logo pulse">${I.today}</div></main>`;
  if (!user) return html`<${Login} />`;
  const uid = user.uid;

  const createExercise = async (name, group) => {
    const ex = { id: "c-" + newId(), name, group };
    saveDoc(uid, "exercises", ex.id, { name, group });
    setCustomEx((l) => [...l, { ...ex, custom: true }]);
    return ex;
  };
  const startWorkout = (routine) => {
    const items = routine ? routine.items.map((it) => {
      const prev = lastSetsFor(it.exId);
      const sets = Array.from({ length: it.sets }, (_, k) => {
        // Casillas vacías; en gris, lo de la última vez (o el peso y reps de la rutina si es la primera).
        const p = prev[k] || prev.at(-1);
        return { kg: null, reps: null, done: false, hint: { kg: p?.kg ?? it.kg ?? null, reps: p?.reps ?? it.reps ?? null } };
      });
      return { exId: it.exId, rest: it.rest || DEFAULT_REST, sets };
    }) : [];
    const w = { id: newId(), routineId: routine?.id || null, name: routine?.name || "Entreno libre", startedAt: Date.now(), finishedAt: null, items };
    setWorkouts((l) => [w, ...l]);
    saveDoc(uid, "workouts", w.id, w);
    setTab("hoy");
  };
  const saveWorkout = (w) => saveDoc(uid, "workouts", w.id, w);
  const finishWorkout = (w) => {
    const items = w.items.map((it) => ({ ...it, sets: doneSets(it).map(({ hint, ...s }) => s) })).filter((it) => it.sets.length);
    const done = { ...w, items, finishedAt: Date.now() };
    // Récords: peso máximo mayor que cualquier serie anterior de ese ejercicio.
    const records = [];
    for (const it of items) {
      const prevMax = Math.max(0, ...finished.flatMap((f) => f.items.filter((x) => x.exId === it.exId).flatMap((x) => doneSets(x).map((s) => s.kg || 0))));
      const top = it.sets.reduce((a, s) => ((s.kg || 0) > (a?.kg || 0) ? s : a), null);
      const hadBefore = finished.some((f) => f.items.some((x) => x.exId === it.exId));
      if (top && hadBefore && top.kg > prevMax) records.push({ exId: it.exId, kg: top.kg, reps: top.reps });
    }
    setWorkouts((l) => l.map((x) => (x.id === w.id ? done : x)));
    saveDoc(uid, "workouts", w.id, done);
    setRest(null);
    setSummary({ workout: done, records });
  };
  const discardWorkout = (w) => { setWorkouts((l) => l.filter((x) => x.id !== w.id)); removeDoc(uid, "workouts", w.id); setRest(null); setToast("Entreno descartado"); };
  const deleteWorkout = (w) => { setWorkouts((l) => l.filter((x) => x.id !== w.id)); removeDoc(uid, "workouts", w.id); setToast("Entreno borrado"); };
  const saveRoutine = (r) => {
    const { isNew, ...data } = r;
    const order = isNew ? (routines.at(-1)?.order ?? -1) + 1 : r.order;
    saveDoc(uid, "routines", r.id, { name: data.name.trim(), items: data.items, order });
    setEditing(null);
    setToast("Rutina guardada");
  };
  const deleteRoutine = (r) => { removeDoc(uid, "routines", r.id); setEditing(null); setToast("Rutina borrada"); };
  const reorder = (i, d) => {
    const list = [...routines];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    list.forEach((r, k) => { if (r.order !== k) saveDoc(uid, "routines", r.id, { name: r.name, items: r.items, order: k }); });
    setRoutines(list.map((r, k) => ({ ...r, order: k })));
  };
  const lastRoutineWorkout = finished.find((w) => w.routineId && routines.some((r) => r.id === w.routineId));
  const nextId = routines.length ? routines[lastRoutineWorkout ? (routines.findIndex((r) => r.id === lastRoutineWorkout.routineId) + 1) % routines.length : 0].id : null;

  const tabs = [["hoy", active ? "Entreno" : "Hoy", I.today], ["rutinas", "Rutinas", I.list], ["progreso", "Progreso", I.chart], ["amigos", "Amigos", I.users]];

  return html`<div class="app">
    <header class="topbar">
      <span class="brand">GYM</span>
      <button class="avatar" aria-label="Tu cuenta" onClick=${() => setMenu(true)}>${user.photoURL ? html`<img src=${user.photoURL} alt="" referrerpolicy="no-referrer" />` : (user.displayName || "?")[0]}</button>
    </header>
    <main class="content">
      ${!loaded ? html`<div class="empty">Cargando tus datos…</div>`
        : tab === "hoy" ? (active
          ? html`<${WorkoutView} key=${active.id} workout=${active} exercises=${exercises} exById=${exById} lastSetsFor=${lastSetsFor} onSave=${saveWorkout} onFinish=${finishWorkout} onDiscard=${discardWorkout} onRest=${startRest} onCreateExercise=${createExercise} />`
          : html`<${TodayView} routines=${routines} finished=${finished} exById=${exById} lastSetsFor=${lastSetsFor} onStart=${startWorkout} goRoutines=${() => { setTab("rutinas"); setEditing({ id: newId(), name: "", items: [], isNew: true }); }} />`)
        : tab === "rutinas" ? html`<${RoutinesView} routines=${routines} exById=${exById} nextId=${nextId} onEdit=${(r) => setEditing(r)} onNew=${() => setEditing({ id: newId(), name: "", items: [], isNew: true })} onReorder=${reorder} />`
        : tab === "amigos" ? html`<${FriendsView} uid=${uid} mySummary=${mySummary} toast=${setToast} />`
        : html`<${ProgressView} finished=${finished} exById=${exById} onDelete=${deleteWorkout} />`}
    </main>
    ${rest && html`<${RestBar} key=${rest.endsAt} rest=${rest} onChange=${setRest} />`}
    <${TabBar} tabs=${tabs} tab=${tab} onTab=${setTab} live=${!!active} />
    ${editing && html`<${RoutineEditor} routine=${editing} exercises=${exercises} exById=${exById} onSave=${saveRoutine} onDelete=${deleteRoutine} onClose=${() => setEditing(null)} onCreateExercise=${createExercise} />`}
    ${summary && html`<${Summary} ...${summary} exById=${exById} onClose=${() => { setSummary(null); setTab("progreso"); }} />`}
    ${menu && html`<${Sheet} title="Tu cuenta" onClose=${() => setMenu(false)} footer=${html`<button class="btn ghost block" onClick=${() => { setMenu(false); logout(); }}>Cerrar sesión</button>`}>
      <p><b>${user.displayName}</b><br /><span class="muted">${user.email}</span></p>
      <p class="muted small">Tus datos se guardan en tu cuenta de Google a través de Firebase. Solo tú puedes verlos.</p>
    </${Sheet}>`}
    ${toast && html`<div class="toast" role="status">${toast}</div>`}
  </div>`;
}

render(html`<${App} />`, document.getElementById("root"));
