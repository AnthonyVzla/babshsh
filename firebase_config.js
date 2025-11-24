// Archivo: firebase_config.js
// Propósito: Inicializar Firebase y exportar las referencias a los servicios (Auth, Firestore).
// Nota: Usamos las importaciones modulares de CDN de Firebase 11.6.1.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- 1. CONFIGURACIÓN Y VARIABLES GLOBALES ---

// Carga la configuración de Firebase inyectada por el entorno de desarrollo.
// Si no existe, usaría un objeto vacío (pero en este entorno siempre existe).
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {};
    
// Obtiene el ID de la aplicación para construir rutas de Firestore.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- 2. INICIALIZACIÓN DE SERVICIOS ---

// Inicializa la aplicación principal de Firebase
const app = initializeApp(firebaseConfig);

// Inicializa y obtiene una referencia a la Base de Datos (Firestore)
export const db = getFirestore(app);

// Inicializa y obtiene una referencia al servicio de Autenticación
export const auth = getAuth(app);

// --- 3. GESTIÓN DE AUTENTICACIÓN INICIAL AUTOMÁTICA ---

/**
 * Función que gestiona la autenticación inicial. 
 * Intenta usar el token seguro del entorno; si falla o no está, usa Auth Anónima.
 */
async function initializeAuth() {
    // 1. Configurar la persistencia de la sesión: Mantiene la sesión mientras la pestaña esté abierta.
    await setPersistence(auth, browserSessionPersistence);

    // 2. Intentar autenticar con el token seguro del entorno
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (initialAuthToken) {
        try {
            // Intenta iniciar sesión con el token de seguridad del ambiente
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Autenticación inicial exitosa con Custom Token.");
        } catch (error) {
            console.error("Error al autenticar con Custom Token:", error);
            // Fallback: Iniciar sesión anónima si el token personalizado falla
            await signInAnonymously(auth);
            console.log("Autenticación anónima utilizada como fallback.");
        }
    } else {
        // No hay token de entorno, inicia sesión anónima
        await signInAnonymously(auth);
        console.log("Autenticación anónima exitosa (no token de entorno).");
    }
}

// Llama a la función para inicializar la autenticación
initializeAuth();


// --- 4. FUNCIÓN DE EJEMPLO DE FIRESTORE ---

/**
 * Función de ejemplo para agregar un artículo de menú a la base de datos.
 * Esta función puede ser importada y llamada desde cualquier otro archivo JS.
 */
export async function addMenuItem(name, price, description) {
    if (!auth.currentUser) {
        console.warn("Autenticación no lista. No se puede guardar sin usuario logueado.");
        return;
    }
    
    try {
        const userId = auth.currentUser.uid;
        // Definición de la ruta para los datos privados del usuario en Firestore:
        // artifacts/{appId}/users/{userId}/menu_items
        const collectionRef = collection(db, `artifacts/${appId}/users/${userId}/menu_items`);
        
        const docRef = await addDoc(collectionRef, {
            name: name,
            price: price,
            description: description,
            createdAt: new Date()
        });
        
        console.log("Artículo de menú agregado con ID: ", docRef.id);
        
    } catch (e) {
        console.error("Error al agregar documento: ", e);
    }
}

// Exportamos la app como referencia principal
export default app;