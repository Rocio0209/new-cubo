# Cubos Dinamicos consumiendo por una API

## Ejecucion en local

```
En el archivo .env
Poner localhost en la linea API_URL=

public\js\vacunas.js -> localhost
const API_FASTAPI = "http://0.0.0.0:8080";
```

## Ejecucion en publico

```
En el archivo .env
Poner IPCONFIG en la linea API_URL= http://0.0.0.0:8080

public\js\vacunas.js -> IPCONFIG
const API_FASTAPI = "http://0.0.0.0:8080";
```