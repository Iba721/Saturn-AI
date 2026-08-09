@echo off
title Saturn Kokoro

cd /d "C:\Users\Anant\Projects\Saturn\kokoro"

echo.
echo 🪐 Starting Kokoro...
echo.

".venv\Scripts\python.exe" server.py

echo.
echo 🛑 Kokoro server stopped.
pause