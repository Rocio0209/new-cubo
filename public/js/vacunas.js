const API_LARAVEL = "/consultar-biologicos";
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

document.getElementById('btnLimpiarClues').addEventListener('click', function() {
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
// Nueva función: exportar con encabezados combinados
// ===============================
async function exportarTablaHTML() {
    try {
        mostrarSpinner();

        // 1. Crear libro y hoja
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resultados');

        // 2. Obtener la estructura de apartados y variables desde resultadosConsulta
        const estructura = construirEstructuraEncabezados();
        
        // 3. Crear fila 1: Apartados (con celdas combinadas)
        const filaApartados = [];
        const filaVariables = [];
        
        // Columnas fijas (A-F) - agregar a ambas filas pero las combinaremos
        filaApartados.push('CLUES', 'Unidad', 'Entidad', 'Jurisdicción', 'Municipio', 'Institución');
        filaVariables.push('CLUES', 'Unidad', 'Entidad', 'Jurisdicción', 'Municipio', 'Institución');
        
        // Variables dinámicas por apartado
        estructura.forEach(apartado => {
            // Agregar apartado a fila 1 (vacío repetido para cada variable)
            for (let i = 0; i < apartado.variables.length; i++) {
                filaApartados.push(apartado.nombre);
                filaVariables.push(apartado.variables[i]);
            }
        });
        
        // 4. Agregar filas al Excel
        worksheet.addRow(filaApartados);  // Fila 1: Apartados
        worksheet.addRow(filaVariables);  // Fila 2: Variables
        
        // 5. COMBINAR CELDAS VERTICALMENTE PARA COLUMNAS A-F
        for (let col = 1; col <= 6; col++) {
            worksheet.mergeCells(1, col, 2, col);
        }
        
        // 6. Combinar celdas de apartados en fila 1 (a partir de columna G)
        let colInicio = 7; // Columna G = 7 (después de las 6 fijas)
        
        estructura.forEach(apartado => {
            const numVariables = apartado.variables.length;
            if (numVariables > 1) {
                worksheet.mergeCells(1, colInicio, 1, colInicio + numVariables - 1);
            }
            colInicio += numVariables;
        });
        
        // 7. Aplicar formato a encabezados
        // Fila 1 (Apartados) - incluyendo columnas A-F que ahora están combinadas
        const row1 = worksheet.getRow(1);
        row1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        row1.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E75B6' } // Azul
        };
        row1.alignment = { vertical: 'middle', horizontal: 'center' };
        row1.height = 25;
        
        // Fila 2 (Variables) - solo para columnas G en adelante
        const row2 = worksheet.getRow(2);
        row2.font = { bold: true, size: 11 };
        row2.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDEBF7' } // Azul claro
        };
        row2.alignment = { vertical: 'middle', horizontal: 'center' };
        row2.height = 20;
        
        // 8. Agregar datos de cada CLUES
        let fila = 3; // Comenzar en fila 3
        
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
            fila++;
        });
        
        // 9. Ajustar ancho de columnas automáticamente
        worksheet.columns = filaVariables.map((header, index) => {
            // Columnas fijas más anchas (A-F)
            if (index < 6) {
                return { width: 20 };
            }
            // Variables más estrechas (G en adelante)
            return { width: 15 };
        });
        
        // 10. Congelar las primeras 2 filas (encabezados)
        worksheet.views = [
            { state: 'frozen', ySplit: 2 }
        ];
        
        // 11. Agregar bordes a todas las celdas de encabezados
        [1, 2].forEach(rowNum => {
            const row = worksheet.getRow(rowNum);
            // Solo bordes para columnas con contenido (el resto ya tiene bordes por defecto)
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
        
        // 12. Descargar archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Resultados_Vacunacion_${new Date().toISOString().slice(0,10)}.xlsx`;
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
btnExportarSimple.disabled = false;

// En la función resetearInterfaz():
btnExportarSimple.disabled = true;

// En el event listener de btnLimpiarClues:
btnExportarSimple.disabled = true;