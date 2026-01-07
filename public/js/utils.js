import { 
    CLASES_CSS
} from './constants.js';
let institucionesCatalogo = [];

/**
 * Muestra el spinner de carga
 * @param {HTMLElement} spinnerElement - Elemento spinner específico (opcional)
 */
export function mostrarSpinner(spinnerElement = null) {
    const spinner = spinnerElement || document.getElementById('spinnerCarga');
    
    if (spinner) {
        spinner.classList.remove(CLASES_CSS.D_NONE);
        console.log('🔄 Spinner mostrado');
    } else {
        console.warn('⚠️ No se encontró el elemento spinner');
    }
}

/**
 * Oculta el spinner de carga
 * @param {HTMLElement} spinnerElement - Elemento spinner específico (opcional)
 */
export function ocultarSpinner(spinnerElement = null) {
    const spinner = spinnerElement || document.getElementById('spinnerCarga');
    
    if (spinner) {
        spinner.classList.add(CLASES_CSS.D_NONE);
        console.log('✅ Spinner ocultado');
    }
}

/**
 * Crea y muestra un spinner flotante
 * @param {string} mensaje - Mensaje a mostrar junto al spinner
 * @returns {HTMLElement} El elemento spinner creado
 */
export function mostrarSpinnerFlotante(mensaje = 'Cargando...') {
    const spinnerContainer = document.createElement('div');
    spinnerContainer.id = 'spinner-flotante';
    spinnerContainer.className = 'spinner-flotante';
    spinnerContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        flex-direction: column;
    `;
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-light';
    spinner.style.cssText = 'width: 3rem; height: 3rem;';
    spinner.setAttribute('role', 'status');
    const texto = document.createElement('p');
    texto.className = 'text-light mt-3';
    texto.textContent = mensaje;
    texto.style.cssText = 'font-size: 1.2rem;';
    spinnerContainer.appendChild(spinner);
    spinnerContainer.appendChild(texto);
    document.body.appendChild(spinnerContainer);
    
    console.log(`🔄 Spinner flotante mostrado: ${mensaje}`);
    return spinnerContainer;
}

/**
 * Oculta y elimina un spinner flotante
 * @param {HTMLElement} spinnerContainer - Contenedor del spinner flotante
 */
export function ocultarSpinnerFlotante(spinnerContainer = null) {
    const spinner = spinnerContainer || document.getElementById('spinner-flotante');
    
    if (spinner && spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
        console.log('✅ Spinner flotante ocultado');
    }
}

/**
 * Configura el catálogo de instituciones
 * @param {Array} instituciones - Array de instituciones
 */
export function configurarInstituciones(instituciones) {
    if (Array.isArray(instituciones)) {
        institucionesCatalogo = instituciones;
        console.log(`✅ Instituciones configuradas: ${instituciones.length} registros`);
    } else {
        console.warn('⚠️ Se intentó configurar instituciones con datos inválidos');
    }
}

/**
 * Obtiene las iniciales de una institución por su ID
 * @param {number|string} id - ID de la institución
 * @returns {string} Iniciales de la institución o cadena vacía si no se encuentra
 */
export function obtenerInicialesInstitucion(id) {
    if (!id) return "";
    
    const idFixed = id.toString().padStart(2, "0");
    const institucion = institucionesCatalogo.find(
        i => i.idinstitucion.toString().padStart(2, "0") === idFixed
    );
    
    return institucion ? institucion.iniciales : "";
}

/**
 * Obtiene el nombre completo de una institución por su ID
 * @param {number|string} id - ID de la institución
 * @returns {string} Nombre completo de la institución
 */
export function obtenerNombreCompletoInstitucion(id) {
    if (!id) return "";
    
    const idFixed = id.toString().padStart(2, "0");
    const institucion = institucionesCatalogo.find(
        i => i.idinstitucion.toString().padStart(2, "0") === idFixed
    );
    
    return institucion ? institucion.nombre : "";
}

/**
 * Obtiene todas las instituciones del catálogo
 * @returns {Array} Copia del catálogo de instituciones
 */
export function obtenerInstitucionesCatalogo() {
    return [...institucionesCatalogo];
}

/**
 * Oculta las acciones personalizadas de Select2
 */
export function ocultarAccionesSelect2() {
    const elementos = document.querySelectorAll('.select2-actions');
    elementos.forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
}

/**
 * Limpia y deshabilita el select de CLUES
 * @param {HTMLElement} selectElement - Elemento select (opcional)
 */
export function limpiarSelectClues(selectElement = null) {
    const select = selectElement || document.getElementById('cluesSelect');
    
    if (select) {
        $(select).empty().trigger('change');
        select.disabled = true;
        console.log('🧹 Select de CLUES limpiado');
    }
}

/**
 * Convierte un número de columna a letra de Excel (1 -> A, 2 -> B, etc.)
 * @param {number} numero - Número de columna (comenzando en 1)
 * @returns {string} Letra de columna de Excel
 */
export function numeroALetra(numero) {
    if (typeof numero !== 'number' || numero <= 0) {
        console.warn('Número de columna inválido:', numero);
        return '';
    }
    
    let letra = '';
    let n = numero;
    
    while (n > 0) {
        let temp = (n - 1) % 26;
        letra = String.fromCharCode(temp + 65) + letra;
        n = Math.floor((n - temp - 1) / 26);
    }
    
    return letra;
}

/**
 * Convierte una letra de columna de Excel a número (A -> 1, B -> 2, etc.)
 * @param {string} letra - Letra de columna de Excel
 * @returns {number} Número de columna
 */
export function letraANumero(letra) {
    if (!letra || typeof letra !== 'string') {
        console.warn('Letra de columna inválida:', letra);
        return 0;
    }
    
    let numero = 0;
    letra = letra.toUpperCase();
    
    for (let i = 0; i < letra.length; i++) {
        const charCode = letra.charCodeAt(i) - 64;
        if (charCode < 1 || charCode > 26) {
            console.warn('Carácter inválido en letra de columna:', letra[i]);
            return 0;
        }
        numero = numero * 26 + charCode;
    }
    
    return numero;
}

/**
 * Formatea una fecha a string legible
 * @param {Date|string} fecha - Fecha a formatear
 * @param {string} formato - Formato deseado (default: 'DD/MM/YYYY HH:mm')
 * @returns {string} Fecha formateada
 */
export function formatearFecha(fecha, formato = 'DD/MM/YYYY HH:mm') {
    let fechaObj;
    
    if (!fecha) {
        return 'Fecha no disponible';
    }
    
    if (fecha instanceof Date) {
        fechaObj = fecha;
    } else if (typeof fecha === 'string') {
        fechaObj = new Date(fecha);
        
        if (isNaN(fechaObj.getTime())) {
            return 'Fecha inválida';
        }
    } else {
        return 'Formato de fecha no soportado';
    }
    
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaObj.getFullYear();
    const horas = fechaObj.getHours().toString().padStart(2, '0');
    const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
    const segundos = fechaObj.getSeconds().toString().padStart(2, '0');
    
    const formatos = {
        'DD/MM/YYYY': `${dia}/${mes}/${anio}`,
        'YYYY-MM-DD': `${anio}-${mes}-${dia}`,
        'DD/MM/YYYY HH:mm': `${dia}/${mes}/${anio} ${horas}:${minutos}`,
        'DD/MM/YYYY HH:mm:ss': `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`,
        'HH:mm': `${horas}:${minutos}`,
        'HH:mm:ss': `${horas}:${minutos}:${segundos}`
    };
    
    return formatos[formato] || `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}

/**
 * Obtiene la fecha y hora actual formateada
 * @param {string} formato - Formato deseado
 * @returns {string} Fecha y hora actual formateada
 */
export function obtenerFechaActual(formato = 'DD/MM/YYYY HH:mm') {
    return formatearFecha(new Date(), formato);
}

/**
 * Calcula la diferencia entre dos fechas en formato legible
 * @param {Date|string} fechaInicio - Fecha de inicio
 * @param {Date|string} fechaFin - Fecha de fin (default: ahora)
 * @returns {string} Diferencia formateada
 */
export function calcularDuracion(fechaInicio, fechaFin = new Date()) {
    try {
        const inicio = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
        const fin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);
        
        if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
            return 'Duración no disponible';
        }
        
        const diferenciaMs = Math.abs(fin - inicio);
        const segundos = Math.floor(diferenciaMs / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        
        if (horas > 0) {
            return `${horas}h ${minutos % 60}m ${segundos % 60}s`;
        } else if (minutos > 0) {
            return `${minutos}m ${segundos % 60}s`;
        } else {
            return `${segundos}s`;
        }
    } catch (error) {
        console.error('Error calculando duración:', error);
        return 'Error calculando duración';
    }
}

/**
 * Descarga un archivo desde un Blob
 * @param {Blob} blob - Blob del archivo
 * @param {string} nombre - Nombre del archivo
 */
export function descargarArchivo(blob, nombre) {
    if (!(blob instanceof Blob)) {
        console.error('El parámetro blob debe ser una instancia de Blob');
        return;
    }
    
    try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombre;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        console.log(`💾 Archivo descargado: ${nombre} (${formatBytes(blob.size)})`);
    } catch (error) {
        console.error('Error al descargar archivo:', error);
        throw error;
    }
}

/**
 * Formatea bytes a un string legible
 * @param {number} bytes - Cantidad de bytes
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Bytes formateados
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Valida si un valor es un array no vacío
 * @param {*} valor - Valor a validar
 * @returns {boolean} True si es un array no vacío
 */
export function esArrayNoVacio(valor) {
    return Array.isArray(valor) && valor.length > 0;
}

/**
 * Valida si un valor es un objeto no vacío
 * @param {*} valor - Valor a validar
 * @returns {boolean} True si es un objeto no vacío
 */
export function esObjetoNoVacio(valor) {
    return valor && typeof valor === 'object' && !Array.isArray(valor) && Object.keys(valor).length > 0;
}

/**
 * Valida si un string no está vacío
 * @param {*} valor - Valor a validar
 * @returns {boolean} True si es un string no vacío
 */
export function esStringNoVacio(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}

/**
 * Valida si un número es positivo
 * @param {*} valor - Valor a validar
 * @returns {boolean} True si es un número positivo
 */
export function esNumeroPositivo(valor) {
    return typeof valor === 'number' && !isNaN(valor) && valor >= 0;
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 */
export function validarEmail(email) {
    if (!esStringNoVacio(email)) return false;
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export function capitalizar(str) {
    if (!esStringNoVacio(str)) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formatea un número con separadores de miles
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Número de decimales
 * @returns {string} Número formateado
 */
export function formatearNumero(numero, decimales = 0) {
    if (typeof numero !== 'number' || isNaN(numero)) {
        return '0';
    }
    
    return numero.toLocaleString('es-MX', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    });
}

/**
 * Trunca un string si excede una longitud máxima
 * @param {string} str - String a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo a agregar (default: '...')
 * @returns {string} String truncado
 */
export function truncarString(str, maxLength = 50, suffix = '...') {
    if (!esStringNoVacio(str)) return str;
    
    if (str.length <= maxLength) return str;
    
    return str.substring(0, maxLength) + suffix;
}

/**
 * Elimina acentos de un string
 * @param {string} str - String con acentos
 * @returns {string} String sin acentos
 */
export function eliminarAcentos(str) {
    if (!esStringNoVacio(str)) return str;
    
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * Elimina duplicados de un array
 * @param {Array} array - Array con posibles duplicados
 * @returns {Array} Array sin duplicados
 */
export function eliminarDuplicados(array) {
    if (!Array.isArray(array)) return [];
    
    return [...new Set(array)];
}

/**
 * Agrupa un array de objetos por una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} propiedad - Propiedad por la que agrupar
 * @returns {Object} Objeto con los grupos
 */
export function agruparPor(array, propiedad) {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((grupos, item) => {
        const key = item[propiedad];
        if (!grupos[key]) {
            grupos[key] = [];
        }
        grupos[key].push(item);
        return grupos;
    }, {});
}

/**
 * Ordena un array de objetos por una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} propiedad - Propiedad por la que ordenar
 * @param {string} orden - 'asc' o 'desc'
 * @returns {Array} Array ordenado
 */
export function ordenarPor(array, propiedad, orden = 'asc') {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
        const valorA = a[propiedad];
        const valorB = b[propiedad];
        
        if (valorA < valorB) return orden === 'asc' ? -1 : 1;
        if (valorA > valorB) return orden === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Filtra un array de objetos por múltiples criterios
 * @param {Array} array - Array de objetos
 * @param {Object} filtros - Objeto con criterios de filtrado
 * @returns {Array} Array filtrado
 */
export function filtrarPor(array, filtros) {
    if (!Array.isArray(array)) return [];
    
    return array.filter(item => {
        return Object.entries(filtros).every(([key, value]) => {
            if (value === undefined || value === null) return true;
            
            const itemValue = item[key];
            
            if (typeof value === 'function') {
                return value(itemValue);
            }
            
            if (Array.isArray(value)) {
                return value.includes(itemValue);
            }
            
            if (typeof value === 'object' && value !== null) {
                if (value.min !== undefined && value.max !== undefined) {
                    return itemValue >= value.min && itemValue <= value.max;
                }
                if (value.min !== undefined) {
                    return itemValue >= value.min;
                }
                if (value.max !== undefined) {
                    return itemValue <= value.max;
                }
            }
            
            return itemValue === value;
        });
    });
}

/**
 * Maneja errores de forma consistente
 * @param {Error|string} error - Error a manejar
 * @param {string} contexto - Contexto donde ocurrió el error
 * @param {boolean} mostrarAlerta - Si mostrar alerta al usuario
 */
export function manejarError(error, contexto = 'Operación', mostrarAlerta = true) {
    const mensaje = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : null;
    
    console.error(`❌ Error en ${contexto}:`, {
        mensaje,
        stack,
        timestamp: new Date().toISOString()
    });
    
    if (mostrarAlerta) {
        const mensajeUsuario = `Error en ${contexto}: ${mensaje}`;
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', mensajeUsuario, 0);
        } else {
            alert(mensajeUsuario);
        }
    }
    return {
        error: true,
        mensaje,
        contexto,
        timestamp: new Date().toISOString()
    };
}

/**
 * Función segura para ejecutar código con manejo de errores
 * @param {Function} funcion - Función a ejecutar
 * @param {*} args - Argumentos para la función
 * @returns {Object} Resultado de la ejecución
 */
export function ejecutarSeguro(funcion, ...args) {
    try {
        const resultado = funcion(...args);
        return {
            success: true,
            data: resultado,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            error: manejarError(error, `ejecutarSeguro: ${funcion.name}`, false)
        };
    }
}

/**
 * Debounce function para limitar la frecuencia de ejecución
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounceada
 */
export function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function para limitar la frecuencia de ejecución
 * @param {Function} func - Función a throttle
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} Función throttleada
 */
export function throttle(func, limit) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Mide el tiempo de ejecución de una función
 * @param {Function} funcion - Función a medir
 * @param {*} args - Argumentos para la función
 * @returns {Object} Resultado y tiempo de ejecución
 */
export function medirTiempoEjecucion(funcion, ...args) {
    const inicio = performance.now();
    const resultado = funcion(...args);
    const fin = performance.now();
    const duracion = fin - inicio;
    
    console.log(`⏱️ ${funcion.name} ejecutado en ${duracion.toFixed(2)}ms`);
    
    return {
        resultado,
        duracion,
        inicio,
        fin
    };
}

/**
 * Guarda datos en localStorage
 * @param {string} key - Clave
 * @param {*} value - Valor a guardar
 * @param {boolean} stringify - Si stringify el valor
 */
export function guardarEnLocalStorage(key, value, stringify = true) {
    try {
        const data = stringify ? JSON.stringify(value) : value;
        localStorage.setItem(key, data);
        console.log(`💾 Guardado en localStorage: ${key}`);
    } catch (error) {
        console.error(`Error guardando en localStorage (${key}):`, error);
    }
}

/**
 * Obtiene datos de localStorage
 * @param {string} key - Clave
 * @param {boolean} parse - Si parsear el valor
 * @returns {*} Valor almacenado o null
 */
export function obtenerDeLocalStorage(key, parse = true) {
    try {
        const data = localStorage.getItem(key);
        
        if (data === null) {
            return null;
        }
        
        return parse ? JSON.parse(data) : data;
    } catch (error) {
        console.error(`Error obteniendo de localStorage (${key}):`, error);
        return null;
    }
}

/**
 * Elimina datos de localStorage
 * @param {string} key - Clave a eliminar
 */
export function eliminarDeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        console.log(`🗑️ Eliminado de localStorage: ${key}`);
    } catch (error) {
        console.error(`Error eliminando de localStorage (${key}):`, error);
    }
}

/**
 * Limpia todo el localStorage
 */
export function limpiarLocalStorage() {
    try {
        localStorage.clear();
        console.log('🧹 localStorage limpiado completamente');
    } catch (error) {
        console.error('Error limpiando localStorage:', error);
    }
}

/**
 * Log personalizado con niveles
 * @param {string} nivel - Nivel del log: 'debug', 'info', 'warn', 'error'
 * @param {string} mensaje - Mensaje a loguear
 * @param {*} data - Datos adicionales
 */
export function log(nivel, mensaje, data = null) {
    const niveles = ['debug', 'info', 'warn', 'error'];
    const nivelActual = niveles.indexOf(process.env.NODE_ENV === 'development' ? 'debug' : 'info');
    const nivelLog = niveles.indexOf(nivel);
    
    if (nivelLog < nivelActual) return;
    
    const timestamp = new Date().toISOString();
    const prefijos = {
        debug: '🐛 DEBUG',
        info: 'ℹ️ INFO',
        warn: '⚠️ WARN',
        error: '❌ ERROR'
    };
    
    const prefijo = prefijos[nivel] || '📝 LOG';
    
    if (data) {
        console.log(`[${timestamp}] ${prefijo}: ${mensaje}`, data);
    } else {
        console.log(`[${timestamp}] ${prefijo}: ${mensaje}`);
    }
}

/**
 * Obtiene la configuración de la aplicación
 * @returns {Object} Configuración
 */
export function obtenerConfiguracion() {
    const config = obtenerDeLocalStorage('app-config') || {};
    const configPorDefecto = {
        tema: 'claro',
        idioma: 'es',
        notificaciones: true,
        autoGuardar: true,
        resultadosPorPagina: 50
    };
    
    return { ...configPorDefecto, ...config };
}

/**
 * Guarda la configuración de la aplicación
 * @param {Object} config - Configuración a guardar
 */
export function guardarConfiguracion(config) {
    const configActual = obtenerConfiguracion();
    const nuevaConfig = { ...configActual, ...config };
    
    guardarEnLocalStorage('app-config', nuevaConfig);
    console.log('⚙️ Configuración guardada');
}

export default {
    mostrarSpinner,
    ocultarSpinner,
    mostrarSpinnerFlotante,
    ocultarSpinnerFlotante,
    configurarInstituciones,
    obtenerInicialesInstitucion,
    obtenerNombreCompletoInstitucion,
    obtenerInstitucionesCatalogo,
    ocultarAccionesSelect2,
    limpiarSelectClues,
    numeroALetra,
    letraANumero,
    formatearFecha,
    obtenerFechaActual,
    calcularDuracion,
    descargarArchivo,
    formatBytes,
    esArrayNoVacio,
    esObjetoNoVacio,
    esStringNoVacio,
    esNumeroPositivo,
    validarEmail,
    capitalizar,
    formatearNumero,
    truncarString,
    eliminarAcentos,
    eliminarDuplicados,
    agruparPor,
    ordenarPor,
    filtrarPor,
    manejarError,
    ejecutarSeguro,
    debounce,
    throttle,
    medirTiempoEjecucion,
    guardarEnLocalStorage,
    obtenerDeLocalStorage,
    eliminarDeLocalStorage,
    limpiarLocalStorage,
    log,
    obtenerConfiguracion,
    guardarConfiguracion
};