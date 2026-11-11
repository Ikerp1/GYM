// Motor de siluetas: dibuja un muñeco articulado (SVG) a partir de una postura,
// y anima entre la postura inicial y la final de cada ejercicio.
//
// Sistema de coordenadas: viewBox "0 -24 200 194", suelo en y = 160, el muñeco mira hacia la derecha.
// Ángulos en grados con el eje Y hacia abajo: 0 = derecha, -90 = arriba, 90 = abajo, 180 = izquierda.

export const VIEWBOX = "0 -24 200 194";
const FLOOR = 160;
const L = { torso: 50, neck: 15, head: 9.5, upper: 28, fore: 26, thigh: 38, shin: 38, foot: 13 };

const rad = (d) => (d * Math.PI) / 180;
const dir = (deg, len = 1) => [Math.cos(rad(deg)) * len, Math.sin(rad(deg)) * len];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// Cinemática inversa de dos huesos: devuelve la articulación intermedia (codo o rodilla).
// De las dos soluciones posibles elige la más cercana al punto "hint".
function ik(root, target, l1, l2, hint) {
  let d = dist(root, target);
  d = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const base = Math.atan2(target[1] - root[1], target[0] - root[0]);
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const m1 = [root[0] + Math.cos(base + a) * l1, root[1] + Math.sin(base + a) * l1];
  const m2 = [root[0] + Math.cos(base - a) * l1, root[1] + Math.sin(base - a) * l1];
  return dist(m1, hint) <= dist(m2, hint) ? m1 : m2;
}
// Si el objetivo está demasiado lejos, el extremo se queda donde llega el brazo/pierna.
function reach(root, mid, target, l2) {
  const d = dist(mid, target);
  if (d <= l2 + 0.5) return target;
  return [mid[0] + ((target[0] - mid[0]) / d) * l2, mid[1] + ((target[1] - mid[1]) / d) * l2];
}

// Mezcla dos posturas (números y listas de números).
function lerpPose(a, b, t) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[k] ?? b[k], vb = b[k] ?? a[k];
    if (typeof va === "number") out[k] = va + (vb - va) * t;
    else if (Array.isArray(va) && Array.isArray(vb)) out[k] = va.map((v, i) => v + (vb[i] - v) * t);
    else out[k] = t < 0.5 ? va : vb;
  }
  return out;
}

// Calcula todas las articulaciones de una postura.
function skeleton(def, p) {
  if (def.front) return skeletonFront(p);
  const hip = p.hip;
  const shoulder = add(hip, dir(p.torso, L.torso * (p.torsoScale ?? 1)));
  const head = add(shoulder, dir(p.torso + (p.headTilt ?? 0), L.neck));
  const hand = p.handRel ? add(shoulder, p.handRel) : p.hand;
  const hand2 = p.hand2 ?? (p.handRel2 ? add(shoulder, p.handRel2) : hand && add(hand, p.handOff ?? [-4, -2]));
  const foot = p.foot;
  const foot2 = p.foot2 ?? add(foot, p.footOff ?? [-7, 0]);
  const arm = (h, hint, explicit) => {
    if (!h) return null;
    const elbow = explicit ?? ik(shoulder, h, L.upper, L.fore, hint ?? add(shoulder, [-10, 30]));
    return { elbow, hand: explicit ? h : reach(shoulder, elbow, h, L.fore) };
  };
  const leg = (f, hint, explicit) => {
    const knee = explicit ?? ik(hip, f, L.thigh, L.shin, hint ?? add(hip, [40, 20]));
    return { knee, ankle: explicit ? f : reach(hip, knee, f, L.shin) };
  };
  return {
    hip, shoulder, head,
    near: { arm: arm(hand, p.elbowHint, p.elbow), leg: leg(foot, p.kneeHint, p.knee) },
    far: { arm: arm(hand2, p.elbowHint2 ?? p.elbowHint, p.elbow2), leg: leg(foot2, p.kneeHint2 ?? p.kneeHint, p.knee2) },
    footAng: p.footAng ?? 0, footAng2: p.footAng2 ?? p.footAng ?? 0,
  };
}

// Vista de frente (para elevaciones laterales, encogimientos, abductores...).
function skeletonFront(p) {
  const hip = p.hip, cx = hip[0];
  const torsoLen = L.torso * (p.torsoScale ?? 1);
  const shrug = p.shrug ?? 0;
  const sC = [cx, hip[1] - torsoLen];
  const sR = [cx + 16, sC[1] + shrug], hR = [cx + 9, hip[1]];
  const head = [cx, sC[1] - L.neck + shrug * 0.5];
  const elbow = p.elbow ?? ik(sR, p.hand, L.upper, L.fore, p.elbowHint ?? add(sR, [22, 18]));
  const hand = p.elbow ? p.hand : reach(sR, elbow, p.hand, L.fore);
  const knee = p.knee ?? ik(hR, p.foot, L.thigh, L.shin, p.kneeHint ?? add(hR, [10, 38]));
  const ankle = p.knee ? p.foot : reach(hR, knee, p.foot, L.shin);
  const m = (pt) => [2 * cx - pt[0], pt[1]];
  return { front: true, hip, sC, head, R: { s: sR, h: hR, elbow, hand, knee, ankle }, Lft: { s: m(sR), h: m(hR), elbow: m(elbow), hand: m(hand), knee: m(knee), ankle: m(ankle) } };
}

// ---------- Dibujo ----------
const f1 = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${f1(p[0])},${f1(p[1])}`;
const seg = (a, b, w, cls) => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke-width="${w}" class="${cls}"/>`;
const poly = (pts, w, cls) => `<polyline points="${pts.map(pt).join(" ")}" stroke-width="${w}" class="${cls}"/>`;
const circ = (c, r, cls, extra = "") => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" class="${cls}" ${extra}/>`;

function anchorPoint(sk, at, off = [0, 0]) {
  if (Array.isArray(at)) return add(at, off);
  const base = sk.front
    ? { hand: sk.R.hand, hand2: sk.Lft.hand, shoulder: sk.R.s, hip: sk.hip, foot: sk.R.ankle }[at]
    : { hand: sk.near.arm?.hand, hand2: sk.far.arm?.hand, shoulder: sk.shoulder, hip: sk.hip, foot: sk.near.leg.ankle, foot2: sk.far.leg.ankle, knee: sk.near.leg.knee, elbow: sk.near.arm?.elbow }[at];
  return base ? add(base, off) : null;
}

function drawProp(sk, pr) {
  switch (pr.type) {
    case "bench": { // banco plano
      const h = pr.h ?? 6;
      return `<rect x="${pr.x1}" y="${pr.y}" width="${pr.x2 - pr.x1}" height="${h}" rx="3" class="eq-fill"/>` +
        seg([pr.x1 + 10, pr.y + h], [pr.x1 + 10, FLOOR], 4, "eq") + seg([pr.x2 - 10, pr.y + h], [pr.x2 - 10, FLOOR], 4, "eq");
    }
    case "shape": return `<polygon points="${pr.pts.map(pt).join(" ")}" class="eq-fill"/>`;
    case "line": return poly(pr.pts, pr.w ?? 4, "eq");
    case "barbell": { const c = anchorPoint(sk, pr.at ?? "hand", pr.off); return c ? circ(c, pr.r ?? 13, "load") + circ(c, 2.5, "eq-fill") : ""; }
    case "dumbbell": { const c = anchorPoint(sk, pr.at ?? "hand", pr.off); return c ? circ(c, pr.r ?? 6.5, "load") : ""; }
    case "kettlebell": { const c = anchorPoint(sk, pr.at ?? "hand", pr.off ?? [0, 6]); return c ? circ(c, 8, "load") : ""; }
    case "handle": { const c = anchorPoint(sk, pr.at ?? "hand", pr.off); return c ? circ(c, 4.5, "eq-fill") : ""; }
    case "pad": { const c = anchorPoint(sk, pr.at, pr.off); return c ? circ(c, pr.r ?? 6, "eq-fill") : ""; }
    case "cable": {
      const a = anchorPoint(sk, pr.from ?? "hand", pr.off);
      return a ? seg(a, pr.to, 1.5, "cable") + circ(pr.to, 4, "eq-fill") : "";
    }
    case "lever": { // barra rígida desde un pivote hasta el punto de agarre (máquinas, remo en T)
      const a = anchorPoint(sk, pr.at ?? "hand", pr.off);
      return a ? seg(pr.pivot, a, 5, "eq") + circ(pr.pivot, 4, "eq-fill") : "";
    }
    case "relline": { const c = anchorPoint(sk, pr.at, [0, 0]); return c ? seg(add(c, pr.a), add(c, pr.b), pr.w ?? 4, "eq") : ""; }
    case "wheel": { const c = anchorPoint(sk, "hand", [0, 3]); return c ? circ(c, 9, "load") + circ(c, 2.5, "eq-fill") : ""; }
    default: return "";
  }
}

function drawFigureSide(sk, pass) {
  const out = [];
  const limb = (side, cls) => {
    const s = sk[side];
    const ankle = s.leg.ankle;
    const toe = add(ankle, dir(side === "near" ? sk.footAng : sk.footAng2, L.foot));
    out.push(poly([sk.hip, s.leg.knee, ankle], cls === "far" ? 11 : 12, "limb " + cls));
    out.push(seg(ankle, toe, 6, "limb " + cls));
  };
  const arm = (side, cls) => {
    const a = sk[side].arm;
    if (!a) return;
    out.push(poly([sk.shoulder, a.elbow, a.hand], 8, "limb " + cls));
    out.push(circ(a.hand, 4, "joint " + cls));
  };
  if (pass === "far") { arm("far", "far"); limb("far", "far"); }
  if (pass === "body") {
    out.push(seg(sk.hip, sk.shoulder, 17, "limb"));
    out.push(circ(sk.head, L.head, "head"));
  }
  if (pass === "nearLeg") limb("near", "near");
  if (pass === "nearArm") arm("near", "near");
  return out.join("");
}

function drawFigureFront(sk) {
  const out = [];
  for (const s of [sk.Lft, sk.R]) {
    out.push(poly([s.h, s.knee, s.ankle], 12, "limb"));
    out.push(seg(s.ankle, add(s.ankle, [s === sk.R ? 6 : -6, 2]), 6, "limb"));
  }
  out.push(seg(sk.hip, sk.sC, 26, "limb"));
  out.push(seg(sk.Lft.s, sk.R.s, 12, "limb"));
  for (const s of [sk.Lft, sk.R]) {
    out.push(poly([s.s, s.elbow, s.hand], 8, "limb"));
    out.push(circ(s.hand, 4, "joint"));
  }
  out.push(circ(sk.head, L.head, "head"));
  return out.join("");
}

/** Devuelve el contenido SVG (sin la etiqueta <svg>) del ejercicio en el instante t (0 = inicio, 1 = final). */
export function drawExercise(def, t = 0) {
  const pose = lerpPose(def.poses[0], def.poses[1] ?? def.poses[0], t);
  const sk = skeleton(def, pose);
  const props = def.props ?? [];
  const back = props.filter((p) => !p.front && !["barbell", "dumbbell", "kettlebell", "handle", "wheel"].includes(p.type));
  const held = props.filter((p) => p.front || ["barbell", "dumbbell", "kettlebell", "handle", "wheel"].includes(p.type));
  const floor = def.noFloor ? "" : seg([4, FLOOR], [196, FLOOR], 2, "floor");
  if (sk.front) {
    return floor + back.map((p) => drawProp(sk, p)).join("") + drawFigureFront(sk) + held.map((p) => drawProp(sk, p)).join("");
  }
  return floor + back.map((p) => drawProp(sk, p)).join("") +
    drawFigureSide(sk, "far") + drawFigureSide(sk, "body") + drawFigureSide(sk, "nearLeg") +
    held.map((p) => drawProp(sk, p)).join("") + drawFigureSide(sk, "nearArm");
}

// Encuadre ajustado al dibujo (para las miniaturas): cuadrado que contiene el muñeco y el material.
const boxCache = new Map();
export function viewBoxFor(def) {
  if (boxCache.has(def)) return boxCache.get(def);
  const pts = [];
  for (const t of [0, 0.5, 1]) {
    const sk = skeleton(def, lerpPose(def.poses[0], def.poses[1] ?? def.poses[0], t));
    if (sk.front) {
      for (const s of [sk.R, sk.Lft]) pts.push(s.s, s.h, s.elbow, s.hand, s.knee, s.ankle);
      pts.push([sk.head[0], sk.head[1] - L.head]);
    } else {
      pts.push(sk.hip, sk.shoulder, [sk.head[0] - L.head, sk.head[1] - L.head], [sk.head[0] + L.head, sk.head[1] + L.head]);
      for (const side of ["near", "far"]) {
        const s = sk[side];
        if (s.arm) pts.push(s.arm.elbow, s.arm.hand);
        pts.push(s.leg.knee, s.leg.ankle);
      }
    }
  }
  for (const pr of def.props ?? []) {
    if (pr.pts) pts.push(...pr.pts);
    if (pr.type === "bench") pts.push([pr.x1, pr.y], [pr.x2, pr.y]);
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys, def.noFloor ? -Infinity : FLOOR);
  const size = Math.max(maxX - minX, maxY - minY) + 28;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const vb = `${f1(cx - size / 2)} ${f1(cy - size / 2)} ${f1(size)} ${f1(size)}`;
  boxCache.set(def, vb);
  return vb;
}

// Curva de animación: va y vuelve, con una pequeña pausa en cada extremo.
export function phaseAt(ms, period = 2600) {
  const x = (ms % period) / period;
  const tri = x < 0.5 ? x * 2 : 2 - x * 2;
  const held = Math.min(1, Math.max(0, (tri - 0.1) / 0.8));
  return 0.5 - 0.5 * Math.cos(Math.PI * held);
}
