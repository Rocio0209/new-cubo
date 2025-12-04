const API_LARAVEL = "/consultar-biologicos";
const API_FASTAPI = "http://127.0.0.1:8080";
console.log("🔵 vacanas.js cargado correctamente");
let cuboActivo = null;
let cluesDisponibles = [];
let resultadosConsulta = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarCatalogos();

    catalogoSelect.addEventListener("change", () => {
        btnCargarClues.disabled = !catalogoSelect.value;
        cluesSelect.innerHTML = "";
        cluesSelect.disabled = true;
    });

    btnCargarClues.addEventListener("click", cargarClues);
    btnConsultar.addEventListener("click", consultarBiologicos);
    btnExportar.addEventListener("click", exportarExcel);
    btnTodasHG.addEventListener("click", () => seleccionarPorPrefijo("HG"));
    btnTodasHGIMB.addEventListener("click", () => seleccionarPorPrefijo("HGIMB"));
});

function cargarCatalogos() {
    fetch(`${API_FASTAPI}/cubos_sis`)
        .then(r => r.json())
        .then(data => {
            data.cubos_sis.forEach(c => {
                catalogoSelect.innerHTML += `<option value="${c}">${c}</option>`;
            });
        });
}

function cargarClues() {
    const catalogo = catalogoSelect.value;

    mostrarSpinner();

    fetch(`${API_FASTAPI}/cubos_en_catalogo/${catalogo}`)
        .then(r => r.json())
        .then(data => {
            cuboActivo = data.cubos[0];
            return fetch(`${API_FASTAPI}/miembros_jerarquia2?catalogo=${catalogo}&cubo=${cuboActivo}&jerarquia=CLUES`);
        })
        .then(r => r.json())
        .then(data => {

            cluesDisponibles = data.miembros.map(m => m.nombre);

            cluesSelect.innerHTML = "";
            cluesDisponibles.forEach(c => {
                cluesSelect.innerHTML += `<option value="${c}">${c}</option>`;
            });

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
    $("#cluesSelect").val(seleccionadas).trigger("change");

    btnConsultar.disabled = seleccionadas.length === 0;
}

function consultarBiologicos() {
    const catalogo = catalogoSelect.value;
    const clues_list = Array.from(cluesSelect.selectedOptions).map(o => o.value);

    mostrarSpinner();

    fetch(API_LARAVEL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
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

    tablaHeader.innerHTML = `
        <th rowspan="2">CLUES</th>
        <th rowspan="2">Unidad</th>
        <th rowspan="2">Entidad</th>
        <th rowspan="2">Jurisdicción</th>
        <th rowspan="2">Municipio</th>
    `;

    const apartados = {};

    data.resultados.forEach(r => {
        r.biologicos.forEach(ap => {
            if (!apartados[ap.apartado]) apartados[ap.apartado] = [];
            ap.variables.forEach(v => {
                if (!apartados[ap.apartado].includes(v.variable))
                    apartados[ap.apartado].push(v.variable);
            });
        });
    });

    Object.entries(apartados).forEach(([apartado, vars]) => {
        tablaHeader.innerHTML += `<th colspan="${vars.length}">${apartado}</th>`;
        vars.forEach(v => variablesHeader.innerHTML += `<th>${v}</th>`);
    });

    data.resultados.forEach(r => {
        let fila = `
            <td>${r.clues}</td>
            <td>${r.unidad.nombre ?? ""}</td>
            <td>${r.unidad.entidad ?? ""}</td>
            <td>${r.unidad.jurisdiccion ?? ""}</td>
            <td>${r.unidad.municipio ?? ""}</td>
        `;

        Object.entries(apartados).forEach(([apartado, vars]) => {
            const datos = r.biologicos.find(b => b.apartado === apartado)?.variables ?? [];
            const dict = Object.fromEntries(datos.map(v => [v.variable, v.total]));
            vars.forEach(v => fila += `<td>${dict[v] ?? 0}</td>`);
        });

        tablaResultadosBody.innerHTML += `<tr>${fila}</tr>`;
    });
}

function exportarExcel() {
    alert("Próximo paso: insertar resultados en plantilla Excel 👍");
}

function mostrarSpinner() {
    spinnerCarga.classList.remove("d-none");
}
function ocultarSpinner() {
    spinnerCarga.classList.add("d-none");
}
