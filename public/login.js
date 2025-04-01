document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginButton");
    if (loginButton) loginButton.addEventListener("click", login);

    function login(event) {
        event.preventDefault();
        const nombre_usuario = document.getElementById("nombre_usuario").value.trim();
        const contra = document.getElementById("contra").value.trim();
        const message = document.getElementById("message");

        if (!nombre_usuario || !contra) {
            message.innerText = "Por favor, completa todos los campos.";
            return;
        }

        fetch('/login', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_usuario, contra })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json(); // Asegura que la respuesta es JSON
        })
        .then(data => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                alert("Inicio de sesión exitoso");
                window.location.href = "/dashboard.html";
            } else {
                message.innerText = data.msg || "Usuario o contraseña incorrectos.";
            }
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
            message.innerText = "Error en el servidor o conexión.";
        });
    }

    // Verificar token (esto lo dejamos igual)
    const token = localStorage.getItem("token");
    if (token) {
        fetch('/login/verify-token', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                window.location.href = "/dashboard.html";  // Redirige si ya está autenticado
            }
        })
        .catch(error => console.error("Error verificando el token:", error));
    }
});
