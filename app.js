// 📌 Importar Firebase Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, where, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 📌 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBlQkozFpUossaLTHycZgywkPqz4VjJSg8",
  authDomain: "diccionario-totonaco.firebaseapp.com",
  projectId: "diccionario-totonaco",
  storageBucket: "diccionario-totonaco.appspot.com",
  messagingSenderId: "134554353684",
  appId: "1:134554353684:web:1aac000b678f98ad1de701"
};

// 📌 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
const formulario = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");
const listaNoRevisadas = document.getElementById("listaNoRevisadas"); // Contenedor para palabras sin revisar

window.palabras = []; // Lista global de palabras aprobadas
window.palabrasNoRevisadas = []; // Lista de palabras sin revisar

// 📌 Función para obtener palabras aprobadas desde Firestore
async function obtenerPalabrasDesdeFirestore() {
    try {
        console.log("🔍 Obteniendo palabras aprobadas desde Firestore...");
        const consulta = query(collection(db, "palabras"), where("revisado", "==", true)); // Solo palabras revisadas
        const querySnapshot = await getDocs(consulta);

        window.palabras = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log("✅ Palabras aprobadas obtenidas:", window.palabras);
    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
    }
}

// 📌 Función para obtener palabras NO revisadas desde Firestore
async function obtenerPalabrasNoRevisadas() {
    try {
        console.log("🔍 Obteniendo palabras NO revisadas...");
        const consulta = query(collection(db, "palabras"), where("revisado", "==", false));
        const querySnapshot = await getDocs(consulta);

        window.palabrasNoRevisadas = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log("⚠️ Palabras NO revisadas obtenidas:", window.palabrasNoRevisadas);
        actualizarListaNoRevisadas();
    } catch (error) {
        console.error("❌ Error al obtener palabras NO revisadas:", error);
    }
}

// 📌 Función para actualizar la lista de palabras sin revisar
function actualizarListaNoRevisadas() {
    listaNoRevisadas.innerHTML = "";
    if (window.palabrasNoRevisadas.length === 0) {
        listaNoRevisadas.innerHTML = "<p>No hay palabras pendientes de revisión.</p>";
        return;
    }

    window.palabrasNoRevisadas.forEach(palabra => {
        const item = document.createElement("li");
        item.innerHTML = `
            <strong>${palabra.espanol}</strong> - ${palabra.totonaco}
            <button onclick="aprobarPalabra('${palabra.id}')">✅ Aprobar</button>
            <button onclick="eliminarPalabra('${palabra.id}')">❌ Eliminar</button>
        `;
        listaNoRevisadas.appendChild(item);
    });
}

// 📌 Función para aprobar una palabra
async function aprobarPalabra(id) {
    try {
        const palabraRef = doc(db, "palabras", id);
        await updateDoc(palabraRef, { revisado: true });
        console.log(`✅ Palabra aprobada: ${id}`);
        obtenerPalabrasDesdeFirestore();
        obtenerPalabrasNoRevisadas();
    } catch (error) {
        console.error("❌ Error al aprobar la palabra:", error);
    }
}

// 📌 Función para eliminar una palabra
async function eliminarPalabra(id) {
    try {
        const palabraRef = doc(db, "palabras", id);
        await deleteDoc(palabraRef);
        console.log(`🗑️ Palabra eliminada: ${id}`);
        obtenerPalabrasNoRevisadas();
    } catch (error) {
        console.error("❌ Error al eliminar la palabra:", error);
    }
}

// 📌 Función para buscar palabras exactas
function filtrarPalabras() {
    const termino = buscador.value.toLowerCase().trim();
    resultado.innerHTML = "";

    if (termino === "") return;

    const filtradas = window.palabras.filter(palabra => 
        palabra.espanol.toLowerCase() === termino || 
        palabra.totonaco.toLowerCase() === termino
    );

    if (filtradas.length > 0) {
        const palabra = filtradas[0];
        const item = document.createElement("li");
        item.innerHTML = `<strong>${palabra.espanol}</strong> - ${palabra.totonaco}`;
        resultado.appendChild(item);
    } else {
        resultado.innerHTML = "<li>No se encontró la palabra exacta</li>";
    }
}

// 📌 Función para agregar nuevas palabras evitando duplicados
formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nuevoEspanol = document.getElementById("nuevoEspanol").value.trim();
    const nuevoTotonaco = document.getElementById("nuevoTotonaco").value.trim();
    const colaborador = document.getElementById("colaborador").value.trim() || "Anónimo";

    if (!nuevoEspanol || !nuevoTotonaco) {
        mensaje.textContent = "❌ Por favor, completa todos los campos.";
        return;
    }

    // 📌 Comprobar si la palabra ya existe en la base de datos
    const consulta = query(collection(db, "palabras"), where("espanol", "==", nuevoEspanol.toLowerCase()));
    const resultado = await getDocs(consulta);

    if (!resultado.empty) {
        mensaje.textContent = "⚠️ La palabra ya existe en la base de datos.";
        return;
    }

    try {
        await addDoc(collection(db, "palabras"), {
            espanol: nuevoEspanol,
            totonaco: nuevoTotonaco,
            colaborador: colaborador,
            revisado: false  // 📌 Agregar estado de revisión
        });

        console.log("✅ Palabra agregada correctamente.");
        mensaje.textContent = "✅ Palabra enviada correctamente. Aún debe ser revisada.";
        formulario.reset();

        // 🔄 Actualizar la lista sin recargar la página
        obtenerPalabrasNoRevisadas();
    } catch (error) {
        console.error("❌ Error al enviar la palabra:", error);
        mensaje.textContent = "❌ Error al enviar la palabra.";
    }
});

// 📌 Cargar palabras al inicio
window.onload = () => {
    obtenerPalabrasDesdeFirestore();
    obtenerPalabrasNoRevisadas();
};
buscador.addEventListener("input", () => setTimeout(() => filtrarPalabras(), 300));

          
