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
