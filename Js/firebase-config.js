// Js/firebase-config.js
// Contiene las credenciales de tu proyecto Firebase "maldito-cafe"
// Estas credenciales las copiaste de la Consola de Firebase.

const firebaseConfig = {
  apiKey: "AIzaSyCTDpEKDnXkmsSjgaNivpOx2pLsGgLUX1U",
  authDomain: "menu-tamplate-d5622.firebaseapp.com",
  projectId: "menu-tamplate-d5622",
  storageBucket: "menu-tamplate-d5622.firebasestorage.app",
  messagingSenderId: "229910792827",
  appId: "1:229910792827:web:319d6596c60f844a3570de",
  measurementId: "G-XWX5LGWEJ3"
};

// Inicializa Firebase usando la API de compatibilidad (ya que tu HTML carga los SDK compat)
const app = firebase.initializeApp(firebaseConfig);

// Obtiene una referencia a la instancia de Cloud Firestore usando la API de compatibilidad
const db = firebase.firestore();

// Opcional: Para depuración, puedes ver si db se inicializa correctamente
console.log("Firestore inicializado en firebase-config.js. Instancia db:", db);

// Si también quieres Analytics, puedes usarlo así con el SDK compat:
// const analytics = firebase.analytics();
