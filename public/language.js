// Función para aplicar traducciones a los elementos de la página
function applyTranslations(translations) {
    // Traducir elementos con atributo data-translate
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key]) {
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.value = translations[key];
            } else {
                element.textContent = translations[key];
            }
        }
    });

    // Traducir placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[key]) {
            element.placeholder = translations[key];
        }
    });

    // Cambiar el título de la página
    if (translations.site_title) {
        document.title = translations.site_title;
    }
}

// Función para resolver claves de objeto anidadas (como "menu.home")
return path.split('.').reduce((prev, curr) => prev?.[curr] ?? null, obj);


// Función para cargar un archivo de traducción
function loadTranslationFile(language) {
    return fetch(`/locales/${language}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error al cargar el archivo de traducción:', error);
            // Si hay un error, intentar cargar el idioma por defecto
            if (language !== 'es') {
                return fetch('/locales/es.json').then(res => res.json());
            }
            return {};
        });
}

// Función para cambiar el idioma
function changeLanguage(language) {
    // Guardar el idioma seleccionado en LocalStorage
    localStorage.setItem('language', language);
    
    // Cargar y aplicar las traducciones
    loadTranslationFile(language)
        .then(translations => {
            applyTranslations(translations);
        });
    
    // Actualizar la clase activa en los selectores de idioma
    document.querySelectorAll('.language-selector a').forEach(link => {
        if (link.id === `language_${language}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Función para cargar el idioma guardado al iniciar la página
function loadLanguage() {
    // Detectar idioma del navegador
    const browserLang = navigator.language.split('-')[0];
    
    // Recuperar el idioma guardado o usar el del navegador como respaldo
    const language = localStorage.getItem('language') || 
                    (browserLang === 'es' || browserLang === 'en' ? browserLang : 'es');
    
    // Aplicar el idioma
    changeLanguage(language);
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', loadLanguage);