const API_LARAVEL = "/consultar-biologicos";
const API_FASTAPI = "http://127.0.0.1:8080";
console.log("🔵 vacanas.js cargado correctamente");

let cuboActivo = null;
let cluesDisponibles = [];
let resultadosConsulta = [];
let institucionesCatalogo = [];




// ===============================
// Spinner global
// ===============================
function mostrarSpinner() {
    spinnerCarga.classList.remove("d-none");
}

function ocultarSpinner() {
    spinnerCarga.classList.add("d-none");
}


document.addEventListener("DOMContentLoaded", () => {

    console.log("vacunas.js cargado");

    // 🔹 ACTIVAR SELECT2 EN EL SELECT DE CLUES
    $('#cluesSelect').select2({
        placeholder: "Selecciona una o más CLUES",
        width: '100%',
        theme: 'bootstrap-5',
        allowClear: true
    });

    cargarCatalogos();

    // 🔹 Cuando cambias el catálogo, se limpia el select
    catalogoSelect.addEventListener("change", () => {
        btnCargarClues.disabled = !catalogoSelect.value;

        $("#cluesSelect").empty().trigger("change");
        cluesSelect.disabled = true;
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


    btnTodasHG.addEventListener("click", () => {
        const seleccionadas = cluesDisponibles.filter(c => c.startsWith("HG"));
        $("#cluesSelect").val(seleccionadas).trigger("change");
    });

    btnTodasHGIMB.addEventListener("click", () => {
        const catalogo = catalogoSelect.value;

        mostrarSpinner();

        fetch(`${API_FASTAPI}/clues_filtradas?catalogo=${catalogo}&cubo=${cuboActivo}&prefijo=HGIMB`)
            .then(r => r.json())
            .then(data => {
                cluesDisponibles = data.clues;

                $("#cluesSelect").empty();
                cluesDisponibles.forEach(c => {
                    $("#cluesSelect").append(new Option(c, c));
                });

                $("#cluesSelect").val(cluesDisponibles).trigger("change");
            })
            .finally(ocultarSpinner);
    });

});
;


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
            btnTodasHG.disabled = false;
            btnTodasHGIMB.disabled = false;

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
                "FG": "=G@ + H@",
                "FH": "=I@ + J@",
                "FI": "=K@ + L@",
                "FJ": "=M@ + N@",
                "FK": "=O@ + P@",
                "FL": "=Q@ + R@",
                "FM": "=S@ + T@",
                "FN": "=U@ + V@",
                "FO": "=W@ + X@",
                "FP": "=Y@ + Z@",
                "FQ": "=AA@ + AB@",
                "FR": "=AC@ + AD@",
                "FS": "=AE@ + AF@",
                "FT": "=AG@ + AH@",
                "FU": "=AI@ + AJ@",
                "FV": "=AK@ + AL@",
                "FW": "=AM@ + AN@",
                "FX": "=AO@ + AP@",
                "FY": "=AQ@ + AR@"
            };

            Object.entries(formulas).forEach(([col, formula]) => {
                // Reemplaza TODAS las @ por el número de fila
const f = formula.replace(/@/g, fila).replace("=", "");  // quitar "="

sheet.getCell(`${col}${fila}`).value = {
    formula: f,   // ✔ fórmula sin "=" → Excel la reconoce
    result: null  // ✔ Excel recalcula al abrir
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

