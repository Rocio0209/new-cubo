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

    // Limpiar y normalizar CLUES
    $clues = $request->clues_list;

    if (!is_array($clues)) {
        $clues = explode(",", $clues);
    }

    $clues = array_filter($clues, fn($v) => trim($v) !== "");
    $clues = array_map("trim", $clues);
    $clues = array_unique($clues);
    $clues = array_values($clues);

    if (count($clues) === 0) {
        return response()->json([
            "error" => true,
            "message" => "La lista clues_list llegó vacía."
        ], 400);
    }

    // 🔥 AUMENTAR TIMEOUT
    $response = Http::timeout(900)->post($url, [
        "catalogo" => $request->catalogo,
        "cubo" => $request->cubo,
        "clues_list" => $clues
    ]);

    if ($response->failed()) {
        return response()->json([
            "error" => true,
            "message" => "Error en la API externa FastAPI",
            "status" => $response->status(),
            "body" => $response->body()
        ], 500);
    }

    return $response->json();
}

}

