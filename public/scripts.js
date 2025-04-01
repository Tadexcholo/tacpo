// Variable global para almacenar los productos cargados y los items del carrito
let allProducts = [];
let cartItems = [];

// Función para manejar los breadcrumbs (ya existente)
document.addEventListener("DOMContentLoaded", function () {
  const breadcrumbsKey = "breadcrumbs";
  let breadcrumbs = JSON.parse(localStorage.getItem(breadcrumbsKey)) || [];
  const currentTitle = document.title || "Página";
  const currentUrl = window.location.pathname;

  if (currentUrl === "/" || currentUrl === "/index.html") {
    breadcrumbs = [{ title: "Inicio", url: "/" }];
  } else {
    const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
    if (!lastBreadcrumb || lastBreadcrumb.url !== currentUrl) {
      breadcrumbs.push({ title: currentTitle, url: currentUrl });
    }
  }

  if (breadcrumbs.length > 5) {
    breadcrumbs = breadcrumbs.slice(-5);
  }

  localStorage.setItem(breadcrumbsKey, JSON.stringify(breadcrumbs));

  const container = document.getElementById("breadcrumbs-container");
  if (container) {
    container.innerHTML = breadcrumbs.map(crumb =>
      `<a href="${crumb.url}" style="text-decoration: none; color: inherit;">${crumb.title}</a>`
    ).join(" > ");
  }
});

// Funciones de traducción (ya existentes)
function changeLanguage(language) {
  localStorage.setItem('language', language);
  fetch(`/locales/${language}.json`)
    .then(response => response.json())
    .then(data => {
      document.querySelectorAll('[data-translate]').forEach(element => {
        const translateKey = element.getAttribute('data-translate');
        if (data[translateKey]) {
          element.textContent = data[translateKey];
        }
      });
    })
    .catch(error => {
      console.error('Error al cargar el archivo de traducción:', error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const language = localStorage.getItem('language') || 'es'; 
  changeLanguage(language);
  document.getElementById('language_en').addEventListener('click', () => changeLanguage('en'));
  document.getElementById('language_es').addEventListener('click', () => changeLanguage('es'));
});

// Función para cargar productos desde la tabla "trabajos"
async function loadProducts() {
  try {
    const response = await fetch("/api/trabajos", {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    if (response.ok) {
      const products = await response.json();
      allProducts = products;  // Guardar globalmente para referencia
      const container = document.getElementById("productsContainer");
      container.innerHTML = "";
      products.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("col-md-4", "mb-4");
        card.innerHTML = `
          <div class="card">
            <img src="/imagenes/${product.imagen}" class="card-img-top" alt="${product.tipo}">
            <div class="card-body">
              <h5 class="card-title">${product.tipo}</h5>
              <p class="card-text"><strong>Material:</strong> ${product.material}</p>
              <p class="card-text"><strong>Costo:</strong> $${product.costo}</p>
              <p class="card-text"><strong>Tamaño:</strong> ${product.tamano}</p>
              <button class="btn btn-info" onclick="viewProduct(${product.id})">Ver más</button>
              <button class="btn btn-success" onclick="addToCart(${product.id})">Agregar al Carrito</button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Error al cargar productos: ", error);
  }
}
document.addEventListener("DOMContentLoaded", loadProducts);

// Función para buscar productos (ya existente)
function searchProducts() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll("#productsContainer .card");
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.parentElement.style.display = text.includes(query) ? "block" : "none";
  });
}

function viewProduct(id) {
  window.location.href = `producto.html?id=${id}`;
}

// --- Funcionalidad del Carrito ---

// Agregar un producto al carrito (no se envía al servidor aún)
function addToCart(productId) {
  // Buscar el producto en allProducts
  const product = allProducts.find(p => p.id === productId);
  if (!product) {
    alert('Producto no encontrado');
    return;
  }
  // Evitar duplicados (opcional)
  if (cartItems.find(item => item.id === productId)) {
    alert('El producto ya está en el carrito');
    return;
  }
  cartItems.push(product);
  updateCartSidebar();
  alert('Producto agregado al carrito.');
}

// Actualizar el contenido del carrito en el sidebar
function updateCartSidebar() {
  const cartList = document.getElementById("cartItemsList");
  cartList.innerHTML = "";
  cartItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.style.padding = "5px 0";
    li.textContent = item.tipo;
    // Botón para eliminar el producto del carrito (solo lo quita del array)
    const removeBtn = document.createElement("button");
    removeBtn.textContent = " X ";
    removeBtn.style.marginLeft = "10px";
    removeBtn.classList.add("btn", "btn-danger", "btn-sm");
    removeBtn.addEventListener("click", () => {
      cartItems.splice(index, 1);
      updateCartSidebar();
    });
    li.appendChild(removeBtn);
    cartList.appendChild(li);
  });
}

// Función para finalizar la compra: se elimina de "trabajos" y se agrega a "carrito"
document.getElementById("checkoutButton").addEventListener("click", async () => {
  if (cartItems.length === 0) {
    alert("No hay productos en el carrito.");
    return;
  }
  // Recopilar los IDs de los productos a comprar
  const productIds = cartItems.map(item => item.id);
  try {
    const response = await fetch('/api/carrito/checkout', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds })
    });
    if (response.ok) {
      alert("Compra realizada con éxito.");
      cartItems = [];
      updateCartSidebar();
      // Recargar productos para reflejar que se han eliminado de la tabla "trabajos"
      await loadProducts();
    } else {
      const errorData = await response.json();
      alert(errorData.msg || "Error al realizar la compra.");
    }
  } catch (error) {
    console.error("Error en checkout:", error);
    alert("Error de conexión.");
  }
});
