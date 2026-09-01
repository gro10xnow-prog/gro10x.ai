@echo off
chcp 65001 > nul
title GRO10X - Google Flow OS Macro Runner
cls
cd /d "%~dp0"
echo ====================================================================
echo  [GRO10X] OS-LEVEL MACRO RUNNER FOR GOOGLE FLOW
echo ====================================================================
echo.
python scripts\flow_macro_runner.py
pause
