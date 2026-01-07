// api.js
export const API_LARAVEL = "/consultar-biologicos";
export const API_FASTAPI = "http://127.0.0.1:8080";

/**
 * Carga los catálogos disponibles desde el servidor FastAPI
 * @returns {Promise<Array>} Array de catálogos disponibles
 */
export async function cargarCatalogos() {
    console.log("🔵 Cargando catálogos desde:", `${API_FASTAPI}/cubos_sis`);

    try {
        const response = await fetch(`${API_FASTAPI}/cubos_sis`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.cubos_sis) {
            console.error("❌ ERROR: No llegó cubos_sis");
            return [];
        }

        return data.cubos_sis;
    } catch (err) {
        console.error("🔴 ERROR de conexión:", err);
        throw err;
    }
}

/**
 * Carga las instituciones desde el endpoint Laravel
 * @returns {Promise<Array>} Array de instituciones
 */
export async function cargarInstituciones() {
    console.log("🔵 Cargando instituciones...");

    try {
        const response = await fetch("/instituciones-json");

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Instituciones cargadas:", data);

        return data;
    } catch (err) {
        console.error("🔴 ERROR al cargar instituciones:", err);
        throw err;
    }
}

/**
 * Obtiene el cubo activo para un catálogo específico
 * @param {string} catalogo - Nombre del catálogo
 * @returns {Promise<string>} Nombre del cubo activo
 */
export async function obtenerCuboActivo(catalogo) {
    console.log(`🔵 Obteniendo cubo activo para catálogo: ${catalogo}`);

    try {
        const response = await fetch(`${API_FASTAPI}/cubos_en_catalogo/${catalogo}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.cubos || data.cubos.length === 0) {
            throw new Error("No se encontraron cubos para el catálogo especificado");
        }

        return data.cubos[0];
    } catch (err) {
        console.error("🔴 ERROR al obtener cubo activo:", err);
        throw err;
    }
}

/**
 * Carga las CLUES filtradas para un catálogo y cubo específicos
 * @param {string} catalogo - Nombre del catálogo
 * @param {string} cubo - Nombre del cubo
 * @param {string} prefijo - Prefijo para filtrar CLUES (ej: "HG")
 * @returns {Promise<Array>} Array de CLUES disponibles
 */
export async function cargarCluesFiltradas(catalogo, cubo, prefijo = "HG") {
    console.log(`🔵 Cargando CLUES para catálogo: ${catalogo}, cubo: ${cubo}, prefijo: ${prefijo}`);

    try {
        const url = `${API_FASTAPI}/clues_filtradas?catalogo=${encodeURIComponent(catalogo)}&cubo=${encodeURIComponent(cubo)}&prefijo=${encodeURIComponent(prefijo)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.clues) {
            console.warn("⚠️ No se encontraron CLUES para los parámetros especificados");
            return [];
        }

        return data.clues;
    } catch (err) {
        console.error("🔴 ERROR al cargar CLUES filtradas:", err);
        throw err;
    }
}

/**
 * Carga todas las CLUES para un catálogo (incluye obtener cubo activo y CLUES filtradas)
 * @param {string} catalogo - Nombre del catálogo
 * @returns {Promise<Object>} Objeto con cubo activo y CLUES disponibles
 */
export async function cargarCluesCompleto(catalogo) {
    try {
        // 1. Obtener cubo activo
        const cubo = await obtenerCuboActivo(catalogo);

        // 2. Obtener CLUES filtradas
        const clues = await cargarCluesFiltradas(catalogo, cubo, "HG");

        return {
            cubo,
            clues
        };
    } catch (err) {
        console.error("🔴 ERROR en cargarCluesCompleto:", err);
        throw err;
    }
}

/**
 * Consulta los datos de biológicos para las CLUES seleccionadas
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.catalogo - Nombre del catálogo
 * @param {string} params.cubo - Nombre del cubo
 * @param {Array<string>} params.clues_list - Lista de CLUES a consultar
 * @returns {Promise<Object>} Datos de la consulta
 */
export async function consultarBiologicos(params) {
    const { catalogo, cubo, clues_list } = params;

    console.log(`🔵 Consultando biológicos para ${clues_list.length} CLUES...`);

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

        if (!csrfToken) {
            console.warn("⚠️ No se encontró token CSRF");
        }

        const response = await fetch(API_LARAVEL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken || ""
            },
            body: JSON.stringify({
                catalogo,
                cubo,
                clues_list
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Validar estructura de respuesta
        if (!data.resultados || !Array.isArray(data.resultados)) {
            console.warn("⚠️ Respuesta inesperada del servidor:", data);
            throw new Error("Estructura de respuesta inválida");
        }

        console.log(`✅ Consulta completada: ${data.resultados.length} resultados`);

        return data;
    } catch (err) {
        console.error("🔴 ERROR al consultar biológicos:", err);
        throw err;
    }
}

/**
 * Verifica la conectividad con los servidores API
 * @returns {Promise<Object>} Estado de conectividad de las APIs
 */
// Versión mejorada con timeout:
export async function verificarConectividad() {
    console.log("🔵 Verificando conectividad con APIs...");

    const resultados = {
        fastAPI: false,
        laravel: false,
        mensajes: []
    };

    try {
        // Crear un AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Verificar FastAPI
        try {
            const fastApiResponse = await fetch(`${API_FASTAPI}/cubos_sis`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            resultados.fastAPI = fastApiResponse.ok;
        } catch (fastApiError) {
            resultados.fastAPI = false;
            console.warn("⚠️ Error FastAPI:", fastApiError.message);
        }

        resultados.mensajes.push(
            resultados.fastAPI
                ? "✅ Conexión con FastAPI establecida"
                : "❌ No se pudo conectar con FastAPI"
        );

        // Verificar Laravel
        const laravelController = new AbortController();
        const laravelTimeoutId = setTimeout(() => laravelController.abort(), 5000);

        try {
            const laravelResponse = await fetch("/", {
                method: 'GET',
                headers: { 'Accept': 'text/html' },
                signal: laravelController.signal
            });

            clearTimeout(laravelTimeoutId);
            resultados.laravel = laravelResponse.ok;
        } catch (laravelError) {
            resultados.laravel = false;
            console.warn("⚠️ Error Laravel:", laravelError.message);
        }

        resultados.mensajes.push(
            resultados.laravel
                ? "✅ Conexión con Laravel establecida"
                : "❌ No se pudo conectar con Laravel"
        );

    } catch (err) {
        console.error("🔴 ERROR general al verificar conectividad:", err);
        resultados.mensajes.push("❌ Error al verificar conectividad");
    }

    console.log("📊 Resultados conectividad:", resultados);

    return resultados;
}

/**
 * Obtiene metadatos del cubo activo
 * @param {string} catalogo - Nombre del catálogo
 * @param {string} cubo - Nombre del cubo
 * @returns {Promise<Object>} Metadatos del cubo
 */
export async function obtenerMetadatosCubo(catalogo, cubo) {
    console.log(`🔵 Obteniendo metadatos para cubo: ${cubo}`);

    try {
        const response = await fetch(`${API_FASTAPI}/metadatos_cubo/${catalogo}/${cubo}`);

        if (!response.ok) {
            console.warn(`⚠️ No se pudieron obtener metadatos para el cubo ${cubo}`);
            return null;
        }

        return await response.json();
    } catch (err) {
        console.error("🔴 ERROR al obtener metadatos del cubo:", err);
        return null;
    }
}

// ===============================
// Versiones con manejo de spinner (para compatibilidad)
// ===============================

/**
 * Versión de cargarClues que incluye spinner
 * @param {string} catalogo - Nombre del catálogo
 * @param {Function} mostrarSpinner - Función para mostrar spinner
 * @param {Function} ocultarSpinner - Función para ocultar spinner
 * @returns {Promise<Object>} Objeto con cubo y CLUES
 */
export async function cargarCluesConSpinner(catalogo, mostrarSpinner, ocultarSpinner) {
    if (typeof mostrarSpinner === 'function') {
        mostrarSpinner();
    }

    try {
        return await cargarCluesCompleto(catalogo);
    } finally {
        if (typeof ocultarSpinner === 'function') {
            ocultarSpinner();
        }
    }
}

/**
 * Versión de consultarBiologicos que incluye spinner
 * @param {Object} params - Parámetros de consulta
 * @param {Function} mostrarSpinner - Función para mostrar spinner
 * @param {Function} ocultarSpinner - Función para ocultar spinner
 * @returns {Promise<Object>} Datos de la consulta
 */
export async function consultarBiologicosConSpinner(params, mostrarSpinner, ocultarSpinner) {
    if (typeof mostrarSpinner === 'function') {
        mostrarSpinner();
    }

    try {
        return await consultarBiologicos(params);
    } finally {
        if (typeof ocultarSpinner === 'function') {
            ocultarSpinner();
        }
    }
}

export default {
    API_LARAVEL,
    API_FASTAPI,
    cargarCatalogos,
    cargarInstituciones,
    obtenerCuboActivo,
    cargarCluesFiltradas,
    cargarCluesCompleto,
    consultarBiologicos,
    verificarConectividad,
    obtenerMetadatosCubo,
    cargarCluesConSpinner,
    consultarBiologicosConSpinner
};