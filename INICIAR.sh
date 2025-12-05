#!/bin/bash

echo ""
echo "========================================"
echo "   SISTEMA RCAS - INICIANDO"
echo "========================================"
echo ""

echo "Iniciando servidor local..."
echo ""

# Usa Python para levantar el servidor en el puerto 5500
python3 -m http.server 5500 &

echo ""
echo "========================================"
echo "   >> SERVIDOR INICIADO EN PUERTO 5500"
echo "========================================"
echo ""
echo "Abre el puerto desde Codespaces:"
echo "👉 http://localhost:5500"
echo ""
read -n 1 -s -r -p "Presiona cualquier tecla para salir..."
echo ""
