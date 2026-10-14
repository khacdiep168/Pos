@echo off
chcp 65001 >nul
title Vibe POS - VieNeu-TTS AI Voice Engine (48kHz)
echo =====================================================================
echo 🦜 VIBE POS - VieNeu-TTS AI Voice Notification Server
echo Mô hình tổng hợp giọng nói tiếng Việt Studio 48kHz chạy On-Device
echo =====================================================================
echo.

set "VIENEU_DIR=%~dp0vieneu-tts"
set "VIENEU_BACKEND=onnx"
set "VIENEU_DEVICE=cpu"
set "PYTHONIOENCODING=utf-8"

if not exist "%VIENEU_DIR%" (
    echo [*] Đang tải mã nguồn VieNeu-TTS từ GitHub...
    git clone --depth 1 https://github.com/pnnbao97/VieNeu-TTS.git "%VIENEU_DIR%"
)

cd /d "%VIENEU_DIR%"

echo [*] Kiểm tra môi trường uv...
where uv >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Chưa tìm thấy uv. Đang tiến hành cài đặt uv tự động...
    powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    set "PATH=%USERPROFILE%\.local\bin;%USERPROFILE%\.cargo\bin;%PATH%"
)

if not exist ".venv" (
    echo [*] Đang khởi tạo môi trường Python và thư viện (chỉ thực hiện lần đầu)...
    uv sync
)

echo.
echo =====================================================================
echo 🚀 Đang khởi động Server VieNeu-TTS tại: http://127.0.0.1:8000
echo    - Cổng kết nối POS: http://127.0.0.1:8000/v1
echo    - Engine: ONNX CPU (48kHz Hi-Fi)
echo    - Bộ 25 giọng đọc Studio: Hải Đăng, Mai Anh, Thùy Dung, Thiện Minh...
echo =====================================================================
echo.

uv run python -m apps.openai_speech

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Máy chủ đã dừng hoặc gặp lỗi khi khởi động.
    echo     Thử chạy lệnh: uv sync để kiểm tra cài đặt.
    echo.
)

pause
