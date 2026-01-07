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
    crearColumnasFijasEstructuraImagen2,
    construirFilaVariables,
    aplicarFormulasPlantilla,
    extraerEstructuraDinamica,       
    obtenerReferenciasPoblacion,   
    numeroALetra,                       
    aplicarFormulasColumnasFijasConMapa,
} from './excel-formulas.js';

/**
 * Extrae todos los códigos de variables (primeros 5 caracteres) desde los resultados
 * @param {Array} resultadosConsulta - Resultados de la consulta
 * @returns {Array<string>} Códigos únicos ej. ["BIO01", "VBC02", ...]
 */
function extraerCodigosVariables(resultadosConsulta) {
    const codigos = new Set();

    (resultadosConsulta || []).forEach(r => {
        (r.biologicos || []).forEach(ap => {
            (ap.grupos || []).forEach(g => {
                (g.variables || []).forEach(v => {
                    if (v.variable && v.variable.length >= 5) {
                        codigos.add(v.variable.substring(0, 5));
                    }
                });
            });
        });
    });

    return Array.from(codigos);
}

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

        console.log("📥 Cargando plantilla desde:", RUTAS.PLANTILLA_EXCEL);
        const response = await fetch(RUTAS.PLANTILLA_EXCEL);

        if (!response.ok) {
            throw new Error(`No se pudo cargar la plantilla: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.getWorksheet(1);
        const filaInicio = EXCEL_CONFIG.FILA_INICIO_DATOS;

        console.log(`📝 Llenando ${resultadosConsulta.length} registros en la plantilla...`);

        resultadosConsulta.forEach((r, index) => {
            const fila = filaInicio + index;

            sheet.getCell(`A${fila}`).value = r.clues || '';
            sheet.getCell(`B${fila}`).value = r.unidad?.nombre ?? "";
            sheet.getCell(`C${fila}`).value = r.unidad?.entidad ?? "";
            sheet.getCell(`D${fila}`).value = r.unidad?.jurisdiccion ?? "";
            sheet.getCell(`E${fila}`).value = r.unidad?.municipio ?? "";
            sheet.getCell(`F${fila}`).value = obtenerInicialesInstitucion
                ? obtenerInicialesInstitucion(r.unidad?.idinstitucion)
                : "";

            const valores = construirFilaVariables(r);
            let col = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES; 

            valores.forEach(v => {
                sheet.getCell(fila, col).value = Number(v) || 0;
                col++;
            });
        });

        await aplicarFormulasPlantilla(sheet, resultadosConsulta, obtenerInicialesInstitucion, filaInicio);

        workbook.calcProperties.fullCalcOnLoad = true;

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
    console.group("🚀 INICIO exportarTablaHTML");

    try {
        if (typeof mostrarSpinner === 'function') {
            mostrarSpinner();
        }

        console.group("🔍 DIAGNÓSTICO DATOS ENTRADA");
        console.log("📊 Total resultados consulta:", resultadosConsulta?.length || 0);

        if (resultadosConsulta && resultadosConsulta.length > 0) {
            const primerRegistro = resultadosConsulta[0];
            console.log("📋 Primer registro - CLUES:", primerRegistro.clues);
            console.log("📋 Primer registro - Biologicos:", primerRegistro.biologicos?.length || 0);
            if (primerRegistro.biologicos) {
                primerRegistro.biologicos.forEach((bio, i) => {
                    console.log(`📋 Apartado ${i}: "${bio.apartado}"`);
                    console.log(`📋 Grupos:`, bio.grupos?.length || 0);
                });
            }
        }
        console.groupEnd();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resultados');
        console.log("✅ Workbook y worksheet creados");

        console.group("🔍 CONSTRUYENDO ESTRUCTURA");
        const estructura = construirEstructuraEncabezados(resultadosConsulta);
        console.log("📋 Estructura obtenida:", estructura);
        console.log("📊 Total apartados:", estructura.length);

        estructura.forEach((apartado, idx) => {
            console.log(`  Apartado ${idx}: "${apartado.nombre}"`);
            console.log(`  Variables (${apartado.variables.length}):`, apartado.variables.slice(0, 3));
        });
        console.groupEnd();

        if (estructura.length === 0) {
            throw new Error("No hay datos para exportar");
        }
        console.group("🔍 CREANDO ENCABEZADOS");
        crearEncabezadosCombinados(worksheet, estructura);
        console.log("✅ Encabezados creados");
        console.log("📊 Dimensiones worksheet:");
        console.log("  - Filas:", worksheet.rowCount);
        console.log("  - Columnas:", worksheet.columnCount);
        console.groupEnd();
        console.group("🔍 AGREGANDO DATOS");
        agregarDatosResultados(worksheet, estructura, resultadosConsulta, obtenerInicialesInstitucion);
        console.log(`✅ Datos agregados: ${resultadosConsulta.length} filas`);
        console.groupEnd();
        console.group("🔍 APLICANDO FORMATO");
        aplicarFormatoEncabezados(worksheet, estructura);
        console.group("🔍 DIAGNÓSTICO CÓDIGOS");
        const codigosVariables = extraerCodigosVariables(resultadosConsulta);
        console.log(`📋 Códigos extraídos del back (${codigosVariables.length}):`, codigosVariables);
        console.groupEnd();
        console.group("🔍 CREANDO COLUMNAS FIJAS CON ENCABEZADOS");
        let totalColumnasDinamicas = 0;
        estructura.forEach(apartado => {
            totalColumnasDinamicas += apartado.variables.length;
        });
        const columnaInicioFijas = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES + totalColumnasDinamicas;

        console.log(`📍 Columnas dinámicas: ${totalColumnasDinamicas}`);
        console.log(`📍 Columnas fijas empiezan en: ${columnaInicioFijas} (${numeroALetra(columnaInicioFijas)})`);

        crearColumnasFijasEstructuraImagen2(
            worksheet,
            EXCEL_CONFIG.COLUMNAS_FIJAS,
            columnaInicioFijas,
            EXCEL_CONFIG.FILA_INICIO_DATOS,
            resultadosConsulta,
            codigosVariables
        );

        console.groupEnd();
        console.log("✅ Formato aplicado");
        console.groupEnd();

        console.group("🔍 EXTRACCIÓN ESTRUCTURA DINÁMICA");
        const estructuraDinamica = extraerEstructuraDinamica(worksheet, estructura);
        console.log(`📊 Estructura dinámica extraída (${estructuraDinamica.length} variables):`);

        if (estructuraDinamica.length === 0) {
            console.error("❌ ESTRUCTURA DINÁMICA VACÍA - Esto causará fórmulas =0");
        } else {
            estructuraDinamica.forEach((item, idx) => {
                console.log(`  [${idx}] Col ${item.columna}: "${item.nombre}"`);
                console.log(`       Códigos:`, item.codigos);
                console.log(`       Apartado: ${item.apartado}`);
            });
        }
        console.groupEnd();

        console.group("🔍 BUSCANDO REFERENCIAS POBLACIÓN");
        const referenciasPoblacion = obtenerReferenciasPoblacion(worksheet, estructuraDinamica);
        console.log("📍 Referencias población encontradas:", referenciasPoblacion);

        if (Object.keys(referenciasPoblacion).length === 0) {
            console.error("❌ REFERENCIAS POBLACIÓN VACÍAS - Fórmulas no funcionarán");
        } else {
            console.log("✅ Referencias población OK");
        }
        console.groupEnd();
        console.group("🔍 APLICANDO FÓRMULAS CON MAPA");
        aplicarFormulasColumnasFijasConMapa(
            worksheet,
            estructura,
            EXCEL_CONFIG.FILA_INICIO_DATOS,
            resultadosConsulta,
            estructuraDinamica,
            referenciasPoblacion
        );
        console.log("✅ Fórmulas con mapa aplicadas");
        console.groupEnd();

        console.group("🔍 AJUSTANDO ANCHOS");
        ajustarAnchosColumnas(worksheet, estructura);
        console.log("✅ Anchos ajustados");
        console.groupEnd();
        worksheet.views = [{ state: 'frozen', ySplit: 4 }];
        console.log("✅ Encabezados congelados");
        const nombreArchivo = NOMBRES_ARCHIVOS.EXCEL_RESULTADOS();
        console.log(`💾 Descargando archivo: ${nombreArchivo}`);

        await descargarWorkbook(workbook, nombreArchivo);

        console.log("✅ Exportación completada exitosamente");
        console.groupEnd();

    } catch (error) {
        console.error('❌ Error al exportar tabla HTML:', error);
        console.error('❌ Stack trace:', error.stack);
        if (error.message && error.message.includes('formula')) {
            console.error('🔍 Error relacionado con fórmulas');
        }

        alert(MENSAJES.ERROR_EXPORTAR_TABLA);
        throw error;
    } finally {
        if (typeof ocultarSpinner === 'function') {
            ocultarSpinner();
        }
        console.groupEnd();
    }
}

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
    const primerResultado = resultadosConsulta[0];

    if (!primerResultado.biologicos || !Array.isArray(primerResultado.biologicos)) {
        console.warn("El primer resultado no tiene datos de biológicos");
        return estructura;
    }

    primerResultado.biologicos.forEach(apartado => {
        const variables = [];
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
    const fila1 = ['CLUES', 'Unidad', 'Entidad', 'Jurisdicción', 'Municipio', 'Institución'];
    estructura.forEach((apartado, index) => {
        for (let i = 0; i < apartado.variables.length; i++) {
            if (i === 0) {
                fila1.push(apartado.nombre);
            } else {
                fila1.push('');
            }
        }
    });
    const fila2 = ['', '', '', '', '', ''];
    estructura.forEach(apartado => {
        apartado.variables.forEach(() => {
            fila2.push('');
        });
    });
    const fila3 = ['', '', '', '', '', ''];

    estructura.forEach(apartado => {
        apartado.variables.forEach(variable => {
            fila3.push(variable);
        });
    });
    const fila4 = ['', '', '', '', '', ''];

    estructura.forEach(apartado => {
        apartado.variables.forEach(variable => {
            fila4.push(variable);
        });
    });

    worksheet.addRow(fila1); 
    worksheet.addRow(fila2); 
    worksheet.addRow(fila3); 
    worksheet.addRow(fila4); 
    for (let col = 1; col <= 6; col++) {
        worksheet.mergeCells(1, col, 4, col);
    }
    let colInicio = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES;

    estructura.forEach((apartado) => {
        const numVariables = apartado.variables.length;

        if (numVariables > 1) {
            worksheet.mergeCells(1, colInicio, 2, colInicio + numVariables - 1);
        } else {
            worksheet.mergeCells(1, colInicio, 2, colInicio);
        }
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
        filaDatos.push(
            r.clues || '',
            r.unidad?.nombre || '',
            r.unidad?.entidad || '',
            r.unidad?.jurisdiccion || '',
            r.unidad?.municipio || '',
            obtenerInicialesInstitucion ?
                obtenerInicialesInstitucion(r.unidad?.idinstitucion) || '' : ''
        );
        estructura.forEach(apartado => {
            const datosApartado = r.biologicos?.find(b => b.apartado === apartado.nombre);

            if (datosApartado) {

                apartado.variables.forEach(variableNombre => {
                    let valor = 0;
    
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
    
                apartado.variables.forEach(() => {
                    filaDatos.push(0);
                });
            }
        });

        const row = worksheet.addRow(filaDatos);

        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            },
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            if (colNumber > 6 && typeof cell.value === 'number') {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
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

    
    let colInicio = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES;

    estructura.forEach((apartado, index) => {
        const numVariables = apartado.variables.length;
        const colorIndex = index % COLORES.APARTADOS.length;
        const color = COLORES.APARTADOS[colorIndex];
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
        for (let i = 0; i < numVariables; i++) {
            const cellVariable = worksheet.getCell(3, colInicio + i);
            const colorVariable = color.replace('FF', 'CC'); 

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
    worksheet.getColumn(1).width = EXCEL_CONFIG.ANCHO_COLUMNAS.CLUES;
    worksheet.getColumn(2).width = EXCEL_CONFIG.ANCHO_COLUMNAS.UNIDAD;
    worksheet.getColumn(3).width = EXCEL_CONFIG.ANCHO_COLUMNAS.ENTIDAD;
    worksheet.getColumn(4).width = EXCEL_CONFIG.ANCHO_COLUMNAS.JURISDICCION;
    worksheet.getColumn(5).width = EXCEL_CONFIG.ANCHO_COLUMNAS.MUNICIPIO;
    worksheet.getColumn(6).width = EXCEL_CONFIG.ANCHO_COLUMNAS.INSTITUCION;

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
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        console.log(`✅ Archivo ${nombreArchivo} descargado exitosamente`);
    } catch (error) {
        console.error('❌ Error al descargar workbook:', error);
        throw error;
    }
}

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

export function probarExportacion(resultadosConsulta) {
    console.group("🧪 PRUEBA RÁPIDA EXPORTACIÓN");

    console.log("📋 Total registros:", resultadosConsulta.length);

    if (resultadosConsulta.length > 0) {
        const primerRegistro = resultadosConsulta[0];
        console.log("📋 Primer registro:", primerRegistro);
        const estructura = construirEstructuraEncabezados([primerRegistro]);
        console.log("📋 Estructura construida:", estructura);
        console.log("🔍 Códigos por variable:");
        estructura.forEach(apartado => {
            apartado.variables.forEach(variable => {
                const codigosVar = extraerCodigosDeVariable(variable);
                console.log(`  "${variable}" →`, codigosVar);
            });
        });
    }

    console.groupEnd();
}

export default {
    exportarExcel,
    exportarTablaHTML,
    construirEstructuraEncabezados,
    validarDatosParaExportar,
    generarResumenExportacion,
    construirDatosParaExcel,
    construirFilaVariables
};