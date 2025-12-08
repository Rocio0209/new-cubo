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
    $apiBase = rtrim(env('API_URL'), '/');
    $url = $apiBase . '/biologicos_normalizados_con_migrantes2';

    $response = Http::post($url, [
        "catalogo" => $request->catalogo,
        "cubo" => $request->cubo,
        "clues_list" => $request->clues_list
    ]);

    if ($response->failed()) {
        return response()->json([
            "error" => true,
            "message" => "Error en la API externa",
            "status" => $response->status(),
            "body" => $response->body()
        ], 500);
    }

    return $response->json();
}

}

