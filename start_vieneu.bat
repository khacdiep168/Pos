@echo off
chcp 65001 >nul
title Vibe POS - VieNeu-TTS AI Engine
echo =====================================================================
echo 🦜 VIBE POS - VieNeu-TTS AI Voice Notification Server Launcher
echo Mô hình tổng hợp giọng nói tiếng Việt 48kHz chạy On-Device
echo =====================================================================
echo.

if not exist "vieneu-tts" (
    echo [*] Đang tải mã nguồn VieNeu-TTS từ GitHub...
    git clone --depth 1 https://github.com/pnnbao97/VieNeu-TTS.git vieneu-tts
)

cd vieneu-tts

echo [*] Kiểm tra công cụ uv / python...
where uv >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [*] Khởi chạy qua uv (khuyến nghị)...
    uv run python -m apps.openai_speech
) else (
    echo [*] Khởi chạy trực tiếp qua python...
    python -m apps.openai_speech
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Hướng dẫn cài đặt nhanh:
    echo     1. Mở PowerShell và chạy: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    echo     2. Sau đó chạy lại file start_vieneu.bat này!
    echo.
)

pause
