let state = {
    api: {
        laravel: "/consultar-biologicos",
        fastapi: "http://127.0.0.1:8080",
        // fastapi: "http://0.0.0.0:8080", // Alternativa
        conectividad: {
            laravel: false,
            fastapi: false,
            ultimaVerificacion: null
        }
    },
    catalogos: {
        disponibles: [],
        seleccionado: null,
        cargando: false,
        error: null
    },
    cubos: {
        disponibles: [],
        activo: null,
        metadatos: null,
        cargando: false
    },
    clues: {
        disponibles: [],
        seleccionadas: [],
        filtradas: [],
        prefijo: "HG",
        cargando: false,
        error: null
    },
    instituciones: {
        catalogo: [],
        cargando: false,
        error: null
    },
    consulta: {
        resultados: [],
        metadata: {
            total_clues_procesadas: 0,
            catalogo: null,
            cubo: null,
            fecha: null,
            duracion: 0
        },
        cargando: false,
        error: null,
        estructura: []
    },
    exportacion: {
        formato: 'excel',
        enProgreso: false,
        ultimoArchivo: null,
        error: null,
        configuracion: {
            incluirTotales: true,
            incluirFormulas: true,
            incluirColores: true
        }
    },
    ui: {
        spinnerVisible: false,
        resultadosVisible: false,
        mensajes: [],
        notificaciones: [],
        tema: 'claro',
        idioma: 'es'
    },
    cache: {
        catalogos: {
            datos: null,
            timestamp: null,
            ttl: 3600000
        },
        instituciones: {
            datos: null,
            timestamp: null,
            ttl: 86400000
        },
        clues: new Map(),
        resultados: new Map()
    },
    configuracion: {
        autoCargarClues: true,
        mostrarResumen: true,
        guardarHistorial: true,
        notificaciones: true,
        tamañoPagina: 50,
        columnasVisibles: [],
        ordenColumnas: []
    },
    historial: {
        consultas: [],
        exportaciones: [],
        maxRegistros: 100
    },
    sesion: {
        id: null,
        inicio: null,
        ultimaActividad: null,
        parametrosGuardados: []
    },
    debug: {
        logs: [],
        errores: [],
        nivel: 'debug',
        habilitado: true,
    }
};


export const getState = () => ({ ...state });
export const getApiConfig = () => ({ ...state.api });
export const getCatalogos = () => ({ ...state.catalogos });
export const getCuboActivo = () => state.cubos.activo;
export const getCluesDisponibles = () => [...state.clues.disponibles];
export const getCluesSeleccionadas = () => [...state.clues.seleccionadas];
export const getResultadosConsulta = () => [...state.consulta.resultados];
export const getInstitucionesCatalogo = () => [...state.instituciones.catalogo];
export const getEstructuraConsulta = () => [...state.consulta.estructura];
export const getMetadataConsulta = () => ({ ...state.consulta.metadata });
export const getUIConfig = () => ({ ...state.ui });
export const getUserConfig = () => ({ ...state.configuracion });
export const setCatalogos = (catalogos) => {
    state.catalogos.disponibles = Array.isArray(catalogos) ? catalogos : [];
    state.catalogos.cargando = false;
    state.catalogos.error = null;
    state.cache.catalogos = {
        datos: catalogos,
        timestamp: Date.now(),
        ttl: 3600000
    };
    logStateChange('Catalogos actualizados', { cantidad: catalogos.length });
};
export const setCatalogoSeleccionado = (catalogo) => {
    state.catalogos.seleccionado = catalogo;
    logStateChange('Catálogo seleccionado', { catalogo });
};
export const setCuboActivo = (cubo) => {
    state.cubos.activo = cubo;
    logStateChange('Cubo activo establecido', { cubo });
};
export const setMetadatosCubo = (metadatos) => {
    state.cubos.metadatos = metadatos;
    logStateChange('Metadatos de cubo actualizados', { cubo: state.cubos.activo });
};
export const setCluesDisponibles = (clues) => {
    state.clues.disponibles = Array.isArray(clues) ? clues : [];
    state.clues.cargando = false;
    state.clues.error = null;
    logStateChange('CLUES disponibles actualizadas', { cantidad: clues.length });
};

export const setCluesSeleccionadas = (clues) => {
    state.clues.seleccionadas = Array.isArray(clues) ? clues : [];
    logStateChange('CLUES seleccionadas actualizadas', { cantidad: clues.length });
};

export const setResultadosConsulta = (resultados, metadata = {}) => {
    state.consulta.resultados = Array.isArray(resultados) ? resultados : [];
    state.consulta.metadata = {
        ...state.consulta.metadata,
        ...metadata,
        fecha: new Date().toISOString()
    };
    state.consulta.cargando = false;
    state.consulta.error = null;
    if (resultados.length > 0) {
        state.consulta.estructura = generarEstructuraDesdeResultados(resultados);
    }
    agregarAlHistorial('consulta', {
        fecha: new Date().toISOString(),
        catalogo: state.catalogos.seleccionado,
        cubo: state.cubos.activo,
        clues: state.clues.seleccionadas.length,
        resultados: resultados.length
    });
    logStateChange('Resultados de consulta actualizados', {
        cantidad: resultados.length,
        catalogo: state.catalogos.seleccionado
    });
};

export const setInstitucionesCatalogo = (instituciones) => {
    state.instituciones.catalogo = Array.isArray(instituciones) ? instituciones : [];
    state.instituciones.cargando = false;
    state.instituciones.error = null;
    state.cache.instituciones = {
        datos: instituciones,
        timestamp: Date.now(),
        ttl: 86400000
    };
    logStateChange('Instituciones actualizadas', { cantidad: instituciones.length });
};

export const setConectividad = (tipo, estado) => {
    if (tipo === 'laravel' || tipo === 'fastapi') {
        state.api.conectividad[tipo] = estado;
        state.api.conectividad.ultimaVerificacion = new Date().toISOString();
        logStateChange(`Conectividad ${tipo} actualizada`, { estado });
    }
};

export const setCargando = (modulo, estado) => {
    const modulos = {
        catalogos: () => state.catalogos.cargando = estado,
        cubos: () => state.cubos.cargando = estado,
        clues: () => state.clues.cargando = estado,
        instituciones: () => state.instituciones.cargando = estado,
        consulta: () => state.consulta.cargando = estado,
        exportacion: () => state.exportacion.enProgreso = estado
    };

    if (modulos[modulo]) {
        modulos[modulo]();
        logStateChange(`Estado de carga ${modulo} actualizado`, { estado });
    }
};

export const setError = (modulo, error) => {
    const modulos = {
        catalogos: () => state.catalogos.error = error,
        clues: () => state.clues.error = error,
        instituciones: () => state.instituciones.error = error,
        consulta: () => state.consulta.error = error,
        exportacion: () => state.exportacion.error = error
    };
    if (modulos[modulo]) {
        modulos[modulo]();
        logStateChange(`Error en ${modulo}`, { error: error?.message || error });
    }
};

export const setUIVisible = (elemento, visible) => {
    if (elemento === 'spinner') {
        state.ui.spinnerVisible = visible;
    } else if (elemento === 'resultados') {
        state.ui.resultadosVisible = visible;
    }

    logStateChange(`UI ${elemento} visible`, { visible });
};

export const setUserConfig = (config) => {
    state.configuracion = {
        ...state.configuracion,
        ...config
    };
    logStateChange('Configuración de usuario actualizada');
};

export const getCacheCatalogos = () => {
    const cache = state.cache.catalogos;
    if (!cache.datos || !cache.timestamp) return null;
    const ahora = Date.now();
    const expirado = ahora - cache.timestamp > cache.ttl;
    if (expirado) {
        state.cache.catalogos = { datos: null, timestamp: null, ttl: 3600000 };
        return null;
    }
    return cache.datos;
};

export const getCacheInstituciones = () => {
    const cache = state.cache.instituciones;
    if (!cache.datos || !cache.timestamp) return null;
    const ahora = Date.now();
    const expirado = ahora - cache.timestamp > cache.ttl;
    if (expirado) {
        state.cache.instituciones = { datos: null, timestamp: null, ttl: 86400000 };
        return null;
    }
    return cache.datos;
};

export const getCacheClues = (catalogo, cubo) => {
    const clave = `${catalogo}-${cubo}`;
    return state.cache.clues.get(clave);
};

export const setCacheClues = (catalogo, cubo, clues) => {
    const clave = `${catalogo}-${cubo}`;
    state.cache.clues.set(clave, {
        datos: clues,
        timestamp: Date.now(),
        ttl: 1800000
    });
    logStateChange('CLUES agregadas al cache', { clave, cantidad: clues.length });
};

export const getCacheResultados = (params) => {
    const clave = generarClaveCache(params);
    return state.cache.resultados.get(clave);
};

export const setCacheResultados = (params, resultados) => {
    const clave = generarClaveCache(params);
    state.cache.resultados.set(clave, {
        datos: resultados,
        timestamp: Date.now(),
        ttl: 300000
    });
    logStateChange('Resultados agregados al cache', { clave, cantidad: resultados.length });
};

export const limpiarCache = (tipo = 'todos') => {
    if (tipo === 'todos' || tipo === 'catalogos') {
        state.cache.catalogos = { datos: null, timestamp: null, ttl: 3600000 };
    }
    if (tipo === 'todos' || tipo === 'instituciones') {
        state.cache.instituciones = { datos: null, timestamp: null, ttl: 86400000 };
    }
    if (tipo === 'todos' || tipo === 'clues') {
        state.cache.clues.clear();
    }
    if (tipo === 'todos' || tipo === 'resultados') {
        state.cache.resultados.clear();
    }
    logStateChange('Cache limpiado', { tipo });
};


export const agregarAlHistorial = (tipo, datos) => {
    const entrada = {
        id: Date.now(),
        tipo,
        datos,
        timestamp: new Date().toISOString()
    };

    if (tipo === 'consulta') {
        state.historial.consultas.unshift(entrada);

        if (state.historial.consultas.length > state.historial.maxRegistros) {
            state.historial.consultas.pop();
        }
    } else if (tipo === 'exportacion') {
        state.historial.exportaciones.unshift(entrada);

        if (state.historial.exportaciones.length > state.historial.maxRegistros) {
            state.historial.exportaciones.pop();
        }
    }

    logStateChange('Entrada agregada al historial', { tipo, id: entrada.id });
};

export const getHistorial = (tipo = 'todos') => {
    if (tipo === 'consultas') {
        return [...state.historial.consultas];
    } else if (tipo === 'exportaciones') {
        return [...state.historial.exportaciones];
    }
    return {
        consultas: [...state.historial.consultas],
        exportaciones: [...state.historial.exportaciones]
    };
};

export const limpiarHistorial = (tipo = 'todos') => {
    if (tipo === 'todos' || tipo === 'consultas') {
        state.historial.consultas = [];
    }
    if (tipo === 'todos' || tipo === 'exportaciones') {
        state.historial.exportaciones = [];
    }
    logStateChange('Historial limpiado', { tipo });
};

export const iniciarSesion = () => {
    state.sesion.id = `sesion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    state.sesion.inicio = new Date().toISOString();
    state.sesion.ultimaActividad = new Date().toISOString();
    logStateChange('Sesión iniciada', { id: state.sesion.id });
};

export const actualizarActividad = () => {
    state.sesion.ultimaActividad = new Date().toISOString();
};

export const guardarParametros = (nombre, parametros) => {
    const existenteIndex = state.sesion.parametrosGuardados.findIndex(p => p.nombre === nombre);
    const parametro = {
        nombre,
        parametros,
        timestamp: new Date().toISOString()
    };

    if (existenteIndex >= 0) {
        state.sesion.parametrosGuardados[existenteIndex] = parametro;
    } else {
        state.sesion.parametrosGuardados.push(parametro);
    }

    logStateChange('Parámetros guardados', { nombre });
};

export const getParametrosGuardados = (nombre = null) => {
    if (nombre) {
        return state.sesion.parametrosGuardados.find(p => p.nombre === nombre);
    }
    return [...state.sesion.parametrosGuardados];
};


export const resetearEstado = (modulo = 'todos') => {
    const resetModulos = {
        catalogos: () => {
            state.catalogos.seleccionado = null;
            state.catalogos.error = null;
        },
        clues: () => {
            state.clues.seleccionadas = [];
            state.clues.error = null;
        },
        consulta: () => {
            state.consulta.resultados = [];
            state.consulta.estructura = [];
            state.consulta.metadata = {
                total_clues_procesadas: 0,
                catalogo: null,
                cubo: null,
                fecha: null,
                duracion: 0
            };
            state.consulta.error = null;
        },
        exportacion: () => {
            state.exportacion.error = null;
        },
        ui: () => {
            state.ui.resultadosVisible = false;
            state.ui.mensajes = [];
        }
    };
    if (modulo === 'todos') {
        Object.values(resetModulos).forEach(reset => reset());
    } else if (resetModulos[modulo]) {
        resetModulos[modulo]();
    }
    logStateChange('Estado reseteado', { modulo });
};

export const generarEstructuraDesdeResultados = (resultados) => {
    if (!resultados || resultados.length === 0) {
        return [];
    }
    const primerResultado = resultados[0];
    const estructura = [];
    if (!primerResultado.biologicos) {
        return estructura;
    }
    primerResultado.biologicos.forEach(apartado => {
        const variables = [];
        if (apartado.grupos) {
            apartado.grupos.forEach(grupo => {
                if (grupo.variables) {
                    grupo.variables.forEach(variable => {
                        if (variable.variable) {
                            variables.push(variable.variable);
                        }
                    });
                }
            });
        }

        if (variables.length > 0) {
            estructura.push({
                nombre: apartado.apartado || 'Sin nombre',
                variables: variables
            });
        }
    });
    return estructura;
};

export const obtenerInicialesInstitucion = (id) => {
    if (!id) return "";
    const idFixed = id.toString().padStart(2, "0");
    const institucion = state.instituciones.catalogo.find(
        i => i.idinstitucion.toString().padStart(2, "0") === idFixed
    );
    return institucion ? institucion.iniciales : "";
};

export const agregarMensajeUI = (tipo, contenido) => {
    const mensaje = {
        id: Date.now(),
        tipo,
        contenido,
        timestamp: new Date().toISOString(),
        leido: false
    };
    state.ui.mensajes.unshift(mensaje);
    if (state.ui.mensajes.length > 50) {
        state.ui.mensajes.pop();
    }
    logStateChange('Mensaje UI agregado', { tipo, id: mensaje.id });
};

export const limpiarMensajesUI = () => {
    state.ui.mensajes = [];
    logStateChange('Mensajes UI limpiados');
};

const logStateChange = (accion, datos = {}) => {
    if (!state.debug.habilitado) return;

    const logEntry = {
        timestamp: new Date().toISOString(),
        accion,
        datos,
        estadoSnapshot: getSnapshotReducido()
    };
    state.debug.logs.unshift(logEntry);
    if (state.debug.logs.length > 100) {
        state.debug.logs.pop();
    }
    if (state.debug.nivel === 'debug') {
        console.log(`[State] ${accion}`, datos);
    }
};

export const agregarErrorDebug = (error, contexto = {}) => {
    const errorEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        error: error?.message || error,
        stack: error?.stack,
        contexto
    };
    state.debug.errores.unshift(errorEntry);
    if (state.debug.errores.length > 50) {
        state.debug.errores.pop();
    }
    console.error(`[State Error] ${errorEntry.error}`, { contexto });
};

export const getLogs = (cantidad = 50) => {
    return state.debug.logs.slice(0, cantidad);
};

export const getErrores = (cantidad = 50) => {
    return state.debug.errores.slice(0, cantidad);
};

export const setNivelDebug = (nivel) => {
    const nivelesValidos = ['debug', 'info', 'warn', 'error', 'silent'];
    if (nivelesValidos.includes(nivel)) {
        state.debug.nivel = nivel;
        logStateChange('Nivel debug cambiado', { nivel });
    }
};

const getSnapshotReducido = () => {
    return {
        catalogos: {
            disponibles: state.catalogos.disponibles.length,
            seleccionado: state.catalogos.seleccionado
        },
        clues: {
            disponibles: state.clues.disponibles.length,
            seleccionadas: state.clues.seleccionadas.length
        },
        consulta: {
            resultados: state.consulta.resultados.length,
            cargando: state.consulta.cargando
        },
        ui: {
            spinnerVisible: state.ui.spinnerVisible,
            resultadosVisible: state.ui.resultadosVisible
        }
    };
};

const generarClaveCache = (params) => {
    return JSON.stringify({
        catalogo: params.catalogo,
        cubo: params.cubo,
        clues: params.clues_list?.sort()
    });
};

iniciarSesion();
setInterval(() => {
    actualizarActividad();
}, 300000);

export default {
    getState,
    getApiConfig,
    getCatalogos,
    getCuboActivo,
    getCluesDisponibles,
    getCluesSeleccionadas,
    getResultadosConsulta,
    getInstitucionesCatalogo,
    getEstructuraConsulta,
    getMetadataConsulta,
    getUIConfig,
    getUserConfig,
    setCatalogos,
    setCatalogoSeleccionado,
    setCuboActivo,
    setMetadatosCubo,
    setCluesDisponibles,
    setCluesSeleccionadas,
    setResultadosConsulta,
    setInstitucionesCatalogo,
    setConectividad,
    setCargando,
    setError,
    setUIVisible,
    setUserConfig,
    getCacheCatalogos,
    getCacheInstituciones,
    getCacheClues,
    setCacheClues,
    getCacheResultados,
    setCacheResultados,
    limpiarCache,
    agregarAlHistorial,
    getHistorial,
    limpiarHistorial,
    iniciarSesion,
    actualizarActividad,
    guardarParametros,
    getParametrosGuardados,
    resetearEstado,
    generarEstructuraDesdeResultados,
    obtenerInicialesInstitucion,
    agregarMensajeUI,
    limpiarMensajesUI,
    agregarErrorDebug,
    getLogs,
    getErrores,
    setNivelDebug
};