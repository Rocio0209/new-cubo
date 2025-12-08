const API_LARAVEL = "/consultar-biologicos";
const API_FASTAPI = "http://127.0.0.1:8080";
console.log("🔵 vacanas.js cargado correctamente");
let cuboActivo = null;
let cluesDisponibles = [];
let resultadosConsulta = [];
let institucionesCatalogo = [];


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

    fetch("/instituciones-json")
    .then(r => r.json())
    .then(data => {
        institucionesCatalogo = data;
        console.log("Instituciones cargadas:", institucionesCatalogo);
    });

    // Botones y acciones
    btnCargarClues.addEventListener("click", cargarClues);
    btnConsultar.addEventListener("click", consultarBiologicos);
    btnExportar.addEventListener("click", exportarExcel);

    // 🔹 Seleccionar TODAS las HG (todas las que existan en cluesDisponibles)
    btnTodasHG.addEventListener("click", () => {
        const seleccionadas = cluesDisponibles.filter(c => c.startsWith("HG"));
        $("#cluesSelect").val(seleccionadas).trigger("change");
    });

    // 🔹 Seleccionar TODAS las HGIMB desde endpoint
    btnTodasHGIMB.addEventListener("click", () => {
        const catalogo = catalogoSelect.value;

        mostrarSpinner();

        fetch(`${API_FASTAPI}/clues_filtradas?catalogo=${catalogo}&cubo=${cuboActivo}&prefijo=HGIMB`)
            .then(r => r.json())
            .then(data => {
                cluesDisponibles = data.clues;

                // Limpiar Select2
                $("#cluesSelect").empty();

                // Agregar nuevas opciones
                cluesDisponibles.forEach(c => {
                    $("#cluesSelect").append(new Option(c, c));
                });

                // Seleccionarlas TODAS
                $("#cluesSelect").val(cluesDisponibles).trigger("change");
            })
            .finally(ocultarSpinner);
    });

});
;

function cargarCatalogos() {
    console.log("🔵 Cargando catálogos desde:", `${API_FASTAPI}/cubos_sis`);

    fetch(`${API_FASTAPI}/cubos_sis`)
        .then(r => {
            console.log("🟢 Respuesta HTTP:", r.status);
            return r.json();
        })
        .then(data => {
            console.log("🟣 Datos recibidos:", data);

            if (!data.cubos_sis) {
                console.error("❌ ERROR: No llegó cubos_sis");
                return;
            }

            data.cubos_sis.forEach(c => {
                catalogoSelect.innerHTML += `<option value="${c}">${c}</option>`;
            });

            console.log("🟢 Catálogos agregados al select");
        })
        .catch(err => {
            console.error("🔴 ERROR de conexión:", err);
        });
}


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

            // Refrescar Select2
            $('#cluesSelect').trigger('change');



            cluesSelect.disabled = false;
            btnConsultar.disabled = false;
            btnTodasHG.disabled = false;
            btnTodasHGIMB.disabled = false;

            mensajeCluesCargadas.classList.remove("d-none");
        })
        .finally(ocultarSpinner);
}


function seleccionarPorPrefijo(prefijo) {
    const seleccionadas = cluesDisponibles.filter(c => c.startsWith(prefijo));
    console.log("Opciones en select2:", $("#cluesSelect option").length);

    if (seleccionadas.length === 0) {
        alert(`No se encontraron CLUES que comiencen con ${prefijo}`);
        return;
    }

    $("#cluesSelect").val(seleccionadas).trigger("change");
    console.log("Clues filtradas:", seleccionadas);
    btnConsultar.disabled = false;
}

function consultarBiologicos() {
    const catalogo = catalogoSelect.value;
    const clues_list = Array.from(cluesSelect.selectedOptions).map(o => o.value);

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
    const totales = {};   // ← 🟢 Aquí guardaremos la suma por columna

    // 🔹 Identificar columnas dinámicas
    data.resultados.forEach(r => {
        r.biologicos.forEach(ap => {
            if (!apartados[ap.apartado]) apartados[ap.apartado] = [];

            ap.variables.forEach(v => {
                if (!apartados[ap.apartado].includes(v.variable)) {
                    apartados[ap.apartado].push(v.variable);

                    // Inicializamos el total en 0
                    totales[v.variable] = 0;
                }
            });
        });
    });

    // 🔹 Pintar encabezados dinámicos
    Object.entries(apartados).forEach(([apartado, vars]) => {
        tablaHeader.innerHTML += `<th colspan="${vars.length}">${apartado}</th>`;
        vars.forEach(v => variablesHeader.innerHTML += `<th>${v}</th>`);
    });

    // 🔹 Agregar filas de datos por cada CLUES
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
            const datos = r.biologicos.find(b => b.apartado === apartado)?.variables ?? [];
            const dict = Object.fromEntries(datos.map(v => [v.variable, v.total]));

            vars.forEach(v => {
                const valor = Number(dict[v] ?? 0);
                fila += `<td>${valor}</td>`;

                // 🔹 Acumular totales
                totales[v] += valor;
            });
        });

        tablaResultadosBody.innerHTML += `<tr>${fila}</tr>`;
    });

    // 🔹 Construir la fila de TOTALES
    let filaTotales = `
        <td colspan="6"><strong>TOTALES GENERALES</strong></td>
    `;

    Object.entries(apartados).forEach(([apartado, vars]) => {
        vars.forEach(v => {
            filaTotales += `<td><strong>${totales[v]}</strong></td>`;
        });
    });

    tablaFooter.innerHTML = `<tr class="table-secondary">${filaTotales}</tr>`;
}

function exportarExcel() {
    if (!resultadosConsulta || resultadosConsulta.length === 0) {
        alert("No hay resultados para exportar.");
        return;
    }

    const datos = resultadosConsulta;

    // --------------------------
    // 1. Construir ENCABEZADOS
    // --------------------------
    const encabezadosFijos = [
        "CLUES",
        "Unidad",
        "Entidad",
        "Jurisdicción",
        "Municipio",
        "Institución"
    ];

    // Recolectar columnas dinámicas (apartados + variables)
    const columnasDinamicas = [];

    datos.forEach(r => {
        r.biologicos.forEach(b => {
            b.variables.forEach(v => {
                if (!columnasDinamicas.includes(v.variable)) {
                    columnasDinamicas.push(v.variable);
                }
            });
        });
    });

    const encabezados = encabezadosFijos.concat(columnasDinamicas);

    // --------------------------
    // 2. Construir FILAS
    // --------------------------
    const filas = [];

    datos.forEach(r => {
        const fila = {
            "CLUES": r.clues,
            "Unidad": r.unidad.nombre ?? "",
            "Entidad": r.unidad.entidad ?? "",
            "Jurisdicción": r.unidad.jurisdiccion ?? "",
            "Municipio": r.unidad.municipio ?? "",
            "Institución": obtenerInicialesInstitucion(r.unidad.idinstitucion)
        };

        // Inicializar valores dinámicos
        columnasDinamicas.forEach(v => {
            fila[v] = 0;
        });

        // Llenar valores
        r.biologicos.forEach(b => {
            b.variables.forEach(v => {
                fila[v.variable] = v.total ?? 0;
            });
        });

        filas.push(fila);
    });

    // --------------------------
    // 3. Crear Excel con SheetJS
    // --------------------------
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { header: encabezados });

    XLSX.utils.book_append_sheet(wb, ws, "Biológicos");

    XLSX.writeFile(wb, "biologicos.xlsx");

    alert("Excel generado correctamente 👍");
}


function mostrarSpinner() {
    spinnerCarga.classList.remove("d-none");
}
function ocultarSpinner() {
    spinnerCarga.classList.add("d-none");
}

function obtenerInicialesInstitucion(id) {
    if (!id) return "";

    // Convertir SIEMPRE a string y rellenar a 2 dígitos
    const idFixed = id.toString().padStart(2, "0");

    // Asegurar que el JSON también se compara como string
    const inst = institucionesCatalogo.find(i => i.idinstitucion.toString().padStart(2, "0") === idFixed);

    return inst ? inst.iniciales : "";
}