// Posturas de cada ejercicio para las siluetas animadas (ver figure-engine.js).
// Cada ejercicio: poses [inicio, final] + material (props). El muñeco mira a la derecha; suelo en y = 160.
// Campos de postura: hip [x,y], torso (ángulo), hand/foot [x,y] (lado cercano), hand2/foot2 (lado lejano),
// handRel [dx,dy] (mano relativa al hombro), elbowHint/kneeHint (hacia dónde dobla), elbow/knee (posición fija).

const FLAT_BENCH = { type: "bench", x1: 46, x2: 150, y: 118 };
const SEAT = { type: "bench", x1: 62, x2: 112, y: 120 };
const BACKREST = { type: "shape", pts: [[62, 120], [70, 120], [70, 50], [62, 50]] };
const STAND = { hip: [96, 84], torso: -90, foot: [100, 160] };

// Postura tumbado en banco plano (press, aperturas, press francés).
const lying = (hand, extra = {}) => ({ hip: [82, 108], torso: 0, headTilt: 0, foot: [50, 158], kneeHint: [44, 100], footAng: -10, hand, elbowHint: [118, 140], footOff: [-6, 0], ...extra });
// Banco inclinado.
const INCLINE = { type: "shape", pts: [[66, 126], [80, 126], [130, 76], [120, 70]] };
const INCLINE_SEAT = { type: "bench", x1: 52, x2: 96, y: 124 };
const inclined = (hand, extra = {}) => ({ hip: [78, 116], torso: -42, foot: [40, 158], kneeHint: [34, 104], footAng: 180, hand, elbowHint: [96, 116], ...extra });
// Sentado erguido.
const seated = (extra = {}) => ({ hip: [80, 114], torso: -90, foot: [120, 158], kneeHint: [130, 100], ...extra });

export const FIGURES = {
  // ---------- Pecho ----------
  "press-banca": { props: [FLAT_BENCH, { type: "barbell" }], poses: [lying([130, 56]), lying([124, 98])] },
  "press-inclinado-barra": { props: [INCLINE, INCLINE_SEAT, { type: "barbell" }], poses: [inclined([116, 26]), inclined([108, 74])] },
  "press-banca-mancuernas": { props: [FLAT_BENCH, { type: "dumbbell" }], poses: [lying([130, 56]), lying([128, 104])] },
  "press-inclinado-mancuernas": { props: [INCLINE, INCLINE_SEAT, { type: "dumbbell" }], poses: [inclined([116, 26]), inclined([112, 80])] },
  "press-pecho-maquina": { props: [SEAT, BACKREST, { type: "handle" }, { type: "lever", pivot: [66, 30] }], poses: [seated({ hand: [100, 66], elbowHint: [70, 80] }), seated({ hand: [132, 66], elbowHint: [100, 90] })] },
  "aperturas-mancuernas": { props: [FLAT_BENCH, { type: "dumbbell" }], poses: [lying([130, 58], { elbowHint: [150, 70] }), lying([146, 112], { elbowHint: [150, 140] })] },
  "cruce-poleas": {
    props: [{ type: "line", pts: [[40, 160], [40, -16]] }, { type: "cable", to: [44, -10] }],
    poses: [{ hip: [96, 84], torso: -78, foot: [112, 160], foot2: [80, 160], hand: [116, 32], elbowHint: [96, 50] }, { hip: [96, 84], torso: -78, foot: [112, 160], foot2: [80, 160], hand: [136, 82], elbowHint: [120, 60] }],
  },
  "contractora": {
    front: true,
    props: [{ type: "shape", pts: [[70, 112], [130, 112], [130, 120], [70, 120]] }, { type: "shape", pts: [[84, 30], [116, 30], [116, 112], [84, 112]] }, { type: "handle", at: "hand" }, { type: "handle", at: "hand2" }],
    poses: [{ hip: [100, 108], foot: [114, 158], knee: [114, 116], hand: [146, 34], elbow: [142, 62] }, { hip: [100, 108], foot: [114, 158], knee: [114, 116], hand: [108, 34], elbow: [112, 62] }],
  },
  "fondos": {
    props: [{ type: "line", pts: [[104, 72], [104, 160]], w: 5 }, { type: "handle", at: [104, 70] }],
    poses: [{ hip: [100, 72], torso: -86, knee: [106, 108], foot: [72, 114], footAng: 170, hand: [104, 70], elbowHint: [80, 70], handOff: [0, 0] }, { hip: [102, 100], torso: -76, knee: [110, 134], foot: [76, 140], footAng: 170, hand: [104, 70], elbowHint: [70, 70], handOff: [0, 0] }],
  },
  "flexiones": {
    poses: [{ hip: [90, 125], torso: -22, foot: [20, 156], kneeHint: [55, 150], footAng: 50, hand: [138, 158], elbowHint: [120, 140], handOff: [0, 0] }, { hip: [84, 146], torso: -10, foot: [10, 158], kneeHint: [47, 160], footAng: 50, hand: [138, 158], elbowHint: [110, 120], handOff: [0, 0] }],
  },

  // ---------- Espalda ----------
  "dominadas": {
    props: [{ type: "line", pts: [[70, -16], [140, -16]], w: 5 }],
    noFloor: true,
    poses: [{ hip: [100, 106], torso: -90, foot: [78, 166], kneeHint: [110, 140], hand: [102, -16], elbowHint: [120, 20], handOff: [0, 0] }, { hip: [96, 62], torso: -90, foot: [74, 124], kneeHint: [110, 96], hand: [102, -16], elbowHint: [130, 20], handOff: [0, 0] }],
  },
  "jalon-pecho": {
    props: [SEAT, { type: "shape", pts: [[104, 96], [118, 96], [118, 104], [104, 104]] }, { type: "cable", to: [96, -20] }, { type: "line", pts: [[78, -6], [110, -6]], w: 3 }],
    poses: [{ ...seated({ torso: -100 }), hand: [94, -4], elbowHint: [120, 20], handOff: [0, 0] }, { ...seated({ torso: -100 }), hand: [98, 46], elbowHint: [70, 80], handOff: [0, 0] }],
  },
  "remo-barra": { props: [{ type: "barbell" }], poses: [{ hip: [76, 86], torso: -22, foot: [98, 160], kneeHint: [120, 110], hand: [126, 120], elbowHint: [140, 100] }, { hip: [76, 86], torso: -22, foot: [98, 160], kneeHint: [120, 110], hand: [104, 96], elbowHint: [90, 50] }] },
  "remo-mancuerna": {
    props: [{ type: "bench", x1: 96, x2: 170, y: 110 }, { type: "dumbbell" }],
    poses: [{ hip: [88, 92], torso: -8, foot: [70, 160], kneeHint: [100, 120], foot2: [146, 108], kneeHint2: [110, 112], hand: [132, 132], hand2: [150, 110], elbowHint: [150, 120] }, { hip: [88, 92], torso: -8, foot: [70, 160], kneeHint: [100, 120], foot2: [146, 108], kneeHint2: [110, 112], hand: [112, 100], hand2: [150, 110], elbowHint: [100, 50] }],
  },
  "remo-polea-baja": {
    props: [{ type: "bench", x1: 40, x2: 110, y: 130, h: 5 }, { type: "shape", pts: [[150, 132], [156, 132], [156, 160], [150, 160]] }, { type: "cable", to: [176, 132] }],
    poses: [{ hip: [72, 126], torso: -55, foot: [148, 140], kneeHint: [110, 110], footAng: -70, hand: [146, 118], elbowHint: [120, 140], handOff: [0, 0] }, { hip: [72, 126], torso: -95, foot: [148, 140], kneeHint: [110, 110], footAng: -70, hand: [92, 104], elbowHint: [50, 100], handOff: [0, 0] }],
  },
  "remo-maquina": {
    props: [SEAT, { type: "shape", pts: [[118, 60], [126, 60], [126, 100], [118, 100]] }, { type: "handle" }, { type: "lever", pivot: [150, 160] }],
    poses: [seated({ torso: -86, hand: [140, 76], elbowHint: [130, 100] }), seated({ torso: -92, hand: [100, 80], elbowHint: [60, 90] })],
  },
  "remo-t": {
    props: [{ type: "lever", pivot: [180, 158] }, { type: "barbell", off: [8, 0], r: 11 }],
    poses: [{ hip: [74, 88], torso: -28, foot: [96, 160], kneeHint: [118, 112], hand: [124, 126], elbowHint: [140, 100], handOff: [0, 0] }, { hip: [74, 88], torso: -28, foot: [96, 160], kneeHint: [118, 112], hand: [106, 100], elbowHint: [86, 60], handOff: [0, 0] }],
  },
  "pullover-polea": {
    props: [{ type: "line", pts: [[176, 160], [176, -16]] }, { type: "cable", to: [172, -8] }],
    poses: [{ hip: [86, 84], torso: -66, foot: [100, 160], kneeHint: [130, 110], hand: [146, 6], elbowHint: [130, 0] }, { hip: [86, 84], torso: -66, foot: [100, 160], kneeHint: [130, 110], hand: [118, 92], elbowHint: [130, 60] }],
  },
  "peso-muerto": { thumb: 0, props: [{ type: "barbell" }], poses: [{ hip: [72, 106], torso: -22, foot: [100, 160], kneeHint: [130, 110], hand: [116, 146], elbowHint: [140, 120] }, { ...STAND, hand: [98, 88], elbowHint: [110, 70] }] },

  // ---------- Hombro ----------
  "press-militar": { props: [{ type: "barbell" }], poses: [{ ...STAND, hand: [108, 30], elbowHint: [120, 60] }, { ...STAND, hand: [98, -20], elbowHint: [120, 0] }] },
  "press-hombro-mancuernas": { props: [SEAT, BACKREST, { type: "dumbbell" }], poses: [seated({ hand: [92, 28], elbowHint: [96, 70] }), seated({ hand: [84, -22], elbowHint: [100, 0] })] },
  "press-hombro-maquina": { props: [SEAT, BACKREST, { type: "handle" }, { type: "lever", pivot: [130, 70] }], poses: [seated({ hand: [92, 30], elbowHint: [100, 70] }), seated({ hand: [86, -20], elbowHint: [100, 0] })] },
  "elevaciones-laterales": { front: true, props: [{ type: "dumbbell", at: "hand" }, { type: "dumbbell", at: "hand2" }], poses: [{ hip: [100, 84], foot: [110, 160], hand: [118, 88], elbowHint: [130, 60] }, { hip: [100, 84], foot: [110, 160], hand: [164, 30], elbowHint: [140, 20] }] },
  "elevaciones-laterales-polea": { front: true, props: [{ type: "line", pts: [[30, 160], [30, 140]] }, { type: "cable", to: [34, 142] }, { type: "handle", at: "hand" }], poses: [{ hip: [100, 84], foot: [110, 160], hand: [96, 92], elbowHint: [130, 60] }, { hip: [100, 84], foot: [110, 160], hand: [164, 30], elbowHint: [140, 20] }] },
  "elevaciones-frontales": { props: [{ type: "dumbbell" }], poses: [{ ...STAND, hand: [104, 88], elbowHint: [130, 60] }, { ...STAND, hand: [150, 30], elbowHint: [130, 20] }] },
  "pajaros": { front: true, props: [{ type: "dumbbell", at: "hand" }, { type: "dumbbell", at: "hand2" }], poses: [{ hip: [100, 86], torsoScale: 0.55, foot: [111, 160], kneeHint: [116, 120], hand: [110, 110], elbowHint: [140, 90] }, { hip: [100, 86], torsoScale: 0.55, foot: [111, 160], kneeHint: [116, 120], hand: [160, 64], elbowHint: [140, 50] }] },
  "face-pull": {
    props: [{ type: "line", pts: [[178, 160], [178, -16]] }, { type: "cable", to: [174, 20] }],
    poses: [{ ...STAND, foot: [104, 160], hand: [150, 30], elbowHint: [120, 50] }, { ...STAND, foot: [104, 160], hand: [116, 10], elbowHint: [90, 10] }],
  },
  "encogimientos": { front: true, props: [{ type: "dumbbell", at: "hand" }, { type: "dumbbell", at: "hand2" }], poses: [{ hip: [100, 84], foot: [110, 160], hand: [124, 90], elbowHint: [140, 60] }, { hip: [100, 84], foot: [110, 160], hand: [124, 82], elbowHint: [140, 50], shrug: -9 }] },

  // ---------- Bíceps ----------
  "curl-barra": { props: [{ type: "barbell" }], poses: [{ ...STAND, hand: [104, 88], elbowHint: [90, 70] }, { ...STAND, hand: [112, 38], elbowHint: [90, 70] }] },
  "curl-mancuernas": { props: [{ type: "dumbbell" }], poses: [{ ...STAND, hand: [102, 88], elbowHint: [90, 70] }, { ...STAND, hand: [112, 38], elbowHint: [90, 70] }] },
  "curl-martillo": { props: [{ type: "dumbbell", r: 5.5 }], poses: [{ ...STAND, hand: [102, 88], elbowHint: [90, 70] }, { ...STAND, hand: [114, 40], elbowHint: [90, 70] }] },
  "curl-predicador": {
    props: [SEAT, { type: "shape", pts: [[96, 66], [104, 60], [134, 94], [126, 100]] }, { type: "barbell", r: 11 }],
    poses: [seated({ torso: -84, hand: [136, 112], elbow: [118, 92] }), seated({ torso: -84, hand: [106, 62], elbow: [118, 92] })],
  },
  "curl-polea": {
    props: [{ type: "line", pts: [[170, 160], [170, 130]] }, { type: "cable", to: [166, 150] }],
    poses: [{ ...STAND, hand: [104, 88], elbowHint: [90, 70] }, { ...STAND, hand: [112, 38], elbowHint: [90, 70] }],
  },

  // ---------- Tríceps ----------
  "extension-triceps-polea": {
    props: [{ type: "line", pts: [[140, 160], [140, -20]] }, { type: "cable", to: [136, -14] }],
    poses: [{ hip: [96, 84], torso: -84, foot: [100, 160], hand: [120, 40], elbowHint: [96, 70] }, { hip: [96, 84], torso: -84, foot: [100, 160], hand: [114, 88], elbowHint: [96, 70] }],
  },
  "press-frances": { props: [FLAT_BENCH, { type: "barbell", r: 11 }], poses: [lying([130, 56], { elbowHint: [140, 60] }), lying([152, 92], { elbowHint: [124, 70] })] },
  "extension-triceps-cabeza": { props: [{ type: "dumbbell" }], poses: [{ ...STAND, hand: [84, 22], elbowHint: [110, 0], handOff: [0, 0] }, { ...STAND, hand: [100, -20], elbowHint: [110, 0], handOff: [0, 0] }] },
  "press-banca-cerrado": { props: [FLAT_BENCH, { type: "barbell" }], poses: [lying([130, 56], { elbowHint: [110, 120] }), lying([120, 98], { elbowHint: [100, 140] })] },
  "patada-triceps": {
    props: [{ type: "dumbbell" }],
    poses: [{ hip: [80, 88], torso: -18, foot: [100, 160], kneeHint: [130, 112], hand: [112, 106], elbow: [104, 80] }, { hip: [80, 88], torso: -18, foot: [100, 160], kneeHint: [130, 112], hand: [80, 86], elbow: [104, 80] }],
  },

  // ---------- Pierna ----------
  "sentadilla": { props: [{ type: "barbell", at: "shoulder", off: [-2, -2] }], poses: [{ ...STAND, handRel: [4, 4], elbowHint: [80, 60] }, { hip: [68, 122], torso: -56, foot: [100, 160], kneeHint: [130, 110], handRel: [4, 4], elbowHint: [60, 100] }] },
  "sentadilla-frontal": { props: [{ type: "barbell", at: "shoulder", off: [10, 0] }], poses: [{ ...STAND, handRel: [12, 2], elbowHint: [130, 40] }, { hip: [70, 124], torso: -68, foot: [100, 160], kneeHint: [130, 110], handRel: [12, 2], elbowHint: [130, 90] }] },
  "sentadilla-hack": {
    props: [{ type: "shape", pts: [[40, 150], [50, 150], [96, 8], [86, 8]] }, { type: "shape", pts: [[100, 154], [150, 150], [150, 160], [100, 160]] }],
    poses: [{ hip: [80, 82], torso: -72, foot: [122, 150], kneeHint: [140, 110], handRel: [2, 6], elbowHint: [70, 60] }, { hip: [62, 124], torso: -72, foot: [122, 150], kneeHint: [140, 110], handRel: [2, 6], elbowHint: [50, 110] }],
  },
  "prensa": {
    props: [{ type: "relline", at: "foot", a: [-4, -16], b: [16, 4], w: 6 }, { type: "shape", pts: [[40, 130], [90, 130], [90, 136], [40, 136]] }, { type: "shape", pts: [[30, 132], [40, 132], [72, 80], [62, 76]] }],
    poses: [{ hip: [76, 126], torso: -128, foot: [146, 62], kneeHint: [120, 120], footAng: -45, hand: [82, 134], elbowHint: [60, 120], handOff: [0, 0] }, { hip: [76, 126], torso: -128, foot: [116, 84], kneeHint: [110, 40], footAng: -45, hand: [82, 134], elbowHint: [60, 120], handOff: [0, 0] }],
  },
  "extension-cuadriceps": { props: [SEAT, BACKREST, { type: "pad", at: "foot", off: [2, -4] }], poses: [seated({ foot: [120, 152], hand: [96, 118], footOff: [0, 0] }), seated({ foot: [156, 116], hand: [96, 118], footOff: [0, 0] })] },
  "zancadas": {
    props: [{ type: "dumbbell" }],
    poses: [{ hip: [96, 84], torso: -90, foot: [104, 160], foot2: [92, 160], kneeHint2: [130, 110], hand: [98, 90], handOff: [0, 0] }, { hip: [92, 118], torso: -88, foot: [128, 160], foot2: [54, 158], kneeHint: [140, 110], kneeHint2: [70, 160], footAng2: 30, hand: [94, 124], handOff: [0, 0] }],
  },
  "sentadilla-bulgara": {
    props: [{ type: "bench", x1: 20, x2: 58, y: 118 }, { type: "dumbbell" }],
    poses: [{ hip: [96, 86], torso: -88, foot: [118, 160], foot2: [44, 114], kneeHint2: [80, 130], footAng2: 160, hand: [98, 92], handOff: [0, 0] }, { hip: [86, 120], torso: -80, foot: [118, 160], foot2: [44, 114], kneeHint: [140, 110], kneeHint2: [70, 160], footAng2: 160, hand: [94, 126], handOff: [0, 0] }],
  },
  "sentadilla-goblet": { props: [{ type: "kettlebell", off: [2, 4] }], poses: [{ ...STAND, handRel: [14, 18], elbowHint: [100, 70] }, { hip: [70, 124], torso: -66, foot: [100, 160], kneeHint: [130, 110], handRel: [14, 18], elbowHint: [100, 110] }] },

  // ---------- Femoral ----------
  "peso-muerto-rumano": { props: [{ type: "barbell" }], poses: [{ ...STAND, hand: [98, 88], elbowHint: [110, 70] }, { hip: [68, 88], torso: -14, foot: [100, 160], kneeHint: [120, 110], hand: [118, 128], elbowHint: [130, 110] }] },
  "curl-femoral-tumbado": {
    props: [{ type: "bench", x1: 30, x2: 150, y: 114 }, { type: "pad", at: "foot", off: [0, -6] }],
    poses: [{ hip: [100, 106], torso: 180, foot: [174, 106], kneeHint: [140, 120], footAng: 90, hand: [34, 120], elbowHint: [50, 130], footOff: [0, 2] }, { hip: [100, 106], torso: 180, foot: [128, 62], kneeHint: [150, 120], footAng: 0, hand: [34, 120], elbowHint: [50, 130], footOff: [0, 2] }],
  },
  "curl-femoral-sentado": { props: [SEAT, BACKREST, { type: "pad", at: "foot", off: [2, -6] }], poses: [seated({ foot: [156, 114], hand: [96, 118], footOff: [0, 0] }), seated({ foot: [112, 150], hand: [96, 118], footOff: [0, 0] })] },

  // ---------- Glúteo ----------
  "hip-thrust": {
    props: [{ type: "bench", x1: 20, x2: 66, y: 112 }, { type: "barbell", at: "hip", off: [2, -12] }],
    poses: [{ hip: [100, 140], torso: -145, foot: [140, 158], kneeHint: [140, 100], hand: [104, 126], elbowHint: [80, 120] }, { hip: [104, 104], torso: 178, foot: [140, 158], kneeHint: [140, 100], hand: [106, 90], elbowHint: [80, 100] }],
  },
  "abductores": {
    front: true,
    props: [{ type: "shape", pts: [[70, 112], [130, 112], [130, 120], [70, 120]] }],
    poses: [{ hip: [100, 108], foot: [112, 158], knee: [112, 116], hand: [120, 112], elbowHint: [130, 90] }, { hip: [100, 108], foot: [132, 158], knee: [138, 114], hand: [120, 112], elbowHint: [130, 90] }],
  },
  "patada-gluteo-polea": {
    props: [{ type: "line", pts: [[150, 160], [150, 40]] }, { type: "cable", from: "foot", to: [146, 152] }],
    poses: [{ hip: [96, 84], torso: -74, foot: [96, 160], foot2: [104, 160], hand: [146, 60], handOff: [0, 2] }, { hip: [96, 84], torso: -74, foot: [40, 126], kneeHint: [60, 120], foot2: [104, 160], hand: [146, 60], handOff: [0, 2] }],
  },

  // ---------- Gemelo ----------
  "gemelo-pie": {
    props: [{ type: "shape", pts: [[96, 150], [140, 150], [140, 160], [96, 160]] }, { type: "dumbbell", off: [0, 4] }],
    poses: [{ hip: [96, 76], torso: -90, foot: [96, 152], footAng: 10, footOff: [-4, 0], hand: [98, 84] }, { hip: [96, 66], torso: -90, foot: [96, 142], footAng: 40, footOff: [-4, 0], hand: [98, 74] }],
  },
  "gemelo-sentado": {
    props: [SEAT, { type: "shape", pts: [[104, 100], [130, 100], [130, 106], [104, 106]] }, { type: "shape", pts: [[110, 150], [140, 150], [140, 160], [110, 160]] }],
    poses: [seated({ foot: [118, 152], knee: [118, 114], footAng: 10, hand: [116, 102] }), seated({ hip: [80, 106], foot: [118, 142], knee: [118, 106], footAng: 40, hand: [116, 94] })],
  },

  // ---------- Core ----------
  "plancha": {
    poses: [{ hip: [84, 136], torso: -11, foot: [10, 152], kneeHint: [40, 160], footAng: 60, hand: [152, 156], elbow: [132, 156] }, { hip: [84, 133], torso: -12, foot: [10, 152], kneeHint: [40, 160], footAng: 60, hand: [152, 156], elbow: [132, 156] }],
  },
  "crunch-polea": {
    props: [{ type: "line", pts: [[176, 160], [176, -20]] }, { type: "cable", to: [172, -14] }],
    poses: [{ hip: [86, 110], torso: -84, knee: [100, 156], foot: [60, 158], footAng: 180, handRel: [8, -8], elbowHint: [110, 20] }, { hip: [86, 110], torso: 14, knee: [100, 156], foot: [60, 158], footAng: 180, handRel: [10, -8], elbowHint: [140, 80] }],
  },
  "elevacion-piernas": {
    props: [{ type: "line", pts: [[70, -16], [140, -16]], w: 5 }],
    noFloor: true,
    poses: [{ hip: [100, 88], torso: -90, foot: [102, 164], kneeHint: [120, 130], hand: [102, -16], elbowHint: [120, 20], handOff: [0, 0] }, { hip: [100, 88], torso: -90, foot: [176, 86], kneeHint: [140, 70], hand: [102, -16], elbowHint: [120, 20], handOff: [0, 0] }],
  },
  "rueda-abdominal": {
    props: [{ type: "wheel" }],
    poses: [{ hip: [76, 116], torso: -30, knee: [70, 156], foot: [40, 158], footAng: 180, hand: [120, 146], elbowHint: [140, 120], handOff: [0, 0] }, { hip: [90, 134], torso: -8, knee: [70, 156], foot: [40, 158], footAng: 180, hand: [188, 140], elbowHint: [170, 120], handOff: [0, 0] }],
  },
};
