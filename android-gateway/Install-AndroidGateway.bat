@echo off
setlocal

cd /d "%~dp0"

set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist "%ADB%" (
  echo adb.exe was not found. Install Android SDK Platform Tools from Android Studio.
  exit /b 1
)

if not exist "app\build\outputs\apk\debug\app-debug.apk" (
  call Build-AndroidGateway.bat
  if errorlevel 1 exit /b 1
)

"%ADB%" install -r "app\build\outputs\apk\debug\app-debug.apk"
if errorlevel 1 exit /b 1

"%ADB%" shell monkey -p com.neuroledger.gateway 1

endlocal
