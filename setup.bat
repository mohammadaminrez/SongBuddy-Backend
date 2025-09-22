@echo off
REM SongBuddy Backend Auto Setup Script for Windows
REM This script automatically installs and configures everything needed to run the backend

echo.
echo 🎵 SongBuddy Backend Auto Setup
echo ================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo [INFO] Installing Node.js...
    call install_node.bat
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Node.js. Please install manually from https://nodejs.org/
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] Node.js is installed: 
    node --version
)

REM Check if Git is installed
echo [INFO] Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed! Please install Git first.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Git is installed: 
    git --version
)

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully!

REM Setup environment file
echo [INFO] Setting up environment configuration...
if not exist .env (
    if exist env.example (
        copy env.example .env >nul
        echo [SUCCESS] Created .env file from env.example
    ) else (
        echo [ERROR] env.example file not found!
        pause
        exit /b 1
    )
) else (
    echo [WARNING] .env file already exists. Skipping...
)

REM Generate JWT secret
echo [INFO] Generating JWT secret...
for /f %%i in ('powershell -command "([System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)))"') do set JWT_SECRET=%%i

REM Update .env file with generated JWT secret
powershell -command "(Get-Content .env) -replace 'your_super_secret_jwt_key_here_change_this_in_production', '%JWT_SECRET%' | Set-Content .env"
echo [SUCCESS] JWT secret generated and configured!

REM Get system IP address
echo [INFO] Getting system IP address...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set SYSTEM_IP=%%i
    goto :ip_found
)
:ip_found
set SYSTEM_IP=%SYSTEM_IP: =%
echo [SUCCESS] System IP address: %SYSTEM_IP%
echo SYSTEM_IP=%SYSTEM_IP% >> .env

REM Test the setup
echo [INFO] Testing the setup...
echo [INFO] Starting server for testing...

REM Start server in background and test
start /b npm run dev:simple
timeout /t 3 /nobreak >nul

REM Test health endpoint
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Server is running and responding!
) else (
    echo [WARNING] Server test failed, but setup is complete
)

REM Stop the test server
taskkill /f /im node.exe >nul 2>&1

echo.
echo [SUCCESS] 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your Spotify credentials
echo 2. Run: npm run dev:simple
echo 3. Test: curl http://localhost:3000/health
echo.
echo 🔧 Configuration:
echo - Backend will run on: http://localhost:3000
echo - Health check: http://localhost:3000/health
echo - API test: http://localhost:3000/api/test
echo.
echo 📱 For Flutter app connection:
echo - Update BackendApiService baseUrl to: http://%SYSTEM_IP%:3000
echo.
echo [SUCCESS] Happy coding! 🎵
echo.
pause
