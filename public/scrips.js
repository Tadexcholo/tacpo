document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginButton");
    if (loginButton) loginButton.addEventListener("click", login);

    const registerButton = document.getElementById("registerButton");
    if (registerButton) registerButton.addEventListener("click", register);

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) logoutButton.addEventListener("click", logout);

    const nombreUsuarioSpan = document.getElementById("nombre_usuario");
    if (nombreUsuarioSpan && !window.location.pathname.includes("login.html")) {
        console.log("Verificando sesión...");
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("No hay sesión, redirigiendo a login.");
            window.location.href = "/index.html";
        } else {
            fetch('/api/verifyToken', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.valid) {
                    console.log("Token inválido, redirigiendo a login.");
                    window.location.href = "/index.html";
                } else {
                    nombreUsuarioSpan.innerText = data.nombre_usuario; 
                }
            })
            .catch(error => {
                console.error("Error verificando el token:", error);
                window.location.href = "/index.html"; 
            });
        }
    }

    // 📩 Evento para enviar el formulario de contacto

function login(event) {
    event.preventDefault(); 

    const nombre_usuario = document.getElementById("nombre_usuario").value.trim();
    const contra = document.getElementById("contra").value.trim();
    const message = document.getElementById("message");

    if (!nombre_usuario || !contra) {
        message.innerText = "Por favor, completa todos los campos.";
        return;
    }

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario, contra })
    })
    .then(response => response.json())
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
        message.innerText = "Error en el servidor. Inténtalo más tarde.";
    });
}

function register(event) {
    event.preventDefault(); 

    const nombre_usuario = document.getElementById("newUsername").value.trim();
    const contra = document.getElementById("newPassword").value.trim();
    const registerMessage = document.getElementById("registerMessage");

    if (!nombre_usuario || !contra) {
        registerMessage.innerText = "Todos los campos son obligatorios.";
        return;
    }

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario, contra })
    })
    .then(response => response.json())
    .then(data => {
        if (data.msg === 'Usuario registrado exitosamente') {
            alert("Registro exitoso, ahora inicia sesión.");
            window.location.href = "/login.html"; 
        } else {
            registerMessage.innerText = data.msg || "Error al registrar usuario.";
        }
    })
    .catch(error => {
        console.error("Error en la solicitud:", error);
        registerMessage.innerText = "Error en el servidor. Inténtalo más tarde.";
    });
}

function logout() {
    localStorage.removeItem("token"); 
    window.location.href = "/index.html"; 
}
});
