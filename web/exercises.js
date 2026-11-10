// Biblioteca de ejercicios incluida en la app.
// Los ejercicios que crees tú se guardan en Firebase (users/{uid}/exercises) y se suman a esta lista.
// No cambies los "id": tus entrenamientos guardados los usan para saber qué ejercicio es cada uno.

export const GROUPS = ["Pecho", "Espalda", "Hombro", "Bíceps", "Tríceps", "Pierna", "Femoral", "Glúteo", "Gemelo", "Core"];

export const BUILTIN_EXERCISES = [
  // Pecho
  { id: "press-banca", name: "Press banca", group: "Pecho" },
  { id: "press-inclinado-barra", name: "Press inclinado con barra", group: "Pecho" },
  { id: "press-banca-mancuernas", name: "Press banca con mancuernas", group: "Pecho" },
  { id: "press-inclinado-mancuernas", name: "Press inclinado con mancuernas", group: "Pecho" },
  { id: "press-pecho-maquina", name: "Press de pecho en máquina", group: "Pecho" },
  { id: "aperturas-mancuernas", name: "Aperturas con mancuernas", group: "Pecho" },
  { id: "cruce-poleas", name: "Cruce de poleas", group: "Pecho" },
  { id: "contractora", name: "Contractora (pec deck)", group: "Pecho" },
  { id: "fondos", name: "Fondos", group: "Pecho" },
  { id: "flexiones", name: "Flexiones", group: "Pecho" },
  // Espalda
  { id: "dominadas", name: "Dominadas", group: "Espalda" },
  { id: "jalon-pecho", name: "Jalón al pecho", group: "Espalda" },
  { id: "remo-barra", name: "Remo con barra", group: "Espalda" },
  { id: "remo-mancuerna", name: "Remo con mancuerna", group: "Espalda" },
  { id: "remo-polea-baja", name: "Remo en polea baja", group: "Espalda" },
  { id: "remo-maquina", name: "Remo en máquina", group: "Espalda" },
  { id: "remo-t", name: "Remo en T", group: "Espalda" },
  { id: "pullover-polea", name: "Pullover en polea", group: "Espalda" },
  { id: "peso-muerto", name: "Peso muerto", group: "Espalda" },
  // Hombro
  { id: "press-militar", name: "Press militar", group: "Hombro" },
  { id: "press-hombro-mancuernas", name: "Press de hombro con mancuernas", group: "Hombro" },
  { id: "press-hombro-maquina", name: "Press de hombro en máquina", group: "Hombro" },
  { id: "elevaciones-laterales", name: "Elevaciones laterales", group: "Hombro" },
  { id: "elevaciones-laterales-polea", name: "Elevaciones laterales en polea", group: "Hombro" },
  { id: "elevaciones-frontales", name: "Elevaciones frontales", group: "Hombro" },
  { id: "pajaros", name: "Pájaros (deltoide posterior)", group: "Hombro" },
  { id: "face-pull", name: "Face pull", group: "Hombro" },
  { id: "encogimientos", name: "Encogimientos (trapecio)", group: "Hombro" },
  // Bíceps
  { id: "curl-barra", name: "Curl con barra", group: "Bíceps" },
  { id: "curl-mancuernas", name: "Curl con mancuernas", group: "Bíceps" },
  { id: "curl-martillo", name: "Curl martillo", group: "Bíceps" },
  { id: "curl-predicador", name: "Curl predicador", group: "Bíceps" },
  { id: "curl-polea", name: "Curl en polea", group: "Bíceps" },
  // Tríceps
  { id: "extension-triceps-polea", name: "Extensión de tríceps en polea", group: "Tríceps" },
  { id: "press-frances", name: "Press francés", group: "Tríceps" },
  { id: "extension-triceps-cabeza", name: "Extensión de tríceps sobre la cabeza", group: "Tríceps" },
  { id: "press-banca-cerrado", name: "Press banca agarre cerrado", group: "Tríceps" },
  { id: "patada-triceps", name: "Patada de tríceps", group: "Tríceps" },
  // Pierna
  { id: "sentadilla", name: "Sentadilla", group: "Pierna" },
  { id: "sentadilla-frontal", name: "Sentadilla frontal", group: "Pierna" },
  { id: "sentadilla-hack", name: "Sentadilla hack", group: "Pierna" },
  { id: "prensa", name: "Prensa", group: "Pierna" },
  { id: "extension-cuadriceps", name: "Extensión de cuádriceps", group: "Pierna" },
  { id: "zancadas", name: "Zancadas", group: "Pierna" },
  { id: "sentadilla-bulgara", name: "Sentadilla búlgara", group: "Pierna" },
  { id: "sentadilla-goblet", name: "Sentadilla goblet", group: "Pierna" },
  // Femoral
  { id: "peso-muerto-rumano", name: "Peso muerto rumano", group: "Femoral" },
  { id: "curl-femoral-tumbado", name: "Curl femoral tumbado", group: "Femoral" },
  { id: "curl-femoral-sentado", name: "Curl femoral sentado", group: "Femoral" },
  // Glúteo
  { id: "hip-thrust", name: "Hip thrust", group: "Glúteo" },
  { id: "abductores", name: "Abductores en máquina", group: "Glúteo" },
  { id: "patada-gluteo-polea", name: "Patada de glúteo en polea", group: "Glúteo" },
  // Gemelo
  { id: "gemelo-pie", name: "Elevación de gemelos de pie", group: "Gemelo" },
  { id: "gemelo-sentado", name: "Elevación de gemelos sentado", group: "Gemelo" },
  // Core
  { id: "plancha", name: "Plancha", group: "Core" },
  { id: "crunch-polea", name: "Crunch en polea", group: "Core" },
  { id: "elevacion-piernas", name: "Elevación de piernas colgado", group: "Core" },
  { id: "rueda-abdominal", name: "Rueda abdominal", group: "Core" },
];
