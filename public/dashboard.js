document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/index.html"; // Redirigir si no hay token
    } else {
        const userName = JSON.parse(atob(token.split('.')[1])).nombre_usuario;
        document.getElementById("userName").innerText = userName;

        await loadJobs();
    }
});
        function verLogs() {
            window.location.href = "/logs.html";
        }
// Cargar trabajos desde la API
async function loadJobs() {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/trabajos", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (response.ok) {
        const trabajos = await response.json();
        const trabajosContainer = document.getElementById("trabajosContainer");
        trabajosContainer.innerHTML = "";

        trabajos.forEach((trabajo, index) => {
            const trabajoDiv = document.createElement("div");
            trabajoDiv.classList.add("col");

            trabajoDiv.innerHTML = `
                <div class="card">
                    <img src="/imagenes/${trabajo.imagen}" class="card-img-top" alt="${trabajo.tipo}">
                    <div class="card-body">
                        <h5 class="card-title">${trabajo.tipo}</h5>
                        <p><strong>Material:</strong> ${trabajo.material}</p>
                        <p><strong>Costo:</strong> $${trabajo.costo}</p>
                        <p><strong>Tamaño:</strong> ${trabajo.tamano}</p>
                        <button class="btn btn-warning" onclick="editJob(${trabajo.id})">Editar</button>
                        <button class="btn btn-danger" onclick="deleteJob(${trabajo.id})">Eliminar</button>
                    </div>
                </div>
            `;

            trabajosContainer.appendChild(trabajoDiv);
        });
    }
}

// Editar trabajo
function editJob(id) {
    fetch(`/api/trabajos/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("jobId").value = data.id;
        document.getElementById("tipo").value = data.tipo;
        document.getElementById("material").value = data.material;
        document.getElementById("costo").value = data.costo;
        document.getElementById("tamano").value = data.tamano;
        document.getElementById("jobModal").style.display = "block";
    });
}

// Eliminar trabajo
function deleteJob(id) {
    fetch(`/api/trabajos/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(response => {
        if (response.ok) {
            loadJobs();
        }
    });
}

// Crear trabajo
document.getElementById("createJobButton").addEventListener("click", function() {
    // Limpiar el formulario antes de abrir el modal
    document.getElementById("jobForm").reset();
    document.getElementById("jobId").value = ""; // Asegurar que el id esté vacío
    document.getElementById("jobModal").style.display = "block";
});

// Guardar trabajo (crear o actualizar)
document.getElementById("jobForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("tipo", document.getElementById("tipo").value);
    formData.append("material", document.getElementById("material").value);
    formData.append("costo", document.getElementById("costo").value);
    formData.append("tamano", document.getElementById("tamano").value);
    formData.append("imagen", document.getElementById("imagen").files[0]);
    formData.append("id", document.getElementById("jobId").value);

    const method = document.getElementById("jobId").value ? "PUT" : "POST";
    const url = method === "PUT" ? `/api/trabajos/${document.getElementById("jobId").value}` : "/api/trabajos";

    fetch(url, {
        method: method,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
    })
    .then(response => {
        if (response.ok) {
            loadJobs();
            document.getElementById("jobModal").style.display = "none";
            document.getElementById("jobForm").reset(); // Limpiar los campos
            document.getElementById("jobId").value = ""; // Limpiar el id
        }
    });
});

// Cerrar sesión
document.getElementById("logoutButton").addEventListener("click", function () {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

// Función de búsqueda
function searchJobs() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        const tipo = card.querySelector(".card-title").innerText.toLowerCase();
        const material = card.querySelector("p").innerText.toLowerCase();

        if (tipo.includes(query) || material.includes(query)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// Cerrar modal
function closeModal() {
    document.getElementById("jobModal").style.display = "none";
}
