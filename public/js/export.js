// export.js
const ExcelJS = window.ExcelJS;
import { 
    EXCEL_CONFIG, 
    COLORES, 
    NOMBRES_ARCHIVOS,
    RUTAS,
    MENSAJES,
    CLASES_CSS
} from './constants.js';
import { 
    construirDatosParaExcel, 
    construirFilaVariables,
    aplicarFormulasColumnasFijas,
    aplicarFormulasPlantilla
} from './excel-formulas.js';

// ===============================
// FUNCIONES DE EXPORTACIÓN PRINCIPALES
// ===============================

/**
 * Exporta datos a Excel usando la plantilla CUBOS
 * @param {Array} resultadosConsulta - Resultados de la consulta
 * @param {Function} obtenerInicialesInstitucion - Función para obtener iniciales de institución
 * @param {Function} mostrarSpinner - Función para mostrar spinner
 * @param {Function} ocultarSpinner - Función para ocultar spinner
 */
export async function exportarExcel(
    resultadosConsulta, 
    obtenerInicialesInstitucion,
    mostrarSpinner, 
    ocultarSpinner
) {
    try {
        if (typeof mostrarSpinner === 'function') {
            mostrarSpinner();
        }

        const workbook = new ExcelJS.Workbook();
        
        // Cargar plantilla
        console.log("📥 Cargando plantilla desde:", RUTAS.PLANTILLA_EXCEL);
        const response = await fetch(RUTAS.PLANTILLA_EXCEL);
        
        if (!response.ok) {
            throw new Error(`No se pudo cargar la plantilla: ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.getWorksheet(1);
        const filaInicio = EXCEL_CONFIG.FILA_INICIO_DATOS;

        // Llenar datos en la plantilla
        console.log(`📝 Llenando ${resultadosConsulta.length} registros en la plantilla...`);
        
        resultadosConsulta.forEach((r, index) => {
            const fila = filaInicio + index;

            // ======== COLUMNAS A–F (fijas) ========
            sheet.getCell(`A${fila}`).value = r.clues || '';
            sheet.getCell(`B${fila}`).value = r.unidad?.nombre ?? "";
            sheet.getCell(`C${fila}`).value = r.unidad?.entidad ?? "";
            sheet.getCell(`D${fila}`).value = r.unidad?.jurisdiccion ?? "";
            sheet.getCell(`E${fila}`).value = r.unidad?.municipio ?? "";
            sheet.getCell(`F${fila}`).value = obtenerInicialesInstitucion 
                ? obtenerInicialesInstitucion(r.unidad?.idinstitucion) 
                : "";

            // ======== VARIABLES ORDENADAS ========
            const valores = construirFilaVariables(r);
            let col = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES; // Columna G = 7

            valores.forEach(v => {
                sheet.getCell(fila, col).value = Number(v) || 0;
                col++;
            });
        });

        // Aplicar fórmulas de plantilla
        await aplicarFormulasPlantilla(sheet, resultadosConsulta, obtenerInicialesInstitucion, filaInicio);

        // Configurar cálculo automático
        workbook.calcProperties.fullCalcOnLoad = true;

        // Descargar archivo
        await descargarWorkbook(workbook, NOMBRES_ARCHIVOS.EXCEL_BIOLOGICOS);

    } catch (error) {
        console.error("❌ Error al exportar Excel:", error);
        alert(MENSAJES.ERROR_EXPORTAR_EXCEL);
        throw error;
    } finally {
        if (typeof ocultarSpinner === 'function') {
            ocultarSpinner();
        }
    }
}

/**
 * Exporta datos a Excel con encabezados combinados y colores
 * @param {Array} resultadosConsulta - Resultados de la consulta
 * @param {Function} obtenerInicialesInstitucion - Función para obtener iniciales de institución
 * @param {Function} mostrarSpinner - Función para mostrar spinner
 * @param {Function} ocultarSpinner - Función para ocultar spinner
 */
export async function exportarTablaHTML(
    resultadosConsulta, 
    obtenerInicialesInstitucion,
    mostrarSpinner, 
    ocultarSpinner
) {
    try {
        if (typeof mostrarSpinner === 'function') {
            mostrarSpinner();
        }

        // 1. Crear libro y hoja
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resultados');

        // 2. Obtener la estructura de apartados y variables
        const estructura = construirEstructuraEncabezados(resultadosConsulta);
        
        if (estructura.length === 0) {
            throw new Error("No hay datos para exportar");
        }

        // 3. Crear encabezados
        crearEncabezadosCombinados(worksheet, estructura);

        // 4. Agregar datos
        agregarDatosResultados(worksheet, estructura, resultadosConsulta, obtenerInicialesInstitucion);

        // 5. Aplicar formato a encabezados
        aplicarFormatoEncabezados(worksheet, estructura);

        // 6. Agregar columnas fijas con fórmulas
        aplicarFormulasColumnasFijas(worksheet, estructura, EXCEL_CONFIG.FILA_INICIO_DATOS, resultadosConsulta);

        // 7. Ajustar anchos de columnas
        ajustarAnchosColumnas(worksheet, estructura);

        // 8. Congelar encabezados
        worksheet.views = [{ state: 'frozen', ySplit: 4 }];

        // 9. Descargar archivo
        const nombreArchivo = NOMBRES_ARCHIVOS.EXCEL_RESULTADOS();
        await descargarWorkbook(workbook, nombreArchivo);

    } catch (error) {
        console.error('❌ Error al exportar tabla HTML:', error);
        alert(MENSAJES.ERROR_EXPORTAR_TABLA);
        throw error;
    } finally {
        if (typeof ocultarSpinner === 'function') {
            ocultarSpinner();
        }
    }
}

// ===============================
// FUNCIONES AUXILIARES DE EXPORTACIÓN
// ===============================

/**
 * Construye la estructura de encabezados a partir de los resultados
 * @param {Array} resultadosConsulta - Resultados de la consulta
 * @returns {Array} Estructura de encabezados
 */
export function construirEstructuraEncabezados(resultadosConsulta) {
    const estructura = [];

    if (!resultadosConsulta || resultadosConsulta.length === 0) {
        console.warn(MENSAJES.SIN_RESULTADOS);
        return estructura;
    }

    // Tomar el primer resultado como referencia para la estructura
    const primerResultado = resultadosConsulta[0];

    if (!primerResultado.biologicos || !Array.isArray(primerResultado.biologicos)) {
        console.warn("El primer resultado no tiene datos de biológicos");
        return estructura;
    }

    primerResultado.biologicos.forEach(apartado => {
        const variables = [];

        // Recolectar todas las variables de este apartado (de todos los grupos)
        if (apartado.grupos && Array.isArray(apartado.grupos)) {
            apartado.grupos.forEach(grupo => {
                if (grupo.variables && Array.isArray(grupo.variables)) {
                    grupo.variables.forEach(variable => {
                        if (variable.variable) {
                            variables.push(variable.variable);
                        }
                    });
                }
            });
        }

        if (variables.length > 0) {
            estructura.push({
                nombre: apartado.apartado || 'Sin nombre',
                variables: variables
            });
        }
    });

    console.log(`📊 Estructura construida: ${estructura.length} apartados`);
    return estructura;
}

/**
 * Crea encabezados combinados en el worksheet
 * @param {Object} worksheet - Worksheet de ExcelJS
 * @param {Array} estructura - Estructura de apartados y variables
 */
function crearEncabezadosCombinados(worksheet, estructura) {
    // 1. Crear fila 1: Encabezados principales (apartados en columnas G+)
    const fila1 = ['CLUES', 'Unidad', 'Entidad', 'Jurisdicción', 'Municipio', 'Institución'];

    // Rellenar para columnas variables (apartados)
    estructura.forEach((apartado, index) => {
        for (let i = 0; i < apartado.variables.length; i++) {
            // Poner el nombre del apartado solo en la primera variable
            if (i === 0) {
                fila1.push(apartado.nombre);
            } else {
                fila1.push(''); // Celdas vacías para el resto del mismo apartado
            }
        }
    });

    // 2. Crear fila 2: Vacía para columnas A-F, también vacía para columnas G+
    const fila2 = ['', '', '', '', '', ''];

    // Para columnas G+, poner vacío (se combinará con fila 1)
    estructura.forEach(apartado => {
        apartado.variables.forEach(() => {
            fila2.push('');
        });
    });

    // 3. Crear fila 3: Variables (vacío para columnas A-F)
    const fila3 = ['', '', '', '', '', ''];

    estructura.forEach(apartado => {
        apartado.variables.forEach(variable => {
            fila3.push(variable);
        });
    });

    // 4. Crear fila 4: Variables duplicadas (vacío para columnas A-F)
    const fila4 = ['', '', '', '', '', ''];

    estructura.forEach(apartado => {
        apartado.variables.forEach(variable => {
            fila4.push(variable);
        });
    });

    // 5. Agregar filas al Excel
    worksheet.addRow(fila1); // Fila 1
    worksheet.addRow(fila2); // Fila 2
    worksheet.addRow(fila3); // Fila 3
    worksheet.addRow(fila4); // Fila 4

    // 6. Combinar celdas para columnas A-F (verticalmente)
    for (let col = 1; col <= 6; col++) {
        worksheet.mergeCells(1, col, 4, col);
    }

    // 7. Combinar celdas para apartados (horizontal y verticalmente)
    let colInicio = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES; // Columna G

    estructura.forEach((apartado) => {
        const numVariables = apartado.variables.length;

        if (numVariables > 1) {
            // Combinar apartado en filas 1-2 (2 filas de altura)
            worksheet.mergeCells(1, colInicio, 2, colInicio + numVariables - 1);
        } else {
            // Si solo tiene una variable, igual combinar verticalmente
            worksheet.mergeCells(1, colInicio, 2, colInicio);
        }

        // Combinar cada variable en filas 3-4 (verticalmente)
        for (let i = 0; i < numVariables; i++) {
            worksheet.mergeCells(3, colInicio + i, 4, colInicio + i);
        }

        colInicio += numVariables;
    });

    console.log("✅ Encabezados combinados creados");
}

/**
 * Agrega datos de resultados al worksheet
 * @param {Object} worksheet - Worksheet de ExcelJS
 * @param {Array} estructura - Estructura de apartados y variables
 * @param {Array} resultadosConsulta - Resultados de la consulta
 * @param {Function} obtenerInicialesInstitucion - Función para obtener iniciales
 */
function agregarDatosResultados(worksheet, estructura, resultadosConsulta, obtenerInicialesInstitucion) {
    let fila = EXCEL_CONFIG.FILA_INICIO_DATOS;

    resultadosConsulta.forEach(r => {
        const filaDatos = [];

        // Información básica (columnas A-F)
        filaDatos.push(
            r.clues || '',
            r.unidad?.nombre || '',
            r.unidad?.entidad || '',
            r.unidad?.jurisdiccion || '',
            r.unidad?.municipio || '',
            obtenerInicialesInstitucion ? 
                obtenerInicialesInstitucion(r.unidad?.idinstitucion) || '' : ''
        );

        // Variables por apartado (columnas G en adelante)
        estructura.forEach(apartado => {
            // Buscar los datos de este apartado para esta CLUES
            const datosApartado = r.biologicos?.find(b => b.apartado === apartado.nombre);

            if (datosApartado) {
                // Para cada variable en la estructura, buscar su valor
                apartado.variables.forEach(variableNombre => {
                    let valor = 0;

                    // Buscar en todos los grupos
                    if (datosApartado.grupos && Array.isArray(datosApartado.grupos)) {
                        for (const grupo of datosApartado.grupos) {
                            if (grupo.variables && Array.isArray(grupo.variables)) {
                                const variable = grupo.variables.find(v => v.variable === variableNombre);
                                if (variable) {
                                    valor = Number(variable.total) || 0;
                                    break;
                                }
                            }
                        }
                    }

                    filaDatos.push(valor);
                });
            } else {
                // Si no hay datos para este apartado, llenar con ceros
                apartado.variables.forEach(() => {
                    filaDatos.push(0);
                });
            }
        });

        // Agregar fila al worksheet
        const row = worksheet.addRow(filaDatos);

        // Aplicar bordes a esta fila de datos
        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Alinear números a la derecha para columnas de datos (G en adelante)
            if (colNumber > 6 && typeof cell.value === 'number') {
                cell.alignment = { horizontal: 'right' };
            }
        });

        fila++;
    });

    console.log(`✅ Datos agregados: ${resultadosConsulta.length} filas`);
}

/**
 * Aplica formato a los encabezados del worksheet
 * @param {Object} worksheet - Worksheet de ExcelJS
 * @param {Array} estructura - Estructura de apartados y variables
 */
function aplicarFormatoEncabezados(worksheet, estructura) {
    // Formato para columnas A-F (todas combinadas)
    for (let col = 1; col <= 6; col++) {
        const cell = worksheet.getCell(1, col);
        cell.font = { 
            bold: true, 
            size: 14, 
            color: { argb: COLORES.TEXT_WHITE } 
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORES.POBLACION }
        };
        cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'center' 
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }

    // Formato para apartados (combinados en filas 1-2)
    let colInicio = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES;

    estructura.forEach((apartado, index) => {
        const numVariables = apartado.variables.length;
        const colorIndex = index % COLORES.APARTADOS.length;
        const color = COLORES.APARTADOS[colorIndex];

        // Apartado (combinado en filas 1-2)
        const cellApartado = worksheet.getCell(1, colInicio);
        cellApartado.font = { 
            bold: true, 
            size: 12,
            color: { argb: COLORES.TEXT_BLACK }
        };
        cellApartado.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }
        };
        cellApartado.alignment = { 
            vertical: 'middle', 
            horizontal: 'center', 
            wrapText: true 
        };
        cellApartado.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Formato para variables (combinadas en filas 3-4)
        for (let i = 0; i < numVariables; i++) {
            const cellVariable = worksheet.getCell(3, colInicio + i);
            const colorVariable = color.replace('FF', 'CC'); // Color más claro
            
            cellVariable.font = { 
                bold: true, 
                size: 10,
                color: { argb: COLORES.TEXT_BLACK }
            };
            cellVariable.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: colorVariable }
            };
            cellVariable.alignment = { 
                vertical: 'middle', 
                horizontal: 'center', 
                wrapText: true 
            };
            cellVariable.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }

        colInicio += numVariables;
    });

    // Aplicar bordes a todas las celdas de encabezado
    for (let row = 1; row <= 4; row++) {
        for (let col = 1; col <= worksheet.columnCount; col++) {
            const cell = worksheet.getCell(row, col);
            if (!cell.border) {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }
    }

    // Ajustar altura de filas
    worksheet.getRow(1).height = EXCEL_CONFIG.ALTURA_FILAS.ENCABEZADO_1;
    worksheet.getRow(2).height = EXCEL_CONFIG.ALTURA_FILAS.ENCABEZADO_2;
    worksheet.getRow(3).height = EXCEL_CONFIG.ALTURA_FILAS.ENCABEZADO_3;
    worksheet.getRow(4).height = EXCEL_CONFIG.ALTURA_FILAS.ENCABEZADO_4;

    console.log("✅ Formato aplicado a encabezados");
}

/**
 * Ajusta los anchos de las columnas
 * @param {Object} worksheet - Worksheet de ExcelJS
 * @param {Array} estructura - Estructura de apartados y variables
 */
function ajustarAnchosColumnas(worksheet, estructura) {
    // Columnas fijas A-F
    worksheet.getColumn(1).width = EXCEL_CONFIG.ANCHO_COLUMNAS.CLUES;
    worksheet.getColumn(2).width = EXCEL_CONFIG.ANCHO_COLUMNAS.UNIDAD;
    worksheet.getColumn(3).width = EXCEL_CONFIG.ANCHO_COLUMNAS.ENTIDAD;
    worksheet.getColumn(4).width = EXCEL_CONFIG.ANCHO_COLUMNAS.JURISDICCION;
    worksheet.getColumn(5).width = EXCEL_CONFIG.ANCHO_COLUMNAS.MUNICIPIO;
    worksheet.getColumn(6).width = EXCEL_CONFIG.ANCHO_COLUMNAS.INSTITUCION;

    // Columnas de variables
    let currentCol = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES;
    estructura.forEach(apartado => {
        apartado.variables.forEach(() => {
            const col = worksheet.getColumn(currentCol);
            col.width = EXCEL_CONFIG.ANCHO_COLUMNAS.VARIABLE;
            currentCol++;
        });
    });

    console.log("✅ Anchos de columnas ajustados");
}

/**
 * Descarga un workbook como archivo Excel
 * @param {Object} workbook - Workbook de ExcelJS
 * @param {string} nombreArchivo - Nombre del archivo
 */
async function descargarWorkbook(workbook, nombreArchivo) {
    console.log(`💾 Descargando archivo: ${nombreArchivo}`);
    
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nombreArchivo;
        
        // Agregar al DOM, hacer click y remover
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Liberar objeto URL
        URL.revokeObjectURL(link.href);
        
        console.log(`✅ Archivo ${nombreArchivo} descargado exitosamente`);
    } catch (error) {
        console.error('❌ Error al descargar workbook:', error);
        throw error;
    }
}

// ===============================
// FUNCIONES DE VALIDACIÓN PARA EXPORTACIÓN
// ===============================

/**
 * Valida si hay datos suficientes para exportar
 * @param {Array} resultadosConsulta - Resultados de la consulta
 * @returns {Object} Resultado de validación
 */
export function validarDatosParaExportar(resultadosConsulta) {
    const resultado = {
        valido: false,
        mensaje: '',
        totalRegistros: 0,
        tieneDatos: false
    };

    if (!resultadosConsulta || !Array.isArray(resultadosConsulta)) {
        resultado.mensaje = 'No hay resultados para exportar';
        return resultado;
    }

    resultado.totalRegistros = resultadosConsulta.length;
    
    if (resultado.totalRegistros === 0) {
        resultado.mensaje = 'No hay registros para exportar';
        return resultado;
    }

    // Verificar que al menos un registro tenga datos de biológicos
    resultado.tieneDatos = resultadosConsulta.some(r => 
        r.biologicos && 
        Array.isArray(r.biologicos) && 
        r.biologicos.length > 0
    );

    if (!resultado.tieneDatos) {
        resultado.mensaje = 'Los registros no contienen datos de biológicos';
        return resultado;
    }

    resultado.valido = true;
    resultado.mensaje = `Listo para exportar ${resultado.totalRegistros} registros`;
    
    return resultado;
}

/**
 * Genera un resumen de la exportación
 * @param {Array} resultadosConsulta - Resultados de la consulta
 * @returns {Object} Resumen de exportación
 */
export function generarResumenExportacion(resultadosConsulta) {
    const resumen = {
        fecha: new Date().toLocaleString(),
        totalCLUES: resultadosConsulta?.length || 0,
        totalApartados: 0,
        totalVariables: 0,
        CLUES: []
    };

    if (!resultadosConsulta || resultadosConsulta.length === 0) {
        return resumen;
    }

    // Contar apartados y variables únicas
    const apartadosSet = new Set();
    const variablesSet = new Set();

    resultadosConsulta.forEach(r => {
        if (r.clues) {
            resumen.CLUES.push(r.clues);
        }

        if (r.biologicos && Array.isArray(r.biologicos)) {
            r.biologicos.forEach(ap => {
                if (ap.apartado) {
                    apartadosSet.add(ap.apartado);
                }

                if (ap.grupos && Array.isArray(ap.grupos)) {
                    ap.grupos.forEach(g => {
                        if (g.variables && Array.isArray(g.variables)) {
                            g.variables.forEach(v => {
                                if (v.variable) {
                                    variablesSet.add(v.variable);
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    resumen.totalApartados = apartadosSet.size;
    resumen.totalVariables = variablesSet.size;

    return resumen;
}

// ===============================
// EXPORTACIÓN POR DEFECTO
// ===============================

export default {
    // Funciones principales
    exportarExcel,
    exportarTablaHTML,
    
    // Funciones auxiliares
    construirEstructuraEncabezados,
    
    // Funciones de validación
    validarDatosParaExportar,
    generarResumenExportacion,
    
    // Re-exportar funciones de excel-formulas
    construirDatosParaExcel,
    construirFilaVariables
};