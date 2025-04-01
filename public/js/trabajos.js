document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("trabajos-tbody");

    try {
        const response = await fetch("/api/trabajos"); // ✅ Obtiene datos de la API
        const trabajos = await response.json();

        trabajos.forEach(trabajo => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${trabajo.id}</td>
                <td>${trabajo.tipo}</td>
                <td>${trabajo.material}</td>
                <td>${trabajo.costo}</td>
                <td>${trabajo.tamano}</td>
                <td><img src="/imagenes/${trabajo.imagen}" width="100" class="img-thumbnail"></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error al obtener trabajos:", error);
    }
});
