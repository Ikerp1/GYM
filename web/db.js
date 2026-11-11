// Conexión con Firebase: inicio de sesión con Google y base de datos (Firestore).
// Todo se guarda en users/{tu uid}/... ; las reglas de Firestore solo te dejan acceder a lo tuyo.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, arrayUnion, arrayRemove,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Caché local: la app funciona sin cobertura y sincroniza cuando vuelve la conexión.
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch {
  db = initializeFirestore(app, {});
}

export const watchUser = (cb) => onAuthStateChanged(auth, cb);
export const logout = () => signOut(auth);
export async function login() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    // Si el navegador bloquea la ventana emergente (pasa en algunos móviles), se usa redirección.
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
    } else {
      throw e;
    }
  }
}

// Firestore no admite "undefined": se limpia el objeto antes de guardar.
const clean = (data) => JSON.parse(JSON.stringify(data));

/** Escucha una colección del usuario. Devuelve la función para dejar de escuchar. */
export function watchCollection(uid, name, cb, onError) {
  return onSnapshot(
    collection(db, "users", uid, name),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err),
  );
}

export const saveDoc = (uid, name, id, data) => setDoc(doc(db, "users", uid, name, id), clean(data));
export const removeDoc = (uid, name, id) => deleteDoc(doc(db, "users", uid, name, id));
// ---------- Documentos sueltos (amigos) ----------
// path es una lista: ["shared", uid], ["codes", "K7M2QX"], ["users", uid, "meta", "profile"]...
/** Escucha un documento. cb(null) si no existe; onError si no tienes permiso para leerlo. */
export const watchDoc = (path, cb, onError) =>
  onSnapshot(doc(db, ...path), (s) => cb(s.exists() ? s.data() : null), (err) => onError?.(err));
export const readDoc = async (path) => { const s = await getDoc(doc(db, ...path)); return s.exists() ? s.data() : null; };
export const mergeDoc = (path, data) => setDoc(doc(db, ...path), clean(data), { merge: true });
export const addToList = (path, field, value) => setDoc(doc(db, ...path), { [field]: arrayUnion(value) }, { merge: true });
export const removeFromList = (path, field, value) => setDoc(doc(db, ...path), { [field]: arrayRemove(value) }, { merge: true });

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
