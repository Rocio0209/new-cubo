<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CubosController extends Controller
{
    protected $permiso = 'cubos';

    protected $accion = 'cubos';

    protected $ao = 'o';

    public function index(Request $request)
    {
        if ($request->user()->cannot('cubos/'.$this->permiso)) {
            abort(403);
        }

        return view('cubos.index');
    }
    public function consultarBiologicos(Request $request)
    {
        // Obtener URL base desde .env
        $apiBase = rtrim(env('API_URL'), '/');

        // Construir endpoint final
        $url = $apiBase . '/biologicos_normalizados_con_migrantes2';

        // Consumir API
        $response = Http::post($url, [
            "catalogo" => $request->catalogo,
            "cubo" => $request->cubo,
            "clues_list" => $request->clues_list
        ]);

        return $response->json();
    }
}

