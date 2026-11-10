// Conexión con Firebase: inicio de sesión con Google y base de datos (Firestore).
// Todo se guarda en users/{tu uid}/... ; las reglas de Firestore solo te dejan acceder a lo tuyo.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, deleteDoc, onSnapshot,
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
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
