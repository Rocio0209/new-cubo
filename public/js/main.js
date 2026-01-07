import * as api from './api.js';
import * as ui from './ui.js';
import * as exportModule from './export.js';
import * as utils from './utils.js';
import {
    MENSAJES,
    CLASES_CSS
} from './constants.js';

let state = {
    cuboActivo: null,
    cluesDisponibles: [],
    resultadosConsulta: [],
    institucionesCatalogo: [],
    catalogoSeleccionado: null,
    cluesSeleccionadas: []
};

let elementosDOM = {
    catalogoSelect: null,
    cluesSelect: null,
    btnCargarClues: null,
    btnConsultar: null,
    btnExportar: null,
    btnExportarSimple: null,
    btnLimpiarClues: null,
    spinnerCarga: null,
    tablaHeader: null,
    variablesHeader: null,
    tablaResultadosBody: null,
    tablaFooter: null,
    resumenConsulta: null,
    resultadosContainer: null,
    mensajeCluesCargadas: null
};

document.addEventListener("DOMContentLoaded", async () => {
    console.log(MENSAJES.CARGA_CORRECTA);
    
    try {
        inicializarElementosDOM();
        ui.inicializarSelect2();
        configurarEventListeners();
        await cargarCatalogosIniciales();
        await cargarInstituciones();
        await verificarConectividad();
        console.log("✅ Aplicación inicializada correctamente");
    } catch (error) {
        console.error("❌ Error al inicializar la aplicación:", error);
        mostrarError("Error al inicializar la aplicación. Por favor, recarga la página.");
    }
});

/**
 * Inicializa las referencias a los elementos del DOM
 */
function inicializarElementosDOM() {
    elementosDOM = {
        catalogoSelect: document.getElementById('catalogoSelect'),
        cluesSelect: document.getElementById('cluesSelect'),
        btnCargarClues: document.getElementById('btnCargarClues'),
        btnConsultar: document.getElementById('btnConsultar'),
        btnExportar: document.getElementById('btnExportar'),
        btnExportarSimple: document.getElementById('btnExportarSimple'),
        btnLimpiarClues: document.getElementById('btnLimpiarClues'),
        spinnerCarga: document.getElementById('spinnerCarga'),
        tablaHeader: document.getElementById('tablaHeader'),
        variablesHeader: document.getElementById('variablesHeader'),
        tablaResultadosBody: document.getElementById('tablaResultadosBody'),
        tablaFooter: document.getElementById('tablaFooter'),
        resumenConsulta: document.getElementById('resumenConsulta'),
        resultadosContainer: document.getElementById('resultadosContainer'),
        mensajeCluesCargadas: document.getElementById('mensajeCluesCargadas')
    };

    Object.entries(elementosDOM).forEach(([nombre, elemento]) => {
        if (!elemento) {
            console.warn(`⚠️ Elemento no encontrado: ${nombre}`);
        }
    });
}

/**
 * Configura todos los event listeners
 */
function configurarEventListeners() {
    if (elementosDOM.catalogoSelect) {
        elementosDOM.catalogoSelect.addEventListener("change", manejarCambioCatalogo);
    }
    
    if (elementosDOM.btnCargarClues) {
        elementosDOM.btnCargarClues.addEventListener("click", manejarCargarClues);
    }
    
    if (elementosDOM.btnConsultar) {
        elementosDOM.btnConsultar.addEventListener("click", manejarConsultar);
    }
    
    if (elementosDOM.btnExportar) {
        elementosDOM.btnExportar.addEventListener("click", manejarExportarExcel);
    }
    
    if (elementosDOM.btnExportarSimple) {
        elementosDOM.btnExportarSimple.addEventListener("click", manejarExportarTablaHTML);
    }
    
    if (elementosDOM.btnLimpiarClues) {
        elementosDOM.btnLimpiarClues.addEventListener("click", manejarLimpiarClues);
    }
    
    if (elementosDOM.cluesSelect) {
        $(elementosDOM.cluesSelect).on('change', manejarCambioClues);
    }
    
    console.log("✅ Event listeners configurados");
}

/**
 * Maneja el cambio de catálogo
 */
async function manejarCambioCatalogo() {
    const catalogo = elementosDOM.catalogoSelect.value;
    state.catalogoSeleccionado = catalogo;
    
    console.log(`📁 Catálogo seleccionado: ${catalogo}`);
    ui.resetearInterfaz();
    if (elementosDOM.btnCargarClues) {
        elementosDOM.btnCargarClues.disabled = !catalogo;
    }
    state.cuboActivo = null;
    state.cluesDisponibles = [];
    state.cluesSeleccionadas = [];
}

/**
 * Maneja la carga de CLUES
 */
async function manejarCargarClues() {
    const catalogo = elementosDOM.catalogoSelect.value;
    
    if (!catalogo) {
        mostrarError("Por favor, selecciona un catálogo primero.");
        return;
    }
    
    try {
        utils.mostrarSpinner(elementosDOM.spinnerCarga);
    
        const resultado = await api.cargarCluesConSpinner(
            catalogo,
            () => utils.mostrarSpinner(elementosDOM.spinnerCarga),
            () => utils.ocultarSpinner(elementosDOM.spinnerCarga)
        );
        state.cuboActivo = resultado.cubo;
        state.cluesDisponibles = resultado.clues;
        
        console.log(`✅ CLUES cargadas: ${resultado.clues.length} disponibles`);
        console.log(`✅ Cubo activo: ${resultado.cubo}`);
        ui.actualizarSelectClues(resultado.clues);
        if (elementosDOM.mensajeCluesCargadas) {
            elementosDOM.mensajeCluesCargadas.classList.remove(CLASES_CSS.D_NONE);
        }
        if (elementosDOM.btnConsultar) {
            elementosDOM.btnConsultar.disabled = false;
        }
        
    } catch (error) {
        console.error("❌ Error al cargar CLUES:", error);
        mostrarError("Error al cargar las CLUES. Verifica la conexión e intenta de nuevo.");
    } finally {
        utils.ocultarSpinner(elementosDOM.spinnerCarga);
    }
}

/**
 * Maneja el cambio en la selección de CLUES
 */
function manejarCambioClues() {
    const seleccionadas = Array.from(elementosDOM.cluesSelect.selectedOptions)
        .map(o => o.value)
        .filter(v => v && v.trim() !== "");
    
    state.cluesSeleccionadas = seleccionadas;
    
    console.log(`🔍 CLUES seleccionadas: ${seleccionadas.length}`);
    if (elementosDOM.btnConsultar) {
        elementosDOM.btnConsultar.disabled = seleccionadas.length === 0;
    }
}

/**
 * Maneja la consulta de biológicos
 */
async function manejarConsultar() {
    const catalogo = elementosDOM.catalogoSelect.value;
    const cluesList = state.cluesSeleccionadas;
    
    if (!catalogo || cluesList.length === 0) {
        mostrarError("Por favor, selecciona un catálogo y al menos una CLUES.");
        return;
    }
    
    if (!state.cuboActivo) {
        mostrarError("No hay un cubo activo. Por favor, carga las CLUES primero.");
        return;
    }
    
    try {
        utils.mostrarSpinner(elementosDOM.spinnerCarga);
        const data = await api.consultarBiologicosConSpinner(
            {
                catalogo,
                cubo: state.cuboActivo,
                clues_list: cluesList
            },
            () => utils.mostrarSpinner(elementosDOM.spinnerCarga),
            () => utils.ocultarSpinner(elementosDOM.spinnerCarga)
        );
        state.resultadosConsulta = data.resultados;
        
        console.log(`✅ Consulta completada: ${data.resultados.length} resultados`);
        console.log(`📊 Total CLUES procesadas: ${data.metadata?.total_clues_procesadas || 'N/A'}`);
        renderTabla(data);
        actualizarResumenConsulta(data);
        elementosDOM.resultadosContainer.classList.remove(CLASES_CSS.D_NONE);
        if (elementosDOM.btnExportar) {
            elementosDOM.btnExportar.disabled = false;
        }
        
    } catch (error) {
        console.error("❌ Error al consultar biológicos:", error);
        mostrarError("Error al consultar los biológicos. Verifica la conexión e intenta de nuevo.");
    } finally {
        utils.ocultarSpinner(elementosDOM.spinnerCarga);
    }
}

/**
 * Maneja la exportación a Excel con plantilla
 */
async function manejarExportarExcel() {
    if (!state.resultadosConsulta || state.resultadosConsulta.length === 0) {
        mostrarError("No hay datos para exportar. Por favor, realiza una consulta primero.");
        return;
    }
    
    try {
        await exportModule.exportarExcel(
            state.resultadosConsulta,
            utils.obtenerInicialesInstitucion,
            () => utils.mostrarSpinner(elementosDOM.spinnerCarga),
            () => utils.ocultarSpinner(elementosDOM.spinnerCarga)
        );
        
        console.log("✅ Exportación a Excel completada");
    } catch (error) {
        console.error("❌ Error en exportación a Excel:", error);
    }
}

/**
 * Maneja la exportación a Excel con tabla HTML
 */
async function manejarExportarTablaHTML() {
    if (!state.resultadosConsulta || state.resultadosConsulta.length === 0) {
        mostrarError("No hay datos para exportar. Por favor, realiza una consulta primero.");
        return;
    }
    
    try {
        await exportModule.exportarTablaHTML(
            state.resultadosConsulta,
            utils.obtenerInicialesInstitucion,
            () => utils.mostrarSpinner(elementosDOM.spinnerCarga),
            () => utils.ocultarSpinner(elementosDOM.spinnerCarga)
        );
        
        console.log("✅ Exportación a tabla HTML completada");
    } catch (error) {
        console.error("❌ Error en exportación a tabla HTML:", error);

    }
}

/**
 * Maneja la limpieza de CLUES seleccionadas
 */
function manejarLimpiarClues() {
    $(elementosDOM.cluesSelect).val(null).trigger('change');
    
    state.cluesSeleccionadas = [];
    
    if (elementosDOM.tablaHeader) elementosDOM.tablaHeader.innerHTML = "";
    if (elementosDOM.variablesHeader) elementosDOM.variablesHeader.innerHTML = "";
    if (elementosDOM.tablaResultadosBody) elementosDOM.tablaResultadosBody.innerHTML = "";
    if (elementosDOM.tablaFooter) elementosDOM.tablaFooter.innerHTML = "";
    if (elementosDOM.resumenConsulta) elementosDOM.resumenConsulta.innerHTML = "";
    if (elementosDOM.resultadosContainer) {
        elementosDOM.resultadosContainer.classList.add(CLASES_CSS.D_NONE);
    }
    if (elementosDOM.btnExportar) {
        elementosDOM.btnExportar.disabled = true;
    }
    if (elementosDOM.btnConsultar) {
        elementosDOM.btnConsultar.disabled = state.cluesDisponibles.length === 0;
    }
    state.resultadosConsulta = [];
    
    console.log("🧹 CLUES limpiadas");
}

/**
 * Carga los catálogos iniciales
 */
async function cargarCatalogosIniciales() {
    try {
        const catalogos = await api.cargarCatalogos();
        
        if (catalogos && catalogos.length > 0) {
            catalogos.forEach(c => {
                if (elementosDOM.catalogoSelect) {
                    elementosDOM.catalogoSelect.innerHTML += `<option value="${c}">${c}</option>`;
                }
            });
            
            console.log(`✅ Catálogos cargados: ${catalogos.length} disponibles`);
        } else {
            console.warn("⚠️ No se encontraron catálogos");
            mostrarError("No se pudieron cargar los catálogos. Verifica la conexión con el servidor.");
        }
    } catch (error) {
        console.error("❌ Error al cargar catálogos:", error);
        mostrarError("Error al cargar los catálogos. Verifica la conexión con el servidor.");
    }
}

/**
 * Carga las instituciones
 */
async function cargarInstituciones() {
    try {
        const instituciones = await api.cargarInstituciones();
        state.institucionesCatalogo = instituciones;
        
        utils.configurarInstituciones(instituciones);
        
        console.log(`✅ Instituciones cargadas: ${instituciones.length} registros`);
    } catch (error) {
        console.error("❌ Error al cargar instituciones:", error);
    }
}

/**
 * Verifica la conectividad con los servidores
 */
async function verificarConectividad() {
    try {
        const estado = await api.verificarConectividad();
        
        estado.mensajes.forEach(mensaje => {
            console.log(mensaje);
        });
        
        if (!estado.fastAPI || !estado.laravel) {
            console.warn("⚠️ Problemas de conectividad detectados");
            mostrarAdvertencia("Se detectaron problemas de conectividad. Algunas funciones pueden no estar disponibles.");
        }
    } catch (error) {
        console.error("❌ Error al verificar conectividad:", error);
    }
}

/**
 * Renderiza la tabla con los resultados
 * @param {Object} data - Datos de la consulta
 */
function renderTabla(data) {
    elementosDOM.tablaHeader.innerHTML = "";
    elementosDOM.variablesHeader.innerHTML = "";
    elementosDOM.tablaResultadosBody.innerHTML = "";
    elementosDOM.tablaFooter.innerHTML = "";
    elementosDOM.tablaHeader.innerHTML = `
        <th rowspan="2">CLUES</th>
        <th rowspan="2">Unidad</th>
        <th rowspan="2">Entidad</th>
        <th rowspan="2">Jurisdicción</th>
        <th rowspan="2">Municipio</th>
        <th rowspan="2">Institución</th>
    `;

    const apartados = {};
    const totales = {};
    data.resultados.forEach(r => {
        if (!r.biologicos) return;
        
        r.biologicos.forEach(ap => {
            if (!apartados[ap.apartado]) apartados[ap.apartado] = [];

            if (ap.grupos) {
                ap.grupos.forEach(g => {
                    if (g.variables) {
                        g.variables.forEach(v => {
                            if (!apartados[ap.apartado].includes(v.variable)) {
                                apartados[ap.apartado].push(v.variable);
                                totales[v.variable] = 0;
                            }
                        });
                    }
                });
            }
        });
    });
    Object.entries(apartados).forEach(([apartado, vars]) => {
        elementosDOM.tablaHeader.innerHTML += `<th colspan="${vars.length}">${apartado}</th>`;
        vars.forEach(v => elementosDOM.variablesHeader.innerHTML += `<th>${v}</th>`);
    });
    data.resultados.forEach(r => {
        let fila = `
            <td>${r.clues || ''}</td>
            <td>${r.unidad?.nombre ?? ""}</td>
            <td>${r.unidad?.entidad ?? ""}</td>
            <td>${r.unidad?.jurisdiccion ?? ""}</td>
            <td>${r.unidad?.municipio ?? ""}</td>
            <td>${utils.obtenerInicialesInstitucion(r.unidad?.idinstitucion)}</td>
        `;
        Object.entries(apartados).forEach(([apartado, vars]) => {
            const grupos = r.biologicos?.find(b => b.apartado === apartado)?.grupos ?? [];
            let dict = {};
            grupos.forEach(g => {
                if (g.variables) {
                    g.variables.forEach(v => {
                        dict[v.variable] = v.total;
                    });
                }
            });
            vars.forEach(v => {
                const valor = Number(dict[v] ?? 0);
                fila += `<td>${valor}</td>`;
                totales[v] += valor;
            });
        });

        elementosDOM.tablaResultadosBody.innerHTML += `<tr>${fila}</tr>`;
    });
    let filaTotales = `<td colspan="6"><strong>TOTALES GENERALES</strong></td>`;

    Object.values(apartados).forEach(vars => {
        vars.forEach(v => {
            filaTotales += `<td><strong>${totales[v]}</strong></td>`;
        });
    });

    elementosDOM.tablaFooter.innerHTML = `<tr class="${CLASES_CSS.TABLE_SECONDARY}">${filaTotales}</tr>`;
    
    console.log(`📊 Tabla renderizada: ${data.resultados.length} filas`);
}

/**
 * Actualiza el resumen de la consulta
 * @param {Object} data - Datos de la consulta
 */
function actualizarResumenConsulta(data) {
    if (!elementosDOM.resumenConsulta) return;
    
    elementosDOM.resumenConsulta.innerHTML = `
        <strong>Catálogo: </strong>${data.catalogo} –
        <strong>Cubo: </strong>${data.cubo} –
        <strong>CLUES consultadas: </strong>${data.metadata?.total_clues_procesadas || 'N/A'}
    `;
}

/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    console.error("❌ Error:", mensaje);
    alert(mensaje);
}

/**
 * Muestra una advertencia
 * @param {string} mensaje - Mensaje de advertencia
 */
function mostrarAdvertencia(mensaje) {
    console.warn("⚠️ Advertencia:", mensaje);
    console.warn(mensaje);
}

/**
 * Muestra información
 * @param {string} mensaje - Mensaje informativo
 */
function mostrarInformacion(mensaje) {
    console.log("ℹ️ Información:", mensaje);
    console.log(mensaje);
}

/**
 * Muestra el estado actual de la aplicación
 */
function mostrarEstadoAplicacion() {
    console.group("📊 Estado de la Aplicación");
    console.log("Catálogo seleccionado:", state.catalogoSeleccionado);
    console.log("Cubo activo:", state.cuboActivo);
    console.log("CLUES disponibles:", state.cluesDisponibles.length);
    console.log("CLUES seleccionadas:", state.cluesSeleccionadas.length);
    console.log("Resultados consulta:", state.resultadosConsulta.length);
    console.log("Instituciones cargadas:", state.institucionesCatalogo.length);
    console.groupEnd();
}

/**
 * Verifica la salud de la aplicación
 */
function verificarSaludAplicacion() {
    const problemas = [];
    
    if (!elementosDOM.catalogoSelect) problemas.push("Select de catálogo no encontrado");
    if (!elementosDOM.cluesSelect) problemas.push("Select de CLUES no encontrado");
    if (!elementosDOM.btnConsultar) problemas.push("Botón consultar no encontrado");
    if (!elementosDOM.spinnerCarga) problemas.push("Spinner no encontrado");
    
    if (problemas.length > 0) {
        console.warn("⚠️ Problemas de salud:", problemas);
        return false;
    }
    
    return true;
}

/**
 * Función global para consultar biológicos (para uso externo)
 */
window.consultarBiologicos = async function() {
    await manejarConsultar();
};

/**
 * Función global para exportar Excel (para uso externo)
 */
window.exportarExcel = async function() {
    await manejarExportarExcel();
};

/**
 * Función global para exportar tabla HTML (para uso externo)
 */
window.exportarTablaHTML = async function() {
    await manejarExportarTablaHTML();
};

/**
 * Función global para limpiar CLUES (para uso externo)
 */
window.limpiarClues = function() {
    manejarLimpiarClues();
};

export {
    state,
    elementosDOM,
    manejarConsultar,
    manejarExportarExcel,
    manejarExportarTablaHTML,
    manejarLimpiarClues,
    mostrarEstadoAplicacion,
    verificarSaludAplicacion
};
if (process.env.NODE_ENV === 'development') {
    window.appState = state;
    window.appElements = elementosDOM;
    window.appUtils = {
        mostrarEstado: mostrarEstadoAplicacion,
        verificarSalud: verificarSaludAplicacion
    };
}

console.log("🚀 Aplicación lista para usar");