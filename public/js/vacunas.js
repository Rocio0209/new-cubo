const API_LARAVEL = "/consultar-biologicos";
// const API_FASTAPI = "http://0.0.0.0:8080";
const API_FASTAPI = "http://127.0.0.1:8080";
console.log("🔵 vacanas.js cargado correctamente");

let cuboActivo = null;
let cluesDisponibles = [];
let resultadosConsulta = [];
let institucionesCatalogo = [];

function ocultarAccionesSelect2() {
    $('.select2-actions').remove();
}


// ===============================
// Spinner global
// ===============================
function mostrarSpinner() {
    spinnerCarga.classList.remove("d-none");
}

function ocultarSpinner() {
    spinnerCarga.classList.add("d-none");
}

// ===============================
// MODIFICAR la función resetearInterfaz() - ELIMINAR la línea que deshabilita btnExportarSimple
// ===============================
function resetearInterfaz() {
    // Limpiar tabla de resultados
    const tablaHeader = document.getElementById('tablaHeader');
    const variablesHeader = document.getElementById('variablesHeader');
    const tablaResultadosBody = document.getElementById('tablaResultadosBody');
    const tablaFooter = document.getElementById('tablaFooter');
    const resumenConsulta = document.getElementById('resumenConsulta');
    const resultadosContainer = document.getElementById('resultadosContainer');
    const mensajeCluesCargadas = document.getElementById('mensajeCluesCargadas');
    const btnConsultar = document.getElementById('btnConsultar');
    const btnExportar = document.getElementById('btnExportar');
    const btnExportarSimple = document.getElementById('btnExportarSimple');

    // Limpiar contenido de la tabla
    tablaHeader.innerHTML = "";
    variablesHeader.innerHTML = "";
    tablaResultadosBody.innerHTML = "";
    tablaFooter.innerHTML = "";
    resumenConsulta.innerHTML = "";

    // Ocultar secciones
    resultadosContainer.classList.add("d-none");

    // Deshabilitar botones (excepto consultar si hay CLUES disponibles)
    btnConsultar.disabled = cluesDisponibles.length === 0;
    btnExportar.disabled = true;
    // NO deshabilitar btnExportarSimple - comentar o eliminar esta línea
    // btnExportarSimple.disabled = true; ← COMENTA O ELIMINA ESTA LÍNEA

    // Limpiar variables
    resultadosConsulta = [];
    cluesDisponibles = [];
    cuboActivo = null;

    // Limpiar y deshabilitar select de CLUES
    const cluesSelect = document.getElementById('cluesSelect');
    $('#cluesSelect').empty().trigger('change');
    cluesSelect.disabled = true;
}

document.addEventListener("DOMContentLoaded", () => {

    console.log("vacunas.js cargado");

    // 🔹 ACTIVAR SELECT2 EN EL SELECT DE CLUES
    $('#cluesSelect').select2({
        placeholder: "Selecciona una o más CLUES",
        width: '100%',
        theme: 'bootstrap-5',
        allowClear: false,
        closeOnSelect: false
    });
    $('#cluesSelect').on('select2:open', function () {

        const dropdown = $('.select2-dropdown');

        // Evitar duplicados
        if (dropdown.find('.select2-actions').length) return;

        const acciones = $(`
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
    `);

        dropdown.prepend(acciones);

        // 🔹 Seleccionar HG
        $('#btnSelectAllHG').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const seleccionadas = cluesDisponibles.filter(c => c.startsWith("HG"));
            $('#cluesSelect').val(seleccionadas).trigger('change');
            ocultarAccionesSelect2();
            $('#cluesSelect').select2('close');
        });

        // 🔹 Seleccionar HGIMB
        $('#btnSelectAllHGIMB').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            $('#cluesSelect').val(cluesDisponibles).trigger('change');
            ocultarAccionesSelect2();
            $('#cluesSelect').select2('close');
        });
    });


    cargarCatalogos();

    // 🔹 Cuando cambias el catálogo, se limpia el select
    catalogoSelect.addEventListener("change", () => {
        // Resetear toda la interfaz
        resetearInterfaz();

        // Habilitar/deshabilitar botón de cargar CLUES
        btnCargarClues.disabled = !catalogoSelect.value;
    });

    // Cargar instituciones
    fetch("/instituciones-json")
        .then(r => r.json())
        .then(data => {
            institucionesCatalogo = data;
            console.log("Instituciones cargadas:", institucionesCatalogo);
        });

    // Botones
    btnCargarClues.addEventListener("click", cargarClues);
    btnConsultar.addEventListener("click", consultarBiologicos);
    btnExportar.addEventListener("click", exportarExcel);
    const btnExportarSimple = document.getElementById('btnExportarSimple');
    btnExportarSimple.addEventListener("click", exportarTablaHTML);


    // btnTodasHG.addEventListener("click", () => {
    //     const seleccionadas = cluesDisponibles.filter(c => c.startsWith("HG"));
    //     $("#cluesSelect").val(seleccionadas).trigger("change");
    // });

    // btnTodasHGIMB.addEventListener("click", () => {
    //     const catalogo = catalogoSelect.value;

    //     mostrarSpinner();

    //     fetch(`${API_FASTAPI}/clues_filtradas?catalogo=${catalogo}&cubo=${cuboActivo}&prefijo=HGIMB`)
    //         .then(r => r.json())
    //         .then(data => {
    //             cluesDisponibles = data.clues;

    //             $("#cluesSelect").empty();
    //             cluesDisponibles.forEach(c => {
    //                 $("#cluesSelect").append(new Option(c, c));
    //             });

    //             $("#cluesSelect").val(cluesDisponibles).trigger("change");
    //         })
    //         .finally(ocultarSpinner);
    // });

});
;

document.getElementById('btnLimpiarClues').addEventListener('click', function () {
    $('#cluesSelect').val(null).trigger('change');
    // 2. Limpiar la tabla de resultados
    tablaHeader.innerHTML = "";
    variablesHeader.innerHTML = "";
    tablaResultadosBody.innerHTML = "";
    tablaFooter.innerHTML = "";
    resumenConsulta.innerHTML = "";
    resultadosContainer.classList.add("d-none");

    // 3. Deshabilitar botones de consulta/exportación
    btnConsultar.disabled = false; // Mantener habilitado porque hay CLUES disponibles
    btnExportar.disabled = true;
    // btnExportarSimple.disabled = false;

    // 4. Limpiar variable de resultados
    resultadosConsulta = [];
});

// ===============================
// Cargar catálogos
// ===============================
function cargarCatalogos() {
    console.log("🔵 Cargando catálogos desde:", `${API_FASTAPI}/cubos_sis`);

    fetch(`${API_FASTAPI}/cubos_sis`)
        .then(r => r.json())
        .then(data => {

            if (!data.cubos_sis) {
                console.error("❌ ERROR: No llegó cubos_sis");
                return;
            }

            data.cubos_sis.forEach(c => {
                catalogoSelect.innerHTML += `<option value="${c}">${c}</option>`;
            });

        })
        .catch(err => console.error("🔴 ERROR de conexión:", err));
}


// ===============================
// Cargar CLUES
// ===============================
function cargarClues() {
    const catalogo = catalogoSelect.value;

    mostrarSpinner();

    fetch(`${API_FASTAPI}/cubos_en_catalogo/${catalogo}`)
        .then(r => r.json())
        .then(data => {
            cuboActivo = data.cubos[0];

            return fetch(`${API_FASTAPI}/clues_filtradas?catalogo=${catalogo}&cubo=${cuboActivo}&prefijo=HG`);
        })
        .then(r => r.json())
        .then(data => {

            cluesDisponibles = data.clues;

            cluesSelect.innerHTML = "";
            cluesDisponibles.forEach(c => {
                $("#cluesSelect").append(new Option(c, c));
            });

            $('#cluesSelect').trigger('change');

            cluesSelect.disabled = false;
            btnConsultar.disabled = false;
            // btnTodasHG.disabled = false;
            // btnTodasHGIMB.disabled = false;

            mensajeCluesCargadas.classList.remove("d-none");
        })
        .finally(ocultarSpinner);
}


// ===============================
// Consultar Biológicos
// ===============================

function consultarBiologicos() {
    const catalogo = catalogoSelect.value;
    const clues_list = Array.from(cluesSelect.selectedOptions)
        .map(o => o.value)
        .filter(v => v && v.trim() !== "");


    mostrarSpinner();


    // IPCONFIG
    // fetch("http://0.0.0.0:8000"+ API_LARAVEL, {

    // LOCALHOST
    fetch(API_LARAVEL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
        },
        body: JSON.stringify({
            catalogo,
            cubo: cuboActivo,
            clues_list
        })
    })
        .then(r => r.json())
        .then(data => {
            resultadosConsulta = data.resultados;
            renderTabla(data);
            console.log(
                "Grupos 132 por cada CLUES:",
                data.resultados.map(r =>
                    r.biologicos.find(b => b.apartado.includes("132"))
                )
            );



            resumenConsulta.innerHTML = `
                <strong>Catálogo: </strong>${data.catalogo} –
                <strong>Cubo: </strong>${data.cubo} –
                <strong>CLUES consultadas: </strong>${data.metadata.total_clues_procesadas}
            `;

            resultadosContainer.classList.remove("d-none");
            btnExportar.disabled = false;

            // 🔹 NO es necesario habilitar aquí porque ya está siempre habilitado
            // btnExportarSimple.disabled = false; ← COMENTA O ELIMINA ESTA LÍNEA
        })
        .finally(ocultarSpinner);
}

// ===============================
// Obtener iniciales institución
// ===============================
function obtenerInicialesInstitucion(id) {
    if (!id) return "";

    const idFixed = id.toString().padStart(2, "0");

    const inst = institucionesCatalogo.find(
        i => i.idinstitucion.toString().padStart(2, "0") === idFixed
    );

    return inst ? inst.iniciales : "";
}


// ===============================
// Renderizar tabla
// ===============================
function renderTabla(data) {
    tablaHeader.innerHTML = "";
    variablesHeader.innerHTML = "";
    tablaResultadosBody.innerHTML = "";
    tablaFooter.innerHTML = "";

    // ENCABEZADOS FIJOS
    tablaHeader.innerHTML = `
        <th rowspan="2">CLUES</th>
        <th rowspan="2">Unidad</th>
        <th rowspan="2">Entidad</th>
        <th rowspan="2">Jurisdicción</th>
        <th rowspan="2">Municipio</th>
        <th rowspan="2">Institución</th>
    `;

    const apartados = {};
    const totales = {};

    // 📌 Aplanar grupos → solo variables (sin subtítulos)
    data.resultados.forEach(r => {
        r.biologicos.forEach(ap => {

            if (!apartados[ap.apartado]) apartados[ap.apartado] = [];

            ap.grupos.forEach(g => {
                g.variables.forEach(v => {
                    if (!apartados[ap.apartado].includes(v.variable)) {
                        apartados[ap.apartado].push(v.variable);
                        totales[v.variable] = 0;
                    }
                });
            });

        });
    });

    // Pintar encabezados dinámicos
    Object.entries(apartados).forEach(([apartado, vars]) => {
        tablaHeader.innerHTML += `<th colspan="${vars.length}">${apartado}</th>`;
        vars.forEach(v => variablesHeader.innerHTML += `<th>${v}</th>`);
    });

    // Filas por CLUES
    data.resultados.forEach(r => {
        let fila = `
            <td>${r.clues}</td>
            <td>${r.unidad.nombre ?? ""}</td>
            <td>${r.unidad.entidad ?? ""}</td>
            <td>${r.unidad.jurisdiccion ?? ""}</td>
            <td>${r.unidad.municipio ?? ""}</td>
            <td>${obtenerInicialesInstitucion(r.unidad.idinstitucion)}</td>
        `;

        Object.entries(apartados).forEach(([apartado, vars]) => {
            const grupos = r.biologicos.find(b => b.apartado === apartado)?.grupos ?? [];

            // Diccionario de variables ya ordenadas por backend
            let dict = {};
            grupos.forEach(g => {
                g.variables.forEach(v => {
                    dict[v.variable] = v.total;
                });
            });

            // Ahora imprimimos solo los valores (sin subtítulos)
            vars.forEach(v => {
                const valor = Number(dict[v] ?? 0);
                fila += `<td>${valor}</td>`;
                totales[v] += valor;
            });
        });

        tablaResultadosBody.innerHTML += `<tr>${fila}</tr>`;
    });

    // Totales
    let filaTotales = `<td colspan="6"><strong>TOTALES GENERALES</strong></td>`;

    Object.values(apartados).forEach(vars => {
        vars.forEach(v => {
            filaTotales += `<td><strong>${totales[v]}</strong></td>`;
        });
    });

    tablaFooter.innerHTML = `<tr class="table-secondary">${filaTotales}</tr>`;
}



// ===============================
// Construir datos aplanados para Excel
// ===============================
function construirDatosParaExcel() {
    const filas = [];

    // resultadosConsulta viene de consultarBiologicos()
    resultadosConsulta.forEach(r => {
        const base = {
            clues: r.clues,
            unidad: r.unidad.nombre ?? "",
            entidad: r.unidad.entidad ?? "",
            jurisdiccion: r.unidad.jurisdiccion ?? "",
            municipio: r.unidad.municipio ?? "",
            institucion: obtenerInicialesInstitucion(r.unidad.idinstitucion) ?? ""
        };

        // biologicos: [{apartado, grupos:[{grupo, variables:[{variable,total}]}]}]
        r.biologicos.forEach(ap => {
            ap.grupos.forEach(g => {
                g.variables.forEach(v => {
                    filas.push({
                        ...base,
                        apartado: ap.apartado,
                        grupo: g.grupo,
                        variable: v.variable,
                        total: Number(v.total ?? 0)
                    });
                });
            });
        });
    });

    return filas;
}


// Construye un arreglo con todos los valores en orden EXACTO
function construirFilaVariables(resultado) {
    const lista = [];

    resultado.biologicos.forEach(ap => {
        ap.grupos.forEach(g => {
            g.variables.forEach(v => {
                lista.push(v.total ?? 0);
            });
        });
    });

    return lista;
}


async function exportarExcel() {

    try {
        mostrarSpinner();

        const workbook = new ExcelJS.Workbook();
        const response = await fetch("../static/Plantilla_CUBOS.xlsx");
        const buffer = await response.arrayBuffer();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.getWorksheet(1);
        let fila = 5; // Donde empiezan tus datos en Excel

        resultadosConsulta.forEach(r => {

            // ======== COLUMNAS A–F (fijas) ========
            sheet.getCell(`A${fila}`).value = r.clues;
            sheet.getCell(`B${fila}`).value = r.unidad.nombre ?? "";
            sheet.getCell(`C${fila}`).value = r.unidad.entidad ?? "";
            sheet.getCell(`D${fila}`).value = r.unidad.jurisdiccion ?? "";
            sheet.getCell(`E${fila}`).value = r.unidad.municipio ?? "";
            sheet.getCell(`F${fila}`).value = obtenerInicialesInstitucion(r.unidad.idinstitucion);

            // ======== VARIABLES ORDENADAS ========
            const valores = construirFilaVariables(r);

            let col = 7; // Columna G = 7

            valores.forEach(v => {
                sheet.getCell(fila, col).value = Number(v) || 0;
                col++;
            });

            const formulas = {
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
            };

            Object.entries(formulas).forEach(([col, formula]) => {
                // Reemplaza TODAS las @ por el número de fila
                const f = formula.replace(/@/g, fila);

                sheet.getCell(`${col}${fila}`).value = {
                    formula: f,
                    result: null
                };


            });
            console.log(sheet.getCell("FG5").value);
            fila++;
        });

        // Descargar archivo
        workbook.calcProperties.fullCalcOnLoad = true;
        const outBuffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([outBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Biologicos.xlsx";
        link.click();
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Error al exportar Excel:", error);
        alert("Error al generar el archivo Excel.");
    } finally {
        ocultarSpinner();
    }
}

// ===============================
// Descargar Tabla HTML como Excel Simple
// ===============================

// ===============================
// Función auxiliar: construir estructura de encabezados
// ===============================
function construirEstructuraEncabezados() {
    const estructura = [];

    if (resultadosConsulta.length === 0) {
        console.warn('No hay resultados para construir encabezados');
        return estructura;
    }

    // Tomar el primer resultado como referencia para la estructura
    const primerResultado = resultadosConsulta[0];

    primerResultado.biologicos.forEach(apartado => {
        const variables = [];

        // Recolectar todas las variables de este apartado (de todos los grupos)
        apartado.grupos.forEach(grupo => {
            grupo.variables.forEach(variable => {
                variables.push(variable.variable);
            });
        });

        estructura.push({
            nombre: apartado.apartado,
            variables: variables
        });
    });

    return estructura;
}
// ===============================
// DICCIONARIO COMPLETO DE FÓRMULAS LITERALES - VERSIÓN EXCEL INGLÉS
// ===============================
const FORMULAS_LITERALES = {
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
    
    "% SRP 1ra": [  // ← AGREGADO
        "IFERROR(BIO11 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)",
        "IFERROR(SRP01 / ((POBLACION_1_AÑO * 0.0833) * 12), 0)"
    ],
    
    "% SRP 2da": [  // ← AGREGADO
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
// NUEVA FUNCIÓN: extraerEstructuraDinamica
// ===============================
function extraerEstructuraDinamica(worksheet, estructura) {
    const estructuraDinamica = [];
    let columnaActual = 7; // Empieza en columna G (7)

    // Recorrer la estructura original para mapear variables a columnas
    estructura.forEach(apartado => {
        apartado.variables.forEach(variable => {
            // Extraer códigos posibles de la variable
            const codigos = extraerCodigosDeVariable(variable);

            estructuraDinamica.push({
                columna: numeroALetra(columnaActual), // Convertir a letra (G, H, I...)
                nombre: variable,
                codigos: codigos,
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

// ===============================
// NUEVA FUNCIÓN: extraerCodigosDeVariable
// ===============================
function extraerCodigosDeVariable(nombreVariable) {
    // Patrones para identificar códigos en nombres de variables
    const patrones = {
        "BCG": ["BIO01", "BIO50", "VBC02", "BVC01", "BVC02"],
        "HEPATITIS": ["BIO02", "BIO51", "VBC03", "BVC03", "HBV01", "HBV02"],
        "HEXAVALENTE": ["BIO03", "BIO04", "BIO05", "VBC04", "VBC05", "VBC06", "HEX01", "HEX02", "HEX03"],
        "ROTAVIRUS": ["BIO06", "BIO07", "ROT01", "ROT02"],
        "NEUMOCÓCICA": ["BIO08", "NEU01"],
        "SRP": ["BIO11", "BIO12", "BIO13", "BIO17", "SRP01", "SRP02", "SRP03", "SRP04"],
        "DPT": ["BIO14", "BIO15", "BIO16", "DPT01", "DPT02", "DPT03"]
    };

    const codigosEncontrados = [];

    // Buscar patrones en el nombre de la variable
    for (const [patron, codigos] of Object.entries(patrones)) {
        if (nombreVariable.toUpperCase().includes(patron)) {
            codigosEncontrados.push(...codigos);
        }
    }

    return codigosEncontrados.length > 0 ? [...new Set(codigosEncontrados)] : null;
}

// ===============================
// NUEVA FUNCIÓN: obtenerReferenciasPoblacion
// ===============================
function obtenerReferenciasPoblacion(worksheet) {
    const referencias = {};
    const totalColumnas = worksheet.columnCount;

    // Buscar en las 4 filas de encabezado
    for (let fila = 1; fila <= 4; fila++) {
        for (let col = 1; col <= totalColumnas; col++) {
            const cell = worksheet.getRow(fila).getCell(col);
            const valor = cell.value?.toString() || "";

            if (valor.includes("POBLACIÓN")) {
                // Convertir columna a letra
                const letraColumna = numeroALetra(col);

                // Identificar qué tipo de población es
                if (valor.includes("<1 AÑO") || valor.includes("MENOR DE 1")) {
                    referencias["POBLACIÓN <1 AÑO"] = letraColumna;
                } else if (valor.includes("1 AÑO")) {
                    referencias["POBLACIÓN 1 AÑO"] = letraColumna;
                } else if (valor.includes("4 AÑO")) {
                    referencias["POBLACIÓN 4 AÑO"] = letraColumna;
                } else if (valor.includes("6 AÑO")) {
                    referencias["POBLACIÓN 6 AÑO"] = letraColumna;
                }
            }
        }
    }

    console.log("📍 Referencias de población encontradas:", referencias);
    return referencias;
}

// ===============================
// FUNCIÓN ACTUALIZADA: extraerVariablesDeFormula
// ===============================
function extraerVariablesDeFormula(formula) {
    // Extraer variables como BIO01, VBC02, etc.
    const regex = /\b(BIO|VBC|BVC|HBV|HEX|ROT|NEU|SRP|DPT)\d{2,3}\b/gi;
    const matches = formula.match(regex) || [];

    // También extraer parámetros especiales de población
    const parametrosPoblacion = formula.match(/POBLACION_[A-Z_ÁÑÓ]+/g) || [];

    return [...matches, ...parametrosPoblacion];
}

// ===============================
// FUNCIÓN ACTUALIZADA: construirFormulaLiteral
// ===============================
function construirFormulaLiteral(nombreVariable, referenciasPoblacion, estructuraDinamica) {
    // 1. Obtener fórmulas literales para esta variable
    const formulasPosibles = FORMULAS_LITERALES[nombreVariable];

    if (!formulasPosibles || formulasPosibles.length === 0) {
        console.log(`⚠️ No hay fórmulas definidas para: ${nombreVariable}`);
        return "=0";
    }

    // 2. Determinar qué tipo de población usar
    let tipoPoblacion = "";
    if (nombreVariable.includes("<1 AÑO") || nombreVariable.includes("MENORES DE 1")) {
        tipoPoblacion = "POBLACIÓN <1 AÑO";
    } else if (nombreVariable.includes("1 AÑO")) {
        tipoPoblacion = "POBLACIÓN 1 AÑO";
    } else if (nombreVariable.includes("4 AÑOS") || nombreVariable.includes("4 AÑO")) {
        tipoPoblacion = "POBLACIÓN 4 AÑO";
    } else if (nombreVariable.includes("6 AÑOS") || nombreVariable.includes("6 AÑO")) {
        tipoPoblacion = "POBLACIÓN 6 AÑO";
    } else {
        tipoPoblacion = "POBLACIÓN <1 AÑO"; // Por defecto
    }

    // 3. Obtener referencia de población
    const referenciaPoblacion = referenciasPoblacion[tipoPoblacion];
    if (!referenciaPoblacion) {
        console.log(`⚠️ No se encontró referencia para: ${tipoPoblacion}`);
        return "=0";
    }

    // 4. Buscar una fórmula que funcione con las variables disponibles
    for (const formulaLiteral of formulasPosibles) {
        const variablesEnFormula = extraerVariablesDeFormula(formulaLiteral);

        // Verificar si todas las variables de esta fórmula existen
        const todasExisten = variablesEnFormula.every(varName => {
            // Si es parámetro de población, lo damos por válido
            if (varName.startsWith("POBLACION_")) {
                return true;
            }

            // Buscar la variable en estructura dinámica
            return estructuraDinamica.some(item =>
                item.codigos?.includes(varName) ||
                item.nombre?.toUpperCase().includes(varName)
            );
        });

        if (todasExisten) {
            console.log(`✅ Fórmula seleccionada para ${nombreVariable}:`);

            // 5. Convertir fórmula literal a fórmula Excel con referencias
            let formulaExcel = formulaLiteral;

            // Reemplazar variables por referencias de columna
            variablesEnFormula.forEach(varName => {
                // Si es variable de población, reemplazar con referencia
                if (varName === "POBLACION_MENOR_1_AÑO") {
                    formulaExcel = formulaExcel.replace(
                        /POBLACION_MENOR_1_AÑO/g,
                        `${referenciaPoblacion}{FILA}`
                    );
                } else if (varName === "POBLACION_1_AÑO") {
                    formulaExcel = formulaExcel.replace(
                        /POBLACION_1_AÑO/g,
                        `${referenciaPoblacion}{FILA}`
                    );
                } else if (varName === "POBLACION_4_AÑOS") {
                    formulaExcel = formulaExcel.replace(
                        /POBLACION_4_AÑOS/g,
                        `${referenciaPoblacion}{FILA}`
                    );
                } else if (varName === "POBLACION_6_AÑOS") {
                    formulaExcel = formulaExcel.replace(
                        /POBLACION_6_AÑOS/g,
                        `${referenciaPoblacion}{FILA}`
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

            // 6. Asegurar que la fórmula empiece con =
            if (!formulaExcel.startsWith("=")) {
                formulaExcel = "=" + formulaExcel;
            }

            console.log(`   Excel: ${formulaExcel}`);
            return formulaExcel;
        }
    }

    // 7. Si ninguna fórmula funciona, crear una simple
    console.log(`⚠️ Ninguna fórmula funciona para ${nombreVariable}, usando fórmula simple`);
    return `=SI.ERROR(0/((${referenciaPoblacion}{FILA}*0.0833)*12),0)`;
}


// ===============================
// FUNCIÓN ÚNICA Y COMPLETA: agregarColumnasFijasConFormulas
// ===============================
function agregarColumnasFijasConFormulas(worksheet, estructura, filaInicioDatos = 5) {
    try {
        console.log("🔧 Iniciando agregarColumnasFijasConFormulas...");

        // 1. Calcular columna de inicio
        let totalColumnasDinamicas = 0;
        estructura.forEach(apartado => {
            totalColumnasDinamicas += apartado.variables.length;
        });
        const columnaInicioFijas = 7 + totalColumnasDinamicas;
        console.log(`🔧 Columnas dinámicas: ${totalColumnasDinamicas}, Inicio columnas fijas: columna ${columnaInicioFijas}`);

        // 2. Extraer estructura dinámica y referencias
        const estructuraDinamica = extraerEstructuraDinamica(worksheet, estructura);
        const referenciasPoblacion = obtenerReferenciasPoblacion(worksheet);

        // 3. ESTRUCTURA COMPLETA DE COLUMNAS FIJAS CON FÓRMULAS - VERSIÓN SIMPLIFICADA
        const columnasFijas = [
            {
                nombre: "POBLACIÓN <1 AÑO",
                ancho: 15,
                formula: "", // Datos manuales
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
                    // En la sección de variables dentro de columnasFijas, actualiza los nombres:

                    {
                        nombre: "ESQUEMAS POR BIOLÓGICO PARA MENORES DE 1 AÑO",
                        color: 'ffc000',
                        variables: [
                            {
                                nombre: "% BCG",
                                formula: construirFormulaLiteral("% BCG", referenciasPoblacion, estructuraDinamica),
                                ancho: 10,
                                color: '0066cc'
                            },
                            {
                                nombre: "% Hepatitis B (<1 AÑO)",  // ← ACTUALIZADO
                                formula: construirFormulaLiteral("% Hepatitis B (<1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                ancho: 12,
                                color: 'ff6600'
                            },
                            {
                                nombre: "% Hexavalente (<1 AÑO)",  // ← ACTUALIZADO
                                formula: construirFormulaLiteral("% Hexavalente (<1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                ancho: 12,
                                color: '6699ff'
                            },
                            {
                                nombre: "% Rotavirus RV1",
                                formula: construirFormulaLiteral("% Rotavirus RV1", referenciasPoblacion, estructuraDinamica),
                                ancho: 12,
                                color: '548135'
                            },
                            {
                                nombre: "% Neumocócica conjugada (<1 AÑO)",  // ← ACTUALIZADO
                                formula: construirFormulaLiteral("% Neumocócica conjugada (<1 AÑO)", referenciasPoblacion, estructuraDinamica),
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
                                nombre: "% Hexavalente (1 AÑO)",  // ← ACTUALIZADO
                                formula: construirFormulaLiteral("% Hexavalente (1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                ancho: 12,
                                color: '6699ff'
                            },
                            {
                                nombre: "% Neumocócica conjugada (1 AÑO)",  // ← ACTUALIZADO
                                formula: construirFormulaLiteral("% Neumocócica conjugada (1 AÑO)", referenciasPoblacion, estructuraDinamica),
                                ancho: 15,
                                color: '00ccff'
                            },
                            {
                                nombre: "% SRP 1ra",
                                formula: construirFormulaLiteral("% SRP 1ra", referenciasPoblacion, estructuraDinamica),
                                ancho: 10,
                                color: '9933ff'
                            },
                            {
                                nombre: "% SRP 2da",
                                formula: construirFormulaLiteral("% SRP 2da", referenciasPoblacion, estructuraDinamica),
                                ancho: 10,
                                color: '9933ff'
                            }
                        ]
                    },
                    {
                        nombre: "", // Subgrupo sin nombre para DPT y SRP
                        color: 'FFB7DEE8',
                        variables: [
                            {
                                nombre: "% ESQUEMA COMPLETO DE DPT EN 4 AÑOS",
                                formula: construirFormulaLiteral(
                                    "% ESQUEMA COMPLETO DE DPT EN 4 AÑOS",
                                    referenciasPoblacion,
                                    estructuraDinamica
                                ),
                                ancho: 18,
                                color: 'ffd965'
                            },
                            {
                                nombre: "% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS",
                                formula: construirFormulaLiteral(
                                    "% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS",
                                    referenciasPoblacion,
                                    estructuraDinamica
                                ),
                                ancho: 18,
                                color: '6699ff'
                            }
                        ]
                    }
                ]
            }
        ];

        // 4. Contar total de columnas que ocuparán las columnas fijas
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

        // 5. Crear estructura vacía para las 4 filas de encabezado
        const encabezadosFilas = {
            fila1: Array(totalColumnasFijas).fill(''),
            fila2: Array(totalColumnasFijas).fill(''),
            fila3: Array(totalColumnasFijas).fill(''),
            fila4: Array(totalColumnasFijas).fill('')
        };

        // 6. Llenar la estructura con los datos Y colores POR VARIABLE
        let columnaOffset = 0;

        // Array para guardar colores de cada columna - UN COLOR POR VARIABLE
        const coloresPorColumna = Array(totalColumnasFijas).fill('');
        const esVariableDirecta = Array(totalColumnasFijas).fill(false); // Para saber si es variable DPT/SRP

        columnasFijas.forEach(columna => {
            if (columna.esGrupo) {
                // Para grupos: el nombre del grupo va en TODAS las columnas del grupo (fila 1)
                let totalVariablesEnGrupo = 0;

                // Primero contar variables totales
                columna.subgrupos.forEach(subgrupo => {
                    totalVariablesEnGrupo += subgrupo.variables.length;
                });

                // Nombre del grupo en fila 1 (todas las columnas del grupo) - COLOR DEL GRUPO
                for (let i = 0; i < totalVariablesEnGrupo; i++) {
                    encabezadosFilas.fila1[columnaOffset + i] = columna.nombre;
                    // Fila 1 usa el color del grupo principal
                    coloresPorColumna[columnaOffset + i] = columna.color || 'fef2cb';
                }

                // Procesar cada subgrupo
                let subgrupoOffset = 0;
                columna.subgrupos.forEach((subgrupo, subgrupoIndex) => {
                    // Nombre del subgrupo en fila 2 (solo si tiene nombre)
                    if (subgrupo.nombre && subgrupo.nombre.trim() !== "") {
                        for (let i = 0; i < subgrupo.variables.length; i++) {
                            encabezadosFilas.fila2[columnaOffset + subgrupoOffset + i] = subgrupo.nombre;
                        }
                    } else {
                        // Para subgrupos sin nombre (DPT y SRP), dejar fila 2 vacía
                        for (let i = 0; i < subgrupo.variables.length; i++) {
                            encabezadosFilas.fila2[columnaOffset + subgrupoOffset + i] = "";
                            esVariableDirecta[columnaOffset + subgrupoOffset + i] = true; // Marcar como variable directa
                        }
                    }

                    // Variables en filas 3 y 4 - DISTINTO PARA SUBGRUPOS CON/SIN NOMBRE
                    subgrupo.variables.forEach((variable, varIndex) => {
                        if (subgrupo.nombre && subgrupo.nombre.trim() !== "") {
                            // Subgrupos CON nombre: variables en fila 3, fila 4 vacía
                            encabezadosFilas.fila3[columnaOffset + subgrupoOffset + varIndex] = variable.nombre;
                            encabezadosFilas.fila4[columnaOffset + subgrupoOffset + varIndex] = "";
                        } else {
                            // Subgrupos SIN nombre (DPT y SRP): variables en fila 2, filas 3-4 vacías
                            encabezadosFilas.fila2[columnaOffset + subgrupoOffset + varIndex] = variable.nombre;
                            encabezadosFilas.fila3[columnaOffset + subgrupoOffset + varIndex] = "";
                            encabezadosFilas.fila4[columnaOffset + subgrupoOffset + varIndex] = "";
                        }

                        // Guardar el color ESPECÍFICO de esta variable para las filas 2-4
                        coloresPorColumna[columnaOffset + subgrupoOffset + varIndex] = variable.color || 'fef2cb';
                    });

                    subgrupoOffset += subgrupo.variables.length;
                });

                columnaOffset += totalVariablesEnGrupo;

            } else {
                // Para columnas simples: mismo valor en las 4 filas
                encabezadosFilas.fila1[columnaOffset] = columna.nombre;
                encabezadosFilas.fila2[columnaOffset] = "";
                encabezadosFilas.fila3[columnaOffset] = "";
                encabezadosFilas.fila4[columnaOffset] = "";

                // Guardar color para columnas simples (todas las filas)
                coloresPorColumna[columnaOffset] = columna.color || 'f0f0f0';

                columnaOffset++;
            }
        });

        // 7. Agregar los encabezados a las filas existentes del worksheet
        // Obtener las filas 1-4 del worksheet
        const fila1Excel = worksheet.getRow(1);
        const fila2Excel = worksheet.getRow(2);
        const fila3Excel = worksheet.getRow(3);
        const fila4Excel = worksheet.getRow(4);

        // Agregar los encabezados de columnas fijas
        for (let i = 0; i < totalColumnasFijas; i++) {
            const columnaExcel = columnaInicioFijas + i;

            fila1Excel.getCell(columnaExcel).value = encabezadosFilas.fila1[i];
            fila2Excel.getCell(columnaExcel).value = encabezadosFilas.fila2[i];
            fila3Excel.getCell(columnaExcel).value = encabezadosFilas.fila3[i];
            fila4Excel.getCell(columnaExcel).value = encabezadosFilas.fila4[i];
        }

        // 8. Combinar celdas - VERSIÓN ESPECIAL PARA DPT Y SRP
        let columnaActual = columnaInicioFijas;
        columnaOffset = 0;

        columnasFijas.forEach(columna => {
            if (columna.esGrupo) {
                // Contar total de variables en el grupo
                let totalVariablesEnGrupo = 0;
                columna.subgrupos.forEach(subgrupo => {
                    totalVariablesEnGrupo += subgrupo.variables.length;
                });

                // COMBINACIÓN PARA GRUPO "COBERTURA PVU" (fila 1)
                if (totalVariablesEnGrupo > 1) {
                    worksheet.mergeCells(1, columnaActual, 1, columnaActual + totalVariablesEnGrupo - 1);
                    console.log(`🔧 Combinado grupo "${columna.nombre}" en fila 1: columnas ${columnaActual} a ${columnaActual + totalVariablesEnGrupo - 1}`);
                }

                // Para cada subgrupo: combinaciones especiales
                let subgrupoOffset = 0;
                columna.subgrupos.forEach((subgrupo, subgrupoIndex) => {
                    // CASO 1: Subgrupos CON nombre (como "ESQUEMAS POR BIOLÓGICO...")
                    if (subgrupo.nombre && subgrupo.nombre.trim() !== "") {
                        if (subgrupo.variables.length > 1) {
                            // COMBINACIÓN PARA SUBGRUPOS CON NOMBRE (fila 2)
                            worksheet.mergeCells(2, columnaActual + subgrupoOffset, 2, columnaActual + subgrupoOffset + subgrupo.variables.length - 1);
                            console.log(`🔧 Combinado subgrupo "${subgrupo.nombre}" en fila 2: columnas ${columnaActual + subgrupoOffset} a ${columnaActual + subgrupoOffset + subgrupo.variables.length - 1}`);
                        }

                        // COMBINACIÓN VERTICAL PARA VARIABLES (fila 3-4)
                        for (let i = 0; i < subgrupo.variables.length; i++) {
                            if (encabezadosFilas.fila3[columnaOffset + subgrupoOffset + i] &&
                                encabezadosFilas.fila4[columnaOffset + subgrupoOffset + i] === "") {
                                worksheet.mergeCells(3, columnaActual + subgrupoOffset + i, 4, columnaActual + subgrupoOffset + i);
                                console.log(`🔧 Combinado variable "${subgrupo.variables[i].nombre}" verticalmente en columna ${columnaActual + subgrupoOffset + i}`);
                            }
                        }
                    }
                    // CASO 2: Subgrupos SIN nombre (DPT y SRP)
                    else {
                        // PARA DPT Y SRP: COMBINAR FILAS 2-4 VERTICALMENTE (3 FILAS DE ALTURA)
                        for (let i = 0; i < subgrupo.variables.length; i++) {
                            worksheet.mergeCells(2, columnaActual + subgrupoOffset + i, 4, columnaActual + subgrupoOffset + i);
                            console.log(`🔧 Combinado variable "${subgrupo.variables[i].nombre}" verticalmente filas 2-4 en columna ${columnaActual + subgrupoOffset + i}`);
                        }
                    }

                    subgrupoOffset += subgrupo.variables.length;
                });

                columnaActual += totalVariablesEnGrupo;
                columnaOffset += totalVariablesEnGrupo;

            } else {
                // Para columnas simples: combinar las 4 filas verticalmente
                worksheet.mergeCells(1, columnaActual, 4, columnaActual);
                console.log(`🔧 Combinando columna simple "${columna.nombre}" verticalmente: columna ${columnaActual}`);
                columnaActual++;
                columnaOffset++;
            }
        });

        // 9. Aplicar formato CON COLORES POR VARIABLE
        for (let i = 0; i < totalColumnasFijas; i++) {
            const columnaExcel = columnaInicioFijas + i;
            const colorColumna = coloresPorColumna[i];
            const esDirecta = esVariableDirecta[i];

            // Obtener los valores para determinar qué formato aplicar
            const valorFila1 = encabezadosFilas.fila1[i];
            const valorFila2 = encabezadosFilas.fila2[i];
            const valorFila3 = encabezadosFilas.fila3[i];

            // Determinar si esta columna es de población (columnas simples)
            const esColumnaPoblacion = valorFila1 && (
                valorFila1.includes("POBLACIÓN") ||
                valorFila1.includes("POBLACION")
            );

            // Determinar si el color es oscuro (necesita texto blanco)
            const coloresOscuros = ['902449', '0066CC'];
            const esColorOscuro = coloresOscuros.includes(colorColumna);
            const colorTexto = esColorOscuro ? 'FFFFFFFF' : 'FF000000';
            const colorTextoClaro = 'FFFFFFFF';
            const colorTextoOscuro = 'FF000000';

            // ============================================
            // FILA 1: Nombres de grupos o columnas simples
            // ============================================
            const cellFila1 = worksheet.getRow(1).getCell(columnaExcel);

            let colorFila1;
            if (esColumnaPoblacion) {
                colorFila1 = colorColumna;
            } else if (valorFila1 && valorFila1.includes("COBERTURA PVU")) {
                colorFila1 = 'fef2cb';
            } else {
                colorFila1 = colorColumna;
            }

            const esColorFila1Oscuro = coloresOscuros.includes(colorFila1);
            const textoFila1 = esColorFila1Oscuro ? colorTextoClaro : colorTextoOscuro;

            cellFila1.font = {
                bold: true,
                size: 14,
                color: { argb: textoFila1 }
            };
            cellFila1.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: colorFila1 }
            };
            cellFila1.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            cellFila1.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // ============================================
            // FILA 2: Puede tener subgrupos, variables, o estar vacía
            // ============================================
            const cellFila2 = worksheet.getRow(2).getCell(columnaExcel);

            if (esColumnaPoblacion) {
                // Para columnas de población (combinadas verticalmente): mismo color que fila 1
                cellFila2.font = { bold: true, size: 10, color: { argb: textoFila1 } };
                cellFila2.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorFila1 }
                };
            } else if (valorFila2 && valorFila2.includes("ESQUEMAS")) {
                // Subgrupo con nombre - color diferente para cada subgrupo
                let colorSubgrupo;
                if (valorFila2.includes("MENORES DE 1 AÑO")) {
                    colorSubgrupo = 'ffc000'; // Azul claro para primer subgrupo
                } else if (valorFila2.includes("EN 1 AÑO")) {
                    colorSubgrupo = '70ad47'; // Azul medio para segundo subgrupo
                } else {
                    colorSubgrupo = 'FFB7DEE8'; // Azul muy claro para otros
                }

                const colorFila2 = colorSubgrupo.replace('FF', 'DD'); // Hacer más claro

                cellFila2.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
                cellFila2.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorFila2 }
                };
            } else if (valorFila2 && (valorFila2.includes("DPT") || valorFila2.includes("SRP"))) {
                // Variables DPT/SRP - color ESPECÍFICO de la variable
                cellFila2.font = { bold: true, size: 10, color: { argb: colorTexto } };
                cellFila2.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorColumna }
                };
            } else if (esDirecta) {
                // Variable directa (parte de DPT/SRP) - color de la variable
                cellFila2.font = { bold: true, size: 10, color: { argb: colorTexto } };
                cellFila2.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorColumna }
                };
            } else {
                // Vacío en grupo COBERTURA PVU - color del grupo (morado)
                const esEnGrupoPVU = valorFila1 && valorFila1.includes("COBERTURA PVU");
                const colorFondoFila2 = esEnGrupoPVU ? 'fef2cb' : colorFila1;
                const textoFila2 = esEnGrupoPVU ? colorTextoClaro : textoFila1;

                cellFila2.font = { bold: true, size: 10, color: { argb: textoFila2 } };
                cellFila2.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorFondoFila2 }
                };
            }

            cellFila2.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            cellFila2.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // ============================================
            // FILAS 3 y 4
            // ============================================
            const cellFila3 = worksheet.getRow(3).getCell(columnaExcel);
            const cellFila4 = worksheet.getRow(4).getCell(columnaExcel);

            if (esColumnaPoblacion) {
                // Para columnas de población (combinadas verticalmente): mismo color que fila 1
                cellFila3.font = { bold: true, size: 10, color: { argb: textoFila1 } };
                cellFila3.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorFila1 }
                };
                cellFila3.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cellFila3.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                cellFila4.font = { bold: true, size: 10, color: { argb: textoFila1 } };
                cellFila4.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorFila1 }
                };
                cellFila4.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cellFila4.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            } else if (valorFila3) {
                // Para variables normales (en fila 3) - color ESPECÍFICO de la variable
                const colorVariables = colorColumna.replace('FF', 'CC'); // Hacer más claro
                cellFila3.font = { bold: true, size: 10, color: { argb: colorTextoOscuro } };
                cellFila3.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorVariables }
                };
                cellFila3.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cellFila3.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                // Fila 4 vacía si se combinó con fila 3 - mismo color
                cellFila4.font = { bold: true, size: 10, color: { argb: colorTextoOscuro } };
                cellFila4.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorVariables }
                };
                cellFila4.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cellFila4.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            } else if (valorFila2 && (valorFila2.includes("DPT") || valorFila2.includes("SRP"))) {
                // Para DPT/SRP: filas 3 y 4 están vacías pero tienen el mismo formato que fila 2
                cellFila3.font = { bold: true, size: 10, color: { argb: colorTexto } };
                cellFila3.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorColumna }
                };
                cellFila3.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cellFila3.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                cellFila4.font = { bold: true, size: 10, color: { argb: colorTexto } };
                cellFila4.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorColumna }
                };
                cellFila4.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cellFila4.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            } else {
                // Para celdas completamente vacías en grupo COBERTURA PVU
                const esEnGrupoPVU = valorFila1 && valorFila1.includes("COBERTURA PVU");
                const colorFondoVacias = esEnGrupoPVU ? 'fef2cb' : colorFila1;
                const textoVacias = esEnGrupoPVU ? colorTextoClaro : textoFila1;

                cellFila3.font = { bold: true, size: 10, color: { argb: textoVacias } };
                cellFila3.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorFondoVacias }
                };
                cellFila3.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cellFila3.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                cellFila4.font = { bold: true, size: 10, color: { argb: textoVacias } };
                cellFila4.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: colorFondoVacias }
                };
                cellFila4.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cellFila4.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }

        // 10. Ajustar anchos de columnas
        columnaOffset = 0;
        columnaActual = columnaInicioFijas;

        columnasFijas.forEach(columna => {
            if (columna.esGrupo) {
                columna.subgrupos.forEach(subgrupo => {
                    subgrupo.variables.forEach(variable => {
                        worksheet.getColumn(columnaActual).width = variable.ancho || 12;
                        console.log(`🔧 Ancho columna ${columnaActual}: ${variable.ancho || 12} (${variable.nombre} - ${variable.color})`);
                        columnaActual++;
                    });
                });
            } else {
                worksheet.getColumn(columnaActual).width = columna.ancho || 15;
                console.log(`🔧 Ancho columna ${columnaActual}: ${columna.ancho || 15} (${columna.nombre} - ${columna.color})`);
                columnaActual++;
            }
        });

        // 11. Aumentar altura de filas para mejor visualización
        worksheet.getRow(1).height = 30;
        worksheet.getRow(2).height = 25;
        worksheet.getRow(3).height = 60;
        worksheet.getRow(4).height = 60;

        // 12. AGREGAR DATOS DE POBLACIÓN Y FÓRMULAS
        for (let fila = filaInicioDatos; fila <= filaInicioDatos + resultadosConsulta.length - 1; fila++) {
            const row = worksheet.getRow(fila);
            let columnaActual = columnaInicioFijas;

            // Las primeras 4 columnas son de población (datos manuales)
            for (let i = 0; i < 4; i++) {
                row.getCell(columnaActual).value = ""; // Vacío para que el usuario ingrese
                columnaActual++;
            }

            // Las siguientes columnas tienen fórmulas
            columnasFijas[4].subgrupos.forEach(subgrupo => {
                subgrupo.variables.forEach(variable => {
                    if (variable.formula && variable.formula !== "=0") {
                        const cell = row.getCell(columnaActual);
                        const formulaFinal = variable.formula.replace(/{FILA}/g, fila);

                        cell.value = {
                            formula: formulaFinal,
                            result: null
                        };

                        console.log(`📝 Fila ${fila}, Col ${columnaActual}: ${formulaFinal}`);
                    }
                    columnaActual++;
                });
            });
        }

        console.log("✅ Fórmulas literales aplicadas exitosamente!");
        return columnaInicioFijas;
    } catch (error) {
        console.error("❌ Error en agregarColumnasFijasConFormulas:", error);
        alert("Hubo un error al agregar las columnas fijas con fórmulas.");
        throw error; // Re-lanzar el error para que sea manejado en exportarTablaHTML
    }
}

// ===============================
// Nueva función: exportar con encabezados combinados y colores
// ===============================
async function exportarTablaHTML() {
    try {
        mostrarSpinner();

        // 1. Crear libro y hoja
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resultados');

        // 2. Obtener la estructura de apartados y variables desde resultadosConsulta
        const estructura = construirEstructuraEncabezados();

        // 3. Paleta de colores para apartados
        const coloresApartados = [
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
        ];

        // 4. Crear fila 1: Encabezados principales (apartados en columnas G+)
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

        // 5. Crear fila 2: Vacía para columnas A-F, también vacía para columnas G+ (se combinará con fila 1)
        const fila2 = ['', '', '', '', '', '']; // Vacío para columnas A-F

        // Para columnas G+, poner vacío (se combinará con fila 1)
        estructura.forEach(apartado => {
            apartado.variables.forEach(() => {
                fila2.push('');
            });
        });

        // 6. Crear fila 3: Variables (vacío para columnas A-F)
        const fila3 = ['', '', '', '', '', '']; // Vacío para columnas A-F

        estructura.forEach(apartado => {
            apartado.variables.forEach(variable => {
                fila3.push(variable);
            });
        });

        // 7. Crear fila 4: Variables duplicadas (vacío para columnas A-F)
        const fila4 = ['', '', '', '', '', '']; // Vacío para columnas A-F

        estructura.forEach(apartado => {
            apartado.variables.forEach(variable => {
                fila4.push(variable);
            });
        });

        // 8. Agregar filas al Excel
        worksheet.addRow(fila1); // Fila 1
        worksheet.addRow(fila2); // Fila 2 (vacía para combinar)
        worksheet.addRow(fila3); // Fila 3 (variables)
        worksheet.addRow(fila4); // Fila 4 (variables duplicadas)

        // 9. COMBINAR CELDAS PARA COLUMNAS A-F (verticalmente)
        for (let col = 1; col <= 6; col++) {
            worksheet.mergeCells(1, col, 4, col); // Combinar filas 1-4 para cada columna A-F
        }

        // 10. COMBINAR CELDAS PARA APARTADOS (horizontal y verticalmente en filas 1-2)
        let colInicio = 7; // Columna G

        estructura.forEach((apartado, index) => {
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

        // 11. APLICAR FORMATO

        // Formato para columnas A-F (todas combinadas)
        for (let col = 1; col <= 6; col++) {
            const cell = worksheet.getCell(1, col);
            cell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '902449' } // Color rojo oscuro
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }

        // Formato para apartados (combinados en filas 1-2)
        colInicio = 7;

        estructura.forEach((apartado, index) => {
            const numVariables = apartado.variables.length;
            const colorIndex = index % coloresApartados.length;
            const color = coloresApartados[colorIndex];

            // Apartado (combinado en filas 1-2)
            const cellApartado = worksheet.getCell(1, colInicio);
            cellApartado.font = { bold: true, size: 12 };
            cellApartado.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: color }
            };
            cellApartado.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cellApartado.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            // comentario
            // Formato para variables (combinadas en filas 3-4)
            for (let i = 0; i < numVariables; i++) {
                const cellVariable = worksheet.getCell(3, colInicio + i);
                cellVariable.font = { bold: true, size: 10 };
                cellVariable.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: color.replace('FF', 'CC') } // Color más claro
                };
                cellVariable.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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

        // 12. Ajustar altura de filas
        worksheet.getRow(1).height = 32;
        worksheet.getRow(2).height = 32;
        worksheet.getRow(3).height = 70;
        worksheet.getRow(4).height = 70;

        // 13. Agregar datos de cada CLUES (comenzando en fila 5)
        // 13. Agregar datos de cada CLUES (comenzando en fila 5)
        let fila = 5;

        resultadosConsulta.forEach(r => {
            const filaDatos = [];

            // Información básica (columnas A-F)
            filaDatos.push(
                r.clues,
                r.unidad.nombre || '',
                r.unidad.entidad || '',
                r.unidad.jurisdiccion || '',
                r.unidad.municipio || '',
                obtenerInicialesInstitucion(r.unidad.idinstitucion) || ''
            );

            // Variables por apartado (columnas G en adelante)
            estructura.forEach(apartado => {
                // Buscar los datos de este apartado para esta CLUES
                const datosApartado = r.biologicos.find(b => b.apartado === apartado.nombre);

                if (datosApartado) {
                    // Para cada variable en la estructura, buscar su valor
                    apartado.variables.forEach(variableNombre => {
                        let valor = 0;

                        // Buscar en todos los grupos
                        for (const grupo of datosApartado.grupos) {
                            const variable = grupo.variables.find(v => v.variable === variableNombre);
                            if (variable) {
                                valor = variable.total;
                                break;
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

            worksheet.addRow(filaDatos);

            // Aplicar bordes a esta fila de datos
            const row = worksheet.getRow(fila);
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

        // 🔴 🔴 🔴 AGREGAR ESTA LÍNEA AQUÍ 🔴 🔴 🔴
        // 14. AGREGAR COLUMNAS FIJAS CON FÓRMULAS
        agregarColumnasFijasConFormulas(worksheet, estructura, 5);

        // 15. Ajustar ancho de columnas (las originales)
        worksheet.getColumn(1).width = 15; // CLUES
        worksheet.getColumn(2).width = 20; // Unidad
        worksheet.getColumn(3).width = 15; // Entidad
        worksheet.getColumn(4).width = 15; // Jurisdicción
        worksheet.getColumn(5).width = 15; // Municipio
        worksheet.getColumn(6).width = 15; // Institución

        // Columnas de variables
        let currentCol = 7;
        estructura.forEach(apartado => {
            apartado.variables.forEach(() => {
                const col = worksheet.getColumn(currentCol);
                col.width = 12; // Ancho fijo para variables
                currentCol++;
            });
        });

        // 15. Congelar las primeras 4 filas (encabezados)
        worksheet.views = [
            { state: 'frozen', ySplit: 4 }
        ];

        // 16. Descargar archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Resultados_Vacunacion_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);

        ocultarSpinner();

    } catch (error) {
        console.error('Error al exportar con encabezados combinados:', error);
        alert('Hubo un problema al generar el archivo Excel.');
        ocultarSpinner();
    }
}



resultadosContainer.classList.remove("d-none");
btnExportar.disabled = false;
// 🔹 Habilitar también el nuevo botón
// btnExportarSimple.disabled = false;

// // En la función resetearInterfaz():
// btnExportarSimple.disabled = true;

// // En el event listener de btnLimpiarClues:
// btnExportarSimple.disabled = true;


// ===============================
// Función para obtener fórmula según el nombre de la variable
// ===============================
// function obtenerFormulaPorVariable(nombreVariable) {
//     // Mapeo de fórmulas basado en patrones en los nombres de variables
//     const formulas = {
//         // Patrones para % BCG y similares
//         "% BCG": "=SI.ERROR(({BCG})/((POBLACIÓN <1 AÑO*0.0833)*12),0)",
//         "%HEPATITIS B 1a": "=SI.ERROR(({HEP_B})/((POBLACIÓN <1 AÑO*0.0833)*12),0)",
//         "% HEXAVALENTE ACELULAR 3a": "=SI.ERROR(({HEXAVALENTE})/((POBLACIÓN <1 AÑO*0.0833)*12),0)",
//         "% HEPATITIS B 1a + HEXAVALENTE ACELULAR 3a": "=SI.ERROR(({HEP_B_HEX})/((POBLACIÓN <1 AÑO*0.0833)*12),0)",

//         // Patrones para ROTAVIRUS
//         "ROTAVIRUS": "=SI.ERROR(({ROTAVIRUS})/((POBLACIÓN <1 AÑO*0.0833)*12),0)",

//         // Patrones para NEUMOCÓCICA
//         "NEUMOCÓCICA": "=SI.ERROR(({NEUMOCOCICA})/((POBLACIÓN <1 AÑO*0.0833)*12),0)",

//         // Patrones para DOSIS APLICADAS
//         "DOSIS APLICADAS": "=SUM({DOSIS_VARIABLES})",

//         // Patrones para PROMEDIO ESQUEMA COMPLETO
//         "PROMEDIO ESQUEMA COMPLETO": "=SI.ERROR(({TOTAL_DOSIS})/((POBLACIÓN <1 AÑO*0.0833)*12),0)",

//         // Patrones para 1 AÑO
//         "% HEXAVALENTE 4a": "=SI.ERROR(({HEXAVALENTE_4A})/((POBLACIÓN 1 AÑO*0.0833)*12),0)",
//         "% NEUMOCÓCICA 3a": "=SI.ERROR(({NEUMOCOCICA_3A})/((POBLACIÓN 1 AÑO*0.0833)*12),0)",
//         "% SRP": "=SI.ERROR(({SRP})/((POBLACIÓN 1 AÑO*0.0833)*12),0)",

//         // Patrones para DPT y SRP por edad
//         "DPT EN 4 AÑOS": "=SI.ERROR(({DPT})/((POBLACIÓN 4 AÑO*0.0833)*12),0)",
//         "SRP 2a EN 6 AÑOS": "=SI.ERROR(({SRP_2A})/((POBLACIÓN 6 AÑO*0.0833)*12),0)"
//     };

//     // Buscar la fórmula por coincidencia de patrones
//     for (const [patron, formula] of Object.entries(formulas)) {
//         if (nombreVariable.includes(patron)) {
//             return formula;
//         }
//     }

//     // Si no encuentra patrón, fórmula por defecto
//     return "=0";
// }


// function mapearVariableACodigo(nombreVariable, estructuraDinamica) {

//     const mapeo = {
//         "% BCG": [["BIO01", "BIO50"],["VBC02", "BIO50"]],
//         "%HEPATITIS B 1a": ["BIO02", "BIO51"],
//         "% HEXAVALENTE ACELULAR 3a": ["BIO03", "BIO04", "BIO05"],
//         "% HEPATITIS B 1a + HEXAVALENTE ACELULAR 3a": ["BIO02", "BIO51", "BIO03", "BIO04", "BIO05"],
//         "% ROTAVIRUS RV1 2a": ["BIO06"],
//         "% ROTAVIRUS RV5 3a": ["BIO07"],
//         "%ROTAVIRUS RV1 2a + RV5 3a": ["BIO06", "BIO07"],
//         "% NEUMOCÓCICA CONJUGADA (13 VALENTE) 2a": ["BIO08"],
//         "DOSIS APLICADAS PARA CÁLCULO DE PROMEDIO DE ESQUEMAS COMPLETOS <1 AÑO": ["BIO01", "BIO02", "BIO03", "BIO04", "BIO05", "BIO06", "BIO07", "BIO08", "BIO50", "BIO51", "VBC02"],
//         "PROMEDIO ESQUEMA COMPLETO COBERTURAS EN <1 AÑO": ["BCG_TOTAL", "HEP_B_TOTAL", "HEX_TOTAL", "ROTA_TOTAL", "NEUMO_TOTAL"],
//         "% HEXAVALENTE 4a": ["BIO09"],
//         "% NEUMOCÓCICA 3a": ["BIO10"],
//         "% SRP 1ra": ["BIO11"],
//         "% SRP 18 Meses": ["BIO12"],
//         "% SRP 2da": ["BIO13"],
//         "DOSIS APLICADAS PARA CÁLCULO DE PROMEDIO DE ESQUEMAS COMPLETOS 1 AÑO": ["BIO09", "BIO10", "BIO11", "BIO12", "BIO13"],
//         "% PROMEDIO ESQUEMA COMPLETO EN 1 AÑO": ["HEX_4A_TOTAL", "NEUMO_3A_TOTAL", "SRP_TOTAL"],
//         "% ESQUEMA COMPLETO DE DPT EN 4 AÑOS": ["BIO14", "BIO15", "BIO16"],
//         "% ESQUEMA COMPLETO DE SRP 2a EN 6 AÑOS": ["BIO17"]
//     };

//     // Buscar el mapeo
//     for (const [variablePatron, codigos] of Object.entries(mapeo)) {
//         if (nombreVariable.includes(variablePatron)) {
//             return codigos;
//         }
//     }

//     return [];
// }


// ===============================
// Funciones auxiliares para construir fórmulas específicas
// ===============================
// function construirFormulaBCG(referenciaPoblacion) {
//     // Fórmula para % BCG: =SI.ERROR((BIO01 + BIO50 OR VBC02 + BIO50) / (Población menor de 1 año*0.0833)*12),0)
//     // Necesitas mapear BIO01, BIO50, VBC02 a las columnas correctas

//     // Suponiendo que BIO01 está en columna X, BIO50 en Y, VBC02 en Z
//     // Esto depende de cómo estén organizadas tus columnas dinámicas

//     return `=SI.ERROR((SUM(X{FILA}:Z{FILA}))/((${referenciaPoblacion}{FILA}*0.0833)*12),0)`;
// }

// function construirFormulaHepatitisB(referenciaPoblacion) {
//     return `=SI.ERROR((SUM(AA{FILA}:AB{FILA}))/((${referenciaPoblacion}{FILA}*0.0833)*12),0)`;
// }

// ===============================
// Función para obtener referencia de columna por nombre
// ===============================
// function obtenerReferenciaColumna(worksheet, nombreColumna) {
//     // Buscar en las primeras filas el nombre de la columna
//     for (let col = 1; col <= worksheet.columnCount; col++) {
//         const cell = worksheet.getRow(1).getCell(col);
//         if (cell.value === nombreColumna) {
//             // Convertir número de columna a letra (A, B, C, ...)
//             return numeroALetra(col);
//         }
//     }
//     return "A"; // Por defecto
// }

// ===============================
// Convertir número de columna a letra
// ===============================
function numeroALetra(numero) {
    let letra = '';
    while (numero > 0) {
        let temp = (numero - 1) % 26;
        letra = String.fromCharCode(temp + 65) + letra;
        numero = (numero - temp - 1) / 26;
    }
    return letra;
}