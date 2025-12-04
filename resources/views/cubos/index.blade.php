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

        {{-- Selección de CLUES --}}
        <div class="mb-3">
            <label for="cluesSelect" class="form-label">Selecciona CLUES:</label>
            <select id="cluesSelect" class="form-select" multiple disabled></select>

            <div class="mt-2 d-flex gap-2">
                <button id="btnTodasHGIMB" class="btn btn-primary btn-sm" disabled>Seleccionar todas HGIMB</button>
                <button id="btnTodasHG" class="btn btn-warning btn-sm" disabled>Seleccionar todas HG</button>
            </div>
        </div>

        {{-- Botón cargar --}}
        <div class="mb-3">
            <button id="btnCargarClues" class="btn btn-secondary" disabled>🔍 Cargar CLUES disponibles</button>
        </div>

        <div id="mensajeCluesCargadas" class="alert alert-info d-none">
            CLUES cargadas correctamente.
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
    @section('scripts')
        <script src="{{ asset('js/vacunas.js') }}"></script>
    @endsection
</x-app-layout>
