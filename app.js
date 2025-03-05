// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Configuración de Firebase (Usa tus valores correctos)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "diccionario-totonaco",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos del DOM
const buscador = document.getElementById('buscador');
const resultado = document.getElementById('resultado');

// Obtener palabras desde Firestore
async function obtenerPalabras() {
    const palabrasRef = collection(db, "palabras");
    const snapshot = await getDocs(palabrasRef);
    let palabras = [];

    snapshot.forEach((doc) => {
        const data = doc.data();

        // 🔥 Corregido: Extraer valores desde "fields" correctamente
        const espanol = data.espanol?.stringValue || "Sin dato";
        const totonaco = data.totonaco?.stringValue || "Sin dato";

        palabras.push({ espanol, totonaco });
    });

    console.log("✅ Palabras obtenidas correctamente:", palabras);

    // Evento para buscar palabras
    buscador.addEventListener('input', () => {
        const query = buscador.value.toLowerCase();
        resultado.innerHTML = '';

        palabras.forEach(palabra => {
            if (palabra.espanol.toLowerCase().includes(query) || palabra.totonaco.toLowerCase().includes(query)) {
                const item = document.createElement('li');
                item.textContent = `${palabra.espanol} - ${palabra.totonaco}`;
                resultado.appendChild(item);
            }
        });

        if (resultado.innerHTML === '') {
            const noResult = document.createElement('li');
            noResult.textContent = 'No se encontraron resultados';
            resultado.appendChild(noResult);
        }
    });
}

// Llamar a la función para obtener las palabras al cargar la página
obtenerPalabras();
