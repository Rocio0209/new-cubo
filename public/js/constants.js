// constants.js

// ===============================
// CONSTANTES DE API
// ===============================

export const API_LARAVEL = "/consultar-biologicos";
export const API_FASTAPI = "http://127.0.0.1:8080";
// export const API_FASTAPI = "http://0.0.0.0:8080"; // Alternativa

// ===============================
// CONSTANTES DE FÓRMULAS EXCEL
// ===============================

export const FORMULAS_LITERALES = {
    "% BCG": [
        "IFERROR((BIO01 + BIO50) / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR((VBC02 + BIO50) / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)",
    ],
    
    "% Hepatitis B (<1 AÑO)": [
        "IFERROR((VAC06) / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR((BIO083) / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)",
    ],
    
    "% Hexavalente (<1 AÑO)": [
        "IFERROR((BIO05) / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR((VAC03) / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR((VAC69) / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)"
    ],
    
    "% Rotavirus RV1": [
        "IFERROR(BIO06 / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR(ROT01 / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)"
    ],
    
    "% Neumocócica conjugada (<1 AÑO)": [
        "IFERROR(BIO08 / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR(NEU01 / ((POBLACION_MENOR_1_AÑO * 0.0833) * 12), 0)"
    ],
    
    "% Hexavalente (1 AÑO)": [
        "IFERROR(BIO09 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR(VBC07 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)"
    ],
    
    "% Neumocócica conjugada (1 AÑO)": [
        "IFERROR(BIO10 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR(NEU02 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)"
    ],
    
    "% SRP 1ra": [
        "IFERROR(BIO11 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR(SRP01 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)"
    ],
    
    "% SRP 2da": [
        "IFERROR(BIO13 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR(SRP03 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)"
    ],
    
    "% ESQUEMA COMPLETO DE DPT EN 4 AÑOS": [
        "IFERROR((BIO14 + BIO15 + BIO16) / ((POBLACION_4_AÑOS * 0.0833) * 12), 0)",
        "IFERROR((DPT01 + DPT02 + DPT03) / ((POBLACION_4_AÑOS * 0.0833) * 12), 0)"
    ],
    
    "% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS": [
        "IFERROR(BIO17 / ((POBLACION_6_AÑOS * 0.0833) * 12), 0)",
        "IFERROR(SRP04 / ((POBLACION_6_AÑOS * 0.0833) * 12), 0)"
    ]
};

// ===============================
// CONSTANTES DE COLORES
// ===============================

export const COLORES = {
    // Paleta para apartados en Excel
    APARTADOS: [
        '0066cc',
        'ff6600',
        '6699ff',
        'FFF79646',
        'ffd965',
        '548135',
        '00ccff',
        '9933ff',
        '00b0f0',
        'ffc000',
        'd4c19c',
        'ff99cc',
        'ff9900',
        'ffcc99',
        'a8d08d',
        '6A3D8C'
    ],
    
    // Colores específicos
    POBLACION: '902449',
    COBERTURA_PVU: 'fef2cb',
    TEXT_WHITE: 'FFFFFFFF',
    TEXT_BLACK: 'FF000000',
    
    // Colores por variable
    VARIABLES: {
        BCG: '0066cc',
        HEPATITIS: 'ff6600',
        HEXAVALENTE: '6699ff',
        ROTAVIRUS: '548135',
        NEUMOCOCICA: '00ccff',
        SRP: '9933ff',
        DPT: 'ffd965'
    },
    
    // Colores para grupos
    GRUPOS: {
        ESQUEMAS_MENORES_1_AÑO: 'ffc000',
        ESQUEMAS_COMPLETOS_1_AÑO: '70ad47',
        DPT_SRP: 'FFB7DEE8'
    },
    
    // Colores oscuros que requieren texto blanco
    OSCUROS: ['902449', '0066CC']
};

// ===============================
// CONSTANTES DE PATRONES Y CÓDIGOS
// ===============================

export const PATRONES_CODIGOS = {
    BCG: ["BIO01", "BIO50", "VBC02", "BVC01", "BVC02"],
    HEPATITIS: ["BIO02", "BIO51", "VBC03", "BVC03", "HBV01", "HBV02"],
    HEXAVALENTE: ["BIO03", "BIO04", "BIO05", "VBC04", "VBC05", "VBC06", "HEX01", "HEX02", "HEX03"],
    ROTAVIRUS: ["BIO06", "BIO07", "ROT01", "ROT02"],
    NEUMOCÓCICA: ["BIO08", "NEU01"],
    SRP: ["BIO11", "BIO12", "BIO13", "BIO17", "SRP01", "SRP02", "SRP03", "SRP04"],
    DPT: ["BIO14", "BIO15", "BIO16", "DPT01", "DPT02", "DPT03"]
};

// ===============================
// CONSTANTES DE CONFIGURACIÓN EXCEL
// ===============================

export const EXCEL_CONFIG = {
    // Configuración de columnas fijas
    COLUMNAS_FIJAS: [
        {
            nombre: "POBLACIÓN <1 AÑO",
            ancho: 15,
            formula: "",
            esGrupo: false,
            color: '902449'
        },
        {
            nombre: "POBLACIÓN 1 AÑO",
            ancho: 15,
            formula: "",
            esGrupo: false,
            color: '902449'
        },
        {
            nombre: "POBLACIÓN 4 AÑO",
            ancho: 15,
            formula: "",
            esGrupo: false,
            color: '902449'
        },
        {
            nombre: "POBLACIÓN 6 AÑO",
            ancho: 15,
            formula: "",
            esGrupo: false,
            color: '902449'
        },
        {
            nombre: "COBERTURA PVU",
            esGrupo: true,
            color: 'fef2cb',
            subgrupos: [
                {
                    nombre: "ESQUEMAS POR BIOLÓGICO PARA MENORES DE 1 AÑO",
                    color: 'ffc000',
                    variables: [
                        {
                            nombre: "% BCG",
                            formulaKey: "% BCG",
                            ancho: 10,
                            color: '0066cc'
                        },
                        {
                            nombre: "% Hepatitis B (<1 AÑO)",
                            formulaKey: "% Hepatitis B (<1 AÑO)",
                            ancho: 12,
                            color: 'ff6600'
                        },
                        {
                            nombre: "% Hexavalente (<1 AÑO)",
                            formulaKey: "% Hexavalente (<1 AÑO)",
                            ancho: 12,
                            color: '6699ff'
                        },
                        {
                            nombre: "% Rotavirus RV1",
                            formulaKey: "% Rotavirus RV1",
                            ancho: 12,
                            color: '548135'
                        },
                        {
                            nombre: "% Neumocócica conjugada (<1 AÑO)",
                            formulaKey: "% Neumocócica conjugada (<1 AÑO)",
                            ancho: 15,
                            color: '00ccff'
                        }
                    ]
                },
                {
                    nombre: "ESQUEMAS COMPLETOS POR BIOLÓGICO EN 1 AÑO",
                    color: '70ad47',
                    variables: [
                        {
                            nombre: "% Hexavalente (1 AÑO)",
                            formulaKey: "% Hexavalente (1 AÑO)",
                            ancho: 12,
                            color: '6699ff'
                        },
                        {
                            nombre: "% Neumocócica conjugada (1 AÑO)",
                            formulaKey: "% Neumocócica conjugada (1 AÑO)",
                            ancho: 15,
                            color: '00ccff'
                        },
                        {
                            nombre: "% SRP 1ra",
                            formulaKey: "% SRP 1ra",
                            ancho: 10,
                            color: '9933ff'
                        },
                        {
                            nombre: "% SRP 2da",
                            formulaKey: "% SRP 2da",
                            ancho: 10,
                            color: '9933ff'
                        }
                    ]
                },
                {
                    nombre: "",
                    color: 'FFB7DEE8',
                    variables: [
                        {
                            nombre: "% ESQUEMA COMPLETO DE DPT EN 4 AÑOS",
                            formulaKey: "% ESQUEMA COMPLETO DE DPT EN 4 AÑOS",
                            ancho: 18,
                            color: 'ffd965'
                        },
                        {
                            nombre: "% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS",
                            formulaKey: "% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS",
                            ancho: 18,
                            color: '6699ff'
                        }
                    ]
                }
            ]
        }
    ],
    
    // Configuración de fórmulas de plantilla
    FORMULAS_PLANTILLA: {
        "FG": "IFERROR((G@+H@+I@)/((FC@*0.0833)*12),0)",
        "FH": "IFERROR((M@)/((FC@*0.0833)*12),0)",
        "FI": "IFERROR((DJ@)/((FC@*0.0833)*12),0)",
        "FJ": "IFERROR((DJ@ + DH@)/((FC@*0.0833)*12),0)",
        "FK": "IFERROR((DD@ + DF@)/((FC@*0.0833)*12),0)",
        "FL": "IFERROR((12)/((FC@*0.0833)*12),0)",
        "FM": "IFERROR((DD@ + DF@)/((FC@*0.0833)*12),0)",
        "FN": "IFERROR((AB@)/((FC@*0.0833)*12),0)",
        "FO": "=G@ + H@ + I@ + M@ + DJ@ + DD@ + AB@",
        "FP": "IFERROR((FO@)/((FC@*0.0833)*4),0)",
        "FQ": "IFERROR((DK@)/((FD@*0.0833)*12),0)",
        "FR": "IFERROR((AC@)/((FD@*0.0833)*12),0)",
        "FS": "IFERROR((AL@)/((FD@*0.0833)*12),0)",
        "FT": "IFERROR((AM@)/((FD@*0.0833)*12),0)",
        "FU": "IFERROR((AN@)/((FD@*0.0833)*12),0)",
        "FV": "=DK@ + AC@ + AL@ + AM@",
        "FW": "IFERROR((FV@)/((FD@*0.0833)*4),0)",
        "FX": "IFERROR((X@)/((FE@*0.0833)*12),0)",
        "FY": "IFERROR((AN@)/((FF@*0.0833)*12),0)",
    },
    
    // Configuración de ancho de columnas
    ANCHO_COLUMNAS: {
        CLUES: 15,
        UNIDAD: 20,
        ENTIDAD: 15,
        JURISDICCION: 15,
        MUNICIPIO: 15,
        INSTITUCION: 15,
        VARIABLE: 12
    },
    
    // Altura de filas
    ALTURA_FILAS: {
        ENCABEZADO_1: 30,
        ENCABEZADO_2: 25,
        ENCABEZADO_3: 60,
        ENCABEZADO_4: 60
    },
    
    // Posiciones iniciales
    FILA_INICIO_DATOS: 5,
    COLUMNA_INICIO_VARIABLES: 7 // Columna G
};

// ===============================
// CONSTANTES DE SELECT2
// ===============================

export const SELECT2_CONFIG = {
    CLUES: {
        placeholder: "Selecciona una o más CLUES",
        width: '100%',
        theme: 'bootstrap-5',
        allowClear: false,
        closeOnSelect: false
    },
    
    // HTML para botones de selección rápida
    HTML_BOTONES_SELECCION: `
        <div class="select2-actions px-2 pb-2 border-bottom mb-2">
            <div class="d-flex gap-2">
                <button type="button"
                        class="btn btn-sm btn-warning w-50"
                        id="btnSelectAllHGIMB">
                    Seleccionar todas HGIMB
                </button>
                <button type="button"
                        class="btn btn-sm btn-primary w-50"
                        id="btnSelectAllHG">
                    Seleccionar todas HG
                </button>
            </div>
        </div>
    `
};

// ===============================
// CONSTANTES DE TIPOS DE POBLACIÓN
// ===============================

export const TIPOS_POBLACION = {
    MENOR_1_AÑO: "POBLACIÓN <1 AÑO",
    UN_AÑO: "POBLACIÓN 1 AÑO",
    CUATRO_AÑOS: "POBLACIÓN 4 AÑO",
    SEIS_AÑOS: "POBLACIÓN 6 AÑO"
};

// Mapeo de patrones a tipos de población
export const MAPEO_POBLACION_POR_VARIABLE = {
    "<1 AÑO": "POBLACIÓN <1 AÑO",
    "MENORES DE 1": "POBLACIÓN <1 AÑO",
    "1 AÑO": "POBLACIÓN 1 AÑO",
    "4 AÑOS": "POBLACIÓN 4 AÑO",
    "4 AÑO": "POBLACIÓN 4 AÑO",
    "6 AÑOS": "POBLACIÓN 6 AÑO",
    "6 AÑO": "POBLACIÓN 6 AÑO"
};

// ===============================
// CONSTANTES DE MENSAJES Y TEXTOS
// ===============================

export const MENSAJES = {
    CARGA_CORRECTA: "🔵 vacunas.js cargado correctamente",
    ERROR_CONEXION: "🔴 ERROR de conexión:",
    ERROR_CUBOS_SIS: "❌ ERROR: No llegó cubos_sis",
    SIN_CLUES: "⚠️ No se encontraron CLUES para los parámetros especificados",
    SIN_RESULTADOS: "⚠️ No hay resultados para construir encabezados",
    SIN_FORMULAS: "⚠️ No hay fórmulas definidas para:",
    SIN_REFERENCIA_POBLACION: "⚠️ No se encontró referencia para:",
    FORMULA_NO_FUNCIONA: "⚠️ Ninguna fórmula funciona para",
    ERROR_AGREGAR_COLUMNAS: "❌ Error en agregarColumnasFijasConFormulas:",
    ERROR_EXPORTAR_EXCEL: "Error al generar el archivo Excel.",
    ERROR_EXPORTAR_TABLA: "Hubo un problema al generar el archivo Excel."
};

// ===============================
// CONSTANTES DE REGEX
// ===============================

export const REGEX = {
    // Para extraer variables de fórmulas
    VARIABLES_FORMULA: /\b(BIO|VBC|BVC|HBV|HEX|ROT|NEU|SRP|DPT)\d{2,3}\b/gi,
    
    // Para extraer parámetros de población
    PARAMETROS_POBLACION: /POBLACION_[A-Z_ÁÑÓ]+/g,
    
    // Para reemplazar marcadores de fila en fórmulas
    MARCADOR_FILA: /@/g,
    MARCADOR_FILA_LLAVES: /{FILA}/g
};

// ===============================
// CONSTANTES DE RUTAS Y ARCHIVOS
// ===============================

export const RUTAS = {
    PLANTILLA_EXCEL: "../static/Plantilla_CUBOS.xlsx",
    INSTITUCIONES_JSON: "/instituciones-json",
    CONSULTAR_BIOLOGICOS: "/consultar-biologicos"
};

// ===============================
// CONSTANTES DE NOMBRES DE ARCHIVOS
// ===============================

export const NOMBRES_ARCHIVOS = {
    EXCEL_BIOLOGICOS: "Biologicos.xlsx",
    EXCEL_RESULTADOS: (fecha = new Date().toISOString().slice(0, 10)) => 
        `Resultados_Vacunacion_${fecha}.xlsx`
};

// ===============================
// CONSTANTES DE ESTADOS Y FLAGS
// ===============================

export const ESTADOS = {
    INTERFAZ: {
        RESETEADA: "interfaz_reseteada",
        CLUES_CARGADAS: "clues_cargadas",
        CONSULTA_COMPLETADA: "consulta_completada"
    },
    
    BOTONES: {
        CONSULTAR_HABILITADO: "btn_consultar_habilitado",
        EXPORTAR_HABILITADO: "btn_exportar_habilitado",
        EXPORTAR_SIMPLE_HABILITADO: "btn_exportar_simple_habilitado"
    }
};

// ===============================
// CONSTANTES DE CLASES CSS
// ===============================

export const CLASES_CSS = {
    D_NONE: "d-none",
    TABLE_SECONDARY: "table-secondary",
    SELECT2_ACTIONS: "select2-actions"
};

// ===============================
// EXPORTACIÓN POR DEFECTO
// ===============================

export default {
    API_LARAVEL,
    API_FASTAPI,
    FORMULAS_LITERALES,
    COLORES,
    PATRONES_CODIGOS,
    EXCEL_CONFIG,
    SELECT2_CONFIG,
    TIPOS_POBLACION,
    MAPEO_POBLACION_POR_VARIABLE,
    MENSAJES,
    REGEX,
    RUTAS,
    NOMBRES_ARCHIVOS,
    ESTADOS,
    CLASES_CSS
};