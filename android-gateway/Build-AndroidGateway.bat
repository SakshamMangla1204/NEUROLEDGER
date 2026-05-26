@echo off
setlocal

cd /d "%~dp0"

if not defined JAVA_HOME (
  if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
  )
)

if defined JAVA_HOME (
  set "PATH=%JAVA_HOME%\bin;%PATH%"
)

if "%~1"=="" (
  call gradlew.bat assembleDebug
) else (
  call gradlew.bat assembleDebug -PNEUROLEDGER_BASE_URL=%~1
)

endlocal
