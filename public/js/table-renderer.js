// table-renderer.js
import { obtenerInicialesInstitucion } from './state.js';
import { CLASES_CSS } from './constants.js';

// ===============================
// FUNCIONES PRINCIPALES DE RENDERIZADO
// ===============================

/**
 * Renderiza la tabla principal con los resultados de la consulta
 * @param {Object} data - Datos de la consulta
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 * @param {Array} institucionesCatalogo - Catálogo de instituciones
 */
export function renderTabla(data, elementosDOM, institucionesCatalogo = []) {
    if (!data || !data.resultados || !Array.isArray(data.resultados)) {
        console.warn("Datos inválidos para renderizar tabla");
        return;
    }

    // Validar elementos DOM requeridos
    if (!validarElementosDOM(elementosDOM)) {
        console.error("Elementos DOM requeridos no encontrados");
        return;
    }

    // Limpiar tabla existente
    limpiarTabla(elementosDOM);

    // Crear estructura de apartados
    const { apartados, totales } = analizarEstructuraResultados(data.resultados);

    // Renderizar encabezados
    renderEncabezados(apartados, elementosDOM);

    // Renderizar filas de datos
    renderFilasDatos(data.resultados, apartados, elementosDOM, institucionesCatalogo, totales);

    // Renderizar totales
    renderTotales(apartados, totales, elementosDOM);

    console.log(`✅ Tabla renderizada: ${data.resultados.length} filas, ${Object.keys(apartados).length} apartados`);
}

/**
 * Renderiza una tabla simplificada (vista resumen)
 * @param {Object} data - Datos de la consulta
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 * @param {Array} institucionesCatalogo - Catálogo de instituciones
 */
export function renderTablaResumen(data, elementosDOM, institucionesCatalogo = []) {
    if (!data || !data.resultados || !Array.isArray(data.resultados)) {
        console.warn("Datos inválidos para renderizar tabla resumen");
        return;
    }

    // Validar elementos DOM requeridos
    if (!validarElementosDOM(elementosDOM)) {
        console.error("Elementos DOM requeridos no encontrados");
        return;
    }

    // Limpiar tabla existente
    limpiarTabla(elementosDOM);

    // Encabezados fijos para resumen
    elementosDOM.tablaHeader.innerHTML = `
        <th>CLUES</th>
        <th>Unidad</th>
        <th>Entidad</th>
        <th>Jurisdicción</th>
        <th>Municipio</th>
        <th>Institución</th>
        <th>Total Variables</th>
        <th>Total Valor</th>
    `;

    // Calcular estadísticas por CLUES
    data.resultados.forEach(r => {
        const estadisticas = calcularEstadisticasCLUES(r);
        const fila = `
            <td>${r.clues || ''}</td>
            <td>${r.unidad?.nombre ?? ""}</td>
            <td>${r.unidad?.entidad ?? ""}</td>
            <td>${r.unidad?.jurisdiccion ?? ""}</td>
            <td>${r.unidad?.municipio ?? ""}</td>
            <td>${obtenerInicialesInstitucion(r.unidad?.idinstitucion, institucionesCatalogo)}</td>
            <td>${estadisticas.totalVariables}</td>
            <td>${estadisticas.totalValor}</td>
        `;
        
        elementosDOM.tablaResultadosBody.innerHTML += `<tr>${fila}</tr>`;
    });

    console.log(`✅ Tabla resumen renderizada: ${data.resultados.length} filas`);
}

/**
 * Renderiza una tabla con agrupación por apartado
 * @param {Object} data - Datos de la consulta
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 * @param {Array} institucionesCatalogo - Catálogo de instituciones
 */
export function renderTablaAgrupada(data, elementosDOM, institucionesCatalogo = []) {
    if (!data || !data.resultados || !Array.isArray(data.resultados)) {
        console.warn("Datos inválidos para renderizar tabla agrupada");
        return;
    }

    // Validar elementos DOM requeridos
    if (!validarElementosDOM(elementosDOM)) {
        console.error("Elementos DOM requeridos no encontrados");
        return;
    }

    // Limpiar tabla existente
    limpiarTabla(elementosDOM);

    // Crear estructura agrupada
    const estructura = crearEstructuraAgrupada(data.resultados);

    // Renderizar encabezados agrupados
    renderEncabezadosAgrupados(estructura, elementosDOM);

    // Renderizar datos agrupados
    renderDatosAgrupados(data.resultados, estructura, elementosDOM, institucionesCatalogo);

    console.log(`✅ Tabla agrupada renderizada: ${data.resultados.length} CLUES, ${estructura.length} grupos`);
}

// ===============================
// FUNCIONES AUXILIARES DE RENDERIZADO
// ===============================

/**
 * Analiza la estructura de los resultados para identificar apartados y variables
 * @param {Array} resultados - Resultados de la consulta
 * @returns {Object} Objeto con apartados y totales
 */
function analizarEstructuraResultados(resultados) {
    const apartados = {};
    const totales = {};

    resultados.forEach(r => {
        if (!r.biologicos) return;

        r.biologicos.forEach(ap => {
            if (!apartados[ap.apartado]) {
                apartados[ap.apartado] = [];
            }

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

    return { apartados, totales };
}

/**
 * Renderiza los encabezados de la tabla
 * @param {Object} apartados - Estructura de apartados
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 */
function renderEncabezados(apartados, elementosDOM) {
    // Encabezados fijos
    elementosDOM.tablaHeader.innerHTML = `
        <th rowspan="2">CLUES</th>
        <th rowspan="2">Unidad</th>
        <th rowspan="2">Entidad</th>
        <th rowspan="2">Jurisdicción</th>
        <th rowspan="2">Municipio</th>
        <th rowspan="2">Institución</th>
    `;

    // Encabezados dinámicos (apartados)
    Object.entries(apartados).forEach(([apartado, vars]) => {
        elementosDOM.tablaHeader.innerHTML += `<th colspan="${vars.length}">${apartado}</th>`;
        vars.forEach(v => elementosDOM.variablesHeader.innerHTML += `<th>${v}</th>`);
    });
}

/**
 * Renderiza las filas de datos
 * @param {Array} resultados - Resultados de la consulta
 * @param {Object} apartados - Estructura de apartados
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 * @param {Array} institucionesCatalogo - Catálogo de instituciones
 * @param {Object} totales - Objeto para acumular totales
 */
function renderFilasDatos(resultados, apartados, elementosDOM, institucionesCatalogo, totales) {
    resultados.forEach(r => {
        const fila = crearFilaDatos(r, apartados, institucionesCatalogo, totales);
        elementosDOM.tablaResultadosBody.innerHTML += `<tr>${fila}</tr>`;
    });
}

/**
 * Crea una fila de datos para una CLUES
 * @param {Object} resultado - Resultado de una CLUES
 * @param {Object} apartados - Estructura de apartados
 * @param {Array} institucionesCatalogo - Catálogo de instituciones
 * @param {Object} totales - Objeto para acumular totales
 * @returns {string} HTML de la fila
 */
function crearFilaDatos(resultado, apartados, institucionesCatalogo, totales) {
    let fila = `
        <td>${resultado.clues || ''}</td>
        <td>${resultado.unidad?.nombre ?? ""}</td>
        <td>${resultado.unidad?.entidad ?? ""}</td>
        <td>${resultado.unidad?.jurisdiccion ?? ""}</td>
        <td>${resultado.unidad?.municipio ?? ""}</td>
        <td>${obtenerInicialesInstitucion(resultado.unidad?.idinstitucion, institucionesCatalogo)}</td>
    `;

    Object.entries(apartados).forEach(([apartado, vars]) => {
        const grupos = resultado.biologicos?.find(b => b.apartado === apartado)?.grupos ?? [];
        const dict = crearDiccionarioVariables(grupos);

        vars.forEach(v => {
            const valor = Number(dict[v] ?? 0);
            fila += `<td>${valor}</td>`;
            
            // Acumular total
            if (totales[v] !== undefined) {
                totales[v] += valor;
            }
        });
    });

    return fila;
}

/**
 * Renderiza la fila de totales
 * @param {Object} apartados - Estructura de apartados
 * @param {Object} totales - Total por variable
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 */
function renderTotales(apartados, totales, elementosDOM) {
    let filaTotales = `<td colspan="6"><strong>TOTALES GENERALES</strong></td>`;

    Object.values(apartados).forEach(vars => {
        vars.forEach(v => {
            filaTotales += `<td><strong>${totales[v]}</strong></td>`;
        });
    });

    elementosDOM.tablaFooter.innerHTML = `<tr class="${CLASES_CSS.TABLE_SECONDARY}">${filaTotales}</tr>`;
}

/**
 * Crea un diccionario de variables a partir de grupos
 * @param {Array} grupos - Grupos de variables
 * @returns {Object} Diccionario variable -> valor
 */
function crearDiccionarioVariables(grupos) {
    const dict = {};
    
    grupos.forEach(g => {
        if (g.variables) {
            g.variables.forEach(v => {
                dict[v.variable] = v.total;
            });
        }
    });
    
    return dict;
}

// ===============================
// FUNCIONES DE TABLA AGRUPADA
// ===============================

/**
 * Crea estructura agrupada para visualización jerárquica
 * @param {Array} resultados - Resultados de la consulta
 * @returns {Array} Estructura agrupada
 */
function crearEstructuraAgrupada(resultados) {
    const estructura = [];
    const apartadosMap = new Map();

    // Primera pasada: identificar todos los apartados y grupos
    resultados.forEach(r => {
        if (!r.biologicos) return;

        r.biologicos.forEach(ap => {
            if (!apartadosMap.has(ap.apartado)) {
                apartadosMap.set(ap.apartado, {
                    nombre: ap.apartado,
                    grupos: new Map()
                });
            }

            const apartadoData = apartadosMap.get(ap.apartado);

            if (ap.grupos) {
                ap.grupos.forEach(g => {
                    if (!apartadoData.grupos.has(g.grupo)) {
                        apartadoData.grupos.set(g.grupo, {
                            nombre: g.grupo,
                            variables: new Set()
                        });
                    }

                    const grupoData = apartadoData.grupos.get(g.grupo);

                    if (g.variables) {
                        g.variables.forEach(v => {
                            grupoData.variables.add(v.variable);
                        });
                    }
                });
            }
        });
    });

    // Convertir Map a Array para renderizado
    apartadosMap.forEach(apartadoData => {
        const apartado = {
            nombre: apartadoData.nombre,
            grupos: []
        };

        apartadoData.grupos.forEach(grupoData => {
            apartado.grupos.push({
                nombre: grupoData.nombre,
                variables: Array.from(grupoData.variables)
            });
        });

        estructura.push(apartado);
    });

    return estructura;
}

/**
 * Renderiza encabezados para tabla agrupada
 * @param {Array} estructura - Estructura agrupada
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 */
function renderEncabezadosAgrupados(estructura, elementosDOM) {
    let htmlHeader = '';
    let htmlVariables = '';
    let totalColumnas = 6; // Columnas fijas

    // Calcular spans para combinación de celdas
    estructura.forEach(apartado => {
        let totalVariablesApartado = 0;
        
        apartado.grupos.forEach(grupo => {
            totalVariablesApartado += grupo.variables.length;
        });

        htmlHeader += `<th colspan="${totalVariablesApartado}">${apartado.nombre}</th>`;
        totalColumnas += totalVariablesApartado;

        // Variables por grupo
        apartado.grupos.forEach(grupo => {
            if (grupo.variables.length > 1) {
                htmlVariables += `<th colspan="${grupo.variables.length}">${grupo.nombre}</th>`;
            } else {
                grupo.variables.forEach(() => {
                    htmlVariables += `<th>${grupo.nombre}</th>`;
                });
            }
        });
    });

    // Encabezados fijos
    const encabezadosFijos = `
        <th rowspan="3">CLUES</th>
        <th rowspan="3">Unidad</th>
        <th rowspan="3">Entidad</th>
        <th rowspan="3">Jurisdicción</th>
        <th rowspan="3">Municipio</th>
        <th rowspan="3">Institución</th>
    `;

    elementosDOM.tablaHeader.innerHTML = encabezadosFijos + htmlHeader;
    elementosDOM.variablesHeader.innerHTML = htmlVariables;

    // Crear tercera fila para nombres de variables individuales
    let htmlVariablesIndividuales = '';
    estructura.forEach(apartado => {
        apartado.grupos.forEach(grupo => {
            grupo.variables.forEach(variable => {
                htmlVariablesIndividuales += `<th>${variable}</th>`;
            });
        });
    });

    // Agregar fila de variables individuales
    const filaVariables = document.createElement('tr');
    filaVariables.innerHTML = '<td colspan="6"></td>' + htmlVariablesIndividuales;
    
    if (elementosDOM.tablaHeader.parentNode) {
        const thead = elementosDOM.tablaHeader.parentNode;
        thead.appendChild(filaVariables);
    }
}

/**
 * Renderiza datos para tabla agrupada
 * @param {Array} resultados - Resultados de la consulta
 * @param {Array} estructura - Estructura agrupada
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 * @param {Array} institucionesCatalogo - Catálogo de instituciones
 */
function renderDatosAgrupados(resultados, estructura, elementosDOM, institucionesCatalogo) {
    resultados.forEach(r => {
        let fila = `
            <td>${r.clues || ''}</td>
            <td>${r.unidad?.nombre ?? ""}</td>
            <td>${r.unidad?.entidad ?? ""}</td>
            <td>${r.unidad?.jurisdiccion ?? ""}</td>
            <td>${r.unidad?.municipio ?? ""}</td>
            <td>${obtenerInicialesInstitucion(r.unidad?.idinstitucion, institucionesCatalogo)}</td>
        `;

        estructura.forEach(apartado => {
            const datosApartado = r.biologicos?.find(b => b.apartado === apartado.nombre);
            
            apartado.grupos.forEach(grupo => {
                const datosGrupo = datosApartado?.grupos?.find(g => g.grupo === grupo.nombre);
                
                grupo.variables.forEach(variable => {
                    const valor = datosGrupo?.variables?.find(v => v.variable === variable)?.total || 0;
                    fila += `<td>${valor}</td>`;
                });
            });
        });

        elementosDOM.tablaResultadosBody.innerHTML += `<tr>${fila}</tr>`;
    });
}

// ===============================
// FUNCIONES DE UTILIDAD
// ===============================

/**
 * Valida que los elementos DOM requeridos existan
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 * @returns {boolean} True si todos los elementos existen
 */
function validarElementosDOM(elementosDOM) {
    const elementosRequeridos = [
        'tablaHeader',
        'variablesHeader', 
        'tablaResultadosBody',
        'tablaFooter'
    ];

    for (const elemento of elementosRequeridos) {
        if (!elementosDOM[elemento]) {
            console.error(`Elemento DOM requerido no encontrado: ${elemento}`);
            return false;
        }
    }

    return true;
}

/**
 * Limpia el contenido de la tabla
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 */
function limpiarTabla(elementosDOM) {
    if (elementosDOM.tablaHeader) elementosDOM.tablaHeader.innerHTML = "";
    if (elementosDOM.variablesHeader) elementosDOM.variablesHeader.innerHTML = "";
    if (elementosDOM.tablaResultadosBody) elementosDOM.tablaResultadosBody.innerHTML = "";
    if (elementosDOM.tablaFooter) elementosDOM.tablaFooter.innerHTML = "";
    
    // Limpiar cualquier fila adicional en thead
    const thead = elementosDOM.tablaHeader?.parentNode;
    if (thead) {
        const filasAdicionales = thead.querySelectorAll('tr:not(:first-child):not(:nth-child(2))');
        filasAdicionales.forEach(fila => fila.remove());
    }
}

/**
 * Calcula estadísticas para una CLUES
 * @param {Object} resultado - Resultado de una CLUES
 * @returns {Object} Estadísticas
 */
function calcularEstadisticasCLUES(resultado) {
    let totalVariables = 0;
    let totalValor = 0;

    if (resultado.biologicos) {
        resultado.biologicos.forEach(ap => {
            if (ap.grupos) {
                ap.grupos.forEach(g => {
                    if (g.variables) {
                        totalVariables += g.variables.length;
                        g.variables.forEach(v => {
                            totalValor += Number(v.total) || 0;
                        });
                    }
                });
            }
        });
    }

    return { totalVariables, totalValor };
}

/**
 * Aplica formato a números grandes
 * @param {number} numero - Número a formatear
 * @returns {string} Número formateado
 */
function formatearNumero(numero) {
    if (typeof numero !== 'number') return '0';
    
    if (numero >= 1000000) {
        return (numero / 1000000).toFixed(1) + 'M';
    } else if (numero >= 1000) {
        return (numero / 1000).toFixed(1) + 'K';
    }
    
    return numero.toString();
}

/**
 * Aplica clases CSS condicionales a celdas basadas en valores
 * @param {number} valor - Valor de la celda
 * @returns {string} Clases CSS
 */
function obtenerClasesValor(valor) {
    if (valor === 0) return 'valor-cero';
    if (valor < 0) return 'valor-negativo';
    if (valor > 100) return 'valor-alto';
    
    return '';
}

// ===============================
// FUNCIONES DE ACTUALIZACIÓN DINÁMICA
// ===============================

/**
 * Actualiza una fila específica en la tabla
 * @param {number} index - Índice de la fila
 * @param {Object} nuevoDato - Nuevos datos para la fila
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 * @param {Array} institucionesCatalogo - Catálogo de instituciones
 */
export function actualizarFila(index, nuevoDato, elementosDOM, institucionesCatalogo) {
    const filas = elementosDOM.tablaResultadosBody.querySelectorAll('tr');
    
    if (index >= 0 && index < filas.length) {
        // Re-renderizar la fila específica
        // Esta función necesitaría más contexto sobre la estructura
        console.log(`Actualizando fila ${index}`, nuevoDato);
    }
}

/**
 * Agrega una nueva fila a la tabla
 * @param {Object} nuevoResultado - Nuevo resultado a agregar
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 * @param {Array} institucionesCatalogo - Catálogo de instituciones
 */
export function agregarFila(nuevoResultado, elementosDOM, institucionesCatalogo) {
    // Esta función necesitaría conocer la estructura actual de la tabla
    // para agregar una fila consistente
    console.log("Agregando nueva fila", nuevoResultado);
}

/**
 * Elimina una fila de la tabla
 * @param {number} index - Índice de la fila a eliminar
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 */
export function eliminarFila(index, elementosDOM) {
    const filas = elementosDOM.tablaResultadosBody.querySelectorAll('tr');
    
    if (index >= 0 && index < filas.length) {
        filas[index].remove();
        console.log(`Fila ${index} eliminada`);
    }
}

// ===============================
// FUNCIONES DE ORDENAMIENTO Y FILTRADO
// ===============================

/**
 * Ordena la tabla por una columna específica
 * @param {number} columnaIndex - Índice de la columna
 * @param {string} orden - 'asc' o 'desc'
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 */
export function ordenarTabla(columnaIndex, orden = 'asc', elementosDOM) {
    const tbody = elementosDOM.tablaResultadosBody;
    const filas = Array.from(tbody.querySelectorAll('tr'));
    
    filas.sort((a, b) => {
        const valorA = obtenerValorCelda(a, columnaIndex);
        const valorB = obtenerValorCelda(b, columnaIndex);
        
        if (orden === 'asc') {
            return compararValores(valorA, valorB);
        } else {
            return compararValores(valorB, valorA);
        }
    });
    
    // Re-insertar filas ordenadas
    filas.forEach(fila => tbody.appendChild(fila));
    
    console.log(`Tabla ordenada por columna ${columnaIndex} (${orden})`);
}

/**
 * Filtra la tabla por un valor específico
 * @param {number} columnaIndex - Índice de la columna
 * @param {string|number} valor - Valor a filtrar
 * @param {Object} elementosDOM - Referencias a elementos del DOM
 */
export function filtrarTabla(columnaIndex, valor, elementosDOM) {
    const filas = elementosDOM.tablaResultadosBody.querySelectorAll('tr');
    
    filas.forEach(fila => {
        const valorCelda = obtenerValorCelda(fila, columnaIndex);
        const coincide = valorCelda.toString().toLowerCase().includes(valor.toString().toLowerCase());
        fila.style.display = coincide ? '' : 'none';
    });
    
    console.log(`Tabla filtrada por columna ${columnaIndex}: "${valor}"`);
}

// ===============================
// FUNCIONES AUXILIARES DE MANIPULACIÓN
// ===============================

/**
 * Obtiene el valor de una celda específica
 * @param {HTMLElement} fila - Elemento fila
 * @param {number} columnaIndex - Índice de la columna
 * @returns {string|number} Valor de la celda
 */
function obtenerValorCelda(fila, columnaIndex) {
    const celdas = fila.querySelectorAll('td');
    
    if (columnaIndex >= 0 && columnaIndex < celdas.length) {
        const celda = celdas[columnaIndex];
        const texto = celda.textContent.trim();
        
        // Intentar convertir a número si es posible
        const numero = Number(texto);
        return isNaN(numero) ? texto : numero;
    }
    
    return '';
}

/**
 * Compara dos valores para ordenamiento
 * @param {*} a - Primer valor
 * @param {*} b - Segundo valor
 * @returns {number} Resultado de la comparación
 */
function compararValores(a, b) {
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }
    
    return a.toString().localeCompare(b.toString());
}

// ===============================
// EXPORTACIÓN POR DEFECTO
// ===============================

export default {
    // Funciones principales
    renderTabla,
    renderTablaResumen,
    renderTablaAgrupada,
    
    // Funciones de actualización
    actualizarFila,
    agregarFila,
    eliminarFila,
    
    // Funciones de ordenamiento y filtrado
    ordenarTabla,
    filtrarTabla,
    
    // Funciones auxiliares
    validarElementosDOM,
    limpiarTabla,
    calcularEstadisticasCLUES,
    obtenerInicialesInstitucion: obtenerInicialesInstitucion
};