<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diccionario Español - Totonaco</title>

    <!-- 🔥 Agregar Firebase desde el CDN oficial -->
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js"></script>

    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
        input, button { margin: 5px; padding: 8px; }
        ul { list-style: none; padding: 0; }
        li { padding: 5px; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>

    <h1>Diccionario Español - Totonaco</h1>

    <!-- 📌 Campo de búsqueda -->
    <input type="text" id="buscador" placeholder="Escribe una palabra...">
    <ul id="resultado"></ul>

    <!-- 📌 Formulario para agregar palabras -->
    <form id="formulario">
        <input type="text" id="nuevoEspanol" placeholder="Palabra en Español" required>
        <input type="text" id="nuevoTotonaco" placeholder="Palabra en Totonaco" required>
        <button type="submit">Agregar Palabra</button>
        <p id="mensaje"></p>
    </form>

    <script>
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
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();

        console.log("✅ Firebase ha sido inicializado correctamente.");

        // 📌 Elementos del DOM
        const buscador = document.getElementById("buscador");
        const resultado = document.getElementById("resultado");
        const formulario = document.getElementById("formulario");
        const mensaje = document.getElementById("mensaje");

        // 📌 Obtener palabras desde Firestore
        async function obtenerPalabrasDesdeFirestore() {
            try {
                console.log("🔍 Obteniendo datos desde Firestore...");
                const querySnapshot = await db.collection("palabras").get();

                let palabras = [];
                querySnapshot.forEach(doc => {
                    palabras.push(doc.data());
                });

                console.log("✅ Palabras obtenidas:", palabras);
                return palabras;
            } catch (error) {
                console.error("❌ Error al obtener datos:", error);
                return [];
            }
        }

        // 📌 Función para buscar palabras exactas
        async function filtrarPalabras() {
            const termino = buscador.value.toLowerCase().trim();
            resultado.innerHTML = "";

            if (termino === "") return;

            const palabras = await obtenerPalabrasDesdeFirestore();
            const filtradas = palabras.filter(palabra => 
                palabra.espanol.toLowerCase() === termino || 
                palabra.totonaco.toLowerCase() === termino
            );

            if (filtradas.length > 0) {
                filtradas.forEach(palabra => {
                    const item = document.createElement("li");
                    item.innerHTML = `<strong>${palabra.espanol}</strong> - ${palabra.totonaco}`;
                    resultado.appendChild(item);
                });
            } else {
                resultado.innerHTML = "<li>No se encontró la palabra exacta</li>";
            }
        }

        // 📌 Función para agregar una nueva palabra
        formulario.addEventListener("submit", async function(event) {
            event.preventDefault();

            const nuevoEspanol = document.getElementById("nuevoEspanol").value.trim();
            const nuevoTotonaco = document.getElementById("nuevoTotonaco").value.trim();

            if (!nuevoEspanol || !nuevoTotonaco) {
                mensaje.textContent = "❌ Por favor, completa todos los campos.";
                return;
            }

            try {
                // 📌 Verificar si la palabra ya existe
                const consulta = await db.collection("palabras").where("espanol", "==", nuevoEspanol).get();

                if (!consulta.empty) {
                    mensaje.textContent = "⚠️ La palabra ya existe en la base de datos.";
                    return;
                }

                await db.collection("palabras").add({
                    espanol: nuevoEspanol,
                    totonaco: nuevoTotonaco
                });

                console.log("✅ Palabra agregada correctamente.");
                mensaje.textContent = "✅ Palabra enviada correctamente.";
                formulario.reset();
                
                // 🔄 Actualizar la lista sin recargar la página
                obtenerPalabrasDesdeFirestore();
            } catch (error) {
                console.error("❌ Error al enviar la palabra:", error);
                mensaje.textContent = "❌ Error al enviar la palabra.";
            }
        });

        // 📌 Cargar palabras al inicio
        buscador.addEventListener("input", () => setTimeout(() => filtrarPalabras(), 300));
    </script>

</body>
</html>
 
       
    
