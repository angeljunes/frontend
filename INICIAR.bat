@echo off
title SISTEMA RCAS - Iniciando...
color 0A
chcp 65001 > nul

cls
echo.
echo ========================================
echo    SISTEMA RCAS - INICIANDO
echo ========================================
echo.

echo Abriendo index.html en el navegador...
echo.

start "" "%~dp0index.html"

echo.
echo ========================================
echo    ^>^> SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo Presiona cualquier tecla para salir...
pause > nul
exit
