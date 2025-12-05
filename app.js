<script>
    let diccionario = [];

    // Cargar las palabras desde el archivo JSON
    fetch("palabras.json")
        .then(response => response.json())
        .then(data => {
            diccionario = data;
            console.log("✅ Diccionario cargado:", diccionario);
        })
        .catch(error => {
            console.error("❌ Error al cargar el diccionario:", error);
        });

    // Función para buscar palabras
    function buscarPalabra() {
        const entrada = document.getElementById("buscador").value.trim().toLowerCase();
        const resultado = document.getElementById("resultado");
        resultado.innerHTML = "";

        const encontrados = diccionario.filter(p => 
            p.espanol.toLowerCase().trim() === entrada || 
            p.totonaco.toLowerCase().trim() === entrada
        );

        if (encontrados.length > 0) {
            encontrados.forEach(p => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${p.espanol}</strong> - ${p.totonaco}`;
                resultado.appendChild(li);
            });
        } else {
            resultado.innerHTML = "<li>No se encontró esa palabra</li>";
        }
    }

    // Ejecutar al escribir
    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("buscador").addEventListener("input", () => {
            setTimeout(buscarPalabra, 300);
        });
    });
</script>

  
       

