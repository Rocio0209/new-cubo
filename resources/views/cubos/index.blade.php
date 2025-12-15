<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight mb-0">
            Cubos Dinamiocos de Vacunas
        </h2>
    </x-slot>

    <div class="container">
        <h3 class="mb-4">Consulta de Biológicos por CLUES</h3>

        {{-- Selección de catálogo --}}
        <div class="mb-3">
            <label for="catalogoSelect" class="form-label">Selecciona un catálogo SIS:</label>
            <select id="catalogoSelect" class="form-select">
                <option value="">-- Selecciona un catálogo --</option>
            </select>
        </div>

        {{-- Botón cargar --}}
        <div class="d-flex flex-row">
            <div class="mb-3">
                <button id="btnCargarClues" class="btn btn-secondary" disabled>🔍 Cargar CLUES disponibles</button>
            </div>
            <div id="mensajeCluesCargadas" class="alert alert-info d-none ml-6">
                CLUES cargadas correctamente.
            </div>
        </div>

        {{-- Selección de CLUES --}}
        {{-- Selección de CLUES --}}
<div class="mb-3">
    <div class="row align-items-end">
        <div class="col-md-10 col-12">
            <label for="cluesSelect" class="form-label">Selecciona CLUES:</label>
            <select id="cluesSelect" class="form-select" multiple disabled></select>
        </div>
        <div class="col-md-2 col-12 mt-2 mt-md-0">
            <button id="btnLimpiarClues" type="button" 
                    class="btn btn-outline-danger w-100 text-wrap">
                ✖ Limpiar selección
            </button>
        </div>
    </div>
</div>

        {{-- Botones consultar --}}
        <div class="mb-3">
            <button id="btnConsultar" class="btn btn-primary" disabled>Consultar Biológicos</button>
            <button id="btnExportar" class="btn btn-success ms-2" disabled>Exportar Excel</button>
        </div>

        {{-- Spinner --}}
        <div id="spinnerCarga" class="text-center my-4 d-none">
            <div class="spinner-border text-primary" style="width:3rem;height:3rem;"></div>
            <p class="mt-2">Procesando...</p>
        </div>

        {{-- Resultados --}}
        <div id="resultadosContainer" class="d-none">
            <div class="alert alert-info" id="resumenConsulta"></div>

            <div class="table-responsive">
                <table class="table table-bordered table-striped" id="tablaResultados">
                    <thead>
                        <tr id="tablaHeader"></tr>
                        <tr id="variablesHeader"></tr>
                    </thead>
                    <tbody id="tablaResultadosBody"></tbody>
                    <tfoot id="tablaFooter"></tfoot>
                </table>
            </div>
        </div>

        <x-precarga></x-precarga>
    </div>
    @push('scripts')
        <script src="https://code.jquery.com/jquery-3.6.0.min.js" nonce="{{ csp_nonce() }}"></script>
        <script src="{{ asset('js/vacunas.js') }}" nonce="{{ csp_nonce() }}"></script>
        <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js" nonce="{{ csp_nonce() }}">
        </script>
        {{-- Select2 Theme Bootstrap 5 (opcional) --}}
        <link href="https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css"
            rel="stylesheet" />
        {{-- jQuery obligatorio --}}

        <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js" nonce="{{ csp_nonce() }}"></script>


        <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js" nonce="{{ csp_nonce() }}"></script>
    @endpush


</x-app-layout>
