import {
    FORMULAS_LITERALES,
    COLORES,
    PATRONES_CODIGOS,
    EXCEL_CONFIG,
    TIPOS_POBLACION,
    MAPEO_POBLACION_POR_VARIABLE,
    REGEX,
    MENSAJES
} from './constants.js';

/**
 * Convierte un número de columna a letra de Excel (1 -> A, 2 -> B, etc.)
 * @param {number} numero - Número de columna (comenzando en 1)
 * @returns {string} Letra de columna de Excel
 */
export function numeroALetra(numero) {
    let letra = '';
    while (numero > 0) {
        let temp = (numero - 1) % 26;
        letra = String.fromCharCode(temp + 65) + letra;
        numero = Math.floor((numero - temp - 1) / 26);
    }
    return letra;
}

/**
 * Convierte una letra de columna de Excel a número (A -> 1, B -> 2, etc.)
 * @param {string} letra - Letra de columna de Excel
 * @returns {number} Número de columna
 */
export function letraANumero(letra) {
    let numero = 0;
    for (let i = 0; i < letra.length; i++) {
        numero = numero * 26 + (letra.charCodeAt(i) - 64);
    }
    return numero;
}

export function obtenerFormulaExcel(nombreVariable, referenciasPoblacion, estructuraDinamica) {
    console.group(`🔍 DEBUG DETALLADO: obtenerFormulaExcel("${nombreVariable}")`);
    const formulas = FORMULAS_LITERALES[nombreVariable];
    console.log(`📋 Fórmulas disponibles para "${nombreVariable}":`, formulas);
    
    if (!formulas?.length) {
        console.warn(`⚠️ NO HAY FÓRMULAS DEFINIDAS en FORMULAS_LITERALES`);
        console.groupEnd();
        return '=0';
    }
    const mapaCodCol = new Map();
    console.log("📊 Estructura dinámica recibida:", estructuraDinamica);
    
    estructuraDinamica.forEach(item => {
        console.log(`  Procesando: ${item.columna} - "${item.nombre}"`);
        if (item.codigos && Array.isArray(item.codigos)) {
            item.codigos.forEach(codigo => {
                if (codigo && codigo.length >= 5) {
                    const codigoCorto = codigo.substring(0, 5).toUpperCase();
                    mapaCodCol.set(codigoCorto, item.columna);
                    console.log(`    Mapeado: ${codigoCorto} → ${item.columna}`);
                }
            });
        } else {
            console.log(`    ⚠️ SIN códigos en: ${item.nombre}`);
        }
    });

    console.log(`🗺️ Mapa final (${mapaCodCol.size} entradas):`, 
        Array.from(mapaCodCol.entries()));

    console.log("👥 Referencias población disponibles:", referenciasPoblacion);

    for (let i = 0; i < formulas.length; i++) {
        const formulaOriginal = formulas[i];
        console.log(`\n🧪 Probando fórmula ${i + 1}/${formulas.length}: ${formulaOriginal}`);
        
        const variablesEnFormula = extraerVariablesDeFormula(formulaOriginal);
        console.log(`📊 Variables encontradas en fórmula:`, variablesEnFormula);
        
        let todasExisten = true;
        const reemplazos = {};
        
        for (const varName of variablesEnFormula) {
            const varNameUpper = varName.toUpperCase();
            
            if (varNameUpper.startsWith("POBLACION_")) {
                console.log(`  👥 Buscando población: ${varNameUpper}`);
                
                const posiblesClaves = [
                    varNameUpper,
                    varNameUpper.replace(/_/g, ' '),
                    varNameUpper === "POBLACION_MENOR_1_AÑO" ? "POBLACIÓN <1 AÑO" : null,
                    varNameUpper === "POBLACION_1_AÑO" ? "POBLACIÓN 1 AÑO" : null,
                    varNameUpper === "POBLACION_4_AÑOS" ? "POBLACIÓN 4 AÑO" : null,
                    varNameUpper === "POBLACION_6_AÑOS" ? "POBLACIÓN 6 AÑO" : null
                ].filter(Boolean);
                
                console.log(`    Posibles claves:`, posiblesClaves);
                
                let encontrada = false;
                for (const clave of posiblesClaves) {
                    if (referenciasPoblacion[clave]) {
                        reemplazos[varName] = referenciasPoblacion[clave];
                        console.log(`    ✅ Encontrada: ${clave} → ${referenciasPoblacion[clave]}`);
                        encontrada = true;
                        break;
                    }
                }
                
                if (!encontrada) {
                    console.log(`    ❌ NO encontrada. Claves disponibles:`, 
                        Object.keys(referenciasPoblacion));
                    todasExisten = false;
                    break;
                }
            } else {
                const codigoCorto = varNameUpper.substring(0, 5);
                console.log(`  🔍 Buscando variable: ${varNameUpper} (${codigoCorto})`);
                
                const columna = mapaCodCol.get(codigoCorto);
                if (columna) {
                    reemplazos[varName] = columna;
                    console.log(`    ✅ Encontrada: ${codigoCorto} → ${columna}`);
                } else {
                    console.log(`    ❌ NO encontrada. Códigos disponibles:`, 
                        Array.from(mapaCodCol.keys()));
                    todasExisten = false;
                    break;
                }
            }
        }
        
        if (todasExisten) {
            console.log(`🎯 ¡Fórmula ${i + 1} VÁLIDA!`);
            let formulaFinal = formulaOriginal;
            const variablesOrdenadas = Object.keys(reemplazos)
                .sort((a, b) => b.length - a.length);
            
            console.log(`📝 Reemplazos a aplicar:`, reemplazos);
            
            for (const varName of variablesOrdenadas) {
                const regex = new RegExp(`\\b${varName}\\b`, 'gi');
                formulaFinal = formulaFinal.replace(regex, `${reemplazos[varName]}{FILA}`);
            }
            
            console.log(`✅ Fórmula final: =${formulaFinal}`);
            console.groupEnd();
            return `=${formulaFinal}`;
        }
    }
    
    console.warn(`⚠️ NINGUNA fórmula funcionó para "${nombreVariable}"`);
    console.log(`🔍 Revisar:`);
    console.log(`  - Códigos en mapa:`, Array.from(mapaCodCol.keys()));
    console.log(`  - Referencias población:`, Object.keys(referenciasPoblacion));
    console.groupEnd();
    return '=0';
}

/**
 * Construye una fórmula Excel válida a partir de los códigos de variables existentes
 * @param {string} nombreFormula - Ej. "% BCG"
 * @param {Array<string>} variablesExistentes - Ej. ["BIO01", "BIO50", "VBC02"]
 * @param {Object} referenciasPoblacion - Ej. { "POBLACION_MENOR_1_AÑO": "A" }
 * @param {Array} estructuraDinamica - Para mapear códigos a columnas
 * @returns {string} Fórmula Excel lista para usar
 */
export function construirFormulaDesdeVariables(
    nombreFormula,
    variablesExistentes,
    referenciasPoblacion,
    estructuraDinamica
) {
    const formulasPosibles = FORMULAS_LITERALES[nombreFormula];
    if (!formulasPosibles || formulasPosibles.length === 0) {
        console.warn(`⚠️ No hay fórmulas definidas para: ${nombreFormula}`);
        return "=0";
    }
    const codigosExistentes = estructuraDinamica
        .flatMap(it => it.codigos || [])
        .map(c => c.substring(0, 5));        
    for (const formulaLiteral of formulasPosibles) {
        const variablesEnFormula = extraerVariablesDeFormula(formulaLiteral);
        const todosExisten = variablesEnFormula.every(codigo =>
            codigo.startsWith("POBLACION_") || codigosExistentes.includes(codigo)
        );
        if (!todosExisten) continue;           
        let formulaExcel = formulaLiteral;

        variablesEnFormula.forEach(varName => {
            if (varName.startsWith("POBLACION_")) {
                const col = referenciasPoblacion[varName];
                if (col) {
                    formulaExcel = formulaExcel.replaceAll(varName, `${col}{FILA}`);
                }
                return;
            }
            const item = estructuraDinamica.find(it =>
                it.codigos?.some(c => c.substring(0, 5) === varName)
            );

            if (item) {
                formulaExcel = formulaExcel.replaceAll(varName, `${item.columna}{FILA}`);
            } else {
                formulaExcel = formulaExcel.replaceAll(varName, "0");
            }
        });

        return `=${formulaExcel}`;
    }

    console.warn(`⚠️ Ninguna fórmula válida para: ${nombreFormula}`);
    return "=0";
}

/**
 * Extrae variables BIO/VBC/etc. de una fórmula
 * @param {string} formula - Fórmula de Excel
 * @returns {Array<string>} Array de variables encontradas
 */
export function extraerVariablesDeFormula(formula) {
    if (!formula) return [];
    
    console.log(`🔍 Extrayendo variables de: "${formula}"`);
    const regexPoblacion = /POBLACION_(MENOR_1_AÑO|1_AÑO|4_AÑOS|6_AÑOS)/gi;
    
    const matchesPoblacion = formula.match(regexPoblacion) || [];
    console.log(`📍 Parámetros población encontrados:`, matchesPoblacion);
    const regexVariables = /\b(BIO|VBC|VAC|VRV|VTV)\d{2,3}\b/gi;
    const matchesVariables = formula.match(regexVariables) || [];
    const regexVariablesCortas = /\b(BIO|VBC|VAC|VRV|VTV)\d{2}\b/gi;
    const matchesVariablesCortas = formula.match(regexVariablesCortas) || [];
    const todasVariables = [...matchesVariables, ...matchesVariablesCortas];
    const variablesUnicas = [...new Set(todasVariables)];
    
    console.log(`📍 Variables BIO/VBC encontradas:`, variablesUnicas);
    const todas = [...matchesPoblacion, ...variablesUnicas];
    const resultado = [...new Set(todas)];
    
    console.log(`✅ Extraídas ${resultado.length} variables:`, resultado);
    
    return resultado;
}

/**
 * Extrae códigos posibles de una variable basándose en su nombre
 * @param {string} nombreVariable - Nombre de la variable
 * @returns {Array<string>|null} Array de códigos posibles o null si no se encuentra
 */
export function extraerCodigosDeVariable(nombreVariable) {
    if (!nombreVariable) return null;
    const m = nombreVariable.match(/\b(BIO|VBC|VAC|VRV|VTV)\d{2}\b/);
    return m ? [m[0]] : null;
}

/**
 * Determina el tipo de población basándose en el nombre de la variable
 * @param {string} nombreVariable - Nombre de la variable
 * @returns {string} Tipo de población
 */
export function determinarTipoPoblacion(nombreVariable) {
    if (!nombreVariable) return TIPOS_POBLACION.MENOR_1_AÑO;
    for (const [patron, tipo] of Object.entries(MAPEO_POBLACION_POR_VARIABLE)) {
        if (nombreVariable.toUpperCase().includes(patron.toUpperCase())) {
            return tipo;
        }
    }

    return TIPOS_POBLACION.MENOR_1_AÑO; 
}

/**
 * Extrae la estructura dinámica de variables desde un worksheet
 * @param {Object} worksheet - Objeto worksheet de ExcelJS
 * @param {Array} estructura - Estructura de apartados y variables
 * @returns {Array} Estructura dinámica con información de columnas
 */
export function extraerEstructuraDinamica(worksheet, estructura) {
    const estructuraDinamica = [];
    let columnaActual = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES; 

    console.group("🔍 EXTRACCIÓN ESTRUCTURA DINÁMICA");
    console.log("📋 Estructura recibida:", estructura);
    
    if (!estructura || estructura.length === 0) {
        console.warn("⚠️ Estructura vacía recibida");
        console.groupEnd();
        return estructuraDinamica;
    }

    estructura.forEach((apartado, apartadoIndex) => {
        console.log(`\n📌 Apartado ${apartadoIndex + 1}: "${apartado.nombre}"`);
        
        apartado.variables.forEach((variable, variableIndex) => {
            const codigos = extraerCodigosDeVariable(variable);
            console.log(`  Variable ${variableIndex + 1}: "${variable}" → códigos:`, codigos);

            estructuraDinamica.push({
                columna: numeroALetra(columnaActual),
                columnaNumero: columnaActual,
                nombre: variable,
                codigos: codigos,
                apartado: apartado.nombre,
                fila: 3 
            });

            columnaActual++;
        });
    });

    console.log("\n📊 Estructura dinámica final:");
    estructuraDinamica.forEach(item => {
        console.log(`  Col ${item.columna}: "${item.nombre}" →`, item.codigos);
    });
    
    console.groupEnd();
    return estructuraDinamica;
}

export function extraerEstructuraDinamicaConCodigos(worksheet, estructura, codigosVariables) {
    const estructuraDinamica = [];
    let columnaActual = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES;
    const mapaCodigos = new Map();
    estructura.forEach(apartado => {
        apartado.variables.forEach(nombreVariable => {
            const codigosParaVariable = codigosVariables.filter(codigo => {
                return nombreVariable.includes(codigo);
            });

            estructuraDinamica.push({
                columna: numeroALetra(columnaActual),
                columnaNumero: columnaActual,
                nombre: nombreVariable,
                codigos: codigosParaVariable.length > 0 ? codigosParaVariable : null,
                apartado: apartado.nombre,
                fila: 3
            });
            codigosParaVariable.forEach(codigo => {
                mapaCodigos.set(codigo, numeroALetra(columnaActual));
            });

            columnaActual++;
        });
    });

    console.log("📊 Estructura dinámica CON códigos reales:");
    estructuraDinamica.forEach(item => {
        console.log(`  Col ${item.columna}: "${item.nombre}" →`, item.codigos);
    });

    console.log("🗺️ Mapa códigos→columnas:", Object.fromEntries(mapaCodigos));

    return estructuraDinamica;
}

/**
 * Obtiene referencias de población desde un worksheet
 * @param {Object} worksheet - Objeto worksheet de ExcelJS
 * @returns {Object} Objeto con referencias de población por tipo
 */
export function obtenerReferenciasPoblacion(worksheet, estructuraDinamica = null) {
    const referencias = {};
    
    console.group("🔍 BUSCANDO REFERENCIAS POBLACIÓN");
    const columnasEsperadas = EXCEL_CONFIG.COLUMNAS_FIJAS.slice(0, 4);
    console.log("📋 Columnas esperadas (primeras 4 de EXCEL_CONFIG):", columnasEsperadas);
    for (let col = 1; col <= worksheet.columnCount; col++) {
        try {
            const cell = worksheet.getRow(1).getCell(col);
            const valor = cell.value?.toString() || "";
            
            if (valor && valor.trim() !== "") {
                console.log(`Col ${col} (${numeroALetra(col)}): "${valor}"`);
                columnasEsperadas.forEach(columnaConfig => {
                    const nombreEsperado = columnaConfig.nombre;
                    if (valor.toUpperCase().includes(nombreEsperado.toUpperCase())) {
                        const letraColumna = numeroALetra(col);
                        referencias[nombreEsperado] = letraColumna;
                        if (nombreEsperado === "POBLACIÓN <1 AÑO") {
                            referencias["POBLACION_MENOR_1_AÑO"] = letraColumna;
                        } else if (nombreEsperado === "POBLACIÓN 1 AÑO") {
                            referencias["POBLACION_1_AÑO"] = letraColumna;
                        } else if (nombreEsperado === "POBLACIÓN 4 AÑO") {
                            referencias["POBLACION_4_AÑOS"] = letraColumna;
                        } else if (nombreEsperado === "POBLACIÓN 6 AÑO") {
                            referencias["POBLACION_6_AÑOS"] = letraColumna;
                        }
                        
                        console.log(`  ✅ Coincidencia: "${nombreEsperado}" → ${letraColumna}`);
                    }
                });
            }
        } catch (e) {
        }
    }
    if (Object.keys(referencias).length === 0) {
        console.warn("⚠️ No encontró población en encabezados, usando configuración predeterminada");
        const totalColumnasDinamicas = estructuraDinamica?.length || 0;
        const columnaInicioPoblacion = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES + totalColumnasDinamicas;
        console.log(`📍 Total columnas dinámicas: ${totalColumnasDinamicas}`);
        console.log(`📍 Columna inicio población: ${columnaInicioPoblacion} (${numeroALetra(columnaInicioPoblacion)})`);
        const poblaciones = [
            { nombre: "POBLACIÓN <1 AÑO", clave: "POBLACION_MENOR_1_AÑO" },
            { nombre: "POBLACIÓN 1 AÑO", clave: "POBLACION_1_AÑO" },
            { nombre: "POBLACIÓN 4 AÑO", clave: "POBLACION_4_AÑOS" },
            { nombre: "POBLACIÓN 6 AÑO", clave: "POBLACION_6_AÑOS" }
        ];
        
        poblaciones.forEach((poblacion, index) => {
            const columnaNumero = columnaInicioPoblacion + index;
            const letraColumna = numeroALetra(columnaNumero);
            
            referencias[poblacion.nombre] = letraColumna;
            referencias[poblacion.clave] = letraColumna;
            
            console.log(`📍 Asignando ${poblacion.clave} → ${letraColumna} (columna ${columnaNumero})`);
        });
    }

    console.log("📍 Referencias finales:", referencias);
    console.groupEnd();
    
    return referencias;
}

/**
 * Convierte una fórmula literal a fórmula Excel con referencias de columna
 * @param {string} formulaLiteral - Fórmula literal con variables genéricas
 * @param {string} referenciaPoblacion - Referencia de columna para población
 * @param {Array} estructuraDinamica - Estructura dinámica de variables
 * @returns {string} Fórmula de Excel con referencias
 */
export function convertirFormulaAExcel(formulaLiteral, referenciaPoblacion, estructuraDinamica) {
    let formulaExcel = formulaLiteral;
    const mapeoPoblacion = {
        "POBLACION_MENOR_1_AÑO": referenciaPoblacion,
        "POBLACION_1_AÑO": referenciaPoblacion,
        "POBLACION_4_AÑOS": referenciaPoblacion,
        "POBLACION_6_AÑOS": referenciaPoblacion
    };
    const variables = extraerVariablesDeFormula(formulaExcel);

    variables.forEach(varName => {
        if (mapeoPoblacion[varName]) {
            formulaExcel = formulaExcel.replace(
                new RegExp(varName, 'g'),
                `${mapeoPoblacion[varName]}{FILA}`
            );
        }
        else {
            const item = estructuraDinamica.find(item =>
                item.codigos?.includes(varName) ||
                item.nombre?.toUpperCase().includes(varName)
            );

            if (item) {
                formulaExcel = formulaExcel.replace(
                    new RegExp(varName, 'g'),
                    `${item.columna}{FILA}`
                );
            }
        }
    });
    if (!formulaExcel.startsWith("=")) {
        formulaExcel = "=" + formulaExcel;
    }

    return formulaExcel;
}

/**
 * Construye una fila de valores de variables para un resultado
 * @param {Object} resultado - Resultado de una CLUES
 * @returns {Array<number>} Array de valores en orden exacto
 */
export function construirFilaVariables(resultado) {
    const lista = [];

    if (!resultado || !resultado.biologicos) {
        console.warn("Resultado inválido para construir fila de variables");
        return lista;
    }

    resultado.biologicos.forEach(ap => {
        if (!ap.grupos) return;

        ap.grupos.forEach(g => {
            if (!g.variables) return;

            g.variables.forEach(v => {
                lista.push(Number(v.total) || 0);
            });
        });
    });

    return lista;
}

/**
 * Construye datos aplanados para exportación a Excel
 * @param {Array} resultadosConsulta - Array de resultados de consulta
 * @param {Function} obtenerInicialesInstitucion - Función para obtener iniciales de institución
 * @returns {Array} Array de objetos con datos aplanados
 */
export function construirDatosParaExcel(resultadosConsulta, obtenerInicialesInstitucion) {
    const filas = [];

    if (!resultadosConsulta || !Array.isArray(resultadosConsulta)) {
        console.warn("No hay resultados para construir datos de Excel");
        return filas;
    }

    resultadosConsulta.forEach(r => {
        const base = {
            clues: r.clues || '',
            unidad: r.unidad?.nombre ?? "",
            entidad: r.unidad?.entidad ?? "",
            jurisdiccion: r.unidad?.jurisdiccion ?? "",
            municipio: r.unidad?.municipio ?? "",
            institucion: obtenerInicialesInstitucion ?
                obtenerInicialesInstitucion(r.unidad?.idinstitucion) ?? "" : ""
        };
        if (!r.biologicos || !Array.isArray(r.biologicos)) {
            console.warn(`CLUES ${r.clues} no tiene datos de biológicos`);
            return;
        }
        r.biologicos.forEach(ap => {
            if (!ap.grupos || !Array.isArray(ap.grupos)) return;

            ap.grupos.forEach(g => {
                if (!g.variables || !Array.isArray(g.variables)) return;

                g.variables.forEach(v => {
                    filas.push({
                        ...base,
                        apartado: ap.apartado || '',
                        grupo: g.grupo || '',
                        variable: v.variable || '',
                        total: Number(v.total ?? 0)
                    });
                });
            });
        });
    });

    console.log(`📊 Construidos ${filas.length} registros para Excel`);
    return filas;
}

/**
 * Aplica fórmulas a columnas fijas usando mapa completo de códigos
 * @param {Object} worksheet - Worksheet de ExcelJS
 * @param {Array} estructura - Estructura de apartados
 * @param {number} filaInicioDatos - Fila donde empiezan los datos
 * @param {Array} resultadosConsulta - Resultados de consulta
 * @param {Array} estructuraDinamica - Estructura con códigos mapeados
 * @param {Object} referenciasPoblacion - Referencias de columnas de población
 * @returns {number} Columna donde empiezan las fijas
 */
export function aplicarFormulasColumnasFijasConMapa(
    worksheet,
    estructura,
    filaInicioDatos,
    resultadosConsulta,
    estructuraDinamica,
    referenciasPoblacion
) {
    try {
        console.log("🔧 Iniciando aplicarFormulasColumnasFijasConMapa...");
        let totalColumnasDinamicas = 0;
        estructura.forEach(apartado => {
            totalColumnasDinamicas += apartado.variables.length;
        });
        const columnaInicioFijas = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES + totalColumnasDinamicas;

        console.log(`📊 Columnas dinámicas: ${totalColumnasDinamicas}`);
        console.log(`📍 Columnas fijas empiezan en: ${columnaInicioFijas}`);
        const mapaCodCol = new Map();
        estructuraDinamica.forEach(item => {
            if (item.codigos) {
                item.codigos.forEach(codigo => {
                    mapaCodCol.set(codigo, item.columna);
                });
            }
        });

        console.log("🔗 Mapa códigos→columnas:", Object.fromEntries(mapaCodCol));
        console.log("📍 Referencias población:", referenciasPoblacion);

        const columnasFijasConfig = [
            { tipo: 'poblacion', nombre: 'POBLACIÓN <1 AÑO' },
            { tipo: 'poblacion', nombre: 'POBLACIÓN 1 AÑO' },
            { tipo: 'poblacion', nombre: 'POBLACIÓN 4 AÑO' },
            { tipo: 'poblacion', nombre: 'POBLACIÓN 6 AÑO' },

            { tipo: 'formula', nombre: '% BCG', formulaKey: '% BCG' },
            { tipo: 'formula', nombre: '% Hepatitis B (<1 AÑO)', formulaKey: '% Hepatitis B (<1 AÑO)' },
            { tipo: 'formula', nombre: '% Hexavalente (<1 AÑO)', formulaKey: '% Hexavalente (<1 AÑO)' },
            { tipo: 'formula', nombre: '% Rotavirus RV1', formulaKey: '% Rotavirus RV1' },
            { tipo: 'formula', nombre: '% Neumocócica conjugada (<1 AÑO)', formulaKey: '% Neumocócica conjugada (<1 AÑO)' },
            { tipo: 'formula', nombre: '% Hexavalente (1 AÑO)', formulaKey: '% Hexavalente (1 AÑO)' },
            { tipo: 'formula', nombre: '% Neumocócica conjugada (1 AÑO)', formulaKey: '% Neumocócica conjugada (1 AÑO)' },
            { tipo: 'formula', nombre: '% SRP 1ra', formulaKey: '% SRP 1ra' },
            { tipo: 'formula', nombre: '% SRP 2da', formulaKey: '% SRP 2da' },
            { tipo: 'formula', nombre: '% ESQUEMA COMPLETO DE DPT EN 4 AÑOS', formulaKey: '% ESQUEMA COMPLETO DE DPT EN 4 AÑOS' },
            { tipo: 'formula', nombre: '% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS', formulaKey: '% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS' }
        ];

        for (let i = 0; i < columnasFijasConfig.length; i++) {
            const config = columnasFijasConfig[i];
            const columnaExcel = columnaInicioFijas + i;

            if (config.tipo === 'formula') {
                for (let fila = filaInicioDatos; fila < filaInicioDatos + resultadosConsulta.length; fila++) {
                    try {
                        const formulaExcel = obtenerFormulaExcel(
                            config.formulaKey,
                            referenciasPoblacion,
                            estructuraDinamica
                        ).replace(/{FILA}/g, fila);

                        worksheet.getRow(fila).getCell(columnaExcel).value = {
                            formula: formulaExcel.replace(/^=/, ''),
                            result: 0
                        };

                        console.log(`📝 Fila ${fila}, Col ${columnaExcel}: ${formulaExcel}`);

                    } catch (error) {
                        console.warn(`⚠️ Error en fórmula ${config.formulaKey}, fila ${fila}:`, error.message);
                        worksheet.getRow(fila).getCell(columnaExcel).value = 0;
                    }
                }
            }
        }

        console.log("✅ Fórmulas aplicadas exitosamente con mapa");
        return columnaInicioFijas;

    } catch (error) {
        console.error("❌ Error en aplicarFormulasColumnasFijasConMapa:", error);
        throw error;
    }
}

export function crearColumnasFijasEstructuraImagen2(worksheet, columnasFijas, columnaInicioFijas, filaInicioDatos, resultadosConsulta, codigosVariables) {
    console.group("🛠️ Creando estructura EXACTA de imagen 2...");
    
    let columnaActual = columnaInicioFijas;
    console.log("📌 Creando 4 columnas de población...");
    for (let i = 0; i < 4; i++) {
        const columnaConfig = columnasFijas[i];
        const colExcel = columnaActual + i;
        worksheet.getRow(1).getCell(colExcel).value = columnaConfig.nombre;
        worksheet.mergeCells(1, colExcel, 4, colExcel);
        const cell = worksheet.getRow(1).getCell(colExcel);
        cell.font = { 
            bold: true, 
            size: 11, 
            color: { argb: COLORES.TEXT_WHITE }
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: columnaConfig.color }
        };
        cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'center', 
            wrapText: true 
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        worksheet.getColumn(colExcel).width = columnaConfig.ancho;

        console.log(`  ✅ Población ${i + 1}: "${columnaConfig.nombre}" en col ${colExcel}`);
    }

    columnaActual += 4;
    const grupoCobertura = columnasFijas[4];
    console.log(`📌 Creando grupo: "${grupoCobertura.nombre}"`);
    let totalVariablesCobertura = 0;
    grupoCobertura.subgrupos.forEach(subgrupo => {
        totalVariablesCobertura += subgrupo.variables.length;
    });

    const columnaFinCobertura = columnaActual + totalVariablesCobertura - 1;
    worksheet.mergeCells(1, columnaActual, 1, columnaFinCobertura);
    const tituloCell = worksheet.getRow(1).getCell(columnaActual);
    tituloCell.value = grupoCobertura.nombre;
    tituloCell.font = { 
        bold: true, 
        size: 14, 
        color: { argb: COLORES.TEXT_BLACK }
    };
    tituloCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: grupoCobertura.color }
    };
    tituloCell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
    };
    tituloCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };

    console.log(`📌 Título "${grupoCobertura.nombre}" en columnas ${columnaActual} a ${columnaFinCobertura}`);
    let subgrupoOffset = 0;
    let subgrupoInicio = columnaActual;

    grupoCobertura.subgrupos.forEach((subgrupo, subIndex) => {
        const subgrupoColumnas = subgrupo.variables.length;
        const subgrupoFin = subgrupoInicio + subgrupoColumnas - 1;
        if (subgrupo.nombre && subgrupo.nombre.trim() !== "") {
            console.log(`📌 Subgrupo "${subgrupo.nombre}" en columnas ${subgrupoInicio} a ${subgrupoFin}`);
            worksheet.mergeCells(2, subgrupoInicio, 2, subgrupoFin);
            const subgrupoCell = worksheet.getRow(2).getCell(subgrupoInicio);
            subgrupoCell.value = subgrupo.nombre;
            subgrupoCell.font = { 
                bold: true, 
                size: 11, 
                color: { argb: COLORES.TEXT_BLACK }
            };
            subgrupoCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: subgrupo.color }
            };
            subgrupoCell.alignment = { 
                vertical: 'middle', 
                horizontal: 'center', 
                wrapText: true 
            };
            subgrupoCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            subgrupo.variables.forEach((variable, varIndex) => {
                const colVariable = subgrupoInicio + varIndex;
                const varCell = worksheet.getRow(3).getCell(colVariable);
                varCell.value = variable.nombre;
                varCell.font = { 
                    bold: true, 
                    size: 10, 
                    color: { argb: COLORES.TEXT_BLACK }
                };
                varCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: variable.color }
                };
                varCell.alignment = { 
                    vertical: 'middle', 
                    horizontal: 'center', 
                    wrapText: true 
                };
                varCell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                worksheet.mergeCells(3, colVariable, 4, colVariable);
                worksheet.getColumn(colVariable).width = variable.ancho;

                console.log(`  📊 Variable: "${variable.nombre}" en col ${colVariable}`);
            });

        }
        else if (subgrupo.variables.length > 0) {
            console.log(`📌 Variables finales sin subgrupo en columnas ${subgrupoInicio} a ${subgrupoFin}`);
            subgrupo.variables.forEach((variable, varIndex) => {
                const colVariable = subgrupoInicio + varIndex;
                const varCell = worksheet.getRow(2).getCell(colVariable);
                varCell.value = variable.nombre;
                varCell.font = { 
                    bold: true, 
                    size: 10, 
                    color: { argb: COLORES.TEXT_BLACK }
                };
                varCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: variable.color }
                };
                varCell.alignment = { 
                    vertical: 'middle', 
                    horizontal: 'center', 
                    wrapText: true 
                };
                varCell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                worksheet.mergeCells(2, colVariable, 4, colVariable);
                worksheet.getColumn(colVariable).width = variable.ancho;

                console.log(`  📊 Variable final: "${variable.nombre}" en col ${colVariable} (combinada filas 2-4)`);
            });
        }
        subgrupoInicio += subgrupoColumnas;
        subgrupoOffset += subgrupoColumnas;
    });
    console.log("📌 Aplicando bordes a todas las celdas de columnas fijas...");
    for (let col = columnaInicioFijas; col <= columnaFinCobertura; col++) {
        for (let row = 1; row <= 4; row++) {
            const cell = worksheet.getRow(row).getCell(col);
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
    worksheet.getRow(1).height = 25;
    worksheet.getRow(2).height = 25;
    worksheet.getRow(3).height = 60;
    worksheet.getRow(4).height = 60;

    console.log("✅ Estructura de imagen 2 creada exitosamente");
    console.groupEnd();
}

/**
 * Aplica fórmulas a columnas fijas y CREA las columnas si no existen
 * @param {Object} worksheet - Worksheet de ExcelJS
 * @param {Array} estructura - Estructura de apartados y variables
 * @param {number} filaInicioDatos - Fila donde empiezan los datos (generalmente 5)
 * @param {Array} resultadosConsulta - Resultados de la consulta
 */
export function aplicarFormulasColumnasFijas(worksheet, estructura, filaInicioDatos = 5, resultadosConsulta, codigosVariables) {
    try {
        console.log("🔧 Iniciando aplicarFormulasColumnasFijas...");
        console.log(`📊 Códigos variables recibidos:`, codigosVariables);
        let totalColumnasDinamicas = 0;
        estructura.forEach(apartado => {
            totalColumnasDinamicas += apartado.variables.length;
        });
        const columnaInicioFijas = 7 + totalColumnasDinamicas; 
        console.log(`🔧 Columnas dinámicas: ${totalColumnasDinamicas}, Inicio columnas fijas: columna ${columnaInicioFijas}`);
        const estructuraDinamica = extraerEstructuraDinamicaConCodigos(worksheet, estructura, codigosVariables);
        const referenciasPoblacion = obtenerReferenciasPoblacion(worksheet);
        const celdaPrimeraColumnaFija = worksheet.getRow(1).getCell(columnaInicioFijas).value;
        const columnasFijasExisten = celdaPrimeraColumnaFija &&
            (celdaPrimeraColumnaFija.includes("POBLACIÓN") ||
                celdaPrimeraColumnaFija.includes("POBLACION"));

        if (!columnasFijasExisten) {
            console.log("📌 Columnas fijas no existen, creándolas con estructura de imagen 2...");
            const columnasFijas = [
                {
                    nombre: "POBLACION <1 AÑO",
                    ancho: 15,
                    esGrupo: false,
                    color: '902449',
                    tipo: 'poblacion'
                },
                {
                    nombre: "POBLACION 1 AÑO",
                    ancho: 15,
                    esGrupo: false,
                    color: '902449',
                    tipo: 'poblacion'
                },
                {
                    nombre: "POBLACION 4 AÑOS",
                    ancho: 15,
                    esGrupo: false,
                    color: '902449',
                    tipo: 'poblacion'
                },
                {
                    nombre: "POBLACION 6 AÑOS",
                    ancho: 15,
                    esGrupo: false,
                    color: '902449',
                    tipo: 'poblacion'
                },
                {
                    nombre: "COBERTURA PVU",
                    esGrupo: true,
                    color: 'fef2cb',
                    tipo: 'grupo_principal',
                    subgrupos: [
                        {
                            nombre: "ESQUEMAS POR BIOLOGICO PARA MENORES DE1ANO",
                            color: 'ffc000',
                            tipo: 'subgrupo',
                            variables: [
                                {
                                    nombre: "% BCG",
                                    formula: obtenerFormulaExcel("% BCG", referenciasPoblacion, estructuraDinamica),
                                    ancho: 10,
                                    color: '0066cc'
                                },
                                {
                                    nombre: "% Hepatitis B (<1 AÑO)",
                                    formula: obtenerFormulaExcel("% Hepatitis B (<1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                    ancho: 15,
                                    color: 'ff6600'
                                },
                                {
                                    nombre: "% Hexavalente (<1 AÑO)",
                                    formula: obtenerFormulaExcel("% Hexavalente (<1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                    ancho: 15,
                                    color: '6699ff'
                                },
                                {
                                    nombre: "% Rotavirus RV1",
                                    formula: obtenerFormulaExcel("% Rotavirus RV1", referenciasPoblacion, estructuraDinamica),
                                    ancho: 12,
                                    color: '548135'
                                },
                                {
                                    nombre: "% Neumocócica conjugada (<1 AÑO)",
                                    formula: obtenerFormulaExcel("% Neumocócica conjugada (<1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                    ancho: 18,
                                    color: '00ccff'
                                }
                            ]
                        },
                        {
                            nombre: "ESQUEMAS COMPLETOS POR BIOLOGICO EN 1 AÑO",
                            color: '70ad47',
                            tipo: 'subgrupo',
                            variables: [
                                {
                                    nombre: "% Hexavalente (1 AÑO)",
                                    formula: obtenerFormulaExcel("% Hexavalente (1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                    ancho: 15,
                                    color: '6699ff'
                                },
                                {
                                    nombre: "% Neumocócica conjugada (1 AÑO)",
                                    formula: obtenerFormulaExcel("% Neumocócica conjugada (1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                    ancho: 18,
                                    color: '00ccff'
                                },
                                {
                                    nombre: "% SRP 1ra",
                                    formula: obtenerFormulaExcel("% SRP 1ra", referenciasPoblacion, estructuraDinamica),
                                    ancho: 10,
                                    color: '9933ff'
                                },
                                {
                                    nombre: "% SRP 2da",
                                    formula: obtenerFormulaExcel("% SRP 2da", referenciasPoblacion, estructuraDinamica),
                                    ancho: 10,
                                    color: '9933ff'
                                }
                            ]
                        },
                        {
                            nombre: "", 
                            color: 'FFB7DEE8',
                            tipo: 'variables_finales',
                            variables: [
                                {
                                    nombre: "% ESQUEMA COMPLETO DE DPT EN 4 AÑOS",
                                    formula: obtenerFormulaExcel("% ESQUEMA COMPLETO DE DPT EN 4 AÑOS", referenciasPoblacion, estructuraDinamica),
                                    ancho: 22,
                                    color: 'ffd965'
                                },
                                {
                                    nombre: "% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS",
                                    formula: obtenerFormulaExcel("% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS", referenciasPoblacion, estructuraDinamica),
                                    ancho: 22,
                                    color: '6699ff'
                                }
                            ]
                        }
                    ]
                }
            ];
            crearColumnasFijasEstructuraImagen2(worksheet, columnasFijas, columnaInicioFijas, filaInicioDatos, resultadosConsulta);

            console.log("✅ Columnas fijas creadas con estructura de imagen 2");
        } else {
            console.log("✅ Columnas fijas ya existen, aplicando fórmulas...");
        }
        aplicarFormulasAColumnasFijas(worksheet, columnaInicioFijas, filaInicioDatos, resultadosConsulta.length);

        console.log("✅ Fórmulas aplicadas exitosamente a columnas fijas!");
        return columnaInicioFijas;
    } catch (error) {
        console.error("❌ Error en aplicarFormulasColumnasFijas:", error);
        throw error;
    }
}
export function mapearCodigosAColumnas(codigosVariables, estructuraDinamica) {
    const mapa = new Map();

    codigosVariables.forEach(codigo => {
        const item = estructuraDinamica.find(it =>
            it.codigos?.some(c => c.substring(0, 5) === codigo)
        );

        if (item) {
            mapa.set(codigo, item.columna);
        } else {
            console.warn(`⚠️ Código sin columna: ${codigo}`);
        }
    });

    return mapa;
}

function aplicarFormulasAColumnasFijas(worksheet, columnaInicioFijas, filaInicioDatos, totalFilas) {
    console.log(`📝 Aplicando fórmulas a ${totalFilas} filas de datos...`);
    const columnaFormulas = [
        // POBLACIONES (sin fórmula, solo datos)
        null, // <1 AÑO
        null, // 1 AÑO
        null, // 4 AÑOS
        null, // 6 AÑOS

        // COBERTURA PVU
        '% BCG',
        '% Hepatitis B (<1 AÑO)',
        '% Hexavalente (<1 AÑO)',
        '% Rotavirus RV1',
        '% Neumocócica conjugada (<1 AÑO)',
        '% Hexavalente (1 AÑO)',
        '% Neumocócica conjugada (1 AÑO)',
        '% SRP 1ra',
        '% SRP 2da',
        '% ESQUEMA COMPLETO DE DPT EN 4 AÑOS',
        '% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS'
    ];
    const estructuraDinamica = extraerEstructuraDinamica(worksheet, []); // vacío porque ya está creada
    const referenciasPoblacion = obtenerReferenciasPoblacion(worksheet);

    for (let fila = filaInicioDatos; fila < filaInicioDatos + totalFilas; fila++) {
        columnaFormulas.forEach((formulaKey, idx) => {
            if (!formulaKey) return; 

            const col = columnaInicioFijas + idx;
            try {
                let formula = obtenerFormulaExcel(formulaKey, referenciasPoblacion, estructuraDinamica)
                    .replace(/^=/, '')
                    .replace(/{FILA}/g, fila);
                const poblacionMap = {
                    'POBLACION_MENOR_1_AÑO': 'POBLACIÓN <1 AÑO',
                    'POBLACION_1_AÑO': 'POBLACIÓN 1 AÑO',
                    'POBLACION_4_AÑOS': 'POBLACIÓN 4 AÑO',
                    'POBLACION_6_AÑOS': 'POBLACIÓN 6 AÑO'
                };

                Object.entries(poblacionMap).forEach(([formulaKey, refKey]) => {
                    const col = referenciasPoblacion[refKey];
                    if (col) {
                        formula = formula.replaceAll(formulaKey, col + fila);
                    }
                });

                console.group('🔍 DIAGNOSTICO POBLACION');
                console.log('formulaKey:', formulaKey);
                console.log('formula cruda:', obtenerFormulaExcel(formulaKey, referenciasPoblacion, estructuraDinamica));
                console.log('referenciasPoblacion:', referenciasPoblacion);
                console.log('POBLACION_MENOR_1_AÑO existe?:', 'POBLACION_MENOR_1_AÑO' in referenciasPoblacion);
                console.log('valor de esa clave:', referenciasPoblacion['POBLACION_MENOR_1_AÑO']);
                console.log('fila actual:', fila);
                console.log('formula después del replace:', formula);
                console.groupEnd();
                console.log('📄 EXCELJS recibe:', formula);
                worksheet.getRow(fila).getCell(col).value = {
                    formula: formula,
                    result: 0
                };
            } catch (e) {
                console.warn(`⚠️ Fórmula no válida para ${formulaKey} en fila ${fila}:`, e.message);
                worksheet.getRow(fila).getCell(col).value = { formula: '0', result: 0 };
            }
        });
    }

    console.log("✅ Fórmulas aplicadas");
}

/**
 * Aplica fórmulas de plantilla a un worksheet
 * @param {Object} worksheet - Worksheet de ExcelJS
 * @param {Array} resultadosConsulta - Resultados de la consulta
 * @param {Function} obtenerInicialesInstitucion - Función para obtener iniciales
 * @param {number} filaInicio - Fila donde comienzan los datos (por defecto 5)
 */
export function aplicarFormulasPlantilla(
    worksheet,
    resultadosConsulta,
    obtenerInicialesInstitucion,
    filaInicio = EXCEL_CONFIG.FILA_INICIO_DATOS
) {
    try {
        console.log("🔧 Aplicando fórmulas de plantilla...");

        resultadosConsulta.forEach((r, index) => {
            const fila = filaInicio + index;
            Object.entries(EXCEL_CONFIG.FORMULAS_PLANTILLA).forEach(([col, formula]) => {
                const formulaFinal = formula.replace(REGEX.MARCADOR_FILA, fila);

                const cell = worksheet.getCell(`${col}${fila}`);
                cell.value = {
                    formula: formulaFinal,
                    result: 0
                };
                console.log(`📊 Celda ${col}${fila} -> Fórmula: ${formulaFinal}`);
                console.log(`📊 Tipo de asignación:`, typeof cell.value, cell.value);
            });
            aplicarFormulasEspecificas(worksheet, r, fila, obtenerInicialesInstitucion);
        });

        console.log("✅ Fórmulas de plantilla aplicadas exitosamente!");
    } catch (error) {
        console.error("❌ Error al aplicar fórmulas de plantilla:", error);
        throw error;
    }
}

/**
 * Valida si una fórmula es sintácticamente correcta
 * @param {string} formula - Fórmula a validar
 * @returns {boolean} True si la fórmula es válida
 */
export function validarFormula(formula) {
    if (!formula || typeof formula !== 'string') {
        return false;
    }
    if (!formula.startsWith('=')) {
        return false;
    }
    const parentesis = formula.split('').filter(c => c === '(' || c === ')');
    let balance = 0;

    for (const p of parentesis) {
        balance += p === '(' ? 1 : -1;
        if (balance < 0) return false;
    }

    if (balance !== 0) return false;
    const erroresObvios = [
        '##',
        '#¡VALOR!',
        '#¡DIV/0!',
        '#¡NULO!',
        '#¡NOMBRE?',
        '#¡NUM!',
        '#¡REF!'
    ];

    if (erroresObvios.some(error => formula.includes(error))) {
        return false;
    }

    return true;
}

/**
 * Verifica si todas las variables en una fórmula existen en la estructura dinámica
 * @param {string} formula - Fórmula a verificar
 * @param {Array} estructuraDinamica - Estructura dinámica de variables
 * @returns {Object} Resultado de la verificación
 */
export function verificarVariablesFormula(formula, estructuraDinamica) {
    const variables = extraerVariablesDeFormula(formula);
    const resultado = {
        todasExisten: true,
        variablesFaltantes: [],
        variablesEncontradas: []
    };

    variables.forEach(varName => {
        if (varName.startsWith("POBLACION_")) {
            resultado.variablesEncontradas.push({
                nombre: varName,
                tipo: 'poblacion',
                existe: true
            });
            return;
        }
        const encontrada = estructuraDinamica.some(item =>
            item.codigos?.includes(varName) ||
            item.nombre?.toUpperCase().includes(varName)
        );

        if (encontrada) {
            resultado.variablesEncontradas.push({
                nombre: varName,
                tipo: 'variable',
                existe: true
            });
        } else {
            resultado.todasExisten = false;
            resultado.variablesFaltantes.push(varName);
            resultado.variablesEncontradas.push({
                nombre: varName,
                tipo: 'variable',
                existe: false
            });
        }
    });

    return resultado;
}
/**
 * Genera un reporte de depuración de fórmulas
 * @param {Array} estructuraDinamica - Estructura dinámica de variables
 * @param {Object} referenciasPoblacion - Referencias de población
 * @returns {Object} Reporte de depuración
 */
export function generarReporteDepuracion(estructuraDinamica, referenciasPoblacion) {
    const reporte = {
        fecha: new Date().toISOString(),
        totalVariables: estructuraDinamica.length,
        referenciasPoblacion: referenciasPoblacion,
        variablesPorApartado: {},
        formulasDisponibles: {},
        problemas: []
    };
    estructuraDinamica.forEach(item => {
        if (!reporte.variablesPorApartado[item.apartado]) {
            reporte.variablesPorApartado[item.apartado] = [];
        }
        reporte.variablesPorApartado[item.apartado].push({
            columna: item.columna,
            nombre: item.nombre,
            codigos: item.codigos
        });
    });
    estructuraDinamica.forEach(item => {
        const nombreVariable = item.nombre;
        const formulas = FORMULAS_LITERALES[nombreVariable];

        if (formulas) {
            reporte.formulasDisponibles[nombreVariable] = {
                cantidad: formulas.length,
                formulas: formulas.map(f => extraerVariablesDeFormula(f))
            };
        } else {
            reporte.problemas.push(`No hay fórmulas para: ${nombreVariable}`);
        }
    });
    console.log('🔧 obtenerFormulaExcel ejecutada con', nombreVariable, formulaExcel);
    Object.entries(TIPOS_POBLACION).forEach(([key, tipo]) => {
        if (!referenciasPoblacion[tipo]) {
            reporte.problemas.push(`Falta referencia para: ${tipo}`);
        }
    });

    console.log("📋 Reporte de depuración generado:", reporte);
    return reporte;
}

export default {
    numeroALetra,
    letraANumero,
    extraerVariablesDeFormula,
    extraerCodigosDeVariable,
    determinarTipoPoblacion,
    crearColumnasFijasEstructuraImagen2,
    extraerEstructuraDinamica,
    obtenerReferenciasPoblacion,
    convertirFormulaAExcel,
    construirFilaVariables,
    construirDatosParaExcel,
    obtenerFormulaExcel,
    aplicarFormulasColumnasFijas,
    aplicarFormulasPlantilla,
    aplicarFormulasColumnasFijasConMapa,
    validarFormula,
    verificarVariablesFormula,
    generarReporteDepuracion
};