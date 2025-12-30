// ui.js
import { 
    SELECT2_CONFIG, 
    CLASES_CSS,
    MENSAJES
} from './constants.js';
import { ocultarAccionesSelect2 } from './utils.js';

// ===============================
// INICIALIZACIÓN DE COMPONENTES UI
// ===============================

/**
 * Inicializa el componente Select2 para el select de CLUES
 * @param {Object} options - Opciones adicionales para Select2
 * @returns {Object} Instancia de Select2
 */
export function inicializarSelect2(options = {}) {
    const config = {
        ...SELECT2_CONFIG.CLUES,
        ...options
    };
    
    const $select = $('#cluesSelect');
    
    if (!$select.length) {
        console.warn('Select2: Elemento #cluesSelect no encontrado');
        return null;
    }
    
    // Inicializar Select2
    const select2Instance = $select.select2(config);
    
    // Configurar eventos personalizados
    configurarEventosSelect2($select);
    
    console.log('✅ Select2 inicializado correctamente');
    return select2Instance;
}

/**
 * Configura los eventos personalizados para Select2
 * @param {jQuery} $select - Elemento jQuery del select
 */
function configurarEventosSelect2($select) {
    // Evento al abrir el dropdown
    $select.on('select2:open', function () {
        manejarAperturaDropdown($select);
    });
    
    // Evento al cerrar el dropdown
    $select.on('select2:close', function () {
        setTimeout(() => {
            ocultarAccionesSelect2();
        }, 100);
    });
    
    // Evento al cambiar selección
    $select.on('change', function () {
        const seleccionadas = $select.val() || [];
        console.log(`🔍 CLUES seleccionadas: ${seleccionadas.length}`);
        
        // Disparar evento personalizado
        const event = new CustomEvent('clues-seleccionadas', {
            detail: { seleccionadas }
        });
        document.dispatchEvent(event);
    });
}

/**
 * Maneja la apertura del dropdown de Select2
 * @param {jQuery} $select - Elemento jQuery del select
 */
function manejarAperturaDropdown($select) {
    const dropdown = $('.select2-dropdown');
    
    // Evitar duplicados
    if (dropdown.find('.select2-actions').length) {
        return;
    }
    
    // Agregar botones de acción
    const acciones = $(SELECT2_CONFIG.HTML_BOTONES_SELECCION);
    dropdown.prepend(acciones);
    
    // Configurar eventos de los botones
    configurarBotonesSeleccionRapida($select);
}

/**
 * Configura los botones de selección rápida
 * @param {jQuery} $select - Elemento jQuery del select
 */
function configurarBotonesSeleccionRapida($select) {
    // Seleccionar todas HG
    $('#btnSelectAllHG').off('click').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const cluesDisponibles = obtenerCluesDisponibles();
        if (!cluesDisponibles) return;
        
        const seleccionadas = cluesDisponibles.filter(c => c.startsWith("HG"));
        $select.val(seleccionadas).trigger('change');
        
        ocultarAccionesSelect2();
        $select.select2('close');
        
        console.log(`✅ Seleccionadas todas HG: ${seleccionadas.length} CLUES`);
    });
    
    // Seleccionar todas HGIMB
    $('#btnSelectAllHGIMB').off('click').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const cluesDisponibles = obtenerCluesDisponibles();
        if (!cluesDisponibles) return;
        
        $select.val(cluesDisponibles).trigger('change');
        
        ocultarAccionesSelect2();
        $select.select2('close');
        
        console.log(`✅ Seleccionadas todas HGIMB: ${cluesDisponibles.length} CLUES`);
    });
}

/**
 * Obtiene las CLUES disponibles del select
 * @returns {Array} Array de CLUES disponibles
 */
function obtenerCluesDisponibles() {
    const options = $('#cluesSelect option');
    if (!options.length) return null;
    
    return Array.from(options).map(opt => opt.value).filter(v => v);
}

// ===============================
// GESTIÓN DE INTERFAZ
// ===============================

/**
 * Actualiza el select de CLUES con nuevas opciones
 * @param {Array} clues - Array de CLUES disponibles
 * @param {boolean} mantenerSeleccion - Si mantener la selección actual
 */
export function actualizarSelectClues(clues, mantenerSeleccion = false) {
    const $select = $('#cluesSelect');
    const seleccionActual = mantenerSeleccion ? $select.val() || [] : [];
    
    // Limpiar opciones existentes
    $select.empty();
    
    // Agregar nuevas opciones
    if (clues && Array.isArray(clues)) {
        clues.forEach(clue => {
            $select.append(new Option(clue, clue));
        });
        
        // Restaurar selección si es necesario
        if (mantenerSeleccion && seleccionActual.length > 0) {
            const seleccionValida = seleccionActual.filter(clue => 
                clues.includes(clue)
            );
            $select.val(seleccionValida).trigger('change');
        }
        
        // Habilitar select
        $select.prop('disabled', false);
        
        console.log(`✅ Select de CLUES actualizado: ${clues.length} opciones`);
    } else {
        console.warn('⚠️ No se proporcionaron CLUES para actualizar el select');
    }
}

/**
 * Resetea toda la interfaz a su estado inicial
 * @param {Object} elementos - Elementos DOM opcionales
 */
export function resetearInterfaz(elementos = {}) {
    // Obtener elementos DOM
    const {
        tablaHeader,
        variablesHeader,
        tablaResultadosBody,
        tablaFooter,
        resumenConsulta,
        resultadosContainer,
        btnConsultar,
        btnExportar,
        btnExportarSimple,
        cluesSelect,
        mensajeCluesCargadas
    } = obtenerElementosDOM(elementos);
    
    // 1. Limpiar tabla de resultados
    if (tablaHeader) tablaHeader.innerHTML = "";
    if (variablesHeader) variablesHeader.innerHTML = "";
    if (tablaResultadosBody) tablaResultadosBody.innerHTML = "";
    if (tablaFooter) tablaFooter.innerHTML = "";
    if (resumenConsulta) resumenConsulta.innerHTML = "";
    
    // 2. Ocultar secciones
    if (resultadosContainer) {
        resultadosContainer.classList.add(CLASES_CSS.D_NONE);
    }
    
    if (mensajeCluesCargadas) {
        mensajeCluesCargadas.classList.add(CLASES_CSS.D_NONE);
    }
    
    // 3. Deshabilitar botones
    if (btnConsultar) {
        btnConsultar.disabled = true;
    }
    
    if (btnExportar) {
        btnExportar.disabled = true;
    }
    
    // btnExportarSimple se mantiene habilitado por diseño
    
    // 4. Limpiar y deshabilitar select de CLUES
    if (cluesSelect) {
        $('#cluesSelect').empty().trigger('change');
        cluesSelect.disabled = true;
    }
    
    // 5. Limpiar cualquier notificación
    limpiarNotificaciones();
    
    console.log('🧹 Interfaz reseteada');
}

/**
 * Obtiene elementos DOM, usando los proporcionados o buscándolos
 * @param {Object} elementos - Elementos DOM proporcionados
 * @returns {Object} Elementos DOM
 */
function obtenerElementosDOM(elementos) {
    return {
        tablaHeader: elementos.tablaHeader || document.getElementById('tablaHeader'),
        variablesHeader: elementos.variablesHeader || document.getElementById('variablesHeader'),
        tablaResultadosBody: elementos.tablaResultadosBody || document.getElementById('tablaResultadosBody'),
        tablaFooter: elementos.tablaFooter || document.getElementById('tablaFooter'),
        resumenConsulta: elementos.resumenConsulta || document.getElementById('resumenConsulta'),
        resultadosContainer: elementos.resultadosContainer || document.getElementById('resultadosContainer'),
        btnConsultar: elementos.btnConsultar || document.getElementById('btnConsultar'),
        btnExportar: elementos.btnExportar || document.getElementById('btnExportar'),
        btnExportarSimple: elementos.btnExportarSimple || document.getElementById('btnExportarSimple'),
        cluesSelect: elementos.cluesSelect || document.getElementById('cluesSelect'),
        mensajeCluesCargadas: elementos.mensajeCluesCargadas || document.getElementById('mensajeCluesCargadas')
    };
}

/**
 * Actualiza el estado de los botones según el estado de la aplicación
 * @param {Object} estado - Estado de la aplicación
 */
export function actualizarEstadoBotones(estado = {}) {
    const {
        cluesDisponibles = [],
        cluesSeleccionadas = [],
        resultadosConsulta = []
    } = estado;
    
    const elementos = obtenerElementosDOM({});
    
    // Botón Consultar
    if (elementos.btnConsultar) {
        elementos.btnConsultar.disabled = cluesSeleccionadas.length === 0;
    }
    
    // Botón Exportar
    if (elementos.btnExportar) {
        elementos.btnExportar.disabled = resultadosConsulta.length === 0;
    }
    
    // Select de CLUES
    if (elementos.cluesSelect) {
        elementos.cluesSelect.disabled = cluesDisponibles.length === 0;
    }
    
    console.log('🔘 Estado de botones actualizado');
}

// ===============================
// GESTIÓN DE NOTIFICACIONES Y MENSAJES
// ===============================

/**
 * Muestra una notificación en la interfaz
 * @param {string} tipo - Tipo de notificación: 'success', 'error', 'warning', 'info'
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos (0 = permanente)
 */
export function mostrarNotificacion(tipo, mensaje, duracion = 5000) {
    // Crear contenedor de notificaciones si no existe
    let contenedor = document.getElementById('notificaciones-container');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'notificaciones-container';
        contenedor.className = 'notificaciones-container';
        document.body.appendChild(contenedor);
    }
    
    // Crear notificación
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show`;
    notificacion.role = 'alert';
    notificacion.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Agregar al contenedor
    contenedor.appendChild(notificacion);
    
    // Auto-eliminar si tiene duración
    if (duracion > 0) {
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, duracion);
    }
    
    console.log(`📢 Notificación [${tipo}]: ${mensaje}`);
}

/**
 * Muestra un mensaje de éxito
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarExito(mensaje, duracion = 3000) {
    mostrarNotificacion('success', mensaje, duracion);
}

/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarError(mensaje, duracion = 0) {
    mostrarNotificacion('danger', mensaje, duracion);
}

/**
 * Muestra un mensaje de advertencia
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarAdvertencia(mensaje, duracion = 4000) {
    mostrarNotificacion('warning', mensaje, duracion);
}

/**
 * Muestra un mensaje informativo
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarInfo(mensaje, duracion = 3000) {
    mostrarNotificacion('info', mensaje, duracion);
}

/**
 * Limpia todas las notificaciones
 */
export function limpiarNotificaciones() {
    const contenedor = document.getElementById('notificaciones-container');
    if (contenedor) {
        contenedor.innerHTML = '';
    }
}

// ===============================
// GESTIÓN DE SPINNER/CARGANDO
// ===============================

/**
 * Muestra el spinner de carga
 * @param {HTMLElement} spinnerElement - Elemento spinner (opcional)
 */
export function mostrarSpinner(spinnerElement = null) {
    const spinner = spinnerElement || document.getElementById('spinnerCarga');
    
    if (spinner) {
        spinner.classList.remove(CLASES_CSS.D_NONE);
        spinner.style.display = 'flex';
        
        // Deshabilitar interacciones mientras carga
        deshabilitarInteracciones(true);
        
        console.log('🔄 Spinner mostrado');
    }
}

/**
 * Oculta el spinner de carga
 * @param {HTMLElement} spinnerElement - Elemento spinner (opcional)
 */
export function ocultarSpinner(spinnerElement = null) {
    const spinner = spinnerElement || document.getElementById('spinnerCarga');
    
    if (spinner) {
        spinner.classList.add(CLASES_CSS.D_NONE);
        spinner.style.display = 'none';
        
        // Re-habilitar interacciones
        deshabilitarInteracciones(false);
        
        console.log('✅ Spinner ocultado');
    }
}

/**
 * Deshabilita o habilita las interacciones de la interfaz
 * @param {boolean} deshabilitar - True para deshabilitar, false para habilitar
 */
function deshabilitarInteracciones(deshabilitar) {
    const elementosInteractivos = [
        '#btnCargarClues',
        '#btnConsultar',
        '#btnExportar',
        '#btnExportarSimple',
        '#btnLimpiarClues',
        '#catalogoSelect',
        '#cluesSelect'
    ];
    
    elementosInteractivos.forEach(selector => {
        const elemento = document.querySelector(selector);
        if (elemento) {
            elemento.disabled = deshabilitar;
            
            if (deshabilitar) {
                elemento.classList.add('disabled');
            } else {
                elemento.classList.remove('disabled');
            }
        }
    });
}

// ===============================
// GESTIÓN DE RESULTADOS
// ===============================

/**
 * Muestra la sección de resultados
 * @param {Object} data - Datos de la consulta
 * @param {Object} elementos - Elementos DOM opcionales
 */
export function mostrarResultados(data, elementos = {}) {
    const {
        resultadosContainer,
        resumenConsulta
    } = obtenerElementosDOM(elementos);
    
    // Mostrar contenedor
    if (resultadosContainer) {
        resultadosContainer.classList.remove(CLASES_CSS.D_NONE);
        
        // Animar aparición
        resultadosContainer.style.opacity = '0';
        resultadosContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultadosContainer.style.transition = 'all 0.3s ease';
            resultadosContainer.style.opacity = '1';
            resultadosContainer.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // Actualizar resumen
    if (resumenConsulta && data) {
        resumenConsulta.innerHTML = `
            <strong>Catálogo: </strong>${data.catalogo || 'N/A'} –
            <strong>Cubo: </strong>${data.cubo || 'N/A'} –
            <strong>CLUES consultadas: </strong>${data.metadata?.total_clues_procesadas || 'N/A'}
        `;
    }
    
    console.log('📊 Resultados mostrados');
}

/**
 * Oculta la sección de resultados
 * @param {Object} elementos - Elementos DOM opcionales
 */
export function ocultarResultados(elementos = {}) {
    const { resultadosContainer } = obtenerElementosDOM(elementos);
    
    if (resultadosContainer) {
        resultadosContainer.classList.add(CLASES_CSS.D_NONE);
        console.log('📊 Resultados ocultados');
    }
}

// ===============================
// GESTIÓN DE FORMULARIOS
// ===============================

/**
 * Valida el formulario de consulta
 * @returns {Object} Resultado de la validación
 */
export function validarFormularioConsulta() {
    const catalogo = document.getElementById('catalogoSelect')?.value;
    const cluesSeleccionadas = $('#cluesSelect').val() || [];
    
    const errores = [];
    
    if (!catalogo) {
        errores.push('Por favor, selecciona un catálogo.');
    }
    
    if (cluesSeleccionadas.length === 0) {
        errores.push('Por favor, selecciona al menos una CLUES.');
    }
    
    return {
        valido: errores.length === 0,
        errores,
        datos: {
            catalogo,
            cluesSeleccionadas
        }
    };
}

/**
 * Muestra errores de validación en el formulario
 * @param {Array} errores - Lista de errores
 */
export function mostrarErroresValidacion(errores) {
    // Limpiar errores anteriores
    limpiarErroresValidacion();
    
    if (!errores || errores.length === 0) return;
    
    // Crear contenedor de errores
    let contenedorErrores = document.getElementById('errores-validacion');
    if (!contenedorErrores) {
        contenedorErrores = document.createElement('div');
        contenedorErrores.id = 'errores-validacion';
        contenedorErrores.className = 'alert alert-danger';
        
        const formulario = document.querySelector('form') || document.body;
        formulario.prepend(contenedorErrores);
    }
    
    // Agregar errores
    errores.forEach(error => {
        const errorElement = document.createElement('p');
        errorElement.className = 'mb-1';
        errorElement.textContent = error;
        contenedorErrores.appendChild(errorElement);
    });
    
    // Resaltar campos con error
    if (errores.some(e => e.includes('catálogo'))) {
        const selectCatalogo = document.getElementById('catalogoSelect');
        if (selectCatalogo) {
            selectCatalogo.classList.add('is-invalid');
        }
    }
    
    if (errores.some(e => e.includes('CLUES'))) {
        const selectClues = document.getElementById('cluesSelect');
        if (selectClues) {
            selectClues.classList.add('is-invalid');
        }
    }
}

/**
 * Limpia los errores de validación
 */
export function limpiarErroresValidacion() {
    // Remover contenedor de errores
    const contenedorErrores = document.getElementById('errores-validacion');
    if (contenedorErrores) {
        contenedorErrores.remove();
    }
    
    // Limpiar clases de error de los campos
    const campos = [
        document.getElementById('catalogoSelect'),
        document.getElementById('cluesSelect')
    ];
    
    campos.forEach(campo => {
        if (campo) {
            campo.classList.remove('is-invalid');
        }
    });
}

// ===============================
// UTILIDADES DE UI
// ===============================

/**
 * Configura tooltips de Bootstrap
 */
export function configurarTooltips() {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(el => {
        new bootstrap.Tooltip(el);
    });
    
    console.log(`🔧 ${tooltips.length} tooltips configurados`);
}

/**
 * Configura popovers de Bootstrap
 */
export function configurarPopovers() {
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach(el => {
        new bootstrap.Popover(el);
    });
    
    console.log(`🔧 ${popovers.length} popovers configurados`);
}

/**
 * Actualiza el título de la página dinámicamente
 * @param {string} texto - Texto para agregar al título
 */
export function actualizarTituloPagina(texto = '') {
    const tituloBase = 'Sistema de Consulta de Biológicos';
    document.title = texto ? `${tituloBase} - ${texto}` : tituloBase;
}

/**
 * Crea un elemento DOM dinámicamente
 * @param {string} tag - Tag del elemento
 * @param {Object} atributos - Atributos del elemento
 * @param {string|HTMLElement} contenido - Contenido del elemento
 * @returns {HTMLElement} Elemento creado
 */
export function crearElemento(tag, atributos = {}, contenido = '') {
    const elemento = document.createElement(tag);
    
    // Establecer atributos
    Object.entries(atributos).forEach(([key, value]) => {
        if (key === 'className') {
            elemento.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                elemento.dataset[dataKey] = dataValue;
            });
        } else {
            elemento.setAttribute(key, value);
        }
    });
    
    // Establecer contenido
    if (typeof contenido === 'string') {
        elemento.innerHTML = contenido;
    } else if (contenido instanceof HTMLElement) {
        elemento.appendChild(contenido);
    } else if (Array.isArray(contenido)) {
        contenido.forEach(child => {
            if (child instanceof HTMLElement) {
                elemento.appendChild(child);
            }
        });
    }
    
    return elemento;
}

/**
 * Descarga un archivo desde un blob
 * @param {Blob} blob - Blob del archivo
 * @param {string} nombre - Nombre del archivo
 */
export function descargarArchivo(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`💾 Archivo descargado: ${nombre}`);
}

// ===============================
// MANEJADORES DE EVENTOS
// ===============================

/**
 * Agrega un event listener con manejo de errores
 * @param {string|HTMLElement} elemento - Elemento o selector
 * @param {string} evento - Tipo de evento
 * @param {Function} manejador - Función manejadora
 * @param {Object} options - Opciones del event listener
 */
export function agregarEventListener(elemento, evento, manejador, options = {}) {
    try {
        const target = typeof elemento === 'string' 
            ? document.querySelector(elemento) 
            : elemento;
        
        if (!target) {
            console.warn(`Elemento no encontrado: ${elemento}`);
            return;
        }
        
        target.addEventListener(evento, manejador, options);
        console.log(`🎯 Event listener agregado: ${evento} en ${elemento}`);
    } catch (error) {
        console.error(`Error al agregar event listener: ${error.message}`);
    }
}

/**
 * Elimina un event listener
 * @param {string|HTMLElement} elemento - Elemento o selector
 * @param {string} evento - Tipo de evento
 * @param {Function} manejador - Función manejadora
 */
export function removerEventListener(elemento, evento, manejador) {
    try {
        const target = typeof elemento === 'string' 
            ? document.querySelector(elemento) 
            : elemento;
        
        if (!target) return;
        
        target.removeEventListener(evento, manejador);
        console.log(`🎯 Event listener removido: ${evento} en ${elemento}`);
    } catch (error) {
        console.error(`Error al remover event listener: ${error.message}`);
    }
}

// ===============================
// INICIALIZACIÓN COMPLETA DE UI
// ===============================

/**
 * Inicializa todos los componentes de UI
 * @param {Object} config - Configuración adicional
 */
export function inicializarUI(config = {}) {
    console.log('🚀 Inicializando interfaz de usuario...');
    
    try {
        // 1. Inicializar Select2
        inicializarSelect2(config.select2);
        
        // 2. Configurar tooltips y popovers
        configurarTooltips();
        configurarPopovers();
        
        // 3. Actualizar título
        actualizarTituloPagina();
        
        // 4. Aplicar tema si está configurado
        if (config.tema) {
            aplicarTema(config.tema);
        }
        
        // 5. Inicializar componentes adicionales
        inicializarComponentesAdicionales();
        
        console.log('✅ Interfaz de usuario inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar UI:', error);
        mostrarError('Error al inicializar la interfaz de usuario');
    }
}

/**
 * Inicializa componentes adicionales de UI
 */
function inicializarComponentesAdicionales() {
    // Puedes agregar aquí la inicialización de otros componentes
    // como modales, acordeones, tabs, etc.
}

/**
 * Aplica un tema a la interfaz
 * @param {string} tema - Nombre del tema: 'claro', 'oscuro'
 */
export function aplicarTema(tema) {
    document.body.setAttribute('data-bs-theme', tema);
    localStorage.setItem('tema-preferido', tema);
    
    console.log(`🎨 Tema aplicado: ${tema}`);
}

// ===============================
// EXPORTACIÓN POR DEFECTO
// ===============================

export default {
    // Inicialización
    inicializarSelect2,
    inicializarUI,
    configurarTooltips,
    configurarPopovers,
    
    // Gestión de interfaz
    resetearInterfaz,
    actualizarSelectClues,
    actualizarEstadoBotones,
    mostrarResultados,
    ocultarResultados,
    
    // Notificaciones
    mostrarNotificacion,
    mostrarExito,
    mostrarError,
    mostrarAdvertencia,
    mostrarInfo,
    limpiarNotificaciones,
    
    // Spinner
    mostrarSpinner,
    ocultarSpinner,
    
    // Formularios
    validarFormularioConsulta,
    mostrarErroresValidacion,
    limpiarErroresValidacion,
    
    // Utilidades
    actualizarTituloPagina,
    crearElemento,
    descargarArchivo,
    aplicarTema,
    
    // Eventos
    agregarEventListener,
    removerEventListener
};