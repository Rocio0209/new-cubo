// excel-formulas.js
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

// ===============================
// FUNCIONES AUXILIARES
// ===============================

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

// excel-formulas.js

// EN excel-formulas.js, REEMPLAZAR la función obtenerFormulaExcel:

export function obtenerFormulaExcel(nombreVariable, referenciasPoblacion, estructuraDinamica) {
    console.group(`🔍 DEBUG: obtenerFormulaExcel("${nombreVariable}")`);
    console.log('Referencias población:', referenciasPoblacion);
    console.log('Estructura dinámica (primeros 5):', estructuraDinamica.slice(0, 5).map(item => ({
        columna: item.columna,
        nombre: item.nombre,
        codigos: item.codigos
    })));
    console.groupEnd();
    
    const formulas = FORMULAS_LITERALES[nombreVariable];

    if (!formulas?.length) {
        console.warn(`⚠️ No hay fórmulas definidas para: ${nombreVariable}`);
        return '=0';
    }

    console.log(`🔍 Buscando fórmula para "${nombreVariable}"`);
    console.log(`📋 ${formulas.length} fórmulas disponibles`);

    // 1. Crear mapa de códigos → columnas (primeros 5 caracteres)
    const mapaCodCol = new Map();
    estructuraDinamica.forEach(item => {
        if (item.codigos && Array.isArray(item.codigos)) {
            item.codigos.forEach(codigo => {
                if (codigo && codigo.length >= 5) {
                    const codigoCorto = codigo.substring(0, 5).toUpperCase();
                    mapaCodCol.set(codigoCorto, item.columna);
                }
            });
        }
    });

    console.log(`🗺️ Mapa con ${mapaCodCol.size} códigos disponibles`);

    // 2. Probar cada fórmula en orden (OR lógico)
    for (let i = 0; i < formulas.length; i++) {
        const formulaOriginal = formulas[i];
        console.log(`\n🧪 Probando fórmula ${i + 1}/${formulas.length}: ${formulaOriginal}`);

        // Extraer variables de esta fórmula
        const variablesEnFormula = extraerVariablesDeFormula(formulaOriginal);
        console.log(`📊 Variables en fórmula:`, variablesEnFormula);

        // Verificar si TODAS las variables de esta fórmula existen
        let todasExisten = true;
        const reemplazos = {};
        let formulaTemp = formulaOriginal;

        for (const varName of variablesEnFormula) {
            const varNameUpper = varName.toUpperCase();
            
            // 2a. Si es parámetro de población
            if (varNameUpper.startsWith("POBLACION_")) {
                // Buscar la referencia de población
                let colPoblacion = null;
                
                // Intentar diferentes formatos de clave
                const posiblesClaves = [
                    varNameUpper, // "POBLACION_MENOR_1_AÑO"
                    varNameUpper.replace(/_/g, ' '), // "POBLACION MENOR 1 AÑO"
                    varNameUpper.replace('POBLACION_', 'POBLACIÓN '), // "POBLACIÓN MENOR_1_AÑO"
                    // También buscar por tipo de población en constantes
                    varNameUpper === "POBLACION_MENOR_1_AÑO" ? "POBLACIÓN <1 AÑO" : null,
                    varNameUpper === "POBLACION_1_AÑO" ? "POBLACIÓN 1 AÑO" : null,
                    varNameUpper === "POBLACION_4_AÑOS" ? "POBLACIÓN 4 AÑO" : null,
                    varNameUpper === "POBLACION_6_AÑOS" ? "POBLACIÓN 6 AÑO" : null
                ].filter(Boolean); // Eliminar nulls

                for (const clave of posiblesClaves) {
                    if (referenciasPoblacion[clave]) {
                        colPoblacion = referenciasPoblacion[clave];
                        console.log(`   ✅ ${varName} → ${colPoblacion}{FILA} (clave: ${clave})`);
                        break;
                    }
                }

                if (colPoblacion) {
                    reemplazos[varName] = colPoblacion;
                } else {
                    console.log(`   ❌ ${varName} NO encontrada en referencias`);
                    console.log(`   Claves disponibles:`, Object.keys(referenciasPoblacion));
                    todasExisten = false;
                    break;
                }
            }
            // 2b. Si es variable BIO/VBC/etc.
            else {
                // Tomar primeros 5 caracteres del código
                const codigoCorto = varNameUpper.substring(0, 5);
                const columna = mapaCodCol.get(codigoCorto);
                
                if (columna) {
                    reemplazos[varName] = columna;
                    console.log(`   ✅ ${varName} (${codigoCorto}) → ${columna}{FILA}`);
                } else {
                    console.log(`   ❌ ${varName} (${codigoCorto}) NO encontrada`);
                    console.log(`   Códigos disponibles:`, Array.from(mapaCodCol.keys()));
                    todasExisten = false;
                    break;
                }
            }
        }

        // 3. Si TODAS las variables existen, usar esta fórmula
        if (todasExisten) {
            console.log(`🎯 ¡Fórmula ${i + 1} ES VÁLIDA! Aplicando reemplazos...`);

            // Aplicar reemplazos a la fórmula
            let formulaFinal = formulaOriginal;
            
            // Reemplazar variables por referencias de columna
            // Ordenar de más largo a más corto para evitar reemplazos parciales
            const variablesOrdenadas = Object.keys(reemplazos)
                .sort((a, b) => b.length - a.length);
            
            for (const varName of variablesOrdenadas) {
                const regex = new RegExp(`\\b${varName}\\b`, 'gi');
                formulaFinal = formulaFinal.replace(regex, `${reemplazos[varName]}{FILA}`);
            }
            
            console.log(`📝 Fórmula procesada: =${formulaFinal}`);
            console.log(`✅ Fórmula ${i + 1} seleccionada para "${nombreVariable}"`);
            return `=${formulaFinal}`;
        }
    }

    // 4. Si ninguna fórmula funciona
    console.warn(`⚠️ Ninguna de las ${formulas.length} fórmulas funciona para "${nombreVariable}"`);
    console.log(`📍 Referencias población:`, Object.keys(referenciasPoblacion));
    console.log(`📍 Códigos disponibles:`, Array.from(mapaCodCol.keys()));
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

    // 1.  Códigos que SÍ vino del back (primeros 5 caracteres)
    const codigosExistentes = estructuraDinamica
        .flatMap(it => it.codigos || [])
        .map(c => c.substring(0, 5));          // BIO50 29 DÍAS… → BIO50

    for (const formulaLiteral of formulasPosibles) {
        const variablesEnFormula = extraerVariablesDeFormula(formulaLiteral);

        // 2.  ¿Todos los códigos de la fórmula existen?
        const todosExisten = variablesEnFormula.every(codigo =>
            codigo.startsWith("POBLACION_") || codigosExistentes.includes(codigo)
        );

        if (!todosExisten) continue;           // probar siguiente fórmula

        // 3.  Convertir códigos a columnas Excel
        let formulaExcel = formulaLiteral;

        variablesEnFormula.forEach(varName => {
            // 3.a  Parámetros de población
            if (varName.startsWith("POBLACION_")) {
                const col = referenciasPoblacion[varName];
                if (col) {
                    formulaExcel = formulaExcel.replaceAll(varName, `${col}{FILA}`);
                }
                return;
            }

            // 3.b  Variables BIO/VBC/…
            const item = estructuraDinamica.find(it =>
                it.codigos?.some(c => c.substring(0, 5) === varName)
            );

            if (item) {
                formulaExcel = formulaExcel.replaceAll(varName, `${item.columna}{FILA}`);
            } else {
                // Si llegó aquí es porque la variable no existe → la anulamos
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
    
    // REGEX ESPECÍFICO para los 4 tipos de población que tienes
    const regexPoblacion = /POBLACION_(MENOR_1_AÑO|1_AÑO|4_AÑOS|6_AÑOS)/gi;
    
    const matchesPoblacion = formula.match(regexPoblacion) || [];
    console.log(`📍 Parámetros población encontrados:`, matchesPoblacion);
    
    // Extraer variables BIO/VBC
    const regexVariables = /\b(BIO|VBC|VAC|VRV|VTV)\d{2,3}\b/gi;
    const matchesVariables = formula.match(regexVariables) || [];
    
    // También extraer variables de 4-5 caracteres (por si acaso)
    const regexVariablesCortas = /\b(BIO|VBC|VAC|VRV|VTV)\d{2}\b/gi;
    const matchesVariablesCortas = formula.match(regexVariablesCortas) || [];
    
    // Combinar todas las variables
    const todasVariables = [...matchesVariables, ...matchesVariablesCortas];
    const variablesUnicas = [...new Set(todasVariables)];
    
    console.log(`📍 Variables BIO/VBC encontradas:`, variablesUnicas);
    
    // Combinar todo
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
    // primer código de 5 letras/dígitos que aparezca
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

    // Buscar patrones en el nombre de la variable
    for (const [patron, tipo] of Object.entries(MAPEO_POBLACION_POR_VARIABLE)) {
        if (nombreVariable.toUpperCase().includes(patron.toUpperCase())) {
            return tipo;
        }
    }

    return TIPOS_POBLACION.MENOR_1_AÑO; // Por defecto
}

// ===============================
// FUNCIONES DE ESTRUCTURA DINÁMICA
// ===============================

/**
 * Extrae la estructura dinámica de variables desde un worksheet
 * @param {Object} worksheet - Objeto worksheet de ExcelJS
 * @param {Array} estructura - Estructura de apartados y variables
 * @returns {Array} Estructura dinámica con información de columnas
 */
export function extraerEstructuraDinamica(worksheet, estructura) {
    const estructuraDinamica = [];
    let columnaActual = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES; // Empieza en columna G (7)

    // Recorrer la estructura original para mapear variables a columnas
    estructura.forEach(apartado => {
        apartado.variables.forEach(variable => {
            // Extraer códigos posibles de la variable
            const codigos = extraerCodigosDeVariable(variable);
            console.log(`📌 Variable ${variable} → códigos:`, codigos);

            estructuraDinamica.push({
                columna: numeroALetra(columnaActual), // Convertir a letra (G, H, I...)
                columnaNumero: columnaActual,
                nombre: variable,
                codigos: codigos,
                apartado: apartado.nombre,
                fila: 3 // La fila donde está el nombre de la variable
            });

            columnaActual++;
        });
    });

    console.log("📊 Estructura dinámica extraída:");
    estructuraDinamica.forEach(item => {
        console.log(`  Col ${item.columna}: "${item.nombre}" → [${item.codigos?.join(', ')}]`);
    });

    return estructuraDinamica;
}

// EN excel-formulas.js, agregar función:
export function extraerEstructuraDinamicaConCodigos(worksheet, estructura, codigosVariables) {
    const estructuraDinamica = [];
    let columnaActual = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES;

    // Usar los códigos reales que vienen del back
    const mapaCodigos = new Map();

    // Primero, mapear cada variable a sus posibles códigos
    estructura.forEach(apartado => {
        apartado.variables.forEach(nombreVariable => {
            // Buscar qué códigos del back corresponden a esta variable
            const codigosParaVariable = codigosVariables.filter(codigo => {
                // Verificar si el nombre de la variable contiene el código
                // Ej: "BIO01 29 DÍAS..." contiene "BIO01"
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

            // Mapear cada código a su columna
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
export function obtenerReferenciasPoblacion(worksheet) {
    const referencias = {};

    // Buscar en las primeras 4 filas (encabezados combinados)
    for (let fila = 1; fila <= 4; fila++) {
        const row = worksheet.getRow(fila);

        // Buscar en las primeras 20 columnas (ajusta según necesidad)
        for (let col = 1; col <= 20; col++) {
            try {
                const cell = row.getCell(col);
                const valor = cell.value?.toString() || "";

                console.log(`🔍 Fila ${fila}, Col ${col}: "${valor}"`);

                if (valor.includes("POBLACIÓN") || valor.includes("POBLACION")) {
                    const letraColumna = numeroALetra(col);

                    // DEBUG: Ver qué está encontrando exactamente
                    console.log(`📍 Encontrado "${valor}" en columna ${letraColumna}`);

                    // Mapear según lo que encuentre
                    if (valor.includes("<1 AÑO") || valor.includes("MENOR DE 1")) {
                        referencias["POBLACIÓN <1 AÑO"] = letraColumna;
                        referencias["POBLACION_MENOR_1_AÑO"] = letraColumna; // ← AGREGAR ESTA LÍNEA
                    } else if (valor.includes("1 AÑO")) {
                        referencias["POBLACIÓN 1 AÑO"] = letraColumna;
                        referencias["POBLACION_1_AÑO"] = letraColumna; // ← AGREGAR ESTA LÍNEA
                    } else if (valor.includes("4 AÑOS") || valor.includes("4 AÑO")) {
                        referencias["POBLACIÓN 4 AÑO"] = letraColumna;
                        referencias["POBLACION_4_AÑOS"] = letraColumna; // ← AGREGAR ESTA LÍNEA
                    } else if (valor.includes("6 AÑOS") || valor.includes("6 AÑO")) {
                        referencias["POBLACIÓN 6 AÑO"] = letraColumna;
                        referencias["POBLACION_6_AÑOS"] = letraColumna; // ← AGREGAR ESTA LÍNEA
                    }
                }
            } catch (e) {
                // Ignorar celdas fuera de rango
            }
        }
    }

    // SI NO ENCUENTRA NADA, buscar en columnas específicas (backup)
    if (Object.keys(referencias).length === 0) {
        console.warn("⚠️ No encontró población en encabezados, buscando en columnas fijas...");

        // Las columnas de población suelen estar después de las variables dinámicas
        // Supongamos que están en columnas 160-163 (ajusta según tu caso)
        const columnasPoblacion = [
            { col: 160, nombre: "POBLACIÓN <1 AÑO", clave: "POBLACION_MENOR_1_AÑO" },
            { col: 161, nombre: "POBLACIÓN 1 AÑO", clave: "POBLACION_1_AÑO" },
            { col: 162, nombre: "POBLACIÓN 4 AÑO", clave: "POBLACION_4_AÑOS" },
            { col: 163, nombre: "POBLACIÓN 6 AÑO", clave: "POBLACION_6_AÑOS" }
        ];

        columnasPoblacion.forEach(item => {
            try {
                const cell = worksheet.getRow(1).getCell(item.col);
                const letraColumna = numeroALetra(item.col);
                referencias[item.nombre] = letraColumna;
                referencias[item.clave] = letraColumna;
                console.log(`📍 Asignando ${item.clave} → ${letraColumna} (columna ${item.col})`);
            } catch (e) {
                console.warn(`No se pudo acceder a columna ${item.col}:`, e.message);
            }
        });
    }

    console.log("📍 Referencias de población FINALES:", referencias);
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

    // Mapeo de parámetros de población a referencias de columna
    const mapeoPoblacion = {
        "POBLACION_MENOR_1_AÑO": referenciaPoblacion,
        "POBLACION_1_AÑO": referenciaPoblacion,
        "POBLACION_4_AÑOS": referenciaPoblacion,
        "POBLACION_6_AÑOS": referenciaPoblacion
    };

    // Reemplazar variables por referencias de columna
    const variables = extraerVariablesDeFormula(formulaExcel);

    variables.forEach(varName => {
        // Si es variable de población, reemplazar con referencia
        if (mapeoPoblacion[varName]) {
            formulaExcel = formulaExcel.replace(
                new RegExp(varName, 'g'),
                `${mapeoPoblacion[varName]}{FILA}`
            );
        }
        // Si es una variable BIO/VBC, buscar su columna
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

    // Asegurar que la fórmula empiece con =
    if (!formulaExcel.startsWith("=")) {
        formulaExcel = "=" + formulaExcel;
    }

    return formulaExcel;
}

// ===============================
// FUNCIONES DE CONSTRUCCIÓN DE DATOS
// ===============================

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

        // Verificar que tenga biologicos
        if (!r.biologicos || !Array.isArray(r.biologicos)) {
            console.warn(`CLUES ${r.clues} no tiene datos de biológicos`);
            return;
        }

        // biologicos: [{apartado, grupos:[{grupo, variables:[{variable,total}]}]}]
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
// EN excel-formulas.js, agregar:

// EN excel-formulas.js, AGREGAR esta función:

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

        // 1. Calcular columna de inicio
        let totalColumnasDinamicas = 0;
        estructura.forEach(apartado => {
            totalColumnasDinamicas += apartado.variables.length;
        });
        const columnaInicioFijas = EXCEL_CONFIG.COLUMNA_INICIO_VARIABLES + totalColumnasDinamicas;

        console.log(`📊 Columnas dinámicas: ${totalColumnasDinamicas}`);
        console.log(`📍 Columnas fijas empiezan en: ${columnaInicioFijas}`);

        // 2. Crear mapa códigos → columnas
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

        // 3. DEFINIR COLUMNAS FIJAS CON FÓRMULAS
        const columnasFijasConfig = [
            // 4 columnas de población (sin fórmulas)
            { tipo: 'poblacion', nombre: 'POBLACIÓN <1 AÑO' },
            { tipo: 'poblacion', nombre: 'POBLACIÓN 1 AÑO' },
            { tipo: 'poblacion', nombre: 'POBLACIÓN 4 AÑO' },
            { tipo: 'poblacion', nombre: 'POBLACIÓN 6 AÑO' },

            // Columnas de fórmulas de cobertura
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

        // 4. APLICAR FÓRMULAS
        for (let i = 0; i < columnasFijasConfig.length; i++) {
            const config = columnasFijasConfig[i];
            const columnaExcel = columnaInicioFijas + i;

            if (config.tipo === 'formula') {
                // Aplicar fórmula para cada fila de datos
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


// ===============================
// FUNCIÓN PARA CREAR ESTRUCTURA EXACTA DE IMAGEN 2
// ===============================

function crearColumnasFijasEstructuraImagen2(worksheet, columnasFijas, columnaInicioFijas, filaInicioDatos, resultadosConsulta, codigosVariables) {
    let columnaActual = columnaInicioFijas;

    console.log("🛠️ Creando estructura exacta de imagen 2...");

    // PRIMERO: Crear las 4 columnas de población
    for (let i = 0; i < 4; i++) {
        const columna = columnasFijas[i];
        const colExcel = columnaActual + i;

        // Fila 1: Nombre de la población
        worksheet.getRow(1).getCell(colExcel).value = columna.nombre;

        // Combinar verticalmente filas 1-4
        worksheet.mergeCells(1, colExcel, 4, colExcel);

        // Aplicar formato
        const cell = worksheet.getRow(1).getCell(colExcel);
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: columna.color }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        // Ajustar ancho
        worksheet.getColumn(colExcel).width = columna.ancho;

        console.log(`📌 Columna población ${i + 1}: "${columna.nombre}" en columna ${colExcel}`);
    }

    columnaActual += 4;

    // SEGUNDO: Crear el GRAN GRUPO "COBERTURA PVU"
    const grupoCobertura = columnasFijas[4];
    let totalVariablesCobertura = 0;

    // Contar total de variables en COBERTURA PVU
    grupoCobertura.subgrupos.forEach(subgrupo => {
        totalVariablesCobertura += subgrupo.variables.length;
    });

    const columnaFinCobertura = columnaActual + totalVariablesCobertura - 1;

    // 1. TÍTULO "COBERTURA PVU" en fila 1 (combinar todas las columnas del grupo)
    worksheet.mergeCells(1, columnaActual, 1, columnaFinCobertura);
    const tituloCell = worksheet.getRow(1).getCell(columnaActual);
    tituloCell.value = "COBERTURA PVU";
    tituloCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
    tituloCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'fef2cb' }
    };
    tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };

    console.log(`📌 Título "COBERTURA PVU" en columnas ${columnaActual} a ${columnaFinCobertura}`);

    // 2. Crear cada subgrupo dentro de COBERTURA PVU
    let columnaOffset = 0;
    let subgrupoInicio = columnaActual;

    grupoCobertura.subgrupos.forEach((subgrupo, subIndex) => {
        const subgrupoColumnas = subgrupo.variables.length;
        const subgrupoFin = subgrupoInicio + subgrupoColumnas - 1;

        // PARA SUBGRUPOS CON NOMBRE (primeros dos subgrupos)
        if (subgrupo.tipo === 'subgrupo' && subgrupo.nombre.trim() !== "") {
            // Nombre del subgrupo en fila 2 (combinar columnas del subgrupo)
            worksheet.mergeCells(2, subgrupoInicio, 2, subgrupoFin);
            const subgrupoCell = worksheet.getRow(2).getCell(subgrupoInicio);
            subgrupoCell.value = subgrupo.nombre;
            subgrupoCell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
            subgrupoCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: subgrupo.color }
            };
            subgrupoCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            console.log(`📌 Subgrupo "${subgrupo.nombre}" en columnas ${subgrupoInicio} a ${subgrupoFin}`);

            // Variables del subgrupo en fila 3
            subgrupo.variables.forEach((variable, varIndex) => {
                const colVariable = subgrupoInicio + varIndex;
                worksheet.getRow(3).getCell(colVariable).value = variable.nombre;

                // Aplicar formato a variable
                const varCell = worksheet.getRow(3).getCell(colVariable);
                varCell.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
                varCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: variable.color }
                };
                varCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

                // Combinar fila 3 con fila 4 para cada variable
                worksheet.mergeCells(3, colVariable, 4, colVariable);

                // Ajustar ancho
                worksheet.getColumn(colVariable).width = variable.ancho;

                console.log(`  📊 Variable: "${variable.nombre}" en columna ${colVariable}`);
            });

            // Fila 4 vacía (ya combinada con fila 3)

        }
        // PARA VARIABLES FINALES SIN SUBGRUPO (DPT y SRP)
        else if (subgrupo.tipo === 'variables_finales') {
            console.log(`📌 Variables finales sin subgrupo en columnas ${subgrupoInicio} a ${subgrupoFin}`);

            // Variables DPT y SRP van DIRECTAMENTE en fila 2 (sin fila de subgrupo)
            subgrupo.variables.forEach((variable, varIndex) => {
                const colVariable = subgrupoInicio + varIndex;

                // Variable en fila 2
                worksheet.getRow(2).getCell(colVariable).value = variable.nombre;

                // Aplicar formato
                const varCell = worksheet.getRow(2).getCell(colVariable);
                varCell.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
                varCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: variable.color }
                };
                varCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

                // Combinar filas 2-4 para estas variables
                worksheet.mergeCells(2, colVariable, 4, colVariable);

                // Ajustar ancho
                worksheet.getColumn(colVariable).width = variable.ancho;

                console.log(`  📊 Variable final: "${variable.nombre}" en columna ${colVariable} (combinada filas 2-4)`);
            });

            // Para variables finales, fila 3 ya está combinada con fila 2, no hacer nada más
        }

        // Actualizar posición para siguiente subgrupo
        subgrupoInicio += subgrupoColumnas;
    });

    // 3. Aplicar bordes y formato general
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

    // 4. Ajustar alturas de filas
    worksheet.getRow(1).height = 25;
    worksheet.getRow(2).height = 25;
    worksheet.getRow(3).height = 60;
    worksheet.getRow(4).height = 60;

    console.log("✅ Estructura de imagen 2 creada exitosamente");
}
// ===============================
// FUNCIONES DE APLICACIÓN DE FÓRMULAS EN EXCEL
// ===============================

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

        // 1. Calcular columna de inicio para columnas fijas
        let totalColumnasDinamicas = 0;
        estructura.forEach(apartado => {
            totalColumnasDinamicas += apartado.variables.length;
        });
        const columnaInicioFijas = 7 + totalColumnasDinamicas; // Columna G (7) + columnas dinámicas
        console.log(`🔧 Columnas dinámicas: ${totalColumnasDinamicas}, Inicio columnas fijas: columna ${columnaInicioFijas}`);

        // 2. Extraer estructura dinámica y referencias
        const estructuraDinamica = extraerEstructuraDinamicaConCodigos(worksheet, estructura, codigosVariables);
        const referenciasPoblacion = obtenerReferenciasPoblacion(worksheet);

        // 3. VERIFICAR SI LAS COLUMNAS FIJAS YA EXISTEN
        const celdaPrimeraColumnaFija = worksheet.getRow(1).getCell(columnaInicioFijas).value;
        const columnasFijasExisten = celdaPrimeraColumnaFija &&
            (celdaPrimeraColumnaFija.includes("POBLACIÓN") ||
                celdaPrimeraColumnaFija.includes("POBLACION"));

        if (!columnasFijasExisten) {
            console.log("📌 Columnas fijas no existen, creándolas con estructura de imagen 2...");

            // 4. ESTRUCTURA EXACTA DE LA IMAGEN 2
            const columnasFijas = [
                // COLUMNAS DE POBLACIÓN (4 columnas individuales)
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

                // GRAN GRUPO "COBERTURA PVU" (todas las columnas de fórmulas)
                {
                    nombre: "COBERTURA PVU",
                    esGrupo: true,
                    color: 'fef2cb',
                    tipo: 'grupo_principal',
                    subgrupos: [
                        // SUBGRUPO 1: ESQUEMAS POR BIOLÓGICO PARA MENORES DE 1 AÑO
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

                        // SUBGRUPO 2: ESQUEMAS COMPLETOS POR BIOLÓGICO EN 1 AÑO
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

                        // VARIABLES FINALES SIN SUBGRUPO (DPT y SRP)
                        {
                            nombre: "", // SIN NOMBRE - van dentro del grupo COBERTURA PVU pero sin subgrupo
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

            // 5. CREAR LAS COLUMNAS FIJAS CON ESTRUCTURA EXACTA
            crearColumnasFijasEstructuraImagen2(worksheet, columnasFijas, columnaInicioFijas, filaInicioDatos, resultadosConsulta);

            console.log("✅ Columnas fijas creadas con estructura de imagen 2");
        } else {
            console.log("✅ Columnas fijas ya existen, aplicando fórmulas...");
        }

        // 6. APLICAR FÓRMULAS
        aplicarFormulasAColumnasFijas(worksheet, columnaInicioFijas, filaInicioDatos, resultadosConsulta.length);

        console.log("✅ Fórmulas aplicadas exitosamente a columnas fijas!");
        return columnaInicioFijas;
    } catch (error) {
        console.error("❌ Error en aplicarFormulasColumnasFijas:", error);
        throw error;
    }
}

// EN excel-formulas.js, agregar función:
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
// ===============================
// FUNCIÓN PARA APLICAR FÓRMULAS
// ===============================

function aplicarFormulasAColumnasFijas(worksheet, columnaInicioFijas, filaInicioDatos, totalFilas) {
    console.log(`📝 Aplicando fórmulas a ${totalFilas} filas de datos...`);

    // Mapeo columna → fórmula (basado en tu configuración)
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

    // Extraer estructura y referencias UNA vez
    const estructuraDinamica = extraerEstructuraDinamica(worksheet, []); // vacío porque ya está creada
    const referenciasPoblacion = obtenerReferenciasPoblacion(worksheet);

    for (let fila = filaInicioDatos; fila < filaInicioDatos + totalFilas; fila++) {
        columnaFormulas.forEach((formulaKey, idx) => {
            if (!formulaKey) return; // saltar columnas de población

            const col = columnaInicioFijas + idx;
            try {
                // 1. quitar "=" inicial y {FILA}
                let formula = obtenerFormulaExcel(formulaKey, referenciasPoblacion, estructuraDinamica)
                    .replace(/^=/, '')
                    .replace(/{FILA}/g, fila);

                // 2. poblaciones: clave = marcador que VIENE, valor = clave en referenciasPoblacion
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

// ===============================
// FUNCIONES AUXILIARES
// ===============================

/**
 * Crea las columnas fijas en el worksheet
 */
function crearColumnasFijas(worksheet, columnasFijas, columnaInicioFijas, filaInicioDatos, resultadosConsulta) {
    let columnaActual = columnaInicioFijas;

    // Contar total de columnas que ocuparán las columnas fijas
    let totalColumnasFijas = 0;
    columnasFijas.forEach(columna => {
        if (columna.esGrupo) {
            columna.subgrupos.forEach(subgrupo => {
                totalColumnasFijas += subgrupo.variables.length;
            });
        } else {
            totalColumnasFijas += 1;
        }
    });

    console.log(`🔧 Total columnas fijas a crear: ${totalColumnasFijas}`);

    // Crear estructura de encabezados
    const encabezadosFilas = {
        fila1: Array(totalColumnasFijas).fill(''),
        fila2: Array(totalColumnasFijas).fill(''),
        fila3: Array(totalColumnasFijas).fill(''),
        fila4: Array(totalColumnasFijas).fill('')
    };

    // Llenar la estructura con nombres
    let columnaOffset = 0;
    columnasFijas.forEach(columna => {
        if (columna.esGrupo) {
            let totalVariablesEnGrupo = 0;
            columna.subgrupos.forEach(subgrupo => {
                totalVariablesEnGrupo += subgrupo.variables.length;
            });

            // Nombre del grupo en fila 1
            for (let i = 0; i < totalVariablesEnGrupo; i++) {
                encabezadosFilas.fila1[columnaOffset + i] = columna.nombre;
            }

            // Procesar cada subgrupo
            let subgrupoOffset = 0;
            columna.subgrupos.forEach((subgrupo, subgrupoIndex) => {
                // Nombre del subgrupo en fila 2 (solo si tiene nombre)
                if (subgrupo.nombre && subgrupo.nombre.trim() !== "") {
                    for (let i = 0; i < subgrupo.variables.length; i++) {
                        encabezadosFilas.fila2[columnaOffset + subgrupoOffset + i] = subgrupo.nombre;
                    }
                }

                // Variables
                subgrupo.variables.forEach((variable, varIndex) => {
                    if (subgrupo.nombre && subgrupo.nombre.trim() !== "") {
                        // Subgrupos CON nombre: variables en fila 3
                        encabezadosFilas.fila3[columnaOffset + subgrupoOffset + varIndex] = variable.nombre;
                    } else {
                        // Subgrupos SIN nombre: variables en fila 2
                        encabezadosFilas.fila2[columnaOffset + subgrupoOffset + varIndex] = variable.nombre;
                    }
                });

                subgrupoOffset += subgrupo.variables.length;
            });

            columnaOffset += totalVariablesEnGrupo;
        } else {
            // Columnas simples
            encabezadosFilas.fila1[columnaOffset] = columna.nombre;
            columnaOffset++;
        }
    });

    // Agregar encabezados al worksheet
    for (let i = 0; i < totalColumnasFijas; i++) {
        const columnaExcel = columnaInicioFijas + i;

        worksheet.getRow(1).getCell(columnaExcel).value = encabezadosFilas.fila1[i] || '';
        worksheet.getRow(2).getCell(columnaExcel).value = encabezadosFilas.fila2[i] || '';
        worksheet.getRow(3).getCell(columnaExcel).value = encabezadosFilas.fila3[i] || '';
        worksheet.getRow(4).getCell(columnaExcel).value = encabezadosFilas.fila4[i] || '';

        // Ajustar ancho
        worksheet.getColumn(columnaExcel).width = 15;
    }

    // Combinar celdas y aplicar formato básico
    // (Aquí puedes añadir la lógica de combinación y colores si es necesario)

    console.log("✅ Estructura de columnas fijas creada");
}

/**
 * Aplica fórmulas a las columnas fijas existentes
 */
function aplicarFormulasAColumnasFijasExistentes(worksheet, columnaInicioFijas, filaInicioDatos, totalFilas) {
    // Extraer estructura dinámica actualizada
    // (Necesitarías recalcular estructuraDinamica y referenciasPoblacion)

    // Aquí iría la lógica para aplicar fórmulas a cada columna fija
    // Basada en los nombres de las columnas que encuentre

    for (let fila = filaInicioDatos; fila < filaInicioDatos + totalFilas; fila++) {
        // Ejemplo: Aplicar fórmula a la primera columna de cobertura
        const columnaCobertura = columnaInicioFijas + 4; // Después de las 4 de población
    }

    console.log(`✅ Fórmulas aplicadas a ${totalFilas} filas`);
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

            // Aplicar fórmulas predefinidas
            Object.entries(EXCEL_CONFIG.FORMULAS_PLANTILLA).forEach(([col, formula]) => {
                // Reemplazar TODAS las @ por el número de fila
                const formulaFinal = formula.replace(REGEX.MARCADOR_FILA, fila);

                const cell = worksheet.getCell(`${col}${fila}`);
                cell.value = {
                    formula: formulaFinal,
                    result: 0
                };
                console.log(`📊 Celda ${col}${fila} -> Fórmula: ${formulaFinal}`);
                console.log(`📊 Tipo de asignación:`, typeof cell.value, cell.value);
            });

            // Aplicar fórmulas específicas adicionales si es necesario
            aplicarFormulasEspecificas(worksheet, r, fila, obtenerInicialesInstitucion);
        });

        console.log("✅ Fórmulas de plantilla aplicadas exitosamente!");
    } catch (error) {
        console.error("❌ Error al aplicar fórmulas de plantilla:", error);
        throw error;
    }
}

// ===============================
// FUNCIONES DE VALIDACIÓN DE FÓRMULAS
// ===============================

/**
 * Valida si una fórmula es sintácticamente correcta
 * @param {string} formula - Fórmula a validar
 * @returns {boolean} True si la fórmula es válida
 */
export function validarFormula(formula) {
    if (!formula || typeof formula !== 'string') {
        return false;
    }

    // Verificar que comience con =
    if (!formula.startsWith('=')) {
        return false;
    }

    // Verificar paréntesis balanceados
    const parentesis = formula.split('').filter(c => c === '(' || c === ')');
    let balance = 0;

    for (const p of parentesis) {
        balance += p === '(' ? 1 : -1;
        if (balance < 0) return false;
    }

    if (balance !== 0) return false;

    // Verificar que no tenga errores obvios
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
        // Ignorar parámetros de población
        if (varName.startsWith("POBLACION_")) {
            resultado.variablesEncontradas.push({
                nombre: varName,
                tipo: 'poblacion',
                existe: true
            });
            return;
        }

        // Buscar en estructura dinámica
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

// ===============================
// FUNCIONES DE DEPURACIÓN
// ===============================

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

    // Agrupar variables por apartado
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

    // Verificar fórmulas disponibles para cada variable
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
    // Verificar referencias de población
    Object.entries(TIPOS_POBLACION).forEach(([key, tipo]) => {
        if (!referenciasPoblacion[tipo]) {
            reporte.problemas.push(`Falta referencia para: ${tipo}`);
        }
    });

    console.log("📋 Reporte de depuración generado:", reporte);
    return reporte;
}

// ===============================
// EXPORTACIÓN POR DEFECTO
// ===============================

export default {
    // Funciones auxiliares
    numeroALetra,
    letraANumero,
    extraerVariablesDeFormula,
    extraerCodigosDeVariable,
    determinarTipoPoblacion,

    // Funciones de estructura dinámica
    extraerEstructuraDinamica,
    obtenerReferenciasPoblacion,

    // Funciones de construcción de fórmulas
    // construirFormulaLiteral,
    convertirFormulaAExcel,

    // Funciones de construcción de datos
    construirFilaVariables,
    construirDatosParaExcel,

    // Funciones de aplicación de fórmulas
    aplicarFormulasColumnasFijas,
    aplicarFormulasPlantilla,

    // Funciones de validación
    validarFormula,
    verificarVariablesFormula,

    // Funciones de depuración
    generarReporteDepuracion
};