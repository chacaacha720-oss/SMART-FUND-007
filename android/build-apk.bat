@echo off
REM ============================================================
REM SMART FUND - Build Android APK
REM Prasyarat: Android Studio (SDK 34) + Java 17 + Gradle wrapper
REM Pastikan ANDROID_HOME & JAVA_HOME sudah diset.
REM Ganti android/app/google-services.json dengan config Firebase sebenar
REM sebelum build supaya FCM berfungsi.
REM ============================================================
cd /d "%~dp0"
echo [1/2] Sync Capacitor native...
call npx cap sync android
if errorlevel 1 goto :err

echo [2/2] Build APK (debug)...
call gradlew assembleDebug
if errorlevel 1 goto :err

echo.
echo ============================================================
echo  BERJAYA! APK di:
echo  android\app\build\outputs\apk\debug\app-debug.apk
echo ============================================================
echo.
echo Salin ke public\smartfund.apk untuk hosting muat turun:
echo   copy android\app\build\outputs\apk\debug\app-debug.apk public\smartfund.apk
goto :eof

:err
echo.
echo X GAGAL. Pastikan:
echo   - ANDROID_HOME / JAVA_HOME diset
echo   - android/app/google-services.json diisi config Firebase sebenar
echo   - 'java -version' berfungsi
pause
